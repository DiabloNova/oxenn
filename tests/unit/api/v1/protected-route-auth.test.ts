import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getSessionMock,
  requireSessionMock,
  runWithTenantContextMock,
  chunkTextMock,
  analyzeSentimentMock,
  scrapeUrlMock,
  crawlUrlMock,
  generateTextMock,
  getLLMClientMock,
  postgresGetInstanceMock,
  postgresQueryMock,
  executeAuditMock,
  crawlerCampaignMock,
  dashboardSummaryMock,
  documentIngestMock,
  answerQuestionMock,
  repositoryConstructorMock,
  crawlJobRepositoryConstructorMock,
  crawlJobGetByIdMock,
  crawlJobCancelMock,
  entityServiceConstructorMock,
  getEntityByNameMock,
  getNeighborhoodMock,
  projectNeighborhoodMock,
} = vi.hoisted(() => {
  const mocks = {
    getSessionMock: vi.fn(),
    requireSessionMock: vi.fn(),
    runWithTenantContextMock: vi.fn(),
    chunkTextMock: vi.fn(),
    analyzeSentimentMock: vi.fn(),
    scrapeUrlMock: vi.fn(),
    crawlUrlMock: vi.fn(),
    generateTextMock: vi.fn(),
    getLLMClientMock: vi.fn(),
    postgresGetInstanceMock: vi.fn(),
    postgresQueryMock: vi.fn(),
    executeAuditMock: vi.fn(),
    crawlerCampaignMock: vi.fn(),
    dashboardSummaryMock: vi.fn(),
    documentIngestMock: vi.fn(),
    answerQuestionMock: vi.fn(),
    repositoryConstructorMock: vi.fn(),
    crawlJobRepositoryConstructorMock: vi.fn(),
    crawlJobGetByIdMock: vi.fn(),
    crawlJobCancelMock: vi.fn(),
    entityServiceConstructorMock: vi.fn(),
    getEntityByNameMock: vi.fn(),
    getNeighborhoodMock: vi.fn(),
    projectNeighborhoodMock: vi.fn(),
  };
  mocks.postgresGetInstanceMock.mockReturnValue({ query: mocks.postgresQueryMock });
  mocks.getLLMClientMock.mockReturnValue({ generateText: mocks.generateTextMock });
  return mocks;
});

vi.mock("@/services/auth/session", () => ({
  getSession: getSessionMock,
  requireSession: requireSessionMock,
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: runWithTenantContextMock,
    runWithSystemContext: vi.fn(),
    getDbClient: vi.fn(),
  },
}));

vi.mock("@/services/ai/text-chunker", () => ({
  chunkText: chunkTextMock,
}));

vi.mock("@/services/ai/sentiment-analysis", () => ({
  analyzeSentiment: analyzeSentimentMock,
}));

vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: {
    scrapeUrl: scrapeUrlMock,
    crawlUrl: crawlUrlMock,
  },
}));

vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: getLLMClientMock,
}));

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: {
    getInstance: postgresGetInstanceMock,
  },
}));

vi.mock("@/lib/audit-engine/builder", () => ({
  executeAudit: executeAuditMock,
}));

vi.mock("@/services/crawler/crawler-orchestrator", () => ({
  CrawlerOrchestrator: class {
    runCrawlerCampaign = crawlerCampaignMock;
  },
}));

vi.mock("@/services/dashboard-home", () => ({
  dashboardHomeService: {
    getDashboardSummary: dashboardSummaryMock,
  },
}));

vi.mock("@/features/ai-intelligence/repositories", () => ({
  CompetitorRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  CompetitiveSeoFindingRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  VisibilityScoreRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  CitationIntelligenceRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  PromptIntelligenceRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  BrandIntelligenceRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  HistoricalMetricRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
  BrandRepository: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
}));

vi.mock("@/features/ai-intelligence/services", () => ({
  CompetitiveRadarService: class {
    constructor() {
      repositoryConstructorMock();
    }
  },
}));

