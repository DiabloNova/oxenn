import fs from "node:fs";
import path from "node:path";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints?: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

interface SnapshotPolicy {
  as?: string;
  for?: string;
  to?: string[];
  using?: string;
  withCheck?: string;
}

interface SnapshotTable {
  name: string;
  columns?: Record<string, unknown>;
  policies?: Record<string, SnapshotPolicy>;
}

export interface TenantTableSnapshot {
  tables: Record<string, SnapshotTable>;
}

function readLatestSnapshot(): TenantTableSnapshot {
  const rootDir = process.cwd();
  const journalPath = path.join(rootDir, "database/drizzle/meta/_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`[verify-tenant-tables] Journal file not found at ${journalPath}`);
  }

  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  if (!journal.entries || journal.entries.length === 0) {
    throw new Error("[verify-tenant-tables] Journal file contains no entries.");
  }

  const lastIdx = journal.entries[journal.entries.length - 1].idx;
  const padIdx = String(lastIdx).padStart(4, "0");
  const snapshotPath = path.join(rootDir, `database/drizzle/meta/${padIdx}_snapshot.json`);

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`[verify-tenant-tables] Latest snapshot file not found at ${snapshotPath}`);
  }

  return JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
}

/**
 * A table is tenant-owned when it carries organization_id / tenant_id.
 * organizations is the deliberate exception: its primary key is the tenant ID.
 * Policy coverage is checked independently so missing policies cannot hide a table.
 */
export function getTenantTableCoverageFromSnapshot(snapshot: TenantTableSnapshot): {
  tenantTables: string[];
  missingPolicyTables: string[];
} {
  const tables = Object.values(snapshot.tables);
  const tenantTables = tables
    .filter((table) => {
      const columns = table.columns ?? {};
      return table.name === "organizations" ||
        Object.hasOwn(columns, "organization_id") ||
        Object.hasOwn(columns, "tenant_id");
    })
    .map((table) => table.name)
    .sort();

  const hasTenantPredicate = (expression: unknown, tenantColumn: string): boolean => {
    if (typeof expression !== "string") return false;
    const normalized = expression.replaceAll('"', "").replace(/\s+/g, "").toLowerCase();
    const expected = `${tenantColumn.toLowerCase()}=nullif(current_setting('app.current_tenant_id',true),'')`;
    return normalized === expected || normalized === `${expected}::uuid`;
  };

  const missingPolicyTables = tables
    .filter((table) => tenantTables.includes(table.name))
    .filter((table) => {
      const columns = table.columns ?? {};
      const tenantColumn = table.name === "organizations"
        ? "id"
        : Object.hasOwn(columns, "organization_id") ? "organization_id" : "tenant_id";
      const policies = Object.values(table.policies ?? {});
      const covers = (operation: string, requiredExpressions: (keyof SnapshotPolicy)[]): boolean => {
        const applicablePermissivePolicies = policies.filter((policy) => {
          const command = String(policy.for ?? "").toUpperCase();
          const mode = String(policy.as ?? "PERMISSIVE").toUpperCase();
          const roles = policy.to ?? [];
          return (command === operation || command === "ALL") &&
            mode === "PERMISSIVE" &&
            (roles.length === 0 || roles.includes("public") || roles.includes("app_runtime"));
        });

        // PostgreSQL ORs permissive policies. One unscoped policy is enough to
        // widen access, so every applicable permissive policy must be tenant-scoped.
        return applicablePermissivePolicies.length > 0 &&
          applicablePermissivePolicies.every((policy) =>
            requiredExpressions.every((field) => hasTenantPredicate(policy[field], tenantColumn)),
          );
      };

      return !covers("SELECT", ["using"]) ||
        !covers("INSERT", ["withCheck"]) ||
        !covers("UPDATE", ["using", "withCheck"]) ||
        !covers("DELETE", ["using"]);
    })
    .map((table) => table.name)
    .sort();

  return { tenantTables, missingPolicyTables };
}

