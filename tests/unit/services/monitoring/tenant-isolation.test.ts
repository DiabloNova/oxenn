import { describe, it, expect } from 'vitest';
import { TenantContextManager, isQueryTenantScoped, TENANT_SCOPED_TABLES } from "@/core/database/tenant-context";

describe('Monitoring Tenant Isolation Pattern Verification', () => {
  it('verifies that monitoring tables are listed under TENANT_SCOPED_TABLES and queries are flagged as tenant-scoped', () => {
    expect(TENANT_SCOPED_TABLES.includes('monitoring_configs')).toBe(true);
    expect(TENANT_SCOPED_TABLES.includes('crawl_snapshots')).toBe(true);
    expect(TENANT_SCOPED_TABLES.includes('monitoring_alerts')).toBe(true);

    expect(isQueryTenantScoped("SELECT * FROM monitoring_configs")).toBe(true);
    expect(isQueryTenantScoped("INSERT INTO crawl_snapshots (id) VALUES (1)")).toBe(true);
  });

  it('throws an exception immediately when fetching tenant context outside an active wrapper', () => {
    expect(() => TenantContextManager.getRequiredTenantId()).toThrow("No active tenant context found");
  });
});
