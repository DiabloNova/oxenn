import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { getSession } from "@/services/auth/session";
import { AuthorizationError, authorizeApiRequest } from "@/services/auth/authorization";

vi.mock("@/services/auth/session", () => ({
  getSession: vi.fn(),
}));

function makeRequest(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

describe("authorizeApiRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects caller-supplied identity headers when no server session exists", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(
      authorizeApiRequest(
        makeRequest({
          "x-user-id": "victim-user",
          "x-tenant-id": "victim-tenant",
        })
      )
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("uses the user and tenant from the validated server session, not request headers", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: {
        id: "session-user",
        name: "Session User",
        email: "session-user@example.com",
        role: "workspace_admin",
        workspaceId: "session-workspace",
      },
      expiresAt: "2099-01-01T00:00:00.000Z",
      status: "authenticated",
    });

    await expect(
      authorizeApiRequest(
        makeRequest({
          "x-user-id": "spoofed-user",
          "x-tenant-id": "spoofed-tenant",
        })
      )
    ).resolves.toEqual({
      userId: "session-user",
      tenantId: "session-workspace",
    });
  });
});
