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

  it("returns null when the session is absent or revoked", async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(getSession()).resolves.toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a database outage instead of misreporting it as an unauthenticated session", async () => {
    queryMock.mockRejectedValue(new Error("database unavailable"));

    await expect(getSession()).rejects.toThrow("database unavailable");
  });

  it("propagates a missing database client as an infrastructure failure", async () => {
    getDbClientMock.mockReturnValue(null);

    await expect(getSession()).rejects.toThrow("Failed to get DB client in system context");
  });
});
