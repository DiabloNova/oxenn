import { describe, it, expect } from "vitest";
import { createContentSnippet } from "../../../scripts/docs-snippet";

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

  it("does not pull in a new token when the boundary falls between tokens", () => {
    const content = `${"x".repeat(499)} next-token`;

    const snippet = createContentSnippet(content);

    expect(snippet).toBe(`${"x".repeat(499)} `);
    expect(snippet).toHaveLength(500);
  });
});
