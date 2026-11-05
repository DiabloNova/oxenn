import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  runWithTenantContextMock,
  checkEntitlementMock,
  fetchPublicUrlMock,
  crawlUrlMock,
  generateTextMock,
  queryMock
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  checkEntitlementMock: vi.fn(),
  fetchPublicUrlMock: vi.fn(),
  crawlUrlMock: vi.fn(),
  generateTextMock: vi.fn(),
  queryMock: vi.fn()
}));

vi.mock("@/services/auth/authorization", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth/authorization")>(
    "@/services/auth/authorization"
  );
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock }
}));
vi.mock("@/features/billing/services/subscription-service", () => ({
  subscriptionService: { checkEntitlement: checkEntitlementMock }
}));
vi.mock("@/services/crawler/safe-http-fetch", () => ({
  fetchPublicUrl: fetchPublicUrlMock
}));
vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: { crawlUrl: crawlUrlMock }
}));
vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: () => ({ generateText: generateTextMock })
}));
vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ query: queryMock }) }
}));

import { POST } from "@/app/api/v1/audit/premium/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/audit/premium", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("premium audit API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIRECRAWL_API_KEY = "fc-test-key";
    authorizeApiRequestMock.mockResolvedValue({
      tenantId: "tenant-test",
      userId: "user-test"
    });
    runWithTenantContextMock.mockImplementation(
      async (_tenantId: string, _userId: string, _requestId: string, callback: () => Promise<unknown>) =>
        callback()
    );
    checkEntitlementMock.mockResolvedValue(true);
    fetchPublicUrlMock.mockImplementation(async (url: string) => ({
      url,
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => null },
      text: async () => ""
    }));
    crawlUrlMock.mockResolvedValue({
      success: true,
      data: [
        {
          url: "https://example.com/",
          markdown: "A".repeat(700),
          metadata: { description: "Homepage description" }
        },
        {
          url: "https://example.com/blog",
          markdown: "B".repeat(700),
          metadata: { description: "Blog description" }
        }
      ]
    });
    generateTextMock.mockResolvedValue(JSON.stringify({
      gapAnalysis: "شکاف محتوایی در خوشه‌های موضوعی",
      recommendations: [{
        priority: "high",
        insight: "تکمیل ساختار محتوایی",
        estimatedImpact: "+20% visibility"
      }]
    }));
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  it("preserves the premium audit score, grade and pages-analyzed response contract", async () => {
    const response = await POST(makeRequest({
      url: "https://example.com",
      depth: 2
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.score).toBeGreaterThanOrEqual(50);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(body.grade);
    expect(body.pagesAnalyzed).toBe(2);
    expect(body.metrics).toEqual(expect.objectContaining({
      contentQuality: expect.any(Number),
      technicalHealth: expect.any(Number)
    }));
    expect(fetchPublicUrlMock).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ maxBytes: 2 * 1024 * 1024 })
    );
    expect(crawlUrlMock).toHaveBeenCalledWith(
      "https://example.com",
      expect.any(Object)
    );
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid URL input with HTTP 400 before any outbound request", async () => {
    const response = await POST(makeRequest({ url: "not-a-url", depth: 2 }));

    expect(response.status).toBe(400);
    expect(fetchPublicUrlMock).not.toHaveBeenCalled();
    expect(crawlUrlMock).not.toHaveBeenCalled();
  });

  it("denies free workspaces before DNS validation, Firecrawl or LLM work", async () => {
    checkEntitlementMock.mockResolvedValue(false);

    const response = await POST(makeRequest({
      url: "https://example.com",
      depth: 2
    }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(checkEntitlementMock).toHaveBeenCalledWith("canRunPremiumAudit");
    expect(fetchPublicUrlMock).not.toHaveBeenCalled();
    expect(crawlUrlMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("rejects an unsafe public-URL validation result before starting premium work", async () => {
    fetchPublicUrlMock.mockRejectedValue(new Error("non-public DNS address"));

    const response = await POST(makeRequest({
      url: "https://example.com",
      depth: 2
    }));

    expect(response.status).toBe(400);
    expect(crawlUrlMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
