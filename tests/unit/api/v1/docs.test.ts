import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET } from "@/app/api/v1/docs/route";
import { resolveDocsViewerHref } from "@/lib/docs-viewer-links";

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
    ["multiline YAML visibility value", "---\nvisibility:\n  internal\n---\n# Private"],
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
      path: "public-guide.md",
    });
  });

  it("serves nested README documents by their directory slug and returns their docs-relative path", async () => {
    const nestedDirectory = path.join(docsDirectory, "architecture", "database");
    mkdirSync(nestedDirectory, { recursive: true });
    writeFileSync(path.join(nestedDirectory, "README.md"), "# Database architecture");

    const response = await GET(new Request("http://localhost/api/v1/docs?slug=README&domain=database"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      content: "# Database architecture",
      path: "architecture/database/README.md",
    });
  });

  it("translates relative Markdown links into locale-aware slug routes", () => {
    expect(resolveDocsViewerHref("./database/README.md", "en", "architecture/README.md")).toBe("/en/docs/database");
    expect(resolveDocsViewerHref("../database/reference-matrix.md", "fa", "architecture/README.md")).toBe("/fa/docs/reference-matrix");
    expect(resolveDocsViewerHref("../database/canonical-data-contract.md#ownership", "en", "architecture/README.md")).toBe("/en/docs/canonical-data-contract#ownership");
    expect(resolveDocsViewerHref("https://example.com/guide.md", "en", "architecture/README.md")).toBe("https://example.com/guide.md");
    expect(resolveDocsViewerHref("#local-heading", "en", "architecture/README.md")).toBe("#local-heading");
  });
});
