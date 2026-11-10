import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateDocsIndex } from "../../../scripts/docs-index-generator";
import { createContentSnippet } from "../../../scripts/docs-snippet";
import { isPublicDocumentation } from "../../../src/lib/docs-visibility";

describe("escaping docs data correctly", () => {
  it("escapes properly", () => {
    const titleRaw = 'Title with "quotes" and \\';
    const contentSnippetRaw = 'Snippet with "quotes", `backticks`, \\ and ${var}\nnewline';

    const title = titleRaw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const snippet = contentSnippetRaw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const output = `{
    titleEn: "${title}",
    snippet: \`${snippet}\`
  }`;

    const evalResult = eval(`(() => { return ${output} })()`);
    expect(evalResult.titleEn).toBe(titleRaw);
    expect(evalResult.snippet).toBe(contentSnippetRaw);
  });
});


describe("createContentSnippet", () => {
  it("preserves complete tokens that cross the snippet boundary", () => {
    const identifier = "0013_remove_api_keys_prefix_index.sql";
    const content = `${"x".repeat(487)} migration ${identifier} next token`;

    const snippet = createContentSnippet(content);

    expect(snippet).toContain(`migration ${identifier}`);
    expect(snippet.length).toBeGreaterThan(500);
    expect(snippet.length).toBeLessThan(500 + identifier.length);
  });

  it("does not extend a natural-language word just because it crosses the limit", () => {
    const content = `${"x".repeat(495)} processing tail`;

    const snippet = createContentSnippet(content);

    expect(snippet).toBe(`${"x".repeat(495)} proc`);
    expect(snippet).toHaveLength(500);
  });

  it("does not pull in a new token when the boundary falls between tokens", () => {
    const content = `${"x".repeat(499)} next-token`;

    const snippet = createContentSnippet(content);

    expect(snippet).toBe(`${"x".repeat(499)} `);
    expect(snippet).toHaveLength(500);
  });
});


describe("documentation visibility", () => {
  it("keeps documents public when no visibility front matter is present", () => {
    expect(isPublicDocumentation("# Public documentation\n\nContent")).toBe(true);
  });

  it("excludes documents explicitly marked internal", () => {
    expect(isPublicDocumentation("---\nvisibility: internal\n---\n# Internal documentation")).toBe(false);
  });

  it("does not treat body text as visibility front matter", () => {
    expect(isPublicDocumentation("# Public documentation\n\nvisibility: internal")).toBe(true);
  });

  it("supports CRLF front matter", () => {
    expect(isPublicDocumentation("---\r\nvisibility: internal\r\n---\r\n# Internal documentation")).toBe(false);
  });
});


describe("documentation visibility front matter", () => {
  it.each([
    ["a quoted YAML key", '---\n"visibility": internal\n---\n# Private'],
    ["a multiline YAML visibility value", "---\nvisibility:\n  internal\n---\n# Private"],
    ["a UTF-8 BOM and whitespace after the opening delimiter", '\uFEFF--- \r\nvisibility: internal\r\n--- \r\n# Private'],
    ["an unclosed front matter block", '--- \nvisibility: internal\n# Private'],
  ])("marks internal documents private when front matter contains %s", (_label, content) => {
    expect(isPublicDocumentation(content)).toBe(false);
  });
});

describe("docs index generation visibility", () => {
  let fixtureRoot: string;
  let docsDirectory: string;
  let outputFile: string;

  beforeEach(() => {
    fixtureRoot = mkdtempSync(path.join(tmpdir(), "oxenn-docs-index-"));
    docsDirectory = path.join(fixtureRoot, "docs");
    outputFile = path.join(fixtureRoot, "src", "lib", "docsIndex.ts");
    mkdirSync(docsDirectory, { recursive: true });
    mkdirSync(path.dirname(outputFile), { recursive: true });
  });

  afterEach(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("omits BOM, quoted-key, and malformed internal docs from the generated public index", () => {
    writeFileSync(path.join(docsDirectory, "public-guide.md"), "# Public guide\nPublic content");
    writeFileSync(
      path.join(docsDirectory, "quoted-private.md"),
      '---\n"visibility": internal\n---\n# Quoted private content'
    );
    writeFileSync(
      path.join(docsDirectory, "bom-private.md"),
      '\uFEFF--- \r\nvisibility: internal\r\n--- \r\n# BOM private content'
    );
    writeFileSync(
      path.join(docsDirectory, "unclosed-private.md"),
      "--- \nvisibility: internal\n# Unclosed private content"
    );
    writeFileSync(
      path.join(docsDirectory, "multiline-private.md"),
      "---\nvisibility:\n  internal\n---\n# Multiline private content"
    );
    symlinkSync(path.join(fixtureRoot, "missing-doc-target.md"), path.join(docsDirectory, "unreadable-internal.md"));

    generateDocsIndex({ docsDirectory, outputFile });

    const generatedIndex = readFileSync(outputFile, "utf-8");
    expect(generatedIndex).toContain('slug: "public-guide"');
    expect(generatedIndex).not.toContain('slug: "quoted-private"');
    expect(generatedIndex).not.toContain('slug: "bom-private"');
    expect(generatedIndex).not.toContain('slug: "unclosed-private"');
    expect(generatedIndex).not.toContain('slug: "multiline-private"');
    expect(generatedIndex).not.toContain('slug: "unreadable-internal"');
  });
});


describe("deterministic docs index ordering", () => {
  it("sorts filesystem entries before generating the public index", () => {
    const fixtureRoot = mkdtempSync(path.join(tmpdir(), "oxenn-docs-order-"));
    const docsDirectory = path.join(fixtureRoot, "docs");
    const outputFile = path.join(fixtureRoot, "src", "lib", "docsIndex.ts");
    try {
      mkdirSync(docsDirectory, { recursive: true });
      mkdirSync(path.dirname(outputFile), { recursive: true });
      writeFileSync(path.join(docsDirectory, "zeta-guide.md"), "# Zeta guide\nZeta content");
      writeFileSync(path.join(docsDirectory, "alpha-guide.md"), "# Alpha guide\nAlpha content");
      generateDocsIndex({ docsDirectory, outputFile });
      const generatedIndex = readFileSync(outputFile, "utf-8");
      expect(generatedIndex.indexOf('slug: "alpha-guide"')).toBeLessThan(
        generatedIndex.indexOf('slug: "zeta-guide"')
      );
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
