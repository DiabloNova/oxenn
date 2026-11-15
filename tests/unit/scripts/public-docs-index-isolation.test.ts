import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildDocumentationRegistry } from "../../../scripts/docs-index-generator";

let temporaryRoot: string | undefined;
afterEach(() => {
  if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = undefined;
});

describe("public product documentation collection isolation", () => {
  it("keeps public product documents out of the engineering index and API collection", () => {
    temporaryRoot = mkdtempSync(path.join(tmpdir(), "oxenn-public-docs-"));
    const docs = path.join(temporaryRoot, "docs");
    const write = (relative: string, content: string) => {
      const file = path.join(docs, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, content, "utf8");
    };
    write("product/guide.md", "---\nvisibility: public\n---\n# Engineering guide\n");
    write("public/README.md", "---\nvisibility: internal\n---\n# Collection index\n");
    write("public/fa/README.md", "---\nvisibility: public\n---\n# مستندات عمومی\n");
    write("public/en/README.md", "---\nvisibility: public\n---\n# Public documentation\n");

    const registry = buildDocumentationRegistry({
      repositoryRoot: temporaryRoot,
      docsDirectory: docs,
      publicDocsDirectory: path.join(docs, "public"),
      legacyEngineeringPublicPaths: new Set<string>(),
    });

    expect(registry.engineering.map((item) => item.id)).toEqual(["engineering:product/guide.md"]);
    expect(registry.productPublic.map((item) => item.id)).toEqual([
      "product-public:en/README.md",
      "product-public:fa/README.md",
    ]);
    expect(registry.content["product-public:fa/README.md"]?.collection).toBe("product-public");
  });
});
