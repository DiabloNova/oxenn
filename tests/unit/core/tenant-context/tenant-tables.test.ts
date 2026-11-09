import { afterEach, describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TENANT_SCOPED_TABLES } from "@/core/database/tenant-context";
import { getTableOwnershipScope, getTenantTableCoverageFromSnapshot, resolveLatestSnapshotPath, verifyTenantTables } from "../../../../scripts/database/verify-tenant-tables";

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

  it("classifies all five tenant-owned junction tables independently of RLS policy presence", () => {
    const junctionTables = ["pages_keywords", "pages_topics", "pages_entities", "keywords_topics", "topics_entities"];
    const tables = Object.fromEntries(junctionTables.map((name) => [name, {
      name,
      columns: { organization_id: { type: "uuid" } },
      policies: {},
    }]));

    const coverage = getTenantTableCoverageFromSnapshot({ tables });

    expect(coverage.tenantTables).toEqual(junctionTables.slice().sort());
    expect(coverage.missingPolicyTables).toEqual(junctionTables.slice().sort());
    for (const name of junctionTables) {
      expect(getTableOwnershipScope({ name, columns: { organization_id: {} } })).toBe("Tenant-Owned");
    }
  });

  it("classifies tables without tenant ownership markers as Global, independently of policies", () => {
    expect(getTableOwnershipScope({ name: "system_settings", columns: { id: {} } })).toBe("Global");
    expect(getTableOwnershipScope({ name: "organizations", columns: { id: {} } })).toBe("Tenant-Owned");
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


const temporaryRoots: string[] = [];

function createSnapshotPathFixture(): { root: string; metadataDirectory: string; snapshotPath: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tenant-snapshot-path-"));
  temporaryRoots.push(root);
  const metadataDirectory = path.join(root, "database", "drizzle", "meta");
  fs.mkdirSync(metadataDirectory, { recursive: true });
  const snapshotPath = path.join(metadataDirectory, "0001_snapshot.json");
  fs.writeFileSync(snapshotPath, JSON.stringify({ tables: {} }));
  return { root, metadataDirectory, snapshotPath };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("Tenant snapshot path validation", () => {
  it("resolves a valid journal index to a snapshot in the canonical metadata directory", () => {
    const fixture = createSnapshotPathFixture();
    const resolved = resolveLatestSnapshotPath(fixture.root, { entries: [{ idx: 1 }] });

    expect(resolved).toBe(fs.realpathSync(fixture.snapshotPath));
    expect(path.dirname(resolved)).toBe(fs.realpathSync(fixture.metadataDirectory));
  });

  it.each([-1, 1.5, 10000, Number.MAX_SAFE_INTEGER + 1, "../0001", "0001"])(
    "rejects an invalid journal index (%s)",
    (idx) => {
      const fixture = createSnapshotPathFixture();
      expect(() => resolveLatestSnapshotPath(fixture.root, { entries: [{ idx }] })).toThrow(
        "Latest journal index must be an integer between 0 and 9999",
      );
    },
  );

  it("rejects a snapshot symlink that resolves outside the metadata directory", () => {
    const fixture = createSnapshotPathFixture();
    const outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tenant-snapshot-outside-"));
    temporaryRoots.push(outsideDirectory);
    const outsideSnapshot = path.join(outsideDirectory, "outside_snapshot.json");
    fs.writeFileSync(outsideSnapshot, JSON.stringify({ tables: {} }));
    fs.unlinkSync(fixture.snapshotPath);
    fs.symlinkSync(outsideSnapshot, fixture.snapshotPath);

    expect(() => resolveLatestSnapshotPath(fixture.root, { entries: [{ idx: 1 }] })).toThrow(
      "Latest snapshot resolves outside the metadata directory",
    );
  });

  it("rejects a journal without entries", () => {
    const fixture = createSnapshotPathFixture();
    expect(() => resolveLatestSnapshotPath(fixture.root, { entries: [] })).toThrow(
      "Journal file contains no entries",
    );
  });
});
