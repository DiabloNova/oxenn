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

interface SnapshotTable {
  name: string;
  policies?: Record<string, unknown>;
}

interface Snapshot {
  tables: Record<string, SnapshotTable>;
}

export function getDerivedTenantTablesFromSnapshot(): string[] {
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

  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const policyTables = new Set<string>();

  for (const table of Object.values(snapshot.tables)) {
    if (table.policies && Object.keys(table.policies).length > 0) {
      policyTables.add(table.name);
    }
  }

  return Array.from(policyTables).sort();
}

function generateGeneratedFileContent(tables: string[]): string {
  const tableLines = tables.map((t) => `  "${t}"`).join(",\n");
  return `/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Generated from database/drizzle latest snapshot by scripts/database/verify-tenant-tables.ts.
 * Represents all schema tables with at least one Row Level Security (RLS) tenant isolation policy.
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
} {
  const derivedTables = getDerivedTenantTablesFromSnapshot();
  const runtimeTables: string[] = Array.from(TENANT_SCOPED_TABLES).sort();

  const missingInRuntime = derivedTables.filter((t) => !runtimeTables.includes(t));
  const extraInRuntime = runtimeTables.filter((t) => !derivedTables.includes(t));

  const isDrifted = missingInRuntime.length > 0 || extraInRuntime.length > 0;

  if (isDrifted && options?.fix) {
    const targetFile = path.join(process.cwd(), "src/core/database/tenant-tables.generated.ts");
    fs.writeFileSync(targetFile, generateGeneratedFileContent(derivedTables), "utf8");
    console.log(`[verify-tenant-tables] Updated ${targetFile} with ${derivedTables.length} tables.`);
    return {
      success: true,
      derivedTables,
      runtimeTables: derivedTables,
      missingInRuntime: [],
      extraInRuntime: [],
    };
  }

  return {
    success: !isDrifted,
    derivedTables,
    runtimeTables,
    missingInRuntime,
    extraInRuntime,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix") || args.includes("--generate");

  try {
    const result = verifyTenantTables({ fix });
    if (!result.success) {
      console.error("\n❌ [Tenant Tables Verification] SCHEMA DRIFT DETECTED!");
      console.error("Runtime TENANT_SCOPED_TABLES does not match Drizzle snapshot policy tables.\n");

      if (result.missingInRuntime.length > 0) {
        console.error("Missing in TENANT_SCOPED_TABLES (present in schema snapshot with policies):");
        for (const t of result.missingInRuntime) {
          console.error(`  + ${t}`);
        }
      }

      if (result.extraInRuntime.length > 0) {
        console.error("Extra in TENANT_SCOPED_TABLES (absent or has 0 policies in schema snapshot):");
        for (const t of result.extraInRuntime) {
          console.error(`  - ${t}`);
        }
      }

      console.error("\nRun 'pnpm tsx scripts/database/verify-tenant-tables.ts --fix' to regenerate.");
      process.exit(1);
    } else {
      console.log(
        `✅ [Tenant Tables Verification] SUCCESS: TENANT_SCOPED_TABLES matches schema snapshot (${result.derivedTables.length} tables).`
      );
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ [Tenant Tables Verification] Error executing script:", err);
    process.exit(1);
  }
}
