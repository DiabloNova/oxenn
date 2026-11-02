import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  analyzeSentimentMock,
  runWithTenantContextMock,
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  analyzeSentimentMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

vi.mock("@/services/ai/sentiment-analysis", () => ({
  analyzeSentiment: analyzeSentimentMock,
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock },
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST } from "@/app/api/v1/ai/sentiment/route";

describe("Sentiment API server-side authorization and tenant isolation", () => {
  let insideTenantContext = false;

  beforeEach(() => {
    vi.clearAllMocks();
    insideTenantContext = false;
    authorizeApiRequestMock.mockResolvedValue({ userId: "user-test", tenantId: "tenant-test" });
    runWithTenantContextMock.mockImplementation(
      async (
        _tenantId: string,
        _userId: string,
        _requestId: string,
        callback: () => Promise<unknown>,
      ) => {
        insideTenantContext = true;
        try {
          return await callback();
        } finally {
          insideTenantContext = false;
        }
      },
    );
    analyzeSentimentMock.mockImplementation(async () => {
      if (!insideTenantContext) {
        throw new Error("Sentiment analysis ran outside the tenant context");
      }
      return { score: 0.8, sentiment: "positive" };
    });
  });

  afterEach(() => {
    insideTenantContext = false;
  });

  async function post(withForgedHeaders: boolean, requestId?: string) {
    return POST(new NextRequest("http://localhost:3000/api/v1/ai/sentiment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(requestId ? { "x-request-id": requestId } : {}),
        ...(withForgedHeaders ? {
          "x-user-id": "forged-user",
          "x-tenant-id": "forged-tenant",
        } : {}),
      },
      body: JSON.stringify({ text: "A positive sample" }),
    }));
  }

  it.each([false, true])(
    "rejects unauthenticated requests (forged headers: %s)",
    async (withForgedHeaders) => {
      authorizeApiRequestMock.mockRejectedValueOnce(
        new AuthorizationError(401, "Unauthorized: A valid server session is required."),
      );

      const response = await post(withForgedHeaders);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
      expect(analyzeSentimentMock).not.toHaveBeenCalled();
      expect(runWithTenantContextMock).not.toHaveBeenCalled();
    },
  );

  it("runs sentiment analysis inside the session-derived tenant context", async () => {
    const response = await post(false, "req-sentiment-test");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      sentiment: { score: 0.8, sentiment: "positive" },
    });
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "user-test",
      "req-sentiment-test",
      expect.any(Function),
    );
    expect(analyzeSentimentMock).toHaveBeenCalledTimes(1);
  });
});
