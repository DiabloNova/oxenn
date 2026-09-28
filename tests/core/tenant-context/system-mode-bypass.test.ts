import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TenantContextManager, TenantContextViolationException } from "../../../src/core/database/tenant-context";

// Ensure DATABASE_URL is set before importing PostgresClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

describe("Defect 1: System Mode Bypass Verification Test Suite", () => {
  let PostgresClientModule: typeof import("../../../src/features/admin/infrastructure/persistence/postgres");

  beforeEach(async () => {
    PostgresClientModule = await import("../../../src/features/admin/infrastructure/persistence/postgres");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws TenantContextViolationException when querying whitelisted table in non-tenant/non-system mode", async () => {
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    await expect(async () => {
      await pgClient.query("SELECT * FROM websites WHERE domain = $1", ["example.com"]);
    }).rejects.toThrow(TenantContextViolationException);
  });

  it("bypasses tenant ID requirement when querying whitelisted table inside runWithSystemContext", async () => {
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    // Mock pool.query so it doesn't attempt real DB connection
    const pool = pgClient.getPool();
    vi.spyOn(pool, "query").mockResolvedValue({ rows: [{ id: "site-1", domain: "example.com" }], rowCount: 1 } as unknown as ReturnType<typeof pool.query>);

    await TenantContextManager.runWithSystemContext("usr-system-actor", "req-123", async () => {
      expect(TenantContextManager.isSystemMode()).toBe(true);

      const res = await pgClient.query("SELECT * FROM websites WHERE domain = $1", ["example.com"]);
      expect(res.rows).toEqual([{ id: "site-1", domain: "example.com" }]);
    });
  });

  it("bypasses tenant ID requirement on leased client query inside runWithSystemContext", async () => {
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [{ prefix: "ox_live_123" }], rowCount: 1 }),
      release: vi.fn(),
    };
    vi.spyOn(pgClient.getPool(), "connect").mockImplementation(async () => mockClient as unknown as import("pg").PoolClient);

    const leasedClient = await pgClient.connectClient();

    await TenantContextManager.runWithSystemContext("usr-system-actor", "req-123", async () => {
      expect(TenantContextManager.isSystemMode()).toBe(true);

      const res = await leasedClient.query("SELECT * FROM api_keys WHERE prefix = $1 LIMIT 1", ["ox_live_123"]);
      expect(res.rows).toEqual([{ prefix: "ox_live_123" }]);
    });

    leasedClient.release();
  });
});
