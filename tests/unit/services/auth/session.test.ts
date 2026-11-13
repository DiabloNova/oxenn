import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/types/auth";

const { runWithSystemContextMock, getDbClientMock, queryMock } = vi.hoisted(() => ({
  runWithSystemContextMock: vi.fn(),
  getDbClientMock: vi.fn(),
  queryMock: vi.fn()
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: runWithSystemContextMock,
    getDbClient: getDbClientMock
  }
}));

import {
  createSession,
  getSession,
  invalidateSession,
  setCookiesMock
} from "@/services/auth/session";

describe("server session lifecycle and error handling", () => {
  const cookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  };
  const user: User = {
    id: "user-1",
    name: "Test User",
    email: "user@example.com",
    role: "workspace_admin",
    workspaceId: "workspace-1"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setCookiesMock(async () => cookieStore as never);
    cookieStore.get.mockReturnValue({ value: "valid-session-token" });
    runWithSystemContextMock.mockImplementation(
      async (
        _userId: string | null,
        _requestId: string,
        callback: () => Promise<unknown>
      ) => callback()
    );
    getDbClientMock.mockReturnValue({ query: queryMock });
    queryMock.mockImplementation(async (sql: string) => {
      if (/SELECT\s+id\s+FROM\s+users/i.test(sql)) return { rows: [{ id: user.id }] };
      if (/SELECT\s+id\s+FROM\s+organizations/i.test(sql)) return { rows: [{ id: user.workspaceId }] };
      if (sql.includes("FROM organization_members")) return { rows: [{ "?column?": 1 }] };
      return { rows: [] };
    });
  });

  it("parses a valid database-backed session into the authenticated session shape", async () => {
    const expiresAt = new Date("2027-01-01T00:00:00.000Z");
    queryMock.mockResolvedValue({
      rows: [{
        id: "session-1",
        userId: user.id,
        workspaceId: user.workspaceId,
        expiresAt,
        revokedAt: null,
        replacedBy: null,
        email: user.email,
        name: user.name,
        role: user.role
      }]
    });

    await expect(getSession()).resolves.toEqual({
      user,
      expiresAt: expiresAt.toISOString(),
      status: "authenticated"
    });
    expect(runWithSystemContextMock).toHaveBeenCalledWith(
      null,
      "sys-auth-check",
      expect.any(Function)
    );
  });

  it("creates opaque sessions with secure cookie attributes and stores only a token hash", async () => {
    await createSession(user);

    expect(queryMock).toHaveBeenCalledTimes(4);
    expect(queryMock.mock.calls[0][0]).toMatch(/SELECT\s+id\s+FROM\s+users/i);
    expect(queryMock.mock.calls[0][0]).toContain("FOR UPDATE");
    expect(queryMock.mock.calls[1][0]).toMatch(/SELECT\s+id\s+FROM\s+organizations/i);
    expect(queryMock.mock.calls[1][0]).toContain("FOR UPDATE");
    expect(queryMock.mock.calls[2][0]).toContain("FROM organization_members");
    expect(queryMock.mock.calls[3][0]).toContain("INSERT INTO sessions");
    const tokenHash = queryMock.mock.calls[3][1][1] as string;
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);

    const [sessionName, rawToken, sessionOptions] = cookieStore.set.mock.calls[0];
    expect(sessionName).toBe("oxenn_session");
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).not.toBe(rawToken);
    expect(sessionOptions).toEqual(expect.objectContaining({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expect.any(Date)
    }));
    expect(cookieStore.set).toHaveBeenCalledWith(
      "tenant_id",
      user.workspaceId,
      expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/" })
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "user_id",
      user.id,
      expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/" })
    );
  });

  it("refuses to create a session for an inactive account", async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(createSession(user)).rejects.toThrow("Cannot create a session for an inactive account.");
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][0]).toContain("FOR UPDATE");
  });

  it("refuses to create a session after workspace membership is revoked", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (/SELECT\s+id\s+FROM\s+users/i.test(sql)) return { rows: [{ id: user.id }] };
      if (/SELECT\s+id\s+FROM\s+organizations/i.test(sql)) return { rows: [{ id: user.workspaceId }] };
      if (sql.includes("FROM organization_members")) return { rows: [] };
      return { rows: [] };
    });

    await expect(createSession(user)).rejects.toThrow("Cannot create a session without an active workspace membership.");
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("refuses to create a session for a closed workspace", async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (/SELECT\s+id\s+FROM\s+users/i.test(sql)) return { rows: [{ id: user.id }] };
      if (/SELECT\s+id\s+FROM\s+organizations/i.test(sql)) return { rows: [] };
      return { rows: [] };
    });

    await expect(createSession(user)).rejects.toThrow("Cannot create a session for an inactive workspace.");
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("revokes the current database session and deletes all session cookies on invalidation", async () => {
    await invalidateSession();

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][0]).toContain("UPDATE sessions");
    expect(queryMock.mock.calls[0][0]).toContain("revoked_at = NOW()");
    expect(queryMock.mock.calls[0][1][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(cookieStore.delete).toHaveBeenCalledTimes(3);
    expect(cookieStore.delete).toHaveBeenCalledWith("oxenn_session");
    expect(cookieStore.delete).toHaveBeenCalledWith("tenant_id");
    expect(cookieStore.delete).toHaveBeenCalledWith("user_id");
  });

  it("returns null when no session cookie exists", async () => {
    cookieStore.get.mockReturnValue(undefined);

    await expect(getSession()).resolves.toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns null when the session is absent", async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(getSession()).resolves.toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["revoked", { revokedAt: new Date("2026-01-01T00:00:00.000Z"), replacedBy: null }],
    ["replaced", { revokedAt: null, replacedBy: "replacement-session-id" }]
  ])("rejects a %s session to prevent stolen-cookie replay", async (_state, state) => {
    queryMock.mockResolvedValue({
      rows: [{
        userId: "user-1",
        workspaceId: "workspace-1",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
        email: "user@example.com",
        name: "Test User",
        role: "workspace_admin",
        ...state
      }]
    });

    await expect(getSession()).resolves.toBeNull();
  });

  it("propagates a sanitized error for a database outage", async () => {
    queryMock.mockRejectedValue(new Error("database unavailable"));

    await expect(getSession()).rejects.toThrow("Unable to retrieve session");
    await expect(getSession()).rejects.not.toThrow("database unavailable");
  });

  it("propagates a sanitized error when the database client is missing", async () => {
    getDbClientMock.mockReturnValue(null);

    await expect(getSession()).rejects.toThrow("Unable to retrieve session");
    await expect(getSession()).rejects.not.toThrow("Failed to get DB client");
  });
});
