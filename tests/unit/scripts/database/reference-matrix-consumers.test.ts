import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findTableReferences } from "../../../../scripts/database/reference-matrix-consumers";

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

function writeSource(relativePath: string, content: string): void {
  const target = path.join(root!, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

describe("database reference matrix consumer detection", () => {
  it("recognizes imported Drizzle table bindings and relational query consumers", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "oxenn-matrix-"));
    writeSource("src/repository.ts", "import { competitors as competitorTable } from \"@/database/schema/ai-intelligence\";\nexport async function load(db: any) { return db.select().from(competitorTable); }");
    writeSource("src/relational.ts", "export async function load(db: any) { return db.query.competitors.findMany(); }");
    expect(findTableReferences(root, "competitors", "competitors")).toEqual(["src/relational.ts", "src/repository.ts"]);
  });

  it("resolves SQL strings stored in local variables", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "oxenn-matrix-"));
    writeSource("src/repository.ts", "export async function load(db: any) { const statement = \"SELECT * FROM competitors c JOIN public.competitors p ON p.id = c.id\"; return db.query(statement); }");
    expect(findTableReferences(root, "competitors", null)).toEqual(["src/repository.ts"]);
  });

  it("ignores payload properties, unrelated table variables, comments, and SQL literals", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "oxenn-matrix-"));
    writeSource("src/studio.ts", "const request = { targetKeywords: [\"seo\"], competitors: [\"sample\"], tableName: \"competitors\" };\nconst message = \"The competitors field is required\";\n// SELECT * FROM competitors\nexport async function notAQuery(db: any, competitors: string) { return db.insert(competitors); }\nexport async function queryContainingMentionsOnly(db: any) { return db.query(\"SELECT 'FROM competitors' AS note /* FROM competitors */ -- FROM competitors\\n\"); }\nvoid request; void message;");
    expect(findTableReferences(root, "competitors", "competitors")).toEqual([]);
  });
});
