import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET } from "@/app/api/v1/docs/route";

describe("GET /api/v1/docs visibility enforcement", () => {
  let fixtureRoot: string;
  let docsDirectory: string;

  beforeEach(() => {
    fixtureRoot = mkdtempSync(path.join(tmpdir(), "oxenn-docs-api-"));
    docsDirectory = path.join(fixtureRoot, "docs");
    mkdirSync(docsDirectory, { recursive: true });
    vi.spyOn(process, "cwd").mockReturnValue(fixtureRoot);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it.each([
    ["quoted YAML visibility key", '---\n"visibility": internal\n---\n# Private'],
    ["UTF-8 BOM", '\uFEFF--- \r\nvisibility: internal\r\n--- \r\n# Private'],
    ["unclosed front matter", "--- \nvisibility: internal\n# Private"],
  ])("returns 404 for internal documentation with %s", async (slugCase, content) => {
    const slug = slugCase.replaceAll(" ", "-");
    writeFileSync(path.join(docsDirectory, `${slug}.md`), content);

    const response = await GET(new Request(`http://localhost/api/v1/docs?slug=${slug}`));

    expect(response.status).toBe(404);
  });

  it("continues to serve public docs", async () => {
    writeFileSync(
      path.join(docsDirectory, "public-guide.md"),
      "# Public guide\n\nThe phrase visibility: internal appears here as ordinary body text."
    );

    const response = await GET(new Request("http://localhost/api/v1/docs?slug=public-guide"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      content: "# Public guide\n\nThe phrase visibility: internal appears here as ordinary body text.",
    });
  });
});