vi.mock("@/features/acquisition/application/orchestrator", () => ({
  CrawlOrchestrator: class {
    submit = vi.fn();
  },
}));

vi.mock("@/features/acquisition/infrastructure/persistence/postgres", () => ({
  CrawlJobRepository: class {
    constructor() {
      crawlJobRepositoryConstructorMock();
    }
    getById = crawlJobGetByIdMock;
    cancel = crawlJobCancelMock;
  },
}));

vi.mock("@/services/ingestion/document-ingestion", () => ({
  DocumentIngestionService: class {
    ingestDocument = documentIngestMock;
  },
}));

vi.mock("@/features/ai-intelligence/services/entity-service", () => ({
  EntityService: class {
    constructor() {
      entityServiceConstructorMock();
    }
    getEntityByName = getEntityByNameMock;
    getNeighborhood = getNeighborhoodMock;
  },
  projectNeighborhoodForVisualization: projectNeighborhoodMock,
}));

vi.mock("@/services/rag/query-service", () => ({
  answerQuestion: answerQuestionMock,
}));

import { POST as chunkPost } from "@/app/api/v1/ai/chunk/route";
import { POST as sentimentPost } from "@/app/api/v1/ai/sentiment/route";
import { POST as competitivePost } from "@/app/api/v1/analysis/competitive/route";
import { POST as llmAnalyticsPost } from "@/app/api/v1/analytics/llm/route";
import { GET as analyticsSummaryGet } from "@/app/api/v1/analytics/summary/route";
import { POST as aeoInsightPost } from "@/app/api/v1/audit/aeo-insight/route";
import { POST as auditEnginePost } from "@/app/api/v1/audit/engine/route";
import { POST as premiumAuditPost } from "@/app/api/v1/audit/premium/route";
import { POST as contentStudioPost } from "@/app/api/v1/content/studio/route";
import { POST as crawlerStartPost } from "@/app/api/v1/crawler/start/route";
import { GET as dashboardSummaryGet } from "@/app/api/v1/dashboard/summary/route";
import { POST as technicalOptimizationPost } from "@/app/api/v1/optimization/technical/route";
import {
  POST as crawlPost,
  GET as crawlGet,
  DELETE as crawlDelete,
} from "@/app/api/v1/crawl/route";
import { POST as ingestDocumentPost } from "@/app/api/v1/ingest/document/route";
import { POST as knowledgeGraphPost } from "@/app/api/v1/knowledge-graph/query/route";
import { POST as ragQueryPost } from "@/app/api/v1/rag/query/route";

function postRequest(path: string, body: unknown): NextRequest {
  return new NextRequest("http://localhost" + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-id": "forged-user",
      "x-tenant-id": "forged-tenant",
      authorization: "Bearer seo_test_api_key",
    },
    body: JSON.stringify(body),
  });
}

function getRequest(path: string): NextRequest {
  return new NextRequest("http://localhost" + path, {
    headers: {
      "x-user-id": "forged-user",
      "x-tenant-id": "forged-tenant",
      authorization: "Bearer seo_test_api_key",
    },
  });
}

const downstreamMocks = [
  runWithTenantContextMock,
  chunkTextMock,
  analyzeSentimentMock,
  scrapeUrlMock,
  crawlUrlMock,
  generateTextMock,
  getLLMClientMock,
  postgresGetInstanceMock,
  postgresQueryMock,
  executeAuditMock,
  crawlerCampaignMock,
  dashboardSummaryMock,
  documentIngestMock,
  answerQuestionMock,
  repositoryConstructorMock,
  crawlJobRepositoryConstructorMock,
  crawlJobGetByIdMock,
  crawlJobCancelMock,
  entityServiceConstructorMock,
  getEntityByNameMock,
  getNeighborhoodMock,
  projectNeighborhoodMock,
];

