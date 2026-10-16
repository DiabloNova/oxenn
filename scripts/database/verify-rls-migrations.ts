import fs from "node:fs";
import path from "node:path";

interface Journal { entries: { idx: number }[]; }
interface SnapshotTable { name: string; policies?: Record<string, unknown>; }
interface Snapshot { tables: Record<string, SnapshotTable>; }

function readSqlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readSqlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".sql")
      ? [fs.readFileSync(fullPath, "utf8")]
      : [];
  });
}

function normalizeTableName(name: string): string {
  return name.replace(/^public\./i, "").replaceAll('"', "").toLowerCase();
}

function collectTables(sql: string, action: "ENABLE" | "FORCE"): Set<string> {
  const tables = new Set<string>();
  const pattern = new RegExp(
    "ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:\\"?public\\"?\\s*\\.\\s*)?\\"?([a-zA-Z_][\\w$]*)\\"?\\s+" +
      action + "\\s+ROW\\s+LEVEL\\s+SECURITY\\b",
    "gi",
  );
  for (const match of sql.matchAll(pattern)) tables.add(normalizeTableName(match[1]));
  return tables;
}

function main(): void {
  const root = process.cwd();
  const journalPath = path.join(root, "database/drizzle/meta/_journal.json");
  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  if (!journal.entries.length) throw new Error("Migration journal has no entries.");

  const snapshotPath = path.join(
    root,
    "database/drizzle/meta",
    String(journal.entries[journal.entries.length - 1].idx).padStart(4, "0") + "_snapshot.json",
  );
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const policyTables = Object.values(snapshot.tables)
    .filter((table) => table.policies && Object.keys(table.policies).length > 0)
    .map((table) => normalizeTableName(table.name))
    .sort();

  const migrationSql = readSqlFiles(path.join(root, "database/drizzle")).join("\\n");
  const enabled = collectTables(migrationSql, "ENABLE");
  const forced = collectTables(migrationSql, "FORCE");
  const missingEnable = policyTables.filter((table) => !enabled.has(table));
  const missingForce = policyTables.filter((table) => !forced.has(table));

  if (missingEnable.length || missingForce.length) {
    console.error("RLS migration coverage drift detected.");
    if (missingEnable.length) console.error("Missing ENABLE ROW LEVEL SECURITY:", missingEnable.join(", "));
    if (missingForce.length) console.error("Missing FORCE ROW LEVEL SECURITY:", missingForce.join(", "));
    process.exitCode = 1;
    return;
  }

  console.log("RLS migration coverage verified for " + policyTables.length + " policy-bearing tables (ENABLE + FORCE statements found).");
  console.log("Static migration verification only; this does not inspect a live database.");
}

main();
