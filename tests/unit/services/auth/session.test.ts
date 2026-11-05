import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { getSession, setCookiesMock } from "@/services/auth/session";

describe("getSession infrastructure error handling", () => {
  const cookieStore = { get: vi.fn() };

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
    queryMock.mockResolvedValue({ rows: [] });
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
        role: "owner",
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
