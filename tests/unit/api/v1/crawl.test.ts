import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getSessionMock, submitMock, runWithTenantContextMock, getEffectiveSubscriptionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  submitMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  getEffectiveSubscriptionMock: vi.fn(),
}));

vi.mock("@/services/auth/session", () => ({ getSession: getSessionMock }));
vi.mock("@/features/acquisition/application/orchestrator", () => ({
  CrawlOrchestrator: class {
    submit = submitMock;
  },
}));
vi.mock("@/features/billing/services/subscription-service", () => ({
  subscriptionService: { getEffectiveSubscription: getEffectiveSubscriptionMock },
}));
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock },
}));

import { POST } from "@/app/api/v1/crawl/route";

describe("Crawl API policy bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-test", workspaceId: "tenant-test" } });
    getEffectiveSubscriptionMock.mockResolvedValue({ effectivePlan: { id: "free" } });
    runWithTenantContextMock.mockImplementation((
      _tenantId: string,
      _userId: string,
      _requestId: string,
      callback: () => unknown
    ) => callback());
    submitMock.mockResolvedValue({ job: { id: "job-test", status: "queued" }, cacheOutcome: "MISS", result: null });
  });

  async function post(policy: Record<string, unknown>) {
    return POST(new NextRequest("http://localhost/api/v1/crawl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestedUrl: "https://example.com", policy }),
    }));
  }

  it("rejects forged identity headers when no real session exists", async () => {
    getSessionMock.mockResolvedValue(null);
    const response = await POST(new NextRequest("http://localhost/api/v1/crawl", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "attacker-tenant",
        "x-user-id": "attacker-user",
      },
      body: JSON.stringify({ requestedUrl: "https://example.com" }),
    }));

    expect(response.status).toBe(401);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it.each([
    ["more than eight allowed schemes", { allowedSchemes: Array.from({ length: 9 }, () => "https") }],
    ["an allowed scheme longer than 16 characters", { allowedSchemes: ["s".repeat(17)] }],
    ["more than 64 allowed content types", { allowedContentTypes: Array.from({ length: 65 }, () => "text/html") }],
    ["an allowed content type longer than 128 characters", { allowedContentTypes: ["t".repeat(129)] }],
  ])("rejects %s before submitting a crawl", async (_label, policy) => {
    const response = await post(policy);
    expect(response.status).toBe(400);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("accepts every policy field exactly at its configured limit", async () => {
    const policy = {
      allowedSchemes: ["s".repeat(16), ...Array.from({ length: 7 }, () => "https")],
      allowedContentTypes: Array.from({ length: 64 }, () => "t".repeat(128)),
      maxRedirects: 10,
    };
    const response = await post(policy);
    expect(response.status).toBe(202);
    expect(runWithTenantContextMock).toHaveBeenCalledWith("tenant-test", "user-test", expect.any(String), expect.any(Function));
    expect(submitMock).toHaveBeenCalledWith(
      "tenant-test",
      "https://example.com",
      { ...policy, maxRedirects: 5 },
      0,
      expect.any(String),
      undefined,
      undefined,
      false
    );
  });

  it("grants paid workspaces no redirect hop-count cap while retaining server-side policy", async () => {
    getEffectiveSubscriptionMock.mockResolvedValue({ effectivePlan: { id: "professional" } });
    const response = await post({ maxRedirects: 0 });
    expect(response.status).toBe(202);
    expect(submitMock).toHaveBeenCalledWith(
      "tenant-test",
      "https://example.com",
      { maxRedirects: null },
      0,
      expect.any(String),
      undefined,
      undefined,
      false
    );
  });
});
