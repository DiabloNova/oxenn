import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deactivateAccountAction } from "../../../../src/app/actions/account";
import { requireSession } from "../../../../src/services/auth/session";

vi.mock("../../../../src/services/auth/session", () => ({
  requireSession: vi.fn(),
  revokeAllForUser: vi.fn(),
}));

vi.mock("../../../../src/services/auth/passwords", () => ({
  hashPassword: vi.fn().mockResolvedValue({ hash: "mockHash", algorithm: "scrypt", params: {} }),
  verifyPassword: vi.fn(),
}));

describe("deactivateAccountAction", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: "usr-1", email: "test@example.com", name: "Test", role: "workspace_admin", workspaceId: "org-sole-admin" },
      expiresAt: new Date().toISOString(),
      status: "authenticated",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects if no session", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      user: null,
      expiresAt: null,
      status: "unauthenticated",
    });
    await expect(deactivateAccountAction("password")).rejects.toThrow("Unauthorized");
  });

  it("fails if password verification fails without changing account or workspace state", async () => {
    const { verifyPassword } = await import("../../../../src/services/auth/passwords");
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();
    const queryMock = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT * FROM user_credentials")) {
        return { rows: [{ password_hash: "hash", params: {} }] };
      }
      return { rows: [], rowCount: 0 };
    });
    const mockClient = { query: queryMock, release: vi.fn() };
    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await deactivateAccountAction("wrongpass");
    expect(result).toEqual({ success: false, errorCode: "INVALID_PASSWORD" });
    expect(queryMock.mock.calls.some(([sql]) => typeof sql === "string" && sql.includes("UPDATE users SET deleted_at"))).toBe(false);
  });

  it("closes a sole-admin workspace and atomically deactivates the account", async () => {
    const { verifyPassword } = await import("../../../../src/services/auth/passwords");
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const roles: Record<string, string> = {
      "org-other-admin": "workspace_admin",
      "org-sole-admin": "workspace_admin",
      "org-viewer": "viewer",
    };
    const adminCounts: Record<string, number> = {
      "org-other-admin": 2,
      "org-sole-admin": 1,
      "org-viewer": 1,
    };

    const queryMock = vi.fn().mockImplementation(async (sql: string, params: unknown[] = []) => {
      if (sql.includes("SELECT * FROM user_credentials")) {
        return { rows: [{ password_hash: "hash", params: {} }], rowCount: 1 };
      }
      if (sql.includes("SELECT id") && sql.includes("FROM users") && sql.includes("FOR UPDATE")) {
        return { rows: [{ id: "usr-1" }], rowCount: 1 };
      }
      if (sql.includes("SELECT m.organization_id, m.role")) {
        // The action orders this list before taking any organization lock.
        return { rows: [
          { organization_id: "org-other-admin", role: "workspace_admin" },
          { organization_id: "org-sole-admin", role: "workspace_admin" },
          { organization_id: "org-viewer", role: "viewer" },
        ], rowCount: 3 };
      }
      if (sql.includes("SELECT m.role") && sql.includes("FOR UPDATE OF m")) {
        const orgId = String(params[0]);
        return { rows: [{ role: roles[orgId] }], rowCount: 1 };
      }
      if (sql.includes("COUNT(*)::int AS admin_count")) {
        return { rows: [{ admin_count: adminCounts[String(params[0])] }], rowCount: 1 };
      }
      if (sql.includes("SELECT id") && sql.includes("FROM organizations") && sql.includes("FOR UPDATE")) {
        return { rows: [{ id: params[0] }], rowCount: 1 };
      }
      if (sql.includes("UPDATE users") && sql.includes("SET deleted_at = NOW()")) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    });

    const mockClient = { query: queryMock, release: vi.fn() };
    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await deactivateAccountAction("correctpass");

    expect(result).toEqual({ success: true });
    const sqlCalls = queryMock.mock.calls
      .map(([sql]) => typeof sql === "string" ? sql : (sql as { text?: string }).text ?? "")
      .filter(Boolean);

    expect(sqlCalls.some((sql) => sql.includes("UPDATE organizations") && sql.includes("deleted_at = NOW()"))).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes("UPDATE sessions") && sql.includes("WHERE workspace_id = $1"))).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes("UPDATE users") && sql.includes("SET deleted_at = NOW()"))).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes("UPDATE sessions") && sql.includes("WHERE user_id = $1"))).toBe(true);

    // Workspaces with another active administrator or a viewer membership
    // are detached; the sole-admin workspace retains its membership for audit.
    const deletedMemberships = queryMock.mock.calls.filter(([sql]) =>
      typeof sql === "string" && sql.includes("DELETE FROM organization_members")
    );
    expect(deletedMemberships).toHaveLength(2);
    expect(deletedMemberships.some(([, params]) => (params as unknown[])[0] === "org-sole-admin")).toBe(false);

    // Workspace locks are acquired in deterministic organization-id order.
    const lockParams = queryMock.mock.calls
      .filter(([sql]) => typeof sql === "string" && sql.includes("FROM organizations") && sql.includes("FOR UPDATE"))
      .map(([, params]) => String((params as unknown[])[0]));
    expect(lockParams).toEqual(["org-other-admin", "org-sole-admin", "org-viewer"]);
  });
});
