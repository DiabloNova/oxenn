import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, systemRunner } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  systemRunner: vi.fn(),
}));

vi.mock("../../../../src/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: systemRunner,
    getDbClient: () => ({ query: queryMock }),
  },
}));

import { grantSuperAdmin } from "../../../../scripts/auth/grant-super-admin";

describe("grantSuperAdmin", () => {
  let workspaceActive = true;
  let membershipRole = "workspace_admin";
  let activeAdminCount = 1;
  let membershipExists = true;

  beforeEach(() => {
    vi.clearAllMocks();
    workspaceActive = true;
    membershipRole = "workspace_admin";
    activeAdminCount = 1;
    membershipExists = true;

    systemRunner.mockImplementation(async (_userId, _purpose, work) => work());
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM organizations") && sql.includes("FOR UPDATE")) {
        return { rows: workspaceActive ? [{ id: "org-1" }] : [], rowCount: workspaceActive ? 1 : 0 };
      }
      if (sql.includes("SELECT m.id, m.role")) {
        return { rows: membershipExists ? [{ id: "membership-1", role: membershipRole }] : [], rowCount: membershipExists ? 1 : 0 };
      }
      if (sql.includes("COUNT(*)::int AS admin_count")) {
        return { rows: [{ admin_count: activeAdminCount }], rowCount: 1 };
      }
      if (sql.includes("UPDATE organization_members")) {
        return { rows: [{ id: "membership-1" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });
  });

  it("rejects converting the final active workspace_admin to super_admin", async () => {
    await expect(grantSuperAdmin("user-1", "org-1")).rejects.toThrow(
      "Cannot grant super_admin to the final active workspace administrator.",
    );

    const sqlCalls = queryMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlCalls[0]).toContain("FROM organizations");
    expect(sqlCalls[0]).toContain("FOR UPDATE");
    expect(sqlCalls.some((sql) => sql.includes("UPDATE organization_members"))).toBe(false);
    expect(sqlCalls.some((sql) => sql.includes("INSERT INTO audit_records"))).toBe(false);
    expect(sqlCalls.some((sql) => sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK")).toBe(false);
  });

  it("allows the grant when another active workspace_admin remains and audits it", async () => {
    activeAdminCount = 2;

    await expect(grantSuperAdmin("user-1", "org-1")).resolves.toBe("membership-1");

    const sqlCalls = queryMock.mock.calls.map(([sql]) => String(sql));
    const lockIndex = sqlCalls.findIndex((sql) => sql.includes("FROM organizations") && sql.includes("FOR UPDATE"));
    const countIndex = sqlCalls.findIndex((sql) => sql.includes("COUNT(*)::int AS admin_count"));
    const updateIndex = sqlCalls.findIndex((sql) => sql.includes("UPDATE organization_members"));
    const auditIndex = sqlCalls.findIndex((sql) => sql.includes("INSERT INTO audit_records"));

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(countIndex).toBeGreaterThan(lockIndex);
    expect(updateIndex).toBeGreaterThan(countIndex);
    expect(auditIndex).toBeGreaterThan(updateIndex);
    expect(sqlCalls.some((sql) => sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK")).toBe(false);
    expect(systemRunner).toHaveBeenCalledWith(null, "sys-grant-super-admin", expect.any(Function));
  });

  it("rejects a closed workspace before reading or changing membership", async () => {
    workspaceActive = false;

    await expect(grantSuperAdmin("user-1", "org-1")).rejects.toThrow("Workspace is inactive or does not exist.");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a user who is no longer an active workspace member", async () => {
    membershipExists = false;

    await expect(grantSuperAdmin("user-1", "org-1")).rejects.toThrow(
      "User is not an active member of the workspace.",
    );
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("UPDATE organization_members"))).toBe(false);
  });

  it("does not need a workspace-admin count when promoting a viewer", async () => {
    membershipRole = "viewer";

    await expect(grantSuperAdmin("user-1", "org-1")).resolves.toBe("membership-1");
    expect(queryMock.mock.calls.some(([sql]) => String(sql).includes("COUNT(*)::int AS admin_count"))).toBe(false);
  });
});