export function getDerivedTenantTablesFromSnapshot(): string[] {
  return getTenantTableCoverageFromSnapshot(readLatestSnapshot()).tenantTables;
}

function generateGeneratedFileContent(tables: string[]): string {
  const tableLines = tables.map((t) => `  "${t}"`).join(",\n");
  return `/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Generated from database/drizzle latest snapshot by scripts/database/verify-tenant-tables.ts.
 * Represents every organization-owned / tenant-owned table, regardless of current policy coverage.
 */

export const TENANT_SCOPED_TABLES = Object.freeze([
${tableLines}
] as const);

export type TenantScopedTable = (typeof TENANT_SCOPED_TABLES)[number];
`;
}

export function verifyTenantTables(options?: { fix?: boolean }): {
  success: boolean;
  derivedTables: string[];
  runtimeTables: string[];
  missingInRuntime: string[];
  extraInRuntime: string[];
  missingPolicyTables: string[];
} {
  const coverage = getTenantTableCoverageFromSnapshot(readLatestSnapshot());
  const derivedTables = coverage.tenantTables;
  const runtimeTables: string[] = Array.from(TENANT_SCOPED_TABLES).sort();

  const missingInRuntime = derivedTables.filter((t) => !runtimeTables.includes(t));
  const extraInRuntime = runtimeTables.filter((t) => !derivedTables.includes(t));
  const isDrifted = missingInRuntime.length > 0 || extraInRuntime.length > 0;

  if (isDrifted && options?.fix) {
    const targetFile = path.join(process.cwd(), "src/core/database/tenant-tables.generated.ts");
    fs.writeFileSync(targetFile, generateGeneratedFileContent(derivedTables), "utf8");
    console.log(`[verify-tenant-tables] Updated ${targetFile} with ${derivedTables.length} tenant-owned tables.`);
    return {
      success: coverage.missingPolicyTables.length === 0,
      derivedTables,
      runtimeTables: derivedTables,
      missingInRuntime: [],
      extraInRuntime: [],
      missingPolicyTables: coverage.missingPolicyTables,
    };
  }

  return {
    success: !isDrifted && coverage.missingPolicyTables.length === 0,
    derivedTables,
    runtimeTables,
    missingInRuntime,
    extraInRuntime,
    missingPolicyTables: coverage.missingPolicyTables,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix") || args.includes("--generate");

  try {
    const result = verifyTenantTables({ fix });
    if (!result.success) {
      console.error("\n❌ [Tenant Tables Verification] TENANT COVERAGE OR SCHEMA DRIFT DETECTED!");
      console.error("Runtime TENANT_SCOPED_TABLES must match ownership columns in the Drizzle snapshot, and every tenant-owned table must have all four tenant policies.\n");

      if (result.missingInRuntime.length > 0) {
        console.error("Missing in TENANT_SCOPED_TABLES (tenant-owned in schema snapshot):");
        for (const t of result.missingInRuntime) console.error(`  + ${t}`);
      }
      if (result.extraInRuntime.length > 0) {
        console.error("Extra in TENANT_SCOPED_TABLES (not tenant-owned in schema snapshot):");
        for (const t of result.extraInRuntime) console.error(`  - ${t}`);
      }
      if (result.missingPolicyTables.length > 0) {
        console.error("Missing or incomplete SELECT/INSERT/UPDATE/DELETE tenant policies:");
        for (const t of result.missingPolicyTables) console.error(`  ! ${t}`);
      }

      console.error("\nRun 'pnpm tsx scripts/database/verify-tenant-tables.ts --fix' to regenerate the runtime table inventory; missing policies must be fixed in the canonical schema.");
      process.exit(1);
    } else {
      console.log(`✅ [Tenant Tables Verification] SUCCESS: ${result.derivedTables.length} tenant-owned tables have complete policies and match runtime inventory.`);
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ [Tenant Tables Verification] Error executing script:", err);
    process.exit(1);
  }
}
