import { describe, it, expect, vi, beforeEach } from "vitest";
import { inviteUserAction } from "@/app/actions/workspace";
import { CaptureEmailSender, setMockEmailSender } from "@/services/email/adapters";

vi.mock("@/services/auth/session", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", name: "Alice" } }),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return {
    ...actual,
    requireWorkspaceMembership: vi.fn(),
    requireRole: vi.fn().mockResolvedValue("workspace_admin"),
  };
});

const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }));

const mockInsert = vi.fn().mockReturnValue({ values: vi.fn() });
const mockWhere = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
const mockFrom = vi.fn().mockReturnValue({ innerJoin: vi.fn().mockReturnValue({ where: mockWhere }), where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ name: "Test Org" }]) }) });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: vi.fn(async (tenantId, userId, purpose, callback) => {
      return await callback();
    }),
    getDbClient: vi.fn(() => ({ query: queryMock })),
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn(),
    and: vi.fn(),
  };
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
}));



describe("inviteUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM users") && sql.includes("FOR UPDATE")) {
        return { rows: [{ id: "user-1" }], rowCount: 1 };
      }
      if (sql.includes("FROM organizations") && sql.includes("FOR UPDATE")) {
        return { rows: [{ id: "org-1" }], rowCount: 1 };
      }
      if (sql.includes("FROM organization_members m")) {
        return { rows: [{ organization_id: "org-1", role: "workspace_admin" }], rowCount: 1 };
      }
      if (sql.includes("UPDATE organization_invitations")) {
        return { rows: [{ id: "invitation-1" }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
    CaptureEmailSender.clear();
    setMockEmailSender(null);

  });

  it("rejects invalid workspace roles before creating an invitation", async () => {
    await expect(inviteUserAction("org-1", "test@test.com", "owner")).rejects.toThrow("Invalid workspace role");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("does not expose the raw token in the response", async () => {
    const res = await inviteUserAction("org-1", "test@test.com", "viewer");
    expect(res).toEqual({ success: true });
    // Token is completely absent
    expect(res).not.toHaveProperty("token");
    expect(res).not.toHaveProperty("rawToken");
  });

  it("awaits the configured invitation sender before returning", async () => {
    await inviteUserAction("org-1", "test@test.com", "viewer");


    const emails = CaptureEmailSender.capturedEmails;
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("test@test.com");
    expect(emails[0].templateId).toBe("workspace_invitation");
    expect(emails[0].params.url).toContain("token=");
    expect(emails[0].params.url).toMatch(/token=[a-f0-9-]{36}$/); // It's a randomUUID string
  });

  it("revokes the pending invitation when email delivery fails", async () => {
    setMockEmailSender({ send: vi.fn().mockRejectedValue(new Error("smtp credentials must not be exposed")) });

    await expect(inviteUserAction("org-1", "test@test.com", "viewer"))
      .rejects.toThrow("Invitation email could not be delivered.");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE organization_invitations"),
      ["org-1", expect.stringMatching(/^[a-f0-9]{64}$/)]
    );
    expect(CaptureEmailSender.capturedEmails).toHaveLength(0);
  });


});
