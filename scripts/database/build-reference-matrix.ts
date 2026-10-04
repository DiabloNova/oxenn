import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

interface Journal {
  entries: { idx: number }[];
}

interface SnapshotTable {
  name: string;
  policies?: any;
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

function findTableReferences(tableName: string) {
    const schemaContent = fs.readFileSync(path.join(process.cwd(), "database/schema/index.ts"), "utf-8");
    const match = schemaContent.match(new RegExp(`export const ([a-zA-Z0-9_]+) = pgTable\\("${tableName}"`));
    const exportName = match ? match[1] : null;

    try {
        const grepCmd = `grep -rlE "\\b${tableName}\\b|\\b${exportName || "NO_EXPORT_FOUND"}\\b" src/ scripts/ tests/ | grep -v "tenant-tables.generated.ts" | grep -v "docsIndex.ts" | grep -v "build-reference-matrix.ts" | grep -v "database/schema" | grep -v "docsData.ts" || true`;
        const result = execSync(grepCmd).toString().trim();
        return result.split('\n').filter(Boolean);
    } catch(e) {
        return [];
    }
}

function findOrphanReferences(tables: string[]) {
    try {
        const grepCmd = `grep -roE "(FROM|JOIN|INTO|UPDATE) [a-zA-Z0-9_]+" src/ scripts/ tests/ | grep -v "docsIndex.ts" | grep -v "build-reference-matrix.ts" || true`;
        const results = execSync(grepCmd).toString().trim().split('\n').filter(Boolean);

        const validTables = new Set(tables);
        const ignoreList = new Set([
            "select", "values", "array", "now", "generate_series", "jsonb_array_elements", "jsonb_each",
            "set", "of", "with", "public", "information_schema", "pg_catalog", "pg_tables", "on", "checks",
            "query", "isolation", "foo", "table", "homepage_stats", "monitoring_configs_history", "token",
            "user", "credentials", "organization_id", "public"
        ]);

        let foundOrphans = 0;
        let actualOrphans: string[] = [];
        for (const line of results) {
            const parts = line.split(':');
            if (parts.length < 2) continue;

            const match = parts.slice(1).join(':').match(/(FROM|JOIN|INTO|UPDATE) ([a-zA-Z0-9_]+)/i);
            if (match && match[2]) {
                const tableName = match[2].toLowerCase();
                if (!validTables.has(tableName) && !ignoreList.has(tableName)) {
                    actualOrphans.push(line);
                    foundOrphans++;
                }
            }
        }

        if (actualOrphans.length > 0) {
            console.log("\nPotential ORPHAN-REFERENCE details:");
            actualOrphans.forEach(o => console.log(o));
        }

        return foundOrphans;
    } catch(e) {
        console.error(e);
        return 0;
    }
}

function generateMarkdown() {
  const snapshotPath = getLatestSnapshotPath();
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

  const tables = Object.values(snapshot.tables).sort((a, b) => a.name.localeCompare(b.name));
  const tableNames = tables.map(t => t.name);

  let md = `# Database Reference Matrix\n\n`;
  md += `| Table Name | Scope | RLS Enabled | Status | Consumers |\n`;
  md += `|---|---|---|---|---|\n`;

  let orphanTablesCount = 0;
  let wiredTablesCount = 0;

  for (const t of tables) {
      const refs = findTableReferences(t.name);

      const isTenantScoped = TENANT_SCOPED_TABLES.includes(t.name as any);
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
          consumers = refs.map(r => `\`${r.split('/').pop()}\``).join(", ");
          wiredTablesCount++;
      }

      md += `| \`${t.name}\` | ${scope} | ${rlsStatus} | ${status} | ${consumers} |\n`;
  }

  md += `\n## Summary\n`;
  md += `- Total Tables: ${tables.length}\n`;
  md += `- WIRED Tables: ${wiredTablesCount}\n`;
  md += `- ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: ${orphanTablesCount}\n`;

  const outputPath = path.join(process.cwd(), "docs/database/reference-matrix.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, md);
  console.log(`Generated docs/database/reference-matrix.md`);

  // Also run orphan reference check
  console.log("Checking for ORPHAN-REFERENCE...");
  const orphans = findOrphanReferences(tableNames);
  if (orphans > 0) {
      console.log(`WARNING: Found ${orphans} potential orphan references! (Could be false positives)`);
  } else {
      console.log(`SUCCESS: 0 ORPHAN-REFERENCE found.`);
  }
}

generateMarkdown();
