import fs from "fs";
import path from "path";
import { pathToFileURL } from "node:url";
import { findTableReferences as detectTableReferences } from "./reference-matrix-consumers";
import { getTableOwnershipScope, getTenantTableCoverageFromSnapshot } from "./verify-tenant-tables";
import { getRlsMigrationCoverage, type RlsMigrationCoverage } from "./verify-rls-migrations";

interface Journal {
  entries: { idx: number }[];
}

interface IndexColumn {
  expression: string;
  isExpression: boolean;
  asc?: boolean;
  nulls?: string;
}

interface SnapshotTable {
  name: string;
  columns: Record<string, {
    name: string;
    type: string;
    notNull: boolean;
    default?: unknown;
    primaryKey: boolean;
  }>;
  policies?: Record<string, {
    as?: string;
    for?: string;
    to?: string[];
    using?: string;
    withCheck?: string;
  }>;
  indexes?: Record<string, {
    name: string;
    columns: IndexColumn[];
    isUnique: boolean;
    where?: string;
    method?: string;
  }>;
  compositePrimaryKeys?: Record<string, {
    name: string;
    columns: string[];
  }>;
  uniqueConstraints?: Record<string, {
    name: string;
    columns: string[];
    nullsNotDistinct?: boolean;
  }>;
  checkConstraints?: Record<string, { name: string; value: string }>;
  foreignKeys?: Record<string, {
    name: string;
    tableTo: string;
    columnsFrom: string[];
    columnsTo: string[];
    onDelete?: string;
  }>;
}

interface Snapshot {
  tables: Record<string, SnapshotTable>;
}

function getLatestSnapshotPath(): string {
  const rootDir = process.cwd();
  const journalPath = path.join(rootDir, "database/drizzle/meta/_journal.json");
  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const lastIdx = journal.entries[journal.entries.length - 1].idx;
  const padIdx = String(lastIdx).padStart(4, "0");
  return path.join(rootDir, `database/drizzle/meta/${padIdx}_snapshot.json`);
}

function getExportNameForTable(tableName: string): string | null {
  const schemaDir = path.join(process.cwd(), "database/schema");

  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else if (fullPath.endsWith(".ts")) {
        arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  }

  for (const file of getAllFiles(schemaDir)) {
    const content = fs.readFileSync(file, "utf-8");
    const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = content.match(new RegExp(`export const ([a-zA-Z0-9_]+) = pgTable\\("${escaped}"`));
    if (match) return match[1];
  }
  return null;
}

