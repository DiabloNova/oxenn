import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/docs/route";
import { decodeDocRouteToken, encodeDocRouteToken, resolveDocsViewerHref, rewriteRelativeMarkdownLinks } from "@/lib/docs-viewer-links";

const fixture = vi.hoisted(() => {
  const docs = [
    { id: "engineering:README.md", collection: "engineering", relativePath: "README.md", slug: "product", domain: "root", category: "product", titleEn: "Root", titleFa: "Root", categoryFa: "Product", snippet: "", sourcePath: "docs/README.md" },
    { id: "engineering:architecture/README.md", collection: "engineering", relativePath: "architecture/README.md", slug: "architecture", domain: "architecture", category: "architecture", titleEn: "Architecture", titleFa: "Architecture", categoryFa: "Architecture", snippet: "", sourcePath: "docs/architecture/README.md" },
    { id: "engineering:architecture/database/README.md", collection: "engineering", relativePath: "architecture/database/README.md", slug: "architecture", domain: "database", category: "architecture", titleEn: "Database", titleFa: "Database", categoryFa: "Architecture", snippet: "", sourcePath: "docs/architecture/database/README.md" },
    { id: "engineering:services/guide.md", collection: "engineering", relativePath: "services/guide.md", slug: "guide", domain: "services", category: "services", titleEn: "Guide", titleFa: "Guide", categoryFa: "Services", snippet: "", sourcePath: "docs/services/guide.md" },
  ];
  const content = {
    "engineering:README.md": { id: "engineering:README.md", collection: "engineering", relativePath: "README.md", content: "# Root", sourcePath: "docs/README.md" },
    "engineering:architecture/README.md": { id: "engineering:architecture/README.md", collection: "engineering", relativePath: "architecture/README.md", content: "# Architecture", sourcePath: "docs/architecture/README.md" },
    "engineering:architecture/database/README.md": { id: "engineering:architecture/database/README.md", collection: "engineering", relativePath: "architecture/database/README.md", content: "# Database architecture", sourcePath: "docs/architecture/database/README.md" },
    "engineering:services/guide.md": { id: "engineering:services/guide.md", collection: "engineering", relativePath: "services/guide.md", content: "# Service guide", sourcePath: "docs/services/guide.md" },
    "product-public:fa/README.md": { id: "product-public:fa/README.md", collection: "product-public", relativePath: "fa/README.md", content: "# Public", sourcePath: "docs/public/fa/README.md" },
  };
  return { docs, content };
});

vi.mock("@/lib/docsIndex", () => ({ DOCS_INDEX: fixture.docs }));
vi.mock("@/lib/docsContent", () => ({ getDocContent: (id: string) => fixture.content[id as keyof typeof fixture.content] }));

describe("GET /api/v1/docs canonical registry lookup", () => {
  it("serves exact engineering IDs and preserves the legacy response shape", async () => {
    const response = await GET(new Request("http://localhost/api/v1/docs?id=engineering%3Aarchitecture%2Fdatabase%2FREADME.md"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      content: "# Database architecture",
      path: "architecture/database/README.md",
    });
  });

  it("retains the legacy README plus domain selector", async () => {
    const response = await GET(new Request("http://localhost/api/v1/docs?slug=README&domain=database"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      content: "# Database architecture",
      path: "architecture/database/README.md",
    });
  });

  it("retains unique legacy slug lookup", async () => {
    const response = await GET(new Request("http://localhost/api/v1/docs?slug=guide"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ content: "# Service guide", path: "services/guide.md" });
  });

  it("returns conflict instead of selecting the first document for a duplicate slug", async () => {
    const response = await GET(new Request("http://localhost/api/v1/docs?slug=architecture"));
    expect(response.status).toBe(409);
  });

  it("does not expose product-public documents through the engineering API", async () => {
    const response = await GET(new Request("http://localhost/api/v1/docs?id=product-public%3Afa%2FREADME.md"));
    expect(response.status).toBe(404);
  });

  it("rejects missing selectors and unknown IDs", async () => {
    expect((await GET(new Request("http://localhost/api/v1/docs"))).status).toBe(400);
    expect((await GET(new Request("http://localhost/api/v1/docs?id=engineering%3Amissing.md"))).status).toBe(404);
  });
});

describe("canonical Markdown link resolution", () => {
  it("round-trips canonical IDs through stable route tokens", () => {
    const id = "engineering:architecture/database/README.md";
    expect(decodeDocRouteToken(encodeDocRouteToken(id))).toBe(id);
    expect(decodeDocRouteToken("id-not-a-valid-token")).toBeNull();
  });

  it("resolves a relative README link to the exact document ID", () => {
    const id = "engineering:architecture/database/README.md";
    expect(resolveDocsViewerHref("./database/README.md", "en", "architecture/README.md"))
      .toBe("/en/docs/" + encodeDocRouteToken(id));
  });

  it("rewrites relative links but preserves external and fragment-only links", () => {
    const id = "engineering:architecture/database/README.md";
    expect(rewriteRelativeMarkdownLinks("[Database](./database/README.md)", "fa", "architecture/README.md"))
      .toBe("[Database](/fa/docs/" + encodeDocRouteToken(id) + ")");
    expect(resolveDocsViewerHref("https://example.com/guide.md", "en", "architecture/README.md"))
      .toBe("https://example.com/guide.md");
    expect(resolveDocsViewerHref("#local-heading", "en", "architecture/README.md"))
      .toBe("#local-heading");
  });
});
