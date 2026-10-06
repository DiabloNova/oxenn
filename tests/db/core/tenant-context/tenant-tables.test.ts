import { describe, it, expect } from "vitest";
import { TENANT_SCOPED_TABLES } from "@/core/database/tenant-context";
import { verifyTenantTables } from "../../../../scripts/database/verify-tenant-tables";

describe("Tenant Scoped Tables Schema Alignment Test Suite", () => {
  it("TENANT_SCOPED_TABLES is an Object.frozen immutable array", () => {
    expect(Object.isFrozen(TENANT_SCOPED_TABLES)).toBe(true);
    expect(() => {
      (TENANT_SCOPED_TABLES as unknown as string[]).push("hacked_table");
    }).toThrow();
  });

  it("TENANT_SCOPED_TABLES matches the Drizzle schema snapshot derived set with 0 drift", () => {
    const result = verifyTenantTables();
    expect(result.success).toBe(true);
    expect(result.missingInRuntime).toEqual([]);
    expect(result.extraInRuntime).toEqual([]);
  });

  it("includes all Audit APP-04 missing tables in TENANT_SCOPED_TABLES", () => {
    const requiredTables = [
      "websites",
      "pages",
      "keywords",
      "topics",
      "competitors",
      "competitor_changes",
      "competitive_seo_findings",
      "technical_audits",
      "historical_metrics",
      "diagnostic_findings",
      "diagnostic_finding_relationships",
      "credit_transactions",
      "api_keys",
      "organizations",
      "organization_members",
      "organization_invitations",
    ];

    for (const table of requiredTables) {
      expect(TENANT_SCOPED_TABLES).toContain(table);
    }
  });
});
