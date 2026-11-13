import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupExpiredFreeAuditRateLimits } from "@/services/audit/free-audit-rate-limit-cleanup";

const mocks = vi.hoisted(() => ({ query: vi.fn(), runWithSystemContext: vi.fn() }));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: mocks.runWithSystemContext,
    getDbClient: () => ({ query: mocks.query })
  }
}));

describe("Free Audit rate-limit cleanup", () => {
  afterEach(() => vi.clearAllMocks());

  it("deletes only expired Free Audit buckets in bounded skip-locked batches", async () => {
    mocks.runWithSystemContext.mockImplementation(async (_userId: null, _purpose: string, work: () => Promise<unknown>) => work());
    mocks.query.mockResolvedValue({ rows: [{}, {}] });

    await expect(cleanupExpiredFreeAuditRateLimits()).resolves.toBe(2);
    expect(mocks.runWithSystemContext).toHaveBeenCalledWith(null, "sys-free-audit", expect.any(Function));
    const sql = String(mocks.query.mock.calls[0]?.[0]);
    expect(sql).toContain("endpoint LIKE 'free-audit-%'");
    expect(sql).toContain("expires_at <= NOW()");
    expect(sql).toContain("LIMIT 5000");
    expect(sql).toContain("FOR UPDATE SKIP LOCKED");
  });

  it("fails when the privileged database client is unavailable", async () => {
    mocks.runWithSystemContext.mockImplementation(async (_userId: null, _purpose: string, work: () => Promise<unknown>) => work());
    await expect(cleanupExpiredFreeAuditRateLimits()).rejects.toThrow("Free audit cleanup database context is unavailable");
  });
});
