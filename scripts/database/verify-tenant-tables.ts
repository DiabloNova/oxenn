import fs from "node:fs";
import path from "node:path";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

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

function getCanonicalMetadataDirectory(rootDir: string): string {
  const absoluteRoot = path.resolve(rootDir);
  if (!fs.existsSync(absoluteRoot)) {
    throw new Error(`[verify-tenant-tables] Repository root not found at ${absoluteRoot}`);
  }

  const canonicalRoot = fs.realpathSync(absoluteRoot);
  const metadataPath = path.resolve(absoluteRoot, "database", "drizzle", "meta");
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`[verify-tenant-tables] Metadata directory not found at ${metadataPath}`);
  }

  const canonicalMetadataPath = fs.realpathSync(metadataPath);
  const expectedMetadataPath = path.join(canonicalRoot, "database", "drizzle", "meta");
  if (canonicalMetadataPath !== expectedMetadataPath) {
    throw new Error("[verify-tenant-tables] Metadata directory resolves outside the repository metadata path.");
  }

  return canonicalMetadataPath;
}

/**
 * Validate the journal index and resolve the snapshot through canonical paths.
 * The result must be a regular file directly inside the real metadata directory;
 * symlinked metadata directories and snapshot files are rejected.
 */
export function resolveLatestSnapshotPath(rootDir: string, journalValue: unknown): string {
  const metadataDirectory = getCanonicalMetadataDirectory(rootDir);
  if (
    typeof journalValue !== "object" ||
    journalValue === null ||
    !("entries" in journalValue) ||
    !Array.isArray((journalValue as { entries?: unknown }).entries)
  ) {
    throw new Error("[verify-tenant-tables] Journal must contain an entries array.");
  }

  const entries = (journalValue as { entries: unknown[] }).entries;
  if (entries.length === 0) {
    throw new Error("[verify-tenant-tables] Journal file contains no entries.");
  }

  const latestEntry = entries[entries.length - 1];
  if (typeof latestEntry !== "object" || latestEntry === null || !("idx" in latestEntry)) {
    throw new Error("[verify-tenant-tables] Latest journal entry has no valid index.");
  }

  const latestIdx = (latestEntry as { idx: unknown }).idx;
  if (!Number.isSafeInteger(latestIdx) || (latestIdx as number) < 0 || (latestIdx as number) > 9999) {
    throw new Error("[verify-tenant-tables] Latest journal index must be an integer between 0 and 9999.");
  }

  const snapshotFileName = `${String(latestIdx).padStart(4, "0")}_snapshot.json`;
  if (!/^\d{4}_snapshot\.json$/.test(snapshotFileName)) {
    throw new Error("[verify-tenant-tables] Latest snapshot filename does not match the expected pattern.");
  }

  const snapshotPath = path.resolve(metadataDirectory, snapshotFileName);
  if (path.dirname(snapshotPath) !== metadataDirectory || path.basename(snapshotPath) !== snapshotFileName) {
    throw new Error("[verify-tenant-tables] Latest snapshot path escapes the metadata directory.");
  }
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`[verify-tenant-tables] Latest snapshot file not found at ${snapshotPath}`);
  }

  const canonicalSnapshotPath = fs.realpathSync(snapshotPath);
  if (path.dirname(canonicalSnapshotPath) !== metadataDirectory || path.basename(canonicalSnapshotPath) !== snapshotFileName) {
    throw new Error("[verify-tenant-tables] Latest snapshot resolves outside the metadata directory.");
  }
  if (!fs.statSync(canonicalSnapshotPath).isFile()) {
    throw new Error("[verify-tenant-tables] Latest snapshot path is not a regular file.");
  }

  return canonicalSnapshotPath;
}

function readLatestSnapshot(): TenantTableSnapshot {
  const rootDir = process.cwd();
  const metadataDirectory = getCanonicalMetadataDirectory(rootDir);
  const journalPath = path.join(metadataDirectory, "_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`[verify-tenant-tables] Journal file not found at ${journalPath}`);
  }

  const canonicalJournalPath = fs.realpathSync(journalPath);
  if (path.dirname(canonicalJournalPath) !== metadataDirectory || path.basename(canonicalJournalPath) !== "_journal.json") {
    throw new Error("[verify-tenant-tables] Journal file resolves outside the metadata directory.");
  }

  const journal: unknown = JSON.parse(fs.readFileSync(canonicalJournalPath, "utf8"));
  const snapshotPath = resolveLatestSnapshotPath(rootDir, journal);
  const snapshotValue: unknown = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  if (
    typeof snapshotValue !== "object" ||
    snapshotValue === null ||
    !("tables" in snapshotValue) ||
    typeof (snapshotValue as { tables?: unknown }).tables !== "object" ||
    (snapshotValue as { tables?: unknown }).tables === null
  ) {
    throw new Error("[verify-tenant-tables] Latest snapshot must contain a tables object.");
  }

  return snapshotValue as TenantTableSnapshot;
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
