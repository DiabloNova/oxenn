import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const {
  authenticateKeyMock,
  checkRateLimitMock,
  enforceAndConsumeQuotaMock,
} = vi.hoisted(() => ({
  authenticateKeyMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  enforceAndConsumeQuotaMock: vi.fn(),
}));

vi.mock("@/features/public-api/services/api-service", () => ({
  ApiService: class {
    authenticateKey = authenticateKeyMock;
  },
}));

vi.mock("@/features/public-api/services/api-quota-service", () => ({
  ApiQuotaService: class {
    checkRateLimit = checkRateLimitMock;
    enforceAndConsumeQuota = enforceAndConsumeQuotaMock;
  },
}));

import {
  withPublicApi,
  type AuthenticatedApiRequest,
} from "@/features/public-api/middleware/api-middleware";

describe("withPublicApi Bearer API-key authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateKeyMock.mockResolvedValue({
      id: "api-key-id",
      organizationId: "tenant-api",
    });
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 99,
    });
    enforceAndConsumeQuotaMock.mockResolvedValue(undefined);
  });

  it("continues to authenticate an explicit Bearer API key and attaches its tenant context", async () => {
    const request = new NextRequest("http://localhost/api/v1/public/test", {
      headers: {
        authorization: "Bearer seo_valid_public_key",
      },
    });

    let receivedIdentity: { userId?: string; tenantId?: string } = {};
    const handler = vi.fn(async (authenticatedRequest: AuthenticatedApiRequest) => {
      receivedIdentity = {
        userId: authenticatedRequest.userId,
        tenantId: authenticatedRequest.tenantId,
      };
      return NextResponse.json({ success: true });
    });

    const response = await withPublicApi(request, handler);

    expect(response.status).toBe(200);
    expect(receivedIdentity).toEqual({
      userId: "api-key-id",
      tenantId: "tenant-api",
    });
    expect(authenticateKeyMock).toHaveBeenCalledWith("seo_valid_public_key");
    expect(checkRateLimitMock).toHaveBeenCalledWith("tenant-api", 100, 60000);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("does not invoke a public handler without a Bearer API key", async () => {
    const request = new NextRequest("http://localhost/api/v1/public/test");
    const handler = vi.fn(async () => NextResponse.json({ success: true }));

    const response = await withPublicApi(request, handler);

    expect(response.status).toBe(401);
    expect(authenticateKeyMock).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});
