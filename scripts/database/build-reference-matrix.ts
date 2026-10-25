import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

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
  policies?: Record<string, unknown>;
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
  const exportName = getExportNameForTable(tableName);
  try {
    const grepCmd = `grep -rlE "\\\\b${tableName}\\\\b|\\\\b${exportName || "NO_EXPORT_FOUND"}\\\\b" src/ scripts/ tests/ | grep -v "tenant-tables.generated.ts" | grep -v "docsIndex.ts" | grep -v "build-reference-matrix.ts" | grep -v "database/schema" | grep -v "docsData.ts" || true`;
    return execSync(grepCmd).toString().trim().split("\n").filter(Boolean).sort();
  } catch {
    return [];
  }
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

function getIndexColumnName(column: IndexColumn): string {
  return column.expression;
}

function generateMarkdown(): void {
  const snapshotPath = getLatestSnapshotPath();
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const tables = Object.values(snapshot.tables).sort((a, b) => a.name.localeCompare(b.name));

  let md = "# Database Reference Matrix\n\n";
  let orphanTablesCount = 0;
  let wiredTablesCount = 0;

  for (const table of tables) {
    const refs = findTableReferences(table.name);
    const isTenantScoped = TENANT_SCOPED_TABLES.includes(table.name as never);
    const scope = isTenantScoped ? "Tenant-Scoped" : "Global";
    const hasPolicies = Object.keys(table.policies || {}).length > 0;
    const policyStatus = hasPolicies ? "✅" : "❌";
    const status = refs.length === 0 ? "`ORPHAN-TABLE` (LEGACY-CANDIDATE)" : "`WIRED`";
    const consumers = refs.length === 0 ? "-" : refs.map((ref) => `\`${ref}\``).join(", ");

    if (refs.length === 0) orphanTablesCount++;
    else wiredTablesCount++;

    md += `## Table: \`${table.name}\`\n\n`;
    md += `- **Scope:** ${scope}\n`;
    md += `- **RLS Policies Defined:** ${policyStatus}\n`;
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

generateMarkdown();
