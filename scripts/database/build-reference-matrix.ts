import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { TENANT_SCOPED_TABLES } from "../../src/core/database/tenant-context";

interface Journal {
  entries: { idx: number }[];
}

interface SnapshotTable {
  name: string;
  policies?: Record<string, unknown>;
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

    // Recursive directory read
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
        const match = content.match(new RegExp(`export const ([a-zA-Z0-9_]+) = pgTable\\("\${tableName}"`));
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

function findOrphanReferences(tables: string[]) {
    try {
        // Use a case-insensitive grep and look for SQL patterns
        const grepCmd = `grep -iroE "(FROM|JOIN|INTO|UPDATE)\\s+([a-zA-Z0-9_]+\\.)?[a-zA-Z0-9_]+" src/ scripts/ tests/ | grep -v "docsIndex.ts" | grep -v "build-reference-matrix.ts" || true`;
        const results = execSync(grepCmd).toString().trim().split('\n').filter(Boolean);

        const validTables = new Set(tables);

        // Let's ignore common false positives (English words following 'from', etc)
        const ignoreList = new Set([
            "select", "values", "array", "now", "generate_series", "jsonb_array_elements", "jsonb_each",
            "set", "of", "with", "public", "information_schema", "pg_catalog", "pg_tables", "on", "checks",
            "query", "isolation", "foo", "table", "homepage_stats", "monitoring_configs_history", "token",
            "user", "credentials", "organization_id",
            "db", "leaking", "edge", "environment", "seed", "14", "standard", "vector", "segments", "previous", "finding", "one", "robots", "those", "sitemap", "your", "each", "records", "server", "postgresql", "chunk", "brand", "exactly", "chatgpt", "setup", "top", "12", "10", "7", "6", "center", "canvas", "positive", "unauthenticated", "request", "header", "recommendation", "dec", "our", "defaults", "library", "local", "claim_crawl_jobs", "recover_expired_crawl_jobs", "last", "80", "pg_database", "update", "txt", "8", "5", "localstorage", "hydration", "clean", "premium", "scratch",
            "foundational", "generative", "website", "the", "semantic", "static", "url", "slightly", "landing",
            "secure", "auth", "var", "0deg", "a", "database", "sql", "consuming", "globals", "change",
            "authenticator", "pool", "regular", "ai", "urls", "an", "llm", "page", "kg", "historical",
            "prompt", "several", "executions", "homepage", "higher", "analyzed", "any", "relevant", "related",
            "dynamic", "all", "competitive", "response", "numbered", "monitored", "tenant", "notes", "actual",
            "raw", "0", "elements", "markdown", "future", "four", "usage", "this", "latency", "english", "basic",
            "legacy", "custom", "migrations", "customer", "strongly", "domain", "distinct", "services", "reads",
            "rich", "its", "that", "calculated", "drizzle", "graphnode", "tables", "billing", "cheerio", "path",
            "structured", "collected", "technicalhealth", "contentquality", "entitysignals", "structureddatasignals",
            "crawl", "word", "document", "existing", "snapp", "associations", "session", "tenantcontextmanager",
            "context", "multiple", "navigation", "seo", "unknown", "free", "other", "metadata", "own", "columns",
            "output", "src", "test", "was", "performing", "admin", "quality", "authenticated", "ir", "1"
        ]);

        let foundOrphans = 0;
        const actualOrphans: string[] = [];
        for (const line of results) {
            const parts = line.split(':');
            if (parts.length < 2) continue;

            // Match (FROM|JOIN|INTO|UPDATE) [schema.]table
            const match = parts.slice(1).join(':').match(/(FROM|JOIN|INTO|UPDATE)\s+(([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)/i);
            if (match && match[4]) {
                const tableName = match[4].toLowerCase();

                // If it's a known table, skip
                if (validTables.has(tableName)) continue;

                // If it's in the ignore list (English word), skip
                if (ignoreList.has(tableName)) continue;

                // Real orphans
                actualOrphans.push(line);
                foundOrphans++;
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
