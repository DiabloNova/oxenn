import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/services/auth/session", () => ({
  getSession,
  requireSession: vi.fn(),
}));

import { authorizeApiRequest, AuthorizationError } from "@/services/auth/authorization";

describe("authorizeApiRequest", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("rejects caller-supplied identity headers when no signed session exists", async () => {
    getSession.mockResolvedValue(null);
    const request = new NextRequest("https://example.test/api/v1/audit/engine", {
      headers: {
        "x-user-id": "victim-user",
        "x-tenant-id": "victim-workspace",
      },
    });

    await expect(authorizeApiRequest(request)).rejects.toMatchObject({
      name: "AuthorizationError",
      statusCode: 401,
    } satisfies Partial<AuthorizationError>);
  });

  it("uses the signed session identity instead of conflicting request headers", async () => {
    getSession.mockResolvedValue({
      user: { id: "session-user", workspaceId: "session-workspace" },
    });
    const request = new NextRequest("https://example.test/api/v1/audit/engine", {
      headers: {
        "x-user-id": "attacker-user",
        "x-tenant-id": "attacker-workspace",
      },
    });

    await expect(authorizeApiRequest(request)).resolves.toEqual({
      userId: "session-user",
      tenantId: "session-workspace",
    });
  });

  it("rejects incomplete authenticated session context", async () => {
    getSession.mockResolvedValue({
      user: { id: "session-user", workspaceId: "" },
    });
    const request = new NextRequest("https://example.test/api/v1/audit/engine");

    await expect(authorizeApiRequest(request)).rejects.toMatchObject({
      name: "AuthorizationError",
      statusCode: 401,
    });
  });
});
