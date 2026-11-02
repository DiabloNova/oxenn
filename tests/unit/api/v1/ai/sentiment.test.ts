import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authorizeApiRequestMock, analyzeSentimentMock, runWithTenantContextMock } = vi.hoisted(() => ({
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

describe("Sentiment API server-side authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({ userId: "user-test", tenantId: "tenant-test" });
    runWithTenantContextMock.mockImplementation(async (...args: unknown[]) => {
      const callback = args[3] as () => Promise<unknown>;
      return callback();
    });
    analyzeSentimentMock.mockResolvedValue({ score: 0.8, sentiment: "positive" });
  });

  async function post(withForgedHeaders: boolean) {
    return POST(new NextRequest("http://localhost:3000/api/v1/ai/sentiment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(withForgedHeaders ? {
          "x-user-id": "forged-user",
          "x-tenant-id": "forged-tenant",
        } : {}),
      },
      body: JSON.stringify({ text: "A positive sample" }),
    }));
  }

  it.each([false, true])("rejects unauthenticated requests (forged headers: %s)", async (withForgedHeaders) => {
    authorizeApiRequestMock.mockRejectedValueOnce(
      new AuthorizationError(401, "Unauthorized: A valid server session is required."),
    );

    const response = await post(withForgedHeaders);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(analyzeSentimentMock).not.toHaveBeenCalled();
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
  });
});
