import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  runWithTenantContextMock,
  generateTextMock,
  scrapeUrlMock,
  brandFindByOrganizationMock,
  competitorFindByDomainMock,
  competitorSaveMock,
  queryMock,
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  generateTextMock: vi.fn(),
  scrapeUrlMock: vi.fn(),
  brandFindByOrganizationMock: vi.fn(),
  competitorFindByDomainMock: vi.fn(),
  competitorSaveMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: runWithTenantContextMock,
  },
}));

vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: { scrapeUrl: scrapeUrlMock },
}));

vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: () => ({ generateText: generateTextMock }),
}));

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: {
    getInstance: () => ({ query: queryMock }),
  },
}));

vi.mock("@/features/ai-intelligence/repositories", () => ({
  BrandRepository: class {
    findByOrganizationId = brandFindByOrganizationMock;
  },
  CompetitorRepository: class {
    findByDomain = competitorFindByDomainMock;
    save = competitorSaveMock;
  },
  CompetitiveSeoFindingRepository: class {},
  VisibilityScoreRepository: class {},
  CitationIntelligenceRepository: class {},
  PromptIntelligenceRepository: class {},
  BrandIntelligenceRepository: class {},
  HistoricalMetricRepository: class {},
}));

vi.mock("@/features/ai-intelligence/services", () => ({
  CompetitiveRadarService: class {
    constructor() {
      throw new Error("Radar service is isolated from this route unit test");
    }
  },
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST } from "@/app/api/v1/analysis/competitive/route";
import type { CompetitiveAnalysisResponse } from "@/app/api/v1/analysis/competitive/route";

describe("Competitive Analysis API authorization and business flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FIRECRAWL_API_KEY", "");

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
    generateTextMock.mockRejectedValue(new Error("LLM is not part of this isolated unit test"));
    scrapeUrlMock.mockResolvedValue({ success: true, markdown: "# ignored" });
    brandFindByOrganizationMock.mockResolvedValue({ data: [] });
    competitorFindByDomainMock.mockResolvedValue(null);
    competitorSaveMock.mockResolvedValue({ id: "competitor-test" });
    queryMock.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function post(
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) {
    return POST(new NextRequest("http://localhost/api/v1/analysis/competitive", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    }));
  }

  const validBody = {
    userUrl: "https://optimus-ai-brand.ir",
    competitorUrls: ["https://competitor-alpha.com"],
    analysisDepth: "standard",
  };

  it("rejects forged identity headers when no server session is available", async () => {
    authorizeApiRequestMock.mockRejectedValueOnce(
      new AuthorizationError(401, "Unauthorized: A valid server session is required."),
    );

    const response = await post(validBody, {
      "x-user-id": "forged-user",
      "x-tenant-id": "forged-tenant",
    });

    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("Unauthorized");
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects an empty competitor list with HTTP 400 before entering tenant context", async () => {
    const response = await post({
      ...validBody,
      competitorUrls: [],
    });

    expect(response.status).toBe(400);
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("returns the competitive analysis response inside the authenticated tenant context", async () => {
    const response = await post(validBody, {
      "x-request-id": "req-competitive-test",
    });
    const payload = (await response.json()) as CompetitiveAnalysisResponse;

    expect(response.status).toBe(200);
    expect(payload.overallScore).toEqual(expect.any(Number));
    expect(payload.overallScore).toBeGreaterThanOrEqual(0);
    expect(payload.overallScore).toBeLessThanOrEqual(100);
    expect(["leader", "challenger", "follower", "niche"]).toContain(payload.marketPosition);
    expect(payload.competitorComparison).toHaveLength(1);
    expect(payload.competitorComparison[0]).toEqual(expect.objectContaining({
      competitorUrl: "https://competitor-alpha.com",
      competitorName: expect.any(String),
      winProbability: expect.any(Number),
    }));
    expect(payload.competitiveAdvantages.length).toBeGreaterThan(0);
    expect(payload.gapAnalysis.length).toBeGreaterThan(0);
    expect(payload.strategicOpportunities.length).toBeGreaterThan(0);
    expect(payload.marketInsights.totalCompetitorsAnalyzed).toBe(1);
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "user-test",
      "req-competitive-test",
      expect.any(Function),
    );
    expect(competitorSaveMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
