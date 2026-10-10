import { describe, it, expect } from "vitest";

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
