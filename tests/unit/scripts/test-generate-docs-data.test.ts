import { describe, expect, it } from "vitest";
import { createContentSnippet } from "../../../scripts/docs-snippet";
import { isPublicDocumentation } from "../../../src/lib/docs-visibility";

describe("createContentSnippet", () => {
  it("preserves complete technical identifiers that cross the snippet boundary", () => {
    const identifier = "0013_remove_api_keys_prefix_index.sql";
    const content = "x".repeat(487) + " migration " + identifier + " next token";
    const snippet = createContentSnippet(content);
    expect(snippet).toContain("migration " + identifier);
    expect(snippet.length).toBeGreaterThan(500);
    expect(snippet.length).toBeLessThan(500 + identifier.length);
  });

  it("does not extend a natural-language word just because it crosses the limit", () => {
    const content = "x".repeat(495) + " processing tail";
    const snippet = createContentSnippet(content);
    expect(snippet).toBe("x".repeat(495) + " proc");
    expect(snippet).toHaveLength(500);
  });

  it("does not pull in a new token when the boundary falls between tokens", () => {
    const content = "x".repeat(499) + " next-token";
    const snippet = createContentSnippet(content);
    expect(snippet).toBe("x".repeat(499) + " ");
    expect(snippet).toHaveLength(500);
  });
});

describe("legacy documentation visibility compatibility", () => {
  it("keeps documents public when no visibility front matter is present", () => {
    expect(isPublicDocumentation("# Public documentation\n\nContent")).toBe(true);
  });

  it("excludes documents explicitly marked internal", () => {
    expect(isPublicDocumentation("---\nvisibility: internal\n---\n# Internal")).toBe(false);
  });

  it("does not treat body text as visibility front matter", () => {
    expect(isPublicDocumentation("# Public documentation\n\nvisibility: internal")).toBe(true);
  });

  it("supports CRLF front matter", () => {
    expect(isPublicDocumentation("---\r\nvisibility: internal\r\n---\r\n# Internal")).toBe(false);
  });

  it.each([
    ["quoted YAML key", '---\n"visibility": internal\n---\n# Private'],
    ["multiline visibility", "---\nvisibility:\n  internal\n---\n# Private"],
    ["UTF-8 BOM", "\uFEFF--- \r\nvisibility: internal\r\n--- \r\n# Private"],
    ["unclosed front matter", "--- \nvisibility: internal\n# Private"],
  ])("fails closed for %s", (_label, content) => {
    expect(isPublicDocumentation(content)).toBe(false);
  });
});
