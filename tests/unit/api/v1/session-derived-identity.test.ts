import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getSessionMock,
  runWithTenantContextMock,
  getEffectiveSubscriptionMock,
  runCrawlerCampaignMock
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  getEffectiveSubscriptionMock: vi.fn(),
  runCrawlerCampaignMock: vi.fn()
}));

vi.mock("@/services/auth/session", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth/session")>(
    "@/services/auth/session"
  );
  return { ...actual, getSession: getSessionMock };
});
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: runWithTenantContextMock
  }
}));
vi.mock("@/features/billing/services/subscription-service", () => ({
  subscriptionService: {
    getEffectiveSubscription: getEffectiveSubscriptionMock
  }
}));
vi.mock("@/services/crawler/crawler-orchestrator", () => ({
  CrawlerOrchestrator: class {
    runCrawlerCampaign = runCrawlerCampaignMock;
  }
}));

import { POST } from "@/app/api/v1/crawler/start/route";

const session = {
  user: {
    id: "session-user",
    name: "Session User",
    email: "session@example.test",
    role: "workspace_admin",
    workspaceId: "session-tenant"
  },
  expiresAt: "2099-01-01T00:00:00.000Z",
  status: "authenticated" as const
};

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/v1/crawler/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": "attacker-tenant",
      "x-user-id": "attacker-user"
    },
    body: JSON.stringify({ seedUrls: ["https://example.com"] })
  });
}

describe("real session-derived tenant identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue(null);
    runWithTenantContextMock.mockImplementation(
      async (
        _tenantId: string,
        _userId: string,
        _requestId: string,
        callback: () => Promise<unknown>
      ) => callback()
    );
    getEffectiveSubscriptionMock.mockResolvedValue({
      effectivePlan: { id: "free" }
    });
    runCrawlerCampaignMock.mockResolvedValue({
      totalUrlsFound: 0,
      totalTextsExtracted: 0,
      totalDocumentsIngested: 0,
      details: []
    });
  });

  it("does not accept forged identity headers without a server session", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });

  it("uses session identity rather than forged headers for downstream tenant context", async () => {
    getSessionMock.mockResolvedValue(session);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "session-tenant",
      "session-user",
      expect.any(String),
      expect.any(Function)
    );
    expect(runWithTenantContextMock).not.toHaveBeenCalledWith(
      "attacker-tenant",
      "attacker-user",
      expect.any(String),
      expect.any(Function)
    );
    expect(runCrawlerCampaignMock).toHaveBeenCalledWith(
      ["https://example.com"],
      "session-tenant",
      "session-user",
      expect.any(String),
      expect.objectContaining({ maxRedirects: 5 })
    );
  });
});
