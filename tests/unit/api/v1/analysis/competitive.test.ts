import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  runWithTenantContextMock,
  validatePublicUrlMock,
  scrapeUrlMock,
  generateTextMock,
  queryMock,
  findBrandMock,
  findCompetitorMock,
  saveCompetitorMock
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  validatePublicUrlMock: vi.fn(),
  scrapeUrlMock: vi.fn(),
  generateTextMock: vi.fn(),
  queryMock: vi.fn(),
  findBrandMock: vi.fn(),
  findCompetitorMock: vi.fn(),
  saveCompetitorMock: vi.fn()
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
vi.mock("@/services/crawler/safe-http-fetch", () => ({
  validatePublicUrl: validatePublicUrlMock
}));
vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: { scrapeUrl: scrapeUrlMock }
}));
vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: () => ({ generateText: generateTextMock })
}));
vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ query: queryMock }) }
}));
vi.mock("@/features/ai-intelligence/repositories", () => {
  class BrandRepository {
    findByOrganizationId = findBrandMock;
  }
  class CompetitorRepository {
    findByDomain = findCompetitorMock;
    save = saveCompetitorMock;
  }
  class EmptyRepository {}
  return {
    BrandRepository,
    CompetitorRepository,
    CompetitiveSeoFindingRepository: EmptyRepository,
    VisibilityScoreRepository: EmptyRepository,
    CitationIntelligenceRepository: EmptyRepository,
    PromptIntelligenceRepository: EmptyRepository,
    BrandIntelligenceRepository: EmptyRepository,
    HistoricalMetricRepository: EmptyRepository
  };
});
vi.mock("@/features/ai-intelligence/services", () => ({
  CompetitiveRadarService: class {
    generateRadarSnapshot = vi.fn().mockResolvedValue({});
    benchmark = vi.fn().mockResolvedValue({ benchmarks: [] });
    generateInsights = vi.fn().mockResolvedValue([]);
    getCompetitiveScore = vi.fn().mockResolvedValue({});
    compareHistorical = vi.fn().mockResolvedValue({});
  }
}));

import { POST } from "@/app/api/v1/analysis/competitive/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/analysis/competitive", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("competitive analysis API", () => {
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
    validatePublicUrlMock.mockImplementation(async (url: string) =>
      url === "https://origin.example" ? "https://validated.example" : url
    );
    scrapeUrlMock.mockResolvedValue({ markdown: "# Competitor analysis content" });
    generateTextMock.mockResolvedValue(JSON.stringify({
      competitiveAdvantages: [{
        category: "سئو فنی",
        advantage: "ساختار محتوایی منسجم",
        impact: "high",
        howToLeverage: "توسعه صفحات هدف"
      }],
      gapAnalysis: [{
        category: "سرعت",
        gap: "سرعت پایین‌تر",
        severity: "warning",
        recommendedAction: "بهینه‌سازی",
        estimatedEffort: "medium"
      }],
      strategicOpportunities: [{
        opportunity: "توسعه محتوا",
        potential: "high",
        timeToImpact: "۳ ماه",
        actionPlan: "برنامه محتوایی"
      }]
    }));
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    findBrandMock.mockResolvedValue({ data: [] });
    findCompetitorMock.mockResolvedValue(null);
    saveCompetitorMock.mockImplementation(async (entry: { id: string }) => ({ id: entry.id }));
  });

  it("preserves the competitive report without bypassing the SSRF-safe fetch", async () => {
    const response = await POST(makeRequest({
      userUrl: "https://origin.example",
      competitorUrls: ["https://competitor.example"],
      analysisDepth: "standard"
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.overallScore).toBeGreaterThanOrEqual(0);
    expect(body.overallScore).toBeLessThanOrEqual(100);
    expect(["leader", "challenger", "follower", "niche"]).toContain(body.marketPosition);
    expect(body.competitorComparison).toHaveLength(1);
    expect(body.competitorComparison[0]).toEqual(expect.objectContaining({
      competitorUrl: "https://competitor.example",
      competitorName: expect.any(String),
      overallScore: expect.any(Number),
      winProbability: expect.any(Number)
    }));
    expect(body.competitiveAdvantages[0].advantage).toContain("ساختار محتوایی");
    expect(body.gapAnalysis[0].recommendedAction).toContain("بهینه‌سازی");
    expect(body.strategicOpportunities[0].actionPlan).toContain("برنامه");
    expect(validatePublicUrlMock).toHaveBeenCalledTimes(2);
    const deadlineAt = validatePublicUrlMock.mock.calls[0][1].deadlineAt;
    expect(validatePublicUrlMock.mock.calls[1][1].deadlineAt).toBe(deadlineAt);
    expect(deadlineAt).toBeGreaterThan(Date.now());
    expect(scrapeUrlMock).not.toHaveBeenCalled();
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty competitorUrls array with HTTP 400", async () => {
    const response = await POST(makeRequest({
      userUrl: "https://example.com",
      competitorUrls: []
    }));

    expect(response.status).toBe(400);
    expect(validatePublicUrlMock).not.toHaveBeenCalled();
    expect(scrapeUrlMock).not.toHaveBeenCalled();
  });

  it("returns HTTP 400 for malformed JSON", async () => {
    const request = new NextRequest("http://localhost/api/v1/analysis/competitive", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain("valid JSON");
    expect(validatePublicUrlMock).not.toHaveBeenCalled();
  });

  it("rejects an unsafe primary URL before validating competitors or invoking Firecrawl", async () => {
    validatePublicUrlMock.mockRejectedValueOnce(new Error("non-public DNS address"));

    const response = await POST(makeRequest({
      userUrl: "http://127.0.0.1",
      competitorUrls: ["https://competitor.example"]
    }));

    expect(response.status).toBe(400);
    expect(validatePublicUrlMock).toHaveBeenCalledTimes(1);
    expect(scrapeUrlMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("rejects an unsafe competitor URL before invoking Firecrawl", async () => {
    validatePublicUrlMock
      .mockResolvedValueOnce({
        url: "https://example.com",
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => null },
        text: async () => ""
      })
      .mockRejectedValueOnce(new Error("non-public DNS address"));

    const response = await POST(makeRequest({
      userUrl: "https://example.com",
      competitorUrls: ["http://127.0.0.1"]
    }));

    expect(response.status).toBe(400);
    expect(validatePublicUrlMock).toHaveBeenCalledTimes(2);
    const deadlineAt = validatePublicUrlMock.mock.calls[0][1].deadlineAt;
    expect(validatePublicUrlMock.mock.calls[1][1].deadlineAt).toBe(deadlineAt);
    expect(deadlineAt).toBeGreaterThan(Date.now());
    expect(validatePublicUrlMock).not.toHaveBeenCalled();
    expect(scrapeUrlMock).not.toHaveBeenCalled();
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
