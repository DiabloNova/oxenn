import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const baselinePath = "docs/project/MVP_ENGINEERING_BASELINE.md";
const indexPath = "docs/project/README.md";

function readFile(relativePath) {
  const fullPath = path.resolve(root, relativePath);
  assert.ok(fs.existsSync(fullPath) && fs.statSync(fullPath).isFile(), "Missing repository file: " + relativePath);
  return fs.readFileSync(fullPath, "utf8");
}

function unique(values) {
  return Array.from(new Set(values)).sort();
}

function assertSameSet(actual, expected, label) {
  const actualSet = unique(actual);
  const expectedSet = unique(expected);
  assert.deepEqual(
    {
      missing: expectedSet.filter((value) => !actualSet.includes(value)),
      unexpected: actualSet.filter((value) => !expectedSet.includes(value)),
    },
    { missing: [], unexpected: [] },
    label + " differs from its source of truth",
  );
}

function parseTs(relativePath) {
  const source = readFile(relativePath);
  const file = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert.equal(file.parseDiagnostics.length, 0, "Invalid TypeScript syntax in " + relativePath);
  return { source, file };
}

function pgTables(relativePath) {
  const { file } = parseTs(relativePath);
  const names = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "pgTable" &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) names.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return names;
}

function runtimeTenantTables(relativePath) {
  const { file } = parseTs(relativePath);
  let values;
  function unwrap(node) {
    while (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    return node;
  }
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "TENANT_SCOPED_TABLES" &&
      node.initializer
    ) {
      let initializer = node.initializer;
      if (
        ts.isCallExpression(initializer) &&
        ts.isPropertyAccessExpression(initializer.expression) &&
        initializer.expression.expression.getText(file) === "Object" &&
        initializer.expression.name.text === "freeze"
      ) initializer = initializer.arguments[0];
      initializer = unwrap(initializer);
      assert.ok(initializer && ts.isArrayLiteralExpression(initializer), "TENANT_SCOPED_TABLES must be a literal array");
      values = initializer.elements.map((element) => {
        assert.ok(ts.isStringLiteralLike(element), "TENANT_SCOPED_TABLES must contain only string literals");
        return element.text;
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(values, "TENANT_SCOPED_TABLES was not found");
  return values;
}

function stripSqlComments(sql) {
  return sql.replace(/--[^\r\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeIdentifier(value) {
  return value.startsWith('"') ? value.slice(1, -1).replaceAll('""', '"') : value;
}

function createdTables(sql) {
  const pattern = /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"public"|public)\s*\.\s*)?("(?:[^"]|"")*"|[a-zA-Z_][\w$]*)/gi;
  return Array.from(stripSqlComments(sql).matchAll(pattern), (match) => normalizeIdentifier(match[1]).toLowerCase());
}

function rlsTables(sql) {
  const pattern = /\bALTER\s+TABLE\s+(?:(?:"public"|public)\s*\.\s*)?("(?:[^"]|"")*"|[a-zA-Z_][\w$]*)\s+(ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY\s*;/gi;
  const enabled = [];
  const forced = [];
  for (const match of stripSqlComments(sql).matchAll(pattern)) {
    (match[2].toUpperCase() === "ENABLE" ? enabled : forced).push(normalizeIdentifier(match[1]).toLowerCase());
  }
  return { enabled, forced };
}

function markdownLinks(markdown) {
  const tick = String.fromCharCode(96);
  const fences = new RegExp("(^|\\n)[ \\t]{0,3}(" + tick + "{3,}|~{3,})[^\\n]*\\n[\\s\\S]*?\\n[ \\t]{0,3}\\2[ \\t]*(?=\\n|$)", "g");
  const inlineCode = new RegExp(tick + "+[^\\n]*?" + tick + "+", "g");
  const content = markdown.replace(/<!--[\s\S]*?-->/g, "").replace(fences, "$1").replace(inlineCode, " ");
  const links = [];
  const pattern = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g;
  for (const match of content.matchAll(pattern)) {
    const value = match[1];
    links.push(value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value);
  }
  return links;
}

function headingSlugs(markdown) {
  const slugs = new Set();
  const counts = new Map();
  const tick = String.fromCharCode(96);
  const ticks = new RegExp(tick, "g");
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const slug = match[1]
      .replace(/<[^>]*>/g, "")
      .replace(ticks, "")
      .replace(/[*_~]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .replace(/\s+/g, "-");
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    slugs.add(count === 0 ? slug : slug + "-" + count);
  }
  return slugs;
}

function resolveLink(sourcePath, href) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return null;
  const hash = href.indexOf("#");
  const rawPath = hash < 0 ? href : href.slice(0, hash);
  const fragment = hash < 0 ? "" : decodeURIComponent(href.slice(hash + 1));
  const pathname = rawPath.split("?")[0];
  const sourceAbsolute = path.resolve(root, sourcePath);
  let target = pathname
    ? pathname.startsWith("/")
      ? path.resolve(root, "." + pathname)
      : path.resolve(path.dirname(sourceAbsolute), decodeURIComponent(pathname))
    : sourceAbsolute;

  assert.ok(fs.existsSync(target), "Broken relative link in " + sourcePath + ": " + href);
  if (fs.statSync(target).isDirectory()) {
    if (!fragment) return target;
    target = path.join(target, "README.md");
    assert.ok(fs.existsSync(target), "Directory anchor has no README.md: " + href);
  }
  if (fragment) {
    assert.ok(target.toLowerCase().endsWith(".md"), "Anchor does not point to Markdown: " + href);
    assert.ok(headingSlugs(fs.readFileSync(target, "utf8")).has(fragment.toLowerCase()), "Broken heading anchor: " + href);
  }
  return target;
}

function checkLinks(relativePath) {
  return markdownLinks(readFile(relativePath))
    .map((href) => ({ href, target: resolveLink(relativePath, href) }))
    .filter((link) => link.target !== null);
}

function checkInlinePaths(markdown) {
  const tick = String.fromCharCode(96);
  const inlineCode = new RegExp(tick + "+([^\\n]*?)" + tick + "+", "g");
  const prefixes = ["src/", "database/", "scripts/", "docs/", ".github/", ".env", "AGENTS.md", "package.json", "vitest.config.ts", "drizzle.config.ts"];
  const references = [];
  for (const match of markdown.matchAll(inlineCode)) {
    const value = match[1].trim();
    if (prefixes.some((prefix) => value === prefix || value.startsWith(prefix))) {
      references.push(value.replace(/:\d+(?:-\d+)?$/, "").replace(/\/$/, ""));
    }
  }
  const paths = unique(references);
  for (const relativePath of paths) {
    assert.ok(fs.existsSync(path.resolve(root, relativePath)), "Missing repository path referenced by baseline: " + relativePath);
  }
  return paths;
}

function main() {
  const baseline = readFile(baselinePath);
  readFile(indexPath);

  const schemaIndexTables = pgTables("database/schema/index.ts");
  const organizationTables = pgTables("database/schema/organization-table.ts");
  const apiKeyTables = pgTables("database/schema/api-keys.ts");
  assert.equal(organizationTables.length, 1, "Expected one organizations table in its schema module");
  assert.equal(apiKeyTables.length, 1, "Expected one api_keys table in its schema module");

  const schemaIndex = readFile("database/schema/index.ts");
  assert.match(schemaIndex, /import\s*\{\s*organizations\s*\}\s*from\s*["']\.\/organization-table["']/);
  assert.match(schemaIndex, /export\s*\{\s*organizations\s*\}/);
  assert.match(schemaIndex, /export\s*\*\s*from\s*["']\.\/api-keys["']/);

  const journal = JSON.parse(readFile("database/drizzle/meta/_journal.json"));
  assert.ok(Array.isArray(journal.entries) && journal.entries.length > 0, "Drizzle journal is empty");
  const latest = journal.entries[journal.entries.length - 1];
  const snapshotPath = "database/drizzle/meta/" + String(latest.idx).padStart(4, "0") + "_snapshot.json";
  const snapshot = JSON.parse(readFile(snapshotPath));
  assert.ok(snapshot.tables && typeof snapshot.tables === "object", "Latest Drizzle snapshot has no table map");

  const schemaTables = [...schemaIndexTables, ...organizationTables, ...apiKeyTables];
  assert.equal(unique(schemaTables).length, schemaTables.length, "Duplicate canonical schema table declaration");
  const snapshotTables = Object.values(snapshot.tables).map((table) => table.name);
  assert.equal(unique(snapshotTables).length, snapshotTables.length, "Duplicate table name in latest snapshot");
  assertSameSet(snapshotTables, schemaTables, "Canonical schema and latest snapshot");

  const migrationTables = [];
  for (const entry of journal.entries) {
    migrationTables.push(...createdTables(readFile("database/drizzle/" + entry.tag + ".sql")));
  }
  assert.equal(unique(migrationTables).length, migrationTables.length, "Migration history creates a table more than once");
  assertSameSet(migrationTables, snapshotTables, "Migration-created table set and latest snapshot");

  const policyTables = Object.values(snapshot.tables)
    .filter((table) => table.policies && Object.keys(table.policies).length > 0)
    .map((table) => table.name);
  const runtimeTables = runtimeTenantTables("src/core/database/tenant-tables.generated.ts");
  assertSameSet(runtimeTables, policyTables, "Runtime tenant-table list and latest snapshot RLS set");

  const rlsEntry = journal.entries.find((entry) => entry.tag === "0005_force_rls");
  assert.ok(rlsEntry, "Migration journal does not contain 0005_force_rls");
  // RLS coverage is cumulative: later forward-only migrations may enable and
  // force RLS for tables added after the original baseline migration.
  const migrationRls = journal.entries.reduce(
    (combined, entry) => {
      const migrationState = rlsTables(readFile("database/drizzle/" + entry.tag + ".sql"));
      combined.enabled.push(...migrationState.enabled);
      combined.forced.push(...migrationState.forced);
      return combined;
    },
    { enabled: [], forced: [] },
  );
  assertSameSet(migrationRls.enabled, policyTables, "Cumulative RLS ENABLE migration set and latest snapshot");
  assertSameSet(migrationRls.forced, policyTables, "Cumulative RLS FORCE migration set and latest snapshot");

  const totalTables = schemaTables.length;
  const rlsCount = policyTables.length;
  const localCount = schemaIndexTables.length;
  const migrationCount = journal.entries.length;
  const migrationTableCount = unique(migrationTables).length;

  assert.match(baseline, /^# OXENN.*MVP Engineering Baseline/m, "Current MVP engineering baseline heading is missing");
  assert.match(baseline, /Repository snapshot|Repository implementation snapshot/i, "Engineering baseline must identify its repository snapshot");
  assert.match(baseline, /known gaps|implementation gaps/i, "Engineering baseline must retain implementation-gap reporting");

  const projectIndexLinks = checkLinks(indexPath);
  const baselineLinks = checkLinks(baselinePath);
  const expectedBaselinePath = path.resolve(root, baselinePath);
  assert.ok(
    projectIndexLinks.some((link) => link.target === expectedBaselinePath),
    "docs/project/README.md must link to the current MVP engineering baseline",
  );

  const implementationPaths = checkInlinePaths(baseline);

  console.log(
    "MVP engineering baseline verification passed: " +
      totalTables + " schema/snapshot/migration tables (" + localCount + " + 2 modular), " +
      migrationCount + " migration files, " +
      rlsCount + " RLS tables aligned across snapshot/runtime/ENABLE/FORCE, " +
      projectIndexLinks.length + " project-index links, " +
      baselineLinks.length + " engineering-baseline links, " +
      implementationPaths.length + " referenced repository paths.",
  );
}

try {
  main();
} catch (error) {
  console.error("[MVP engineering baseline verification] FAILED");
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
