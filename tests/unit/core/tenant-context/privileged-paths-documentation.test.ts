import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { PRIVILEGED_PATHS_REGISTRY } from "../../../../src/core/database/privileged-paths";
import { DOCS_INDEX } from "../../../../src/lib/docsIndex";
import { createContentSnippet } from "../../../../scripts/docs-snippet";

type PurposeTag = keyof typeof PRIVILEGED_PATHS_REGISTRY;
type DirectSystemContextCall = { purpose?: string; line: number };
type RealPathResolver = (candidatePath: string) => string;

function getRealPath(candidatePath: string): string {
  if (!ts.sys.realpath) {
    throw new Error("The TypeScript host must provide realpath for path-containment checks");
  }
  return ts.sys.realpath(candidatePath);
}

const repositoryRoot = getRealPath(ts.sys.getCurrentDirectory());

function isOutsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

function resolveExistingPathWithinRoot(
  rootPath: string,
  candidatePath: string,
  realPath: RealPathResolver = getRealPath
): string {
  const canonicalRoot = realPath(rootPath);
  const resolvedCandidate = ts.sys.resolvePath(path.resolve(canonicalRoot, candidatePath));

  if (isOutsideRoot(canonicalRoot, resolvedCandidate)) {
    throw new Error(`Path escapes repository root: ${candidatePath}`);
  }

  const canonicalCandidate = realPath(resolvedCandidate);
  if (isOutsideRoot(canonicalRoot, canonicalCandidate)) {
    throw new Error(`Resolved path escapes repository root: ${candidatePath}`);
  }

  return canonicalCandidate;
}

function readFileWithinRoot(rootPath: string, candidatePath: string): string {
  const safePath = resolveExistingPathWithinRoot(rootPath, candidatePath);
  const content = ts.sys.readFile(safePath);
  if (content === undefined) {
    throw new Error(`Unable to read repository file: ${candidatePath}`);
  }
  return content;
}

function collectSourceFiles(): string[] {
  const extensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];
  const files = ts.sys.readDirectory(repositoryRoot, extensions, undefined, [
    "src/**/*",
    "scripts/**/*",
    "tests/**/*",
    "verification/**/*"
  ]);

  return files.map((filePath) => resolveExistingPathWithinRoot(repositoryRoot, filePath));
}

function collectSchemaTableNames(directory: string): Set<string> {
  const names = new Set<string>();
  const safeDirectory = resolveExistingPathWithinRoot(repositoryRoot, directory);
  const files = ts.sys.readDirectory(safeDirectory, [".ts"], undefined, ["**/*.ts"]);

  for (const filePath of files) {
    const source = readFileWithinRoot(repositoryRoot, filePath);
    for (const match of source.matchAll(/pgTable\(\s*["']([^"']+)["']/g)) {
      names.add(match[1]);
    }
  }

  return names;
}

function getStringLiteralValue(expression: ts.Expression | undefined): string | undefined {
  let current = expression;
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current))
  ) {
    current = current.expression;
  }

  return current &&
    (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current))
    ? current.text
    : undefined;
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
          getStringLiteralValue(expression.argumentExpression) === "runWithSystemContext");

      if (isDirectSystemContextCall) {
        calls.push({
          purpose: getStringLiteralValue(node.arguments[1]),
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
  const documentation = readFileWithinRoot(repositoryRoot, documentationPath);
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
  const schemaTables = collectSchemaTableNames("database/schema");

  it("documents every registered purpose exactly once", () => {
    const registryPurposes = Object.keys(PRIVILEGED_PATHS_REGISTRY).sort();
    const documentedPurposes = Array.from(documentedRows.keys()).sort();

    expect(documentedPurposes).toEqual(registryPurposes);
  });

  it("reconciles every direct AST call site with the registry and documentation", () => {
    const callerModules = new Map<string, Set<string>>();
    const invalidCallSites: string[] = [];
    const unregisteredCalls: string[] = [];
    const expectedNegativeTestCalls = [
      "tests/unit/core/tenant-context/privileged-paths.test.ts:unregistered-haxor-tag"
    ];

    for (const sourcePath of collectSourceFiles()) {
      const source = readFileWithinRoot(repositoryRoot, sourcePath);
      const modulePath = path.relative(repositoryRoot, sourcePath).split(path.sep).join("/");

      for (const call of collectDirectSystemContextCalls(source, sourcePath)) {
        if (!call.purpose) {
          invalidCallSites.push(`${modulePath}:${call.line} uses a non-literal purpose`);
          continue;
        }

        if (!Object.prototype.hasOwnProperty.call(PRIVILEGED_PATHS_REGISTRY, call.purpose)) {
          unregisteredCalls.push(`${modulePath}:${call.purpose}`);
          continue;
        }

        const callers = callerModules.get(call.purpose) ?? new Set<string>();
        callers.add(modulePath);
        callerModules.set(call.purpose, callers);
      }
    }

    // This negative unit test deliberately passes an unregistered literal to verify rejection.
    expect(invalidCallSites).toEqual([]);
    expect(unregisteredCalls.sort()).toEqual(expectedNegativeTestCalls);

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

  it("rejects paths whose canonical target escapes the trusted root", () => {
    const candidatePath = ts.sys.resolvePath(path.resolve(repositoryRoot, "internal-link"));
    const outsidePath = ts.sys.resolvePath(path.resolve(repositoryRoot, "../outside"));
    const simulatedRealPath: RealPathResolver = (candidate) =>
      candidate === candidatePath ? outsidePath : candidate;

    expect(() =>
      resolveExistingPathWithinRoot(repositoryRoot, candidatePath, simulatedRealPath)
    ).toThrow(/Resolved path escapes repository root/);
  });

  it("keeps the generated docs index snippet synchronized with the source markdown", () => {
    const indexedDocument = DOCS_INDEX.find((entry) => entry.slug === "privileged-paths");

    expect(indexedDocument).toBeDefined();
    expect(indexedDocument?.snippet).toBe(createContentSnippet(documentation));
  });
});