function findTableReferences(tableName: string): string[] {
  return detectTableReferences(process.cwd(), tableName, getExportNameForTable(tableName));
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

function getIndexColumnName(column: IndexColumn): string {
  return column.expression;
}

export interface TableGovernanceMetadata {
  ownershipScope: "Tenant-Owned" | "Global";
  rlsPoliciesDeclared: string;
  tenantRlsPolicyCoverage: string;
  migrationCoverage: string;
  runtimeEnforcementVerification: string;
}

/** Keep ownership, policy declarations, migration state, and live verification separate. */
export function getTableGovernanceMetadata(
  table: Pick<SnapshotTable, "name" | "columns" | "policies">,
  policyCoverage: Pick<ReturnType<typeof getTenantTableCoverageFromSnapshot>, "missingPolicyTables">,
  migrationCoverage: Pick<RlsMigrationCoverage, "missingEnable" | "missingForce">,
): TableGovernanceMetadata {
  const ownershipScope = getTableOwnershipScope(table);
  const policyCount = Object.keys(table.policies ?? {}).length;
  const rlsPoliciesDeclared = policyCount === 0
    ? "None"
    : String(policyCount) + " policy object" + (policyCount === 1 ? "" : "s");

  if (ownershipScope === "Global") {
    return {
      ownershipScope,
      rlsPoliciesDeclared,
      tenantRlsPolicyCoverage: "Not applicable (Global)",
      migrationCoverage: "Not applicable (Global)",
      runtimeEnforcementVerification: "Not applicable (Global)",
    };
  }

  const tenantRlsPolicyCoverage = policyCoverage.missingPolicyTables.includes(table.name)
    ? policyCount === 0 ? "Missing" : "Incomplete"
    : "Complete (SELECT, INSERT, UPDATE, DELETE)";

  const missingMigrationParts: string[] = [];
  if (migrationCoverage.missingEnable.includes(table.name)) missingMigrationParts.push("ENABLE");
  if (migrationCoverage.missingForce.includes(table.name)) missingMigrationParts.push("FORCE");
  const migrationStatus = missingMigrationParts.length
    ? "Incomplete (missing " + missingMigrationParts.join(" + ") + ")"
    : "Complete (ENABLE + FORCE in checked-in journal)";

  return {
    ownershipScope,
    rlsPoliciesDeclared,
    tenantRlsPolicyCoverage,
    migrationCoverage: migrationStatus,
    runtimeEnforcementVerification:
      "Not verified by static generation; see PostgreSQL isolation suite",
  };
}

function generateMarkdown(): void {
  const snapshotPath = getLatestSnapshotPath();
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const tables = Object.values(snapshot.tables).sort((a, b) => a.name.localeCompare(b.name));
  const policyCoverage = getTenantTableCoverageFromSnapshot(snapshot);
  const migrationCoverage = getRlsMigrationCoverage(process.cwd());

  let md = "# Database Reference Matrix\n\n";
  md += "**Ownership rule:** `organizations` is the tenant root. A table is Tenant-Owned when its canonical schema declares `organization_id` or `tenant_id`, unless a reviewed exception with a rationale is recorded in `GLOBAL_OWNERSHIP_EXCEPTIONS`. Ownership is never inferred from whether an RLS policy exists.\n\n";
  md += "**Verification boundary:** policy declarations and ENABLE/FORCE migration coverage are static checks against the Drizzle snapshot and checked-in migration journal. Runtime enforcement is not inferred here; it requires the PostgreSQL isolation suite.\n\n";
  let orphanTablesCount = 0;
  let wiredTablesCount = 0;

  for (const table of tables) {
    const refs = findTableReferences(table.name);
    const governance = getTableGovernanceMetadata(table, policyCoverage, migrationCoverage);
    const status = refs.length === 0 ? "`ORPHAN-TABLE` (LEGACY-CANDIDATE)" : "`WIRED`";
    const consumers = refs.length === 0 ? "-" : refs.map((ref) => `\`${ref}\``).join(", ");

    if (refs.length === 0) orphanTablesCount++;
    else wiredTablesCount++;

    md += `## Table: \`${table.name}\`\n\n`;
    md += "- **Ownership Scope:** " + governance.ownershipScope + "\n";
    md += "- **RLS Policies Declared:** " + governance.rlsPoliciesDeclared + "\n";
    md += "- **Tenant RLS Policy Coverage:** " + governance.tenantRlsPolicyCoverage + "\n";
    md += "- **Migration Coverage:** " + governance.migrationCoverage + "\n";
    md += "- **Runtime Enforcement Verification:** " + governance.runtimeEnforcementVerification + "\n";
    md += `- **Status:** ${status}\n`;
    md += `- **Consumers:** ${consumers}\n\n`;
    md += "### Columns\n\n";
    md += "| Name | Type | Not Null | Primary Key | Default |\n";
    md += "|---|---|---|---|---|\n";

    for (const column of Object.values(table.columns).sort((a, b) => a.name.localeCompare(b.name))) {
      const notNull = column.notNull ? "✅" : "❌";
      const primaryKey = column.primaryKey ? "✅" : "❌";
      const defaultValue = column.default !== undefined ? `\`${String(column.default)}\`` : "NULL";
      md += `| \`${column.name}\` | \`${column.type}\` | ${notNull} | ${primaryKey} | ${defaultValue} |\n`;
    }

    const compositeKeys = Object.values(table.compositePrimaryKeys || {}).sort((a, b) => a.name.localeCompare(b.name));
    if (compositeKeys.length > 0) {
      md += "\n### Composite Primary Keys\n\n";
      md += "| Name | Columns |\n|---|---|\n";
      for (const key of compositeKeys) {
        md += `| \`${key.name}\` | \`${key.columns.join(", ")}\` |\n`;
      }
    }

    const indexes = Object.values(table.indexes || {}).sort((a, b) => a.name.localeCompare(b.name));
    if (indexes.length > 0) {
      md += "\n### Indexes\n\n";
      md += "| Name | Columns | Method | Unique | Predicate |\n|---|---|---|---|---|\n";
      for (const index of indexes) {
        const columns = index.columns.map(getIndexColumnName).join(", ");
        const method = index.method || "unknown";
        const unique = index.isUnique ? "✅" : "❌";
        const predicate = index.where ? `\`${escapeMarkdownCell(index.where)}\`` : "—";
        md += `| \`${index.name}\` | \`${escapeMarkdownCell(columns)}\` | \`${method}\` | ${unique} | ${predicate} |\n`;
      }
    }

    const uniqueConstraints = Object.values(table.uniqueConstraints || {}).sort((a, b) => a.name.localeCompare(b.name));
    if (uniqueConstraints.length > 0) {
      md += "\n### Unique Constraints\n\n";
      md += "| Name | Columns | Nulls Not Distinct |\n|---|---|---|\n";
      for (const constraint of uniqueConstraints) {
        const nullsNotDistinct = constraint.nullsNotDistinct ? "✅" : "❌";
        md += `| \`${constraint.name}\` | \`${constraint.columns.join(", ")}\` | ${nullsNotDistinct} |\n`;
      }
    }

    const checkConstraints = Object.values(table.checkConstraints || {}).sort((a, b) => a.name.localeCompare(b.name));
    if (checkConstraints.length > 0) {
      md += "\n### Check Constraints\n\n";
      md += "| Name | Expression |\n|---|---|\n";
      for (const constraint of checkConstraints) {
        md += `| \`${constraint.name}\` | \`${escapeMarkdownCell(constraint.value)}\` |\n`;
      }
    }

    const foreignKeys = Object.values(table.foreignKeys || {}).sort((a, b) => a.name.localeCompare(b.name));
    if (foreignKeys.length > 0) {
      md += "\n### Foreign Keys\n\n";
      md += "| Name | Columns | Foreign Table | Foreign Columns | On Delete |\n|---|---|---|---|---|\n";
      for (const foreignKey of foreignKeys) {
        const onDelete = foreignKey.onDelete || "NO ACTION";
        md += `| \`${foreignKey.name}\` | \`${foreignKey.columnsFrom.join(", ")}\` | \`${foreignKey.tableTo}\` | \`${foreignKey.columnsTo.join(", ")}\` | ${onDelete} |\n`;
      }
    }
    md += "\n---\n\n";
  }

  md += "\n## Summary\n";
  md += `- Total Tables: ${tables.length}\n`;
  md += `- WIRED Tables: ${wiredTablesCount}\n`;
  md += `- ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: ${orphanTablesCount}\n`;

  const outputPath = path.join(process.cwd(), "docs/database/reference-matrix.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, md);
  console.log("Generated docs/database/reference-matrix.md");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) generateMarkdown();
