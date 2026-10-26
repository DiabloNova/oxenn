import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const TABLE_OPERATION_METHODS = new Set(["from", "insert", "update", "delete", "join", "leftJoin", "rightJoin", "innerJoin", "fullJoin", "crossJoin", "references"]);
const SQL_EXECUTION_METHODS = new Set(["query", "execute", "executeQuery", "unsafe"]);

function collectSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(full));
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) files.push(full);
  }
  return files;
}

function callMethod(node: ts.CallExpression): string | undefined {
  return ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : undefined;
}

function sqlTextFromExpression(expression: ts.Expression): string | undefined {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  if (ts.isTemplateExpression(expression)) return expression.getText().slice(1, -1);
  if (ts.isTaggedTemplateExpression(expression)) {
    const tag = expression.tag;
    const sqlTag = ts.isIdentifier(tag) && tag.text === "sql" ||
      ts.isPropertyAccessExpression(tag) && tag.name.text === "sql";
    return sqlTag ? sqlTextFromExpression(expression.template) : undefined;
  }
  if (ts.isCallExpression(expression)) {
    for (const argument of expression.arguments) {
      const text = sqlTextFromExpression(argument);
      if (text !== undefined) return text;
    }
  }
  return undefined;
}

function stripSqlCommentsAndLiterals(sql: string): string {
  return sql.replace(/'(?:''|[^'])*'|\$([a-zA-Z0-9_]*)\$[\s\S]*?\$\1\$|\/\*[\s\S]*?\*\/|--[^\n]*/g, " ");
}

function sqlReferencesTable(sql: string, tableName: string): boolean {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tick = String.fromCharCode(96);
  const identifier = '(?:"' + escaped + '"|' + tick + escaped + tick + '|' + escaped + ')';
  const clause = new RegExp("\\b(?:from|join|update|into|references)\\s+(?:(?:\"?[A-Za-z_][A-Za-z0-9_$]*\"?)\\s*\\.\\s*)?" + identifier + "(?=$|[\\s,;)]|$)", "i");
  return clause.test(stripSqlCommentsAndLiterals(sql));
}

function isScopeNode(node: ts.Node): boolean {
  return ts.isBlock(node) || ts.isSourceFile(node) || ts.isModuleBlock(node) || ts.isCaseBlock(node);
}

export function findTableReferences(rootDir: string, tableName: string, exportName: string | null): string[] {
  const roots = ["src", "scripts", "tests"].map((folder) => path.join(rootDir, folder));
  const candidates = roots.flatMap(collectSourceFiles).filter((file) =>
    !file.endsWith("tenant-tables.generated.ts") && !file.endsWith("docsIndex.ts") &&
    !file.endsWith("docsData.ts") && !file.endsWith("build-reference-matrix.ts") &&
    !file.endsWith("reference-matrix-consumers.ts") && !file.includes(path.sep + "database" + path.sep + "schema" + path.sep)
  );
  const consumers = new Set<string>();

  for (const filePath of candidates) {
    const text = fs.readFileSync(filePath, "utf8");
    const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const importedTables = new Set<string>();
    const schemaNamespaces = new Set<string>();
    const sqlBindings = new WeakMap<ts.Node, Map<string, ts.Expression>>();

    function collectSchemaImports(node: ts.Node): void {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
          /database\/schema/.test(node.moduleSpecifier.text) && node.importClause?.namedBindings) {
        const bindings = node.importClause.namedBindings;
        if (ts.isNamedImports(bindings) && exportName) {
          for (const element of bindings.elements) {
            if ((element.propertyName?.text ?? element.name.text) === exportName) importedTables.add(element.name.text);
          }
        } else if (ts.isNamespaceImport(bindings)) schemaNamespaces.add(bindings.name.text);
      }
      ts.forEachChild(node, collectSchemaImports);
    }
    collectSchemaImports(source);

    function scopeFor(node: ts.Node): ts.Node {
      for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
        if (isScopeNode(current)) return current;
      }
      return source;
    }
    function collectSqlBindings(node: ts.Node): void {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const scope = scopeFor(node);
        let scopeBindings = sqlBindings.get(scope);
        if (!scopeBindings) { scopeBindings = new Map(); sqlBindings.set(scope, scopeBindings); }
        scopeBindings.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, collectSqlBindings);
    }
    collectSqlBindings(source);

    function findSqlBinding(name: string, context: ts.Node): ts.Expression | undefined {
      for (let current: ts.Node | undefined = context; current; current = current.parent) {
        if (isScopeNode(current)) {
          const binding = sqlBindings.get(current)?.get(name);
          if (binding) return binding;
        }
      }
      return undefined;
    }
    function sqlTextAtUse(expression: ts.Expression, context: ts.Node, seen = new Set<string>()): string | undefined {
      const direct = sqlTextFromExpression(expression);
      if (direct !== undefined) return direct;
      if (ts.isIdentifier(expression) && !seen.has(expression.text)) {
        const binding = findSqlBinding(expression.text, context);
        if (binding) {
          const next = new Set(seen);
          next.add(expression.text);
          return sqlTextAtUse(binding, context, next);
        }
      }
      if (ts.isCallExpression(expression)) {
        for (const argument of expression.arguments) {
          const found = sqlTextAtUse(argument, context, seen);
          if (found !== undefined) return found;
        }
      }
      return undefined;
    }
    function isTableExpression(expression: ts.Expression): boolean {
      if (ts.isIdentifier(expression)) return importedTables.has(expression.text);
      return ts.isPropertyAccessExpression(expression) && !!exportName &&
        expression.name.text === exportName && ts.isIdentifier(expression.expression) &&
        schemaNamespaces.has(expression.expression.text);
    }

    let found = false;
    function visit(node: ts.Node): void {
      if (found) return;
      if (ts.isCallExpression(node)) {
        const method = callMethod(node);
        if (method && TABLE_OPERATION_METHODS.has(method) && node.arguments.some(isTableExpression)) {
          found = true; return;
        }
        if (method && SQL_EXECUTION_METHODS.has(method) && node.arguments.some((argument) => {
          const sql = sqlTextAtUse(argument, node);
          return sql !== undefined && sqlReferencesTable(sql, tableName);
        })) {
          found = true; return;
        }
      }
      if (exportName && ts.isPropertyAccessExpression(node) && node.name.text === exportName &&
          ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "query") {
        found = true; return;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    if (found) consumers.add(path.relative(rootDir, filePath).split(path.sep).join("/"));
  }
  return Array.from(consumers).sort();
}
