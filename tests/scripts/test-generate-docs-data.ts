import { test } from "node:test";
import assert from "node:assert";

test("escaping docs data correctly", () => {
    const titleRaw = 'Title with "quotes" and \\';
    const contentSnippetRaw = 'Snippet with "quotes", `backticks`, \\ and ${var}\nnewline';

    const title = titleRaw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const snippet = contentSnippetRaw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const output = `{
    titleEn: "${title}",
    snippet: \`${snippet}\`
  }`;

    // Attempt to evaluate output
    const evalResult = eval(`(() => { return ${output} })()`);
    assert.strictEqual(evalResult.titleEn, titleRaw);
    assert.strictEqual(evalResult.snippet, contentSnippetRaw);
});
