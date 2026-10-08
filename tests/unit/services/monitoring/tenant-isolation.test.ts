import { describe, it, expect } from "vitest";
import { TenantContextManager, isQueryTenantScoped } from "../../../../src/core/database/tenant-context";
import { TENANT_SCOPED_TABLES } from "../../../../src/core/database/tenant-tables.generated";

describe("Monitoring Tenant Isolation Pattern Verification", () => {
  it("monitoring_configs must be protected by TenantContextManager RLS scopes", () => {
    expect(TENANT_SCOPED_TABLES.includes('monitoring_configs')).toBe(true);
  });

  it("crawl_snapshots must be protected by TenantContextManager RLS scopes", () => {
    expect(TENANT_SCOPED_TABLES.includes('crawl_snapshots')).toBe(true);
  });

  it("monitoring_alerts must be protected by TenantContextManager RLS scopes", () => {
    expect(TENANT_SCOPED_TABLES.includes('monitoring_alerts')).toBe(true);
  });

  it("Monitoring queries must be flagged as tenant scoped", () => {
    expect(isQueryTenantScoped("SELECT * FROM monitoring_configs")).toBe(true);
  });

  it("Snapshot queries must be flagged as tenant scoped", () => {
    expect(isQueryTenantScoped("INSERT INTO crawl_snapshots (id) VALUES (1)")).toBe(true);
  });

  it("Fetching tenant scoped repo without explicit context wrapper MUST throw an exception immediately", () => {
    expect(() => {
      TenantContextManager.getRequiredTenantId();
    }).toThrow("No active tenant context found");
  });
});
