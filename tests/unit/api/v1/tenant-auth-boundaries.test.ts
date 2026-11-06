import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn()
}));

vi.mock("@/services/auth/session", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth/session")>(
    "@/services/auth/session"
  );
  return { ...actual, getSession: getSessionMock };
});

import { POST as postChunk } from "@/app/api/v1/ai/chunk/route";
import { POST as postCompetitiveAnalysis } from "@/app/api/v1/analysis/competitive/route";
import { POST as postLlmAnalytics } from "@/app/api/v1/analytics/llm/route";
import { POST as postCrawlerStart } from "@/app/api/v1/crawler/start/route";
import { POST as postTechnicalOptimization } from "@/app/api/v1/optimization/technical/route";
import { POST as postSentiment } from "@/app/api/v1/ai/sentiment/route";
import { GET as getAnalyticsSummary } from "@/app/api/v1/analytics/summary/route";
import { POST as postAeoInsight } from "@/app/api/v1/audit/aeo-insight/route";
import { POST as postAuditEngine } from "@/app/api/v1/audit/engine/route";
import { POST as postPremiumAudit } from "@/app/api/v1/audit/premium/route";
import { POST as postContentStudio } from "@/app/api/v1/content/studio/route";
import { GET as getDashboardSummary } from "@/app/api/v1/dashboard/summary/route";
import { POST as postDocumentIngestion } from "@/app/api/v1/ingest/document/route";
import { POST as postKnowledgeGraphQuery } from "@/app/api/v1/knowledge-graph/query/route";
import { POST as postRagQuery } from "@/app/api/v1/rag/query/route";

type Handler = (request: NextRequest) => Promise<Response>;

const protectedRoutes: Array<{ name: string; invoke: Handler }> = [
  { name: "AI text chunking", invoke: postChunk },
  { name: "competitive analysis", invoke: postCompetitiveAnalysis },
  { name: "LLM analytics", invoke: postLlmAnalytics },
  { name: "crawler campaign start", invoke: postCrawlerStart },
  { name: "technical optimization", invoke: postTechnicalOptimization },
  { name: "AI sentiment", invoke: postSentiment },
  { name: "analytics summary", invoke: getAnalyticsSummary },
  { name: "AEO insight audit", invoke: postAeoInsight },
  { name: "audit engine", invoke: postAuditEngine },
  { name: "premium audit", invoke: postPremiumAudit },
  { name: "content studio", invoke: postContentStudio },
  { name: "dashboard summary", invoke: getDashboardSummary },
  { name: "document ingestion", invoke: postDocumentIngestion },
  { name: "knowledge graph query", invoke: postKnowledgeGraphQuery },
  { name: "RAG query", invoke: postRagQuery }
];

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/v1/security-boundary", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "attacker-tenant",
      "x-user-id": "attacker-user"
    },
    body: JSON.stringify({
      text: "test",
      targetBrandOrEntity: "Example",
      url: "https://example.com"
    })
  });
}

describe("tenant-scoped API authentication boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue(null);
  });

  it.each(protectedRoutes)(
    "rejects forged identity headers through the real session authorization path on $name",
    async ({ invoke }) => {
      const response = await invoke(makeRequest());

      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ error: "Unauthorized" });
      expect(getSessionMock).toHaveBeenCalled();
    }
  );
});
