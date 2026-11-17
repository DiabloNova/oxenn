import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  runWithTenantContext: vi.fn(async (_tenantId: string, _userId: string, _requestId: string, work: () => Promise<unknown>) => work()),
  requireSession: vi.fn(async () => ({ user: { id: "user-1", workspaceId: "tenant-1" } })),
}));
vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({ PostgresClient: { getInstance: () => ({ query: mocks.query }) } }));
vi.mock("@/core/database/tenant-context", () => ({ TenantContextManager: { runWithTenantContext: mocks.runWithTenantContext } }));
vi.mock("@/services/auth/session", () => ({ requireSession: mocks.requireSession }));
import { getPremiumAuditById, listPremiumAudits } from "@/services/audits/dashboard-audits";
beforeEach(() => { mocks.query.mockReset(); mocks.runWithTenantContext.mockClear(); mocks.requireSession.mockClear(); });
describe("tenant-scoped premium audit history", () => {
  it("lists real workspace records with bounded pagination and search", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ total: "21" }] }).mockResolvedValueOnce({ rows: [{
      id: "2f1d4b67-62f5-4b4d-9b18-4b0b3e7e4c7a", url: "https://example.com", score: 82,
      grade: "B", pages_analyzed: 4, created_at: new Date("2026-11-17T00:00:00.000Z"),
    }] });
    const result = await listPremiumAudits({ page: 2, query: "example.com" });
    expect(mocks.runWithTenantContext).toHaveBeenCalledWith("tenant-1", "user-1", expect.stringMatching(/^req-dashboard-audits-/), expect.any(Function));
    expect(mocks.query.mock.calls[0][0]).toContain("WHERE organization_id = $1");
    expect(mocks.query.mock.calls[0][1]).toEqual(["tenant-1", "%example.com%"]);
    expect(mocks.query.mock.calls[1][0]).toContain("ORDER BY created_at DESC, id DESC");
    expect(mocks.query.mock.calls[1][1]).toEqual(["tenant-1", "%example.com%", 20, 20]);
    expect(result).toMatchObject({ page: 2, pageCount: 2, total: 21, query: "example.com" });
    expect(result.audits[0]).toMatchObject({ url: "https://example.com", score: 82, pagesAnalyzed: 4 });
  });
  it("fetches detail by both workspace and UUID", async () => {
    const id = "2f1d4b67-62f5-4b4d-9b18-4b0b3e7e4c7a";
    mocks.query.mockResolvedValueOnce({ rows: [{ id, url: "https://example.com", score: 82, grade: "B", pages_analyzed: 4,
      metrics: { contentQuality: 91 }, issues: [{ description: "Missing metadata" }],
      recommendations: [{ insight: "Add metadata" }], created_at: new Date("2026-11-17T00:00:00.000Z") }] });
    const audit = await getPremiumAuditById(id);
    expect(mocks.query.mock.calls[0][0]).toContain("WHERE organization_id = $1 AND id = $2");
    expect(mocks.query.mock.calls[0][1]).toEqual(["tenant-1", id]);
    expect(audit).toMatchObject({ id, url: "https://example.com", score: 82, metrics: { contentQuality: 91 }, issues: [{ description: "Missing metadata" }] });
  });
  it("rejects malformed IDs before querying", async () => {
    await expect(getPremiumAuditById("not-a-uuid")).resolves.toBeNull();
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
