import { beforeEach, describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/v1/analytics/llm/route";
import { NextRequest } from "next/server";

const { authorizeApiRequestMock } = vi.hoisted(() => ({ authorizeApiRequestMock: vi.fn() }));

vi.mock("@/services/auth/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth/authorization")>("@/services/auth/authorization");
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

import { AuthorizationError } from "@/services/auth/authorization";

describe("DIRECT REGRESSION TEST: src/app/api/v1/analytics/llm/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({ tenantId: "tenant-test", userId: "user-test" });
  });

  it("rejects a request when no authenticated server session exists", async () => {
    authorizeApiRequestMock.mockRejectedValue(new AuthorizationError(401, "Unauthorized"));
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects oversized query arrays before per-item validation or model calls", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        // Invalid elements ensure the size guard wins before parsing items.
        queries: Array.from({ length: 101 }, (_, index) => ({ invalid: index })),
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("حداکثر ۱۰۰ پرس‌وجو قابل ارسال است");
  });

  it("Test 2: Invalid / unparseable LLM output -> Fail Closed HTTP 500 (No Math.random / synthetic fallback)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
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
