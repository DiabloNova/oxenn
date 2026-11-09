import { describe, it, expect } from "vitest";
import { TENANT_SCOPED_TABLES } from "@/core/database/tenant-context";
import { getTenantTableCoverageFromSnapshot, verifyTenantTables } from "../../../../scripts/database/verify-tenant-tables";

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
    expect(result.missingPolicyTables).toEqual([]);
  });

  it("includes all Audit APP-04 missing tables in TENANT_SCOPED_TABLES", () => {
    const requiredTables = [
      "websites",
      "pages",
      "keywords",
      "keywords_topics",
      "pages_entities",
      "pages_keywords",
      "pages_topics",
      "topics",
      "topics_entities",
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

  it("detects tenant-owned tables even when their snapshot has no RLS policies", () => {
    const coverage = getTenantTableCoverageFromSnapshot({
      tables: {
        "public.pages_keywords": {
          name: "pages_keywords",
          columns: { organization_id: { type: "uuid" } },
          policies: {},
        },
      },
    });

    expect(coverage.tenantTables).toEqual(["pages_keywords"]);
    expect(coverage.missingPolicyTables).toEqual(["pages_keywords"]);
  });


  it("rejects an additional unscoped permissive policy that could widen tenant access", () => {
    const predicate = `"organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`;
    const coverage = getTenantTableCoverageFromSnapshot({
      tables: {
        "public.pages_keywords": {
          name: "pages_keywords",
          columns: { organization_id: { type: "uuid" } },
          policies: {
            select_tenant: { as: "PERMISSIVE", for: "SELECT", to: ["public"], using: predicate },
            select_open: { as: "PERMISSIVE", for: "SELECT", to: ["public"], using: "true" },
            insert_tenant: { as: "PERMISSIVE", for: "INSERT", to: ["public"], withCheck: predicate },
            update_tenant: { as: "PERMISSIVE", for: "UPDATE", to: ["public"], using: predicate, withCheck: predicate },
            delete_tenant: { as: "PERMISSIVE", for: "DELETE", to: ["public"], using: predicate },
          },
        },
      },
    });

    expect(coverage.missingPolicyTables).toEqual(["pages_keywords"]);
  });

});
