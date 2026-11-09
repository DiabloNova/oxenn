import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRIVILEGED_PATHS_REGISTRY } from "../../../../src/core/database/privileged-paths";
import { DOCS_INDEX } from "../../../../src/lib/docsIndex";
import { createContentSnippet } from "../../../../scripts/docs-snippet";

type PurposeTag = keyof typeof PRIVILEGED_PATHS_REGISTRY;

const repositoryRoot = process.cwd();
const documentationPath = path.join(repositoryRoot, "docs/security/privileged-paths.md");
const documentation = fs.readFileSync(documentationPath, "utf8");

function collectSchemaTableNames(directory: string): Set<string> {
  const names = new Set<string>();

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const name of collectSchemaTableNames(entryPath)) names.add(name);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const source = fs.readFileSync(entryPath, "utf8");
    for (const match of source.matchAll(/pgTable\(\s*["']([^"']+)["']/g)) {
      names.add(match[1]);
    }
  }

  return names;
}

function parseDocumentationRows() {
  const rows = new Map<
    string,
    { status: string; tables: string[]; callers: string[] }
  >();

  for (const line of documentation.split(/\r?\n/)) {
    if (!line.startsWith("| **")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const purpose = cells[1]?.replace(/^\*\*|\*\*$/g, "");
    if (!purpose) continue;

    rows.set(purpose, {
      status: cells[2],
      tables: Array.from(cells[3].matchAll(/`([^`]+)`/g), (match) => match[1]),
      callers: Array.from(cells[4].matchAll(/`([^`]+)`/g), (match) => match[1])
    });
  }

  return rows;
}

describe("Privileged paths documentation consistency", () => {
  const documentedRows = parseDocumentationRows();
  const schemaTables = collectSchemaTableNames(path.join(repositoryRoot, "database/schema"));

  it("documents every registered purpose exactly once", () => {
    const registryPurposes = Object.keys(PRIVILEGED_PATHS_REGISTRY).sort();
    const documentedPurposes = Array.from(documentedRows.keys()).sort();

    expect(documentedPurposes).toEqual(registryPurposes);
  });

  it("keeps documented tables and caller modules aligned with registry metadata", () => {
    for (const purpose of Object.keys(PRIVILEGED_PATHS_REGISTRY) as PurposeTag[]) {
      const registryEntry = PRIVILEGED_PATHS_REGISTRY[purpose];
      const documentedEntry = documentedRows.get(purpose);

      expect(documentedEntry, `Missing documentation row for ${purpose}`).toBeDefined();
      if (registryEntry.status === "in-use") {
        expect(documentedEntry?.status).toMatch(/^In use(?: \(.+\))?$/);
      } else {
        expect(documentedEntry?.status).toBe("Registered; no current caller found");
      }
      expect(documentedEntry?.tables.sort()).toEqual([...registryEntry.allowedTables].sort());
      expect(documentedEntry?.callers.sort()).toEqual([...registryEntry.callerModules].sort());
      expect(registryEntry.callerModule).toBe(registryEntry.callerModules[0]);

      for (const callerModule of registryEntry.callerModules) {
        const callerPath = path.join(repositoryRoot, callerModule);
        expect(fs.existsSync(callerPath), `Missing caller module: ${callerModule}`).toBe(true);
        const source = fs.readFileSync(callerPath, "utf8");
        expect(source).toContain("runWithSystemContext");
        expect(source).toMatch(new RegExp(`["']${purpose}["']`));
      }

      if (registryEntry.status === "unreferenced") {
        expect(registryEntry.callerModules).toEqual([]);
        expect(registryEntry.allowedTables).toEqual([]);
      }
    }
  });

  it("uses only canonical schema table names in observed-table metadata", () => {
    for (const [purpose, entry] of Object.entries(PRIVILEGED_PATHS_REGISTRY)) {
      for (const table of entry.allowedTables) {
        if (table === "*") continue;
        expect(schemaTables.has(table), `${purpose} references unknown schema table ${table}`).toBe(true);
      }
    }

    for (const legacyName of ["tenants", "tenant_users", "tenant_invitations"]) {
      const activeTableNames = Array.from(documentedRows.values()).flatMap((entry) => entry.tables);
      expect(activeTableNames).not.toContain(legacyName);
    }

    expect(documentation).toContain("organization_members.role");
    expect(documentation).toContain("frozen legacy");
  });

  it("marks the currently unreferenced API-auth purpose without deleting its registration", () => {
    expect(PRIVILEGED_PATHS_REGISTRY["sys-auth-api-check"].status).toBe("unreferenced");
    expect(PRIVILEGED_PATHS_REGISTRY["sys-auth-api-check"].callerModules).toEqual([]);
    expect(documentedRows.get("sys-auth-api-check")?.status).toBe(
      "Registered; no current caller found"
    );
  });

  it("keeps the generated docs index snippet synchronized with the source markdown", () => {
    const indexedDocument = DOCS_INDEX.find((entry) => entry.slug === "privileged-paths");

    expect(indexedDocument).toBeDefined();
    expect(indexedDocument?.snippet).toBe(createContentSnippet(documentation));
  });
});
