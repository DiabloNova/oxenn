import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

interface Journal {
  entries: { idx: number }[];
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
    columns: string[];
    isUnique: boolean;
  }>;
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

    function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
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

    const files = getAllFiles(schemaDir);

    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = content.match(new RegExp(`export const ([a-zA-Z0-9_]+) = pgTable\\("${escaped}"`));
        if (match) return match[1];
    }
    return null;
}

function findTableReferences(tableName: string) {
    const exportName = getExportNameForTable(tableName);

    try {
        const grepCmd = `grep -rlE "\\b${tableName}\\b|\\b${exportName || "NO_EXPORT_FOUND"}\\b" src/ scripts/ tests/ | grep -v "tenant-tables.generated.ts" | grep -v "docsIndex.ts" | grep -v "build-reference-matrix.ts" | grep -v "database/schema" | grep -v "docsData.ts" || true`;
        const result = execSync(grepCmd).toString().trim();
        return result.split('\n').filter(Boolean).sort();
    } catch(e) {
        return [];
    }
}

function generateMarkdown() {
  const snapshotPath = getLatestSnapshotPath();
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

  const tables = Object.values(snapshot.tables).sort((a, b) => a.name.localeCompare(b.name));
  const tableNames = tables.map(t => t.name);

  let md = `# Database Reference Matrix\n\n`;

  let orphanTablesCount = 0;
  let wiredTablesCount = 0;

  for (const t of tables) {
      const refs = findTableReferences(t.name);

      const isTenantScoped = TENANT_SCOPED_TABLES.includes(t.name as never);
      const scope = isTenantScoped ? "Tenant-Scoped" : "Global";

      const hasRls = t.policies && Object.keys(t.policies).length > 0;
      const rlsStatus = hasRls ? "✅" : "❌";

      let status = "";
      let consumers = "";

      if (refs.length === 0) {
          status = "`ORPHAN-TABLE` (LEGACY-CANDIDATE)";
          consumers = "-";
          orphanTablesCount++;
      } else {
          status = "`WIRED`";
          consumers = refs.map(r => `\`${r}\``).join(", ");
          wiredTablesCount++;
      }

      md += `## Table: \`${t.name}\`\n\n`;
      md += `- **Scope:** ${scope}\n`;
      md += `- **RLS Enabled:** ${rlsStatus}\n`;
      md += `- **Status:** ${status}\n`;
      md += `- **Consumers:** ${consumers}\n\n`;
      md += `### Columns\n\n`;
      md += `| Name | Type | Not Null | Primary Key | Default |\n`;
      md += `|---|---|---|---|---|\n`;

      const cols = Object.values(t.columns).sort((a,b) => a.name.localeCompare(b.name));
      for (const c of cols) {
        const isNotNull = c.notNull ? "✅" : "❌";
        const isPk = c.primaryKey ? "✅" : "❌";
        const defaultVal = c.default !== undefined ? `\`${c.default}\`` : "NULL";
        md += `| \`${c.name}\` | \`${c.type}\` | ${isNotNull} | ${isPk} | ${defaultVal} |\n`;
      }

      if (t.indexes && Object.keys(t.indexes).length > 0) {
        md += `\n### Indexes\n\n`;
        md += `| Name | Columns | Unique |\n`;
        md += `|---|---|---|\n`;
        const idxs = Object.values(t.indexes).sort((a,b) => a.name.localeCompare(b.name));
        for (const idx of idxs) {
            const isUnique = idx.isUnique ? "✅" : "❌";
            md += `| \`${idx.name}\` | \`${idx.columns.join(", ")}\` | ${isUnique} |\n`;
        }
      }

      if (t.foreignKeys && Object.keys(t.foreignKeys).length > 0) {
        md += `\n### Foreign Keys\n\n`;
        md += `| Name | Columns | Foreign Table | Foreign Columns | On Delete |\n`;
        md += `|---|---|---|---|---|\n`;
        const fks = Object.values(t.foreignKeys).sort((a,b) => a.name.localeCompare(b.name));
        for (const fk of fks) {
            const onDelete = fk.onDelete || "NO ACTION";
            md += `| \`${fk.name}\` | \`${fk.columnsFrom.join(", ")}\` | \`${fk.tableTo}\` | \`${fk.columnsTo.join(", ")}\` | ${onDelete} |\n`;
        }
      }

      md += "\n---\n\n";
  }

  md += `\n## Summary\n`;
  md += `- Total Tables: ${tables.length}\n`;
  md += `- WIRED Tables: ${wiredTablesCount}\n`;
  md += `- ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: ${orphanTablesCount}\n`;

  const outputPath = path.join(process.cwd(), "docs/database/reference-matrix.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, md);
  console.log(`Generated docs/database/reference-matrix.md`);
}

generateMarkdown();
