import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const { authorizeApiRequestMock, runWithTenantContextMock, generateTextMock } = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  generateTextMock: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock },
}));

vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: () => ({ generateText: generateTextMock }),
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST } from "@/app/api/v1/analytics/llm/route";

describe("LLM Analytics server-side authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({ userId: "user-test", tenantId: "tenant-test" });
    runWithTenantContextMock.mockImplementation(async (...args: unknown[]) => {
      const callback = args[3] as () => Promise<unknown>;
      return callback();
    });
    generateTextMock.mockResolvedValue("{ invalid json");
  });

  it("rejects a request with forged identity headers when no server session is available", async () => {
    authorizeApiRequestMock.mockRejectedValueOnce(
      new AuthorizationError(401, "Unauthorized: A valid server session is required."),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "forged-tenant",
        "x-user-id": "forged-user",
      },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(authorizeApiRequestMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("rejects oversized query arrays after resolving the server identity and before calling the model", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: Array.from({ length: 101 }, (_, index) => ({ invalid: index })),
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(authorizeApiRequestMock).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(400);
    expect(body.message).toBe("حداکثر ۱۰۰ پرس‌وجو قابل ارسال است");
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("fails closed with HTTP 500 when the model output cannot be parsed", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
    expect(body.shareOfVoice).toBeUndefined();
    expect(body.sentimentScore).toBeUndefined();
  });
});
