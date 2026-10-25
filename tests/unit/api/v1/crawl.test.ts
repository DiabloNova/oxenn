import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getSessionMock, submitMock, runWithTenantContextMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  submitMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
}));

vi.mock("@/services/auth/session", () => ({ getSession: getSessionMock }));
vi.mock("@/features/acquisition/application/orchestrator", () => ({
  CrawlOrchestrator: class {
    submit = submitMock;
  },
}));
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock },
}));

import { POST } from "@/app/api/v1/crawl/route";

describe("Crawl API policy bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-test", workspaceId: "tenant-test" } });
    runWithTenantContextMock.mockImplementation((...args: unknown[]) => {
      const callback = args[args.length - 1];
      return (callback as () => unknown)();
    });
    submitMock.mockResolvedValue({ job: { id: "job-test", status: "queued" }, cacheOutcome: "MISS", result: null });
  });

  async function post(policy: Record<string, unknown>) {
    return POST(new NextRequest("http://localhost/api/v1/crawl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestedUrl: "https://example.com", policy }),
    }));
  }

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
      allowedSchemes: Array.from({ length: 8 }, () => "https"),
      allowedContentTypes: Array.from({ length: 64 }, () => "t".repeat(128)),
    };
    const response = await post(policy);
    expect(response.status).toBe(202);
    expect(runWithTenantContextMock).toHaveBeenCalledWith("tenant-test", "user-test", expect.any(String), expect.any(Function));
    expect(submitMock).toHaveBeenCalledWith("tenant-test", "https://example.com", policy, 0, expect.any(String), undefined, undefined, false);
  });
});
