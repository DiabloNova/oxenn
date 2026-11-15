import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateDocsIndex } from "../../../scripts/docs-index-generator";

let temporaryRoot: string | undefined;

afterEach(() => {
  if (temporaryRoot) {
    rmSync(temporaryRoot, { recursive: true, force: true });
    temporaryRoot = undefined;
  }
});

describe("public documentation isolation from the engineering docs index", () => {
  it("excludes the top-level public docs tree while retaining ordinary engineering docs", () => {
    temporaryRoot = mkdtempSync(path.join(tmpdir(), "oxenn-public-docs-"));
    const docsRoot = path.join(temporaryRoot, "docs");
    const publicFa = path.join(docsRoot, "public", "fa");
    const publicEn = path.join(docsRoot, "public", "en");
    const productDocs = path.join(docsRoot, "product");
    const outputFile = path.join(temporaryRoot, "docsIndex.ts");
    const newline = String.fromCharCode(10);

    mkdirSync(publicFa, { recursive: true });
    mkdirSync(publicEn, { recursive: true });
    mkdirSync(productDocs, { recursive: true });

    writeFileSync(path.join(docsRoot, "public", "README.md"), ["# Public docs", ""].join(newline));
    writeFileSync(path.join(publicFa, "README.md"), ["# مستندات عمومی", ""].join(newline));
    writeFileSync(path.join(publicEn, "README.md"), ["# Public documentation", ""].join(newline));
    writeFileSync(path.join(productDocs, "guide.md"), ["# Engineering guide", "", "Internal implementation notes."].join(newline));

    generateDocsIndex({ docsDirectory: docsRoot, outputFile });
    const generatedIndex = readFileSync(outputFile, "utf8");

    expect(generatedIndex).toContain('slug: "guide"');
    expect(generatedIndex).toContain("Engineering guide");
    expect(generatedIndex).not.toContain("Public documentation");
    expect(generatedIndex).not.toContain("مستندات عمومی");
    expect(generatedIndex).not.toContain('slug: "public"');
    expect(generatedIndex).not.toContain('slug: "fa"');
    expect(generatedIndex).not.toContain('slug: "en"');
  });
});
