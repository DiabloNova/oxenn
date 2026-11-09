import { describe, expect, it } from "vitest";
import { createReferenceMatrixSnippet } from "../../../scripts/docs-index-generator";

describe("reference matrix docs search snippet", () => {
  it("retains ownership, policy, migration, and runtime verification as independent metadata", () => {
    const matrix = [
      "# Database Reference Matrix",
      "**Ownership rule:** Ownership is not inferred from RLS.",
      "## Table: `pages_keywords`",
      "- **Ownership Scope:** Tenant-Owned",
      "- **RLS Policies Declared:** 4 policy objects",
      "- **Tenant RLS Policy Coverage:** Complete (SELECT, INSERT, UPDATE, DELETE)",
      "- **Migration Coverage:** Complete (ENABLE + FORCE in checked-in journal)",
      "- **Runtime Enforcement Verification:** Not verified by static generation; see PostgreSQL isolation suite",
      "- **Status:** `WIRED`",
      "### Columns",
      "- `organization_id`: uuid",
      "## Summary",
      "- Total Tables: 70",
    ].join("\n");

    const snippet = createReferenceMatrixSnippet(matrix);

    expect(snippet).toContain("Ownership Scope: Tenant-Owned");
    expect(snippet).toContain("RLS Policies Declared: 4 policy objects");
    expect(snippet).toContain("Tenant RLS Policy Coverage: Complete");
    expect(snippet).toContain("Migration Coverage: Complete");
    expect(snippet).toContain("Runtime Enforcement Verification: Not verified by static generation");
    expect(snippet).not.toContain("### Columns");
    expect(snippet).not.toContain("Ownership rule:");
  });
});