const protectedRouteCases: Array<[string, () => Promise<Response>]> = [
  ["POST /api/v1/ai/chunk", () => chunkPost(postRequest("/api/v1/ai/chunk", { text: "sample" }))],
  ["POST /api/v1/ai/sentiment", () => sentimentPost(postRequest("/api/v1/ai/sentiment", { text: "sample" }))],
  [
    "POST /api/v1/analysis/competitive",
    () =>
      competitivePost(
        postRequest("/api/v1/analysis/competitive", {
          userUrl: "https://example.com",
          competitorUrls: ["https://competitor.example"],
        }),
      ),
  ],
  [
    "POST /api/v1/analytics/llm",
    () =>
      llmAnalyticsPost(
        postRequest("/api/v1/analytics/llm", {
          brandName: "Example",
          competitorNames: ["Competitor"],
          queries: ["Which brand is best?"],
        }),
      ),
  ],
  ["GET /api/v1/analytics/summary", () => analyticsSummaryGet(getRequest("/api/v1/analytics/summary"))],
  [
    "POST /api/v1/audit/aeo-insight",
    () => aeoInsightPost(postRequest("/api/v1/audit/aeo-insight", { targetBrandOrEntity: "Example" })),
  ],
  ["POST /api/v1/audit/engine", () => auditEnginePost(postRequest("/api/v1/audit/engine", { url: "https://example.com" }))],
  [
    "POST /api/v1/audit/premium",
    () => premiumAuditPost(postRequest("/api/v1/audit/premium", { url: "https://example.com", depth: 5 })),
  ],
  [
    "POST /api/v1/content/studio",
    () => contentStudioPost(postRequest("/api/v1/content/studio", { url: "https://example.com" })),
  ],
  [
    "POST /api/v1/crawler/start",
    () => crawlerStartPost(postRequest("/api/v1/crawler/start", { seedUrls: ["https://example.com"] })),
  ],
  ["GET /api/v1/dashboard/summary", () => dashboardSummaryGet(getRequest("/api/v1/dashboard/summary"))],
  [
    "POST /api/v1/optimization/technical",
    () =>
      technicalOptimizationPost(
        postRequest("/api/v1/optimization/technical", { url: "https://example.com" }),
      ),
  ],
  [
    "POST /api/v1/ingest/document",
    () => ingestDocumentPost(postRequest("/api/v1/ingest/document", { text: "document text" })),
  ],
  [
    "POST /api/v1/knowledge-graph/query",
    () => knowledgeGraphPost(postRequest("/api/v1/knowledge-graph/query", { entityName: "Example" })),
  ],
  ["POST /api/v1/rag/query", () => ragQueryPost(postRequest("/api/v1/rag/query", { question: "What is this?" }))],
];

describe("Protected API route session boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue(null);
    requireSessionMock.mockRejectedValue(
      new Error("Unauthorized: Active session is missing, invalid or expired."),
    );
  });

  it.each(protectedRouteCases)(
    "%s rejects a request without a server session, even with forged identity headers and a Bearer token",
    async (_name, invoke) => {
      const response = await invoke();

      expect(response.status).toBe(401);
      for (const downstreamMock of downstreamMocks) {
        expect(downstreamMock).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    ["POST", () => crawlPost(postRequest("/api/v1/crawl", { requestedUrl: "https://example.com" }))],
    ["GET", () => crawlGet(getRequest("/api/v1/crawl?jobId=job-test"))],
    ["DELETE", () => crawlDelete(getRequest("/api/v1/crawl?jobId=job-test"))],
  ])(
    "%s /api/v1/crawl rejects a request without a server session before touching crawl services",
    async (_method, invoke) => {
      const response = await invoke();

      expect(response.status).toBe(401);
      expect(runWithTenantContextMock).not.toHaveBeenCalled();
      expect(crawlJobRepositoryConstructorMock).not.toHaveBeenCalled();
      expect(crawlJobGetByIdMock).not.toHaveBeenCalled();
      expect(crawlJobCancelMock).not.toHaveBeenCalled();
    },
  );
});
