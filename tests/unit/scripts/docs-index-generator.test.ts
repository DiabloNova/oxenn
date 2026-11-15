import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildDocumentationRegistry, createReferenceMatrixSnippet, generateDocsRegistry } from "../../../scripts/docs-index-generator";

let root: string | undefined;
function fixture() {
  root = mkdtempSync(path.join(tmpdir(), "oxenn-doc-registry-"));
  const docs = path.join(root, "docs");
  const write = (relative: string, content: string) => {
    const file = path.join(docs, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content, "utf8");
  };
  write("README.md", "---\nvisibility: public\n---\n\n# Root engineering docs\n");
  write("architecture/README.md", "---\nvisibility: public\n---\n\n# Architecture overview\n");
  write("architecture/architecture.md", "---\nvisibility: public\n---\n\n# Architecture detail\n");
  write("services/guide.md", "---\nvisibility: public\n---\n\n# Service guide\n");
  write("private/internal.md", "---\nvisibility: internal\n---\n\n# Internal material\n");
  write("unclassified.md", "# Must remain unpublished\n");
  write("public/README.md", "---\nvisibility: internal\n---\n\n# Collection index\n");
  write("public/fa/README.md", "---\nvisibility: public\n---\n\n# مستندات عمومی\n");
  write("public/en/README.md", "---\nvisibility: public\n---\n\n# Public documentation\n");
  return { docs, options: { repositoryRoot: root, docsDirectory: docs, publicDocsDirectory: path.join(docs, "public"), legacyEngineeringPublicPaths: new Set<string>() } };
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe("central documentation registry generator", () => {
  it("generates separate metadata collections and matching server content from one snapshot", () => {
    const { options } = fixture();
    const registry = buildDocumentationRegistry(options);
    expect(registry.engineering.map((item) => item.id)).toContain("engineering:architecture/README.md");
    expect(registry.productPublic.map((item) => item.id)).toEqual([
      "product-public:en/README.md",
      "product-public:fa/README.md",
    ]);
    expect(registry.engineering.filter((item) => item.slug === "architecture")).toHaveLength(2);
    expect(registry.engineering.some((item) => item.relativePath === "unclassified.md")).toBe(false);
    expect(registry.engineering.some((item) => item.relativePath === "private/internal.md")).toBe(false);
    expect(Object.keys(registry.content).sort()).toEqual(
      [...registry.engineering, ...registry.productPublic].map((item) => item.id).sort(),
    );
  });

  it("writes client-safe metadata and a server-only full-content registry", () => {
    const { options } = fixture();
    const metadataOutputFile = path.join(root!, "generated/docsIndex.ts");
    const contentOutputFile = path.join(root!, "generated/docsContent.ts");
    generateDocsRegistry({ ...options, metadataOutputFile, contentOutputFile });
    const metadata = readFileSync(metadataOutputFile, "utf8");
    const content = readFileSync(contentOutputFile, "utf8");
    expect(metadata).toContain("PUBLIC_DOCS_INDEX");
    expect(metadata).toContain("product-public:fa/README.md");
    expect(metadata).not.toContain("Internal material");
    expect(metadata).not.toContain('"content":');
    expect(content).toContain('import "server-only"');
    expect(content).toContain("# Root engineering docs");
    expect(content).toContain("# Public documentation");
    expect(content).not.toContain("# Internal material");
  });

  it("fails on malformed visibility instead of publishing an unknown value", () => {
    const { options, docs } = fixture();
    writeFileSync(path.join(docs, "bad.md"), "---\nvisibility: published\n---\n# Bad\n");
    expect(() => buildDocumentationRegistry(options)).toThrow(/Unsupported documentation visibility/);
  });

  it("rejects symlinks inside documentation source roots", () => {
    const { options, docs } = fixture();
    const outside = path.join(root!, "outside.md");
    writeFileSync(outside, "# Outside\n");
    symlinkSync(outside, path.join(docs, "escape.md"));
    expect(() => buildDocumentationRegistry(options)).toThrow(/Symlink in documentation source root/);
  });

  it("fails when the reviewed legacy publication baseline drifts", () => {
    const { options } = fixture();
    expect(() => buildDocumentationRegistry({
      ...options,
      legacyEngineeringPublicPaths: new Set(["removed/legacy.md"]),
    })).toThrow(/Legacy publication baseline drift/);
  });

  it("rejects source paths that collide after Unicode NFC normalization", () => {
    const { options, docs } = fixture();
    const composed = path.join(docs, "unicode", "caf\u00e9.md");
    const decomposed = path.join(docs, "unicode", "cafe\u0301.md");
    mkdirSync(path.dirname(composed), { recursive: true });
    writeFileSync(composed, "---\nvisibility: public\n---\n# Composed");
    writeFileSync(decomposed, "---\nvisibility: public\n---\n# Decomposed");
    expect(() => buildDocumentationRegistry(options)).toThrow(/Duplicate canonical source path/);
  });
});

describe("reference matrix snippet", () => {
  it("keeps the security and migration evidence lines", () => {
    const matrix = [
      "# Database Reference Matrix",
      "## Table: pages_keywords",
      "- **Ownership Scope:** Tenant-Owned",
      "- **RLS Policies Declared:** 4 policy objects",
      "- **Tenant RLS Policy Coverage:** Complete",
      "- **Migration Coverage:** Complete",
      "- **Runtime Enforcement Verification:** Not verified by static generation",
      "- **Status:** WIRED",
      "### Columns",
    ].join("\n");
    const result = createReferenceMatrixSnippet(matrix);
    expect(result).toContain("**Ownership Scope:** Tenant-Owned");
    expect(result).toContain("**Runtime Enforcement Verification:** Not verified");
    expect(result).not.toContain("### Columns");
  });
});
