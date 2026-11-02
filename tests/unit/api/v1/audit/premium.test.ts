import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  crawlUrlMock,
  generateTextMock,
  runWithTenantContextMock,
  queryMock,
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  crawlUrlMock: vi.fn(),
  generateTextMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: { crawlUrl: crawlUrlMock },
}));

vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: () => ({ generateText: generateTextMock }),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: runWithTenantContextMock,
  },
}));

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: {
    getInstance: () => ({ query: queryMock }),
  },
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST, type PremiumAuditResponse } from "@/app/api/v1/audit/premium/route";

describe("Premium Audit API authentication and business flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-api-key");

    authorizeApiRequestMock.mockResolvedValue({
      userId: "user-test",
      tenantId: "tenant-test",
    });

    runWithTenantContextMock.mockImplementation(
      async (
        _tenantId: string,
        _userId: string,
        _requestId: string,
        callback: () => Promise<unknown>,
      ) => callback(),
    );

    crawlUrlMock.mockResolvedValue({
      success: true,
      data: [
        {
          url: "https://optimus.ai/",
          markdown: "# Optimus AI\nSemantic search and AI optimization.",
          metadata: {
            title: "Optimus AI",
            description: "Semantic search and AI optimization platform.",
          },
        },
        {
          url: "https://optimus.ai/blog",
          markdown: "# Blog\nKnowledge graph and semantic optimization.",
          metadata: {
            title: "Optimus AI Blog",
            description: "Articles about semantic search and knowledge graphs.",
          },
        },
      ],
    });

    generateTextMock.mockResolvedValue(JSON.stringify({
      gapAnalysis: "Missing topic clusters and entity relationships.",
      recommendations: [
        {
          priority: "high",
          insight: "Create focused topic clusters.",
          estimatedImpact: "Improved topical coverage.",
        },
      ],
    }));

    queryMock.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function post(body: Record<string, unknown>, headers: Record<string, string> = {}) {
    return POST(new NextRequest("http://localhost/api/v1/audit/premium", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    }));
  }

  it("rejects forged identity headers when no server session is available", async () => {
    authorizeApiRequestMock.mockRejectedValueOnce(
      new AuthorizationError(401, "Unauthorized: A valid server session is required."),
    );

    const response = await post(
      { url: "https://optimus.ai", depth: 10 },
      {
        "x-user-id": "forged-user",
        "x-tenant-id": "forged-tenant",
      },
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(crawlUrlMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("preserves the premium audit scoring and response flow for an authenticated session", async () => {
    const response = await post({ url: "https://optimus.ai", depth: 10 }, {
      "x-request-id": "req-premium-test",
    });
    const payload = (await response.json()) as PremiumAuditResponse;

    expect(response.status).toBe(200);
    expect(payload.score).toBeGreaterThanOrEqual(50);
    expect(payload.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(payload.grade);
    expect(payload.pagesAnalyzed).toBe(2);
    expect(payload.metrics).toEqual(expect.objectContaining({
      contentQuality: expect.any(Number),
      technicalHealth: expect.any(Number),
      internalLinking: expect.any(Number),
      semanticCoverage: expect.any(Number),
    }));
    expect(payload.recommendations).toEqual([
      expect.objectContaining({
        priority: "high",
        insight: "Create focused topic clusters.",
      }),
    ]);
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "user-test",
      "req-premium-audit",
      expect.any(Function),
    );
    expect(crawlUrlMock).toHaveBeenCalledWith(
      "https://optimus.ai",
      expect.objectContaining({ limit: 10 }),
    );
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid URL with HTTP 400 after authenticating the request", async () => {
    const response = await post({ url: "not-a-valid-url", depth: 10 });

    expect(response.status).toBe(400);
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(crawlUrlMock).not.toHaveBeenCalled();
  });
});
