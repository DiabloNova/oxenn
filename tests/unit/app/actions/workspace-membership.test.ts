import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeMemberAction, updateMemberRoleAction } from "@/app/actions/workspace";
import { requireSession } from "@/services/auth/session";

const { queryMock, tenantRunner, systemRunner } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  tenantRunner: vi.fn(),
  systemRunner: vi.fn(),
}));

vi.mock("@/services/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return {
    ...actual,
    requireWorkspaceMembership: vi.fn(),
    requireRole: vi.fn(),
  };
});

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: tenantRunner,
    runWithSystemContext: systemRunner,
    getDbClient: () => ({ query: queryMock }),
  },
}));

describe("workspace final-administrator invariant", () => {
  let activeAdminCount = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    activeAdminCount = 1;

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "workspace_admin",
        workspaceId: "org-1",
      },
      expiresAt: new Date().toISOString(),
      status: "authenticated",
    });

    tenantRunner.mockImplementation(async (_workspaceId, _userId, _purpose, work) => work());
    systemRunner.mockImplementation(async (_userId, _purpose, work) => work());
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM organizations") && sql.includes("FOR UPDATE")) {
        return { rows: [{ id: "org-1" }], rowCount: 1 };
      }
      if (sql.includes("SELECT m.role") && sql.includes("FROM organization_members m") && !sql.includes("FOR UPDATE OF m")) {
        return { rows: [{ role: "workspace_admin" }], rowCount: 1 };
      }
      if (sql.includes("SELECT m.role") && sql.includes("FOR UPDATE OF m")) {
        return { rows: [{ role: "workspace_admin", user_active: true }], rowCount: 1 };
      }
      if (sql.includes("COUNT(*)::int AS admin_count")) {
        return { rows: [{ admin_count: activeAdminCount }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });
  });

  it("rejects removing the last active administrator, including self-removal", async () => {
    const result = await removeMemberAction("org-1", "admin-1");

    expect(result).toEqual({ success: false, errorCode: "LAST_WORKSPACE_ADMIN" });
    const sqlCalls = queryMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlCalls.findIndex((sql) => sql.includes("FROM organizations") && sql.includes("FOR UPDATE")))
      .toBeLessThan(sqlCalls.findIndex((sql) => sql.includes("COUNT(*)::int AS admin_count")));
    expect(sqlCalls.some((sql) => sql.includes("DELETE FROM organization_members"))).toBe(false);
    expect(sqlCalls.some((sql) => sql.includes("UPDATE sessions"))).toBe(false);
  });

  it("rejects demoting the last active administrator, including self-demotion", async () => {
    const result = await updateMemberRoleAction("org-1", "admin-1", "viewer");

    expect(result).toEqual({ success: false, errorCode: "LAST_WORKSPACE_ADMIN" });
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("UPDATE organization_members"))).toBe(false);
  });

  it("allows removal when another active administrator remains", async () => {
    activeAdminCount = 2;

    const result = await removeMemberAction("org-1", "admin-2");

    expect(result).toEqual({ success: true });
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("DELETE FROM organization_members"))).toBe(true);
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("UPDATE sessions"))).toBe(true);
  });

  it("allows demotion when another active administrator remains", async () => {
    activeAdminCount = 2;

    const result = await updateMemberRoleAction("org-1", "admin-2", "viewer");

    expect(result).toEqual({ success: true });
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("UPDATE organization_members"))).toBe(true);
  });

  it("fails closed when the target workspace is already inactive", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM organizations") && sql.includes("FOR UPDATE")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    const result = await removeMemberAction("org-1", "admin-2");
    expect(result).toEqual({ success: false, errorCode: "WORKSPACE_INACTIVE" });
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("DELETE FROM organization_members"))).toBe(false);
  });
});
