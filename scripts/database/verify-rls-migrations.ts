import fs from "node:fs";
import path from "node:path";

interface Journal {
  entries: { idx: number; tag: string }[];
}
interface SnapshotTable {
  name: string;
  policies?: Record<string, unknown>;
}
interface Snapshot {
  tables: Record<string, SnapshotTable>;
}
interface RlsState {
  enabled: boolean;
  forced: boolean;
}

const IDENTIFIER = String.raw`(?:"(?:""|[^"])*"|[a-zA-Z_][\\w$]*)`;

function normalizeTableName(name: string): string {
  return name.replaceAll('"', "").replaceAll('""', '"').toLowerCase();
}

/**
 * Remove SQL comments and literal contents before inspecting migration DDL.
 * Quoted identifiers are deliberately preserved. Dollar-quoted function bodies
 * and ordinary string literals must not be mistaken for executable statements.
 */
function stripCommentsAndLiterals(sql: string): string {
  let output = "";
  let i = 0;

  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      while (i < sql.length && sql[i] !== "\n") {
        output += " ";
        i++;
      }
      continue;
    }

    if (sql.startsWith("/*", i)) {
      let depth = 1;
      output += "  ";
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql.startsWith("/*", i)) {
          depth++;
          output += "  ";
          i += 2;
        } else if (sql.startsWith("*/", i)) {
          depth--;
          output += "  ";
          i += 2;
        } else {
          output += sql[i] === "\n" ? "\n" : " ";
          i++;
        }
      }
      continue;
    }

    if (sql[i] === "'") {
      output += " ";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          output += "  ";
          i += 2;
        } else if (sql[i] === "'") {
          output += " ";
          i++;
          break;
        } else {
          output += sql[i] === "\n" ? "\n" : " ";
          i++;
        }
      }
      continue;
    }

    if (sql[i] === "$") {
      const delimiter = sql.slice(i).match(/^\$(?:[a-zA-Z_][\w]*)?\$/)?.[0];
      if (delimiter) {
        const end = sql.indexOf(delimiter, i + delimiter.length);
        const stop = end === -1 ? sql.length : end + delimiter.length;
        const segment = sql.slice(i, stop);
        output += segment.replace(/[^\n]/g, " ");
        i = stop;
        continue;
      }
    }

    output += sql[i];
    i++;
  }

  return output;
}

function unquoteIdentifier(identifier: string): string {
  return identifier.startsWith('"')
    ? identifier.slice(1, -1).replaceAll('""', '"')
    : identifier;
}

function getPublicTableName(target: string): string | null {
  const qualified = target.trim().match(
    new RegExp(String.raw`^(?:(?:"public"|public)\\s*\\.\\s*)?(${IDENTIFIER})$`, "i"),
  );
  if (!qualified) return null;
  return normalizeTableName(unquoteIdentifier(qualified[1]));
}

function applyMigrationStatement(statement: string, state: Map<string, RlsState>): void {
  const sql = statement.trim();
  if (!sql) return;

  const createMatch = sql.match(
    new RegExp(String.raw`^CREATE\\s+(?:UNLOGGED\\s+|TEMP(?:ORARY)?\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:(?:"public"|public)\\s*\\.\\s*)?(${IDENTIFIER})(?!\\s*\\.)`, "i"),
  );
  if (createMatch) {
    const table = normalizeTableName(unquoteIdentifier(createMatch[1]));
    if (state.has(table)) state.set(table, { enabled: false, forced: false });
    return;
  }

  const dropMatch = sql.match(/^DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?([\\s\\S]+)$/i);
  if (dropMatch) {
    const targets = dropMatch[1].replace(/\\s+(?:CASCADE|RESTRICT)\\s*$/i, "");
    for (const target of targets.split(",")) {
      const table = getPublicTableName(target);
      if (table && state.has(table)) state.set(table, { enabled: false, forced: false });
    }
    return;
  }

  const alterMatch = sql.match(
    new RegExp(
      String.raw`^ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(?:(?:"public"|public)\\s*\\.\\s*)?(${IDENTIFIER})(?!\\s*\\.)\\s+(ENABLE|DISABLE|FORCE|NO\\s+FORCE)\\s+ROW\\s+LEVEL\\s+SECURITY\\b`,
      "i",
    ),
  );
  if (!alterMatch) return;

  const table = normalizeTableName(unquoteIdentifier(alterMatch[1]));
  if (!state.has(table)) return;
  const action = alterMatch[2].toUpperCase().replace(/\\s+/g, " ");
  const current = state.get(table)!;
  if (action === "ENABLE") current.enabled = true;
  else if (action === "DISABLE") current.enabled = false;
  else if (action === "FORCE") current.forced = true;
  else current.forced = false;
}

function main(): void {
  const root = process.cwd();
  const migrationDirectory = path.join(root, "database/drizzle");
  const journalPath = path.join(migrationDirectory, "meta/_journal.json");
  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  if (!journal.entries.length) throw new Error("Migration journal has no entries.");

  const snapshotPath = path.join(
    migrationDirectory,
    "meta",
    String(journal.entries[journal.entries.length - 1].idx).padStart(4, "0") + "_snapshot.json",
  );
  const snapshot: Snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const policyTables = Object.values(snapshot.tables)
    .filter((table) => table.policies && Object.keys(table.policies).length > 0)
    .map((table) => normalizeTableName(table.name))
    .sort();

  const state = new Map<string, RlsState>(
    policyTables.map((table) => [table, { enabled: false, forced: false }]),
  );
  const migrationFiles = journal.entries.map((entry) => {
    const filePath = path.join(migrationDirectory, entry.tag + ".sql");
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration journal entry "${entry.tag}" has no matching SQL file.`);
    }
    return { tag: entry.tag, sql: fs.readFileSync(filePath, "utf8") };
  });

  for (const migration of migrationFiles) {
    const executableSql = stripCommentsAndLiterals(migration.sql);
    for (const statement of executableSql.split(";")) {
      applyMigrationStatement(statement, state);
    }
  }

  const missingEnable = policyTables.filter((table) => !state.get(table)?.enabled);
  const missingForce = policyTables.filter((table) => !state.get(table)?.forced);

  if (missingEnable.length || missingForce.length) {
    console.error("RLS migration final-state verification failed.");
    if (missingEnable.length) console.error("RLS not enabled at end of journal:", missingEnable.join(", "));
    if (missingForce.length) console.error("RLS not forced at end of journal:", missingForce.join(", "));
    process.exitCode = 1;
    return;
  }

  console.log(
    `RLS migration final-state verified for ${policyTables.length} policy-bearing tables (journal order; ENABLE + FORCE active).`,
  );
  console.log("Static migration verification only; this does not inspect a live database.");
}

main();
