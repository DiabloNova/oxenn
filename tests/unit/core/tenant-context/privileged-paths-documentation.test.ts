import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { PRIVILEGED_PATHS_REGISTRY } from "../../../../src/core/database/privileged-paths";
import { DOCS_INDEX } from "../../../../src/lib/docsIndex";
import { createContentSnippet } from "../../../../scripts/docs-snippet";

type PurposeTag = keyof typeof PRIVILEGED_PATHS_REGISTRY;
type DirectSystemContextCall = { purpose?: string; line: number };

const repositoryRoot = fs.realpathSync(process.cwd());

function isOutsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

function resolveExistingPathWithinRoot(rootPath: string, candidatePath: string): string {
  const canonicalRoot = fs.realpathSync(rootPath);
  const resolvedCandidate = path.resolve(canonicalRoot, candidatePath);

  if (isOutsideRoot(canonicalRoot, resolvedCandidate)) {
    throw new Error(`Path escapes repository root: ${candidatePath}`);
  }

  const canonicalCandidate = fs.realpathSync(resolvedCandidate);
  if (isOutsideRoot(canonicalRoot, canonicalCandidate)) {
    throw new Error(`Resolved path escapes repository root: ${candidatePath}`);
  }

  return canonicalCandidate;
}

function collectSourceFiles(directory: string): string[] {
  const safeDirectory = resolveExistingPathWithinRoot(repositoryRoot, directory);
  const files: string[] = [];

  for (const entry of fs.readdirSync(safeDirectory, { withFileTypes: true })) {
    const entryPath = resolveExistingPathWithinRoot(
      repositoryRoot,
      path.join(safeDirectory, entry.name)
    );

    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && /\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function collectSchemaTableNames(directory: string): Set<string> {
  const names = new Set<string>();
  const safeDirectory = resolveExistingPathWithinRoot(repositoryRoot, directory);

  for (const entry of fs.readdirSync(safeDirectory, { withFileTypes: true })) {
    const entryPath = resolveExistingPathWithinRoot(
      repositoryRoot,
      path.join(safeDirectory, entry.name)
    );

    if (entry.isSymbolicLink()) continue;
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

function collectDirectSystemContextCalls(
  source: string,
  fileName: string
): DirectSystemContextCall[] {
  const extension = path.extname(fileName);
  const scriptKind =
    extension === ".tsx"
      ? ts.ScriptKind.TSX
      : extension === ".jsx"
        ? ts.ScriptKind.JSX
        : [".js", ".mjs", ".cjs"].includes(extension)
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const calls: DirectSystemContextCall[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const isDirectSystemContextCall =
        (ts.isIdentifier(expression) && expression.text === "runWithSystemContext") ||
        (ts.isPropertyAccessExpression(expression) &&
          expression.name.text === "runWithSystemContext") ||
        (ts.isElementAccessExpression(expression) &&
          expression.argumentExpression !== undefined &&
          (ts.isStringLiteral(expression.argumentExpression) ||
            ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression)) &&
          expression.argumentExpression.text === "runWithSystemContext");

      if (isDirectSystemContextCall) {
        const purposeArgument = node.arguments[1];
        const purpose =
          purposeArgument &&
          (ts.isStringLiteral(purposeArgument) ||
            ts.isNoSubstitutionTemplateLiteral(purposeArgument))
            ? purposeArgument.text
            : undefined;
        calls.push({
          purpose,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calls;
}

function parseDocumentationRows() {
  const documentationPath = resolveExistingPathWithinRoot(
    repositoryRoot,
    "docs/security/privileged-paths.md"
  );
  const documentation = fs.readFileSync(documentationPath, "utf8");
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

  return { documentation, rows };
}

describe("Privileged paths documentation consistency", () => {
  const { documentation, rows: documentedRows } = parseDocumentationRows();
  const schemaDirectory = resolveExistingPathWithinRoot(repositoryRoot, "database/schema");
  const schemaTables = collectSchemaTableNames(schemaDirectory);

  it("documents every registered purpose exactly once", () => {
    const registryPurposes = Object.keys(PRIVILEGED_PATHS_REGISTRY).sort();
    const documentedPurposes = Array.from(documentedRows.keys()).sort();

    expect(documentedPurposes).toEqual(registryPurposes);
  });

  it("reconciles every direct AST call site with the registry and documentation", () => {
    const callerModules = new Map<string, Set<string>>();
    const invalidCallSites: string[] = [];
    const sourceRoots = ["src", "scripts", "tests", "verification"].map((root) =>
      resolveExistingPathWithinRoot(repositoryRoot, root)
    );
    const sourceFiles = sourceRoots.flatMap((root) => collectSourceFiles(root));

    for (const sourcePath of sourceFiles) {
      const source = fs.readFileSync(sourcePath, "utf8");
      const modulePath = path.relative(repositoryRoot, sourcePath).split(path.sep).join("/");

      for (const call of collectDirectSystemContextCalls(source, sourcePath)) {
        if (!call.purpose) {
          invalidCallSites.push(`${modulePath}:${call.line} uses a non-literal purpose`);
          continue;
        }

        const callers = callerModules.get(call.purpose) ?? new Set<string>();
        callers.add(modulePath);
        callerModules.set(call.purpose, callers);
      }
    }

    expect(invalidCallSites).toEqual([]);

    for (const purpose of callerModules.keys()) {
      expect(
        Object.prototype.hasOwnProperty.call(PRIVILEGED_PATHS_REGISTRY, purpose),
        `Direct call uses unregistered purpose ${purpose}`
      ).toBe(true);
    }

    for (const purpose of Object.keys(PRIVILEGED_PATHS_REGISTRY) as PurposeTag[]) {
      const registryEntry = PRIVILEGED_PATHS_REGISTRY[purpose];
      const documentedEntry = documentedRows.get(purpose);
      const actualCallers = Array.from(callerModules.get(purpose) ?? []).sort();

      expect(documentedEntry, `Missing documentation row for ${purpose}`).toBeDefined();
      expect([...registryEntry.callerModules].sort()).toEqual(actualCallers);
      expect(registryEntry.status).toBe(actualCallers.length > 0 ? "in-use" : "unreferenced");
      expect(registryEntry.callerModule).toBe(registryEntry.callerModules[0]);
      expect(documentedEntry?.callers.sort()).toEqual(actualCallers);

      if (registryEntry.status === "in-use") {
        expect(documentedEntry?.status).toMatch(/^In use(?: \(.+\))?$/);
      } else {
        expect(documentedEntry?.status).toBe("Registered; no current caller found");
      }

      expect(documentedEntry?.tables.sort()).toEqual([...registryEntry.allowedTables].sort());
    }
  });

  it("recognizes real calls and ignores comments and string lookalikes", () => {
    const fixture = `
      // TenantContextManager.runWithSystemContext(null, "comment-only", callback)
      const example = 'TenantContextManager.runWithSystemContext(null, "string-only", callback)';
      TenantContextManager.runWithSystemContext(null, "sys-login", callback);
      TenantContextManager["runWithSystemContext"](null, "sys-register", callback);
      TenantContextManager.runWithSystemContext(null, purpose, callback);
    `;
    const calls = collectDirectSystemContextCalls(fixture, "fixture.ts");

    expect(calls.map((call) => call.purpose)).toEqual([
      "sys-login",
      "sys-register",
      undefined
    ]);
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

  it("rejects lexical traversal outside the repository root", () => {
    expect(() => resolveExistingPathWithinRoot(repositoryRoot, "../package.json")).toThrow(
      /Path escapes repository root/
    );
  });

  it("rejects symbolic links that resolve outside the trusted root", () => {
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "privileged-paths-"));
    const temporaryRoot = path.join(temporaryDirectory, "repository");
    const outsideFile = path.join(temporaryDirectory, "outside.txt");
    const escapedLink = path.join(temporaryRoot, "escaped.txt");

    try {
      fs.mkdirSync(temporaryRoot);
      fs.writeFileSync(outsideFile, "outside");
      fs.symlinkSync(outsideFile, escapedLink);

      expect(() => resolveExistingPathWithinRoot(temporaryRoot, escapedLink)).toThrow(
        /Resolved path escapes repository root/
      );
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("keeps the generated docs index snippet synchronized with the source markdown", () => {
    const indexedDocument = DOCS_INDEX.find((entry) => entry.slug === "privileged-paths");

    expect(indexedDocument).toBeDefined();
    expect(indexedDocument?.snippet).toBe(createContentSnippet(documentation));
  });
});
