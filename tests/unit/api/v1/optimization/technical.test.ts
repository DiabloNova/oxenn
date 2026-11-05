import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authorizeApiRequestMock,
  runWithTenantContextMock,
  scrapeUrlMock,
  queryMock
} = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  scrapeUrlMock: vi.fn(),
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
vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: { scrapeUrl: scrapeUrlMock }
}));
vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ query: queryMock }) }
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST } from "@/app/api/v1/optimization/technical/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/v1/optimization/technical", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

describe("technical optimization API", () => {
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
    scrapeUrlMock.mockResolvedValue({
      markdown: "# Home\n## About\nContent without missing alt tags.",
      metadata: { canonical: "https://example.com/" }
    });
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  it("preserves high-score and grade behavior for a healthy HTTPS site", async () => {
    const response = await POST(makeRequest({
      url: "https://perfect.example",
      pagesToAnalyze: 2
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.technicalScore).toBeGreaterThanOrEqual(85);
    expect(body.grade).toBe("A");
    expect(body.pagesAnalyzed).toBe(2);
  });

  it("preserves low-score and Persian critical findings for HTTP and missing alt tags", async () => {
    scrapeUrlMock.mockResolvedValue({
      markdown: "### Broken heading\n![](hero.png)\n" + "متن محتوای ناقص. ".repeat(20),
      metadata: {}
    });

    const response = await POST(makeRequest({
      url: "http://poor.example",
      pagesToAnalyze: 2
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.technicalScore).toBeLessThan(80);
    expect(body.criticalIssues.some((issue: { issue: string }) => issue.issue.includes("HTTPS"))).toBe(true);
    expect(body.criticalIssues.some((issue: { issue: string }) => issue.issue.includes("alt"))).toBe(true);
    expect(body.criticalIssues.some((issue: { category: string }) => issue.category === "دسترسی‌پذیری")).toBe(true);
  });

  it("rejects invalid URL input with HTTP 400", async () => {
    const response = await POST(makeRequest({ url: "not-a-url" }));

    expect(response.status).toBe(400);
    expect(scrapeUrlMock).not.toHaveBeenCalled();
  });

  it("rejects forged tenant/user headers when no server session is available", async () => {
    authorizeApiRequestMock.mockRejectedValue(
      new AuthorizationError(401, "Unauthorized: A valid authenticated session is required.")
    );

    const response = await POST(makeRequest(
      { url: "https://example.com" },
      { "x-tenant-id": "attacker-tenant", "x-user-id": "attacker-user" }
    ));

    expect(response.status).toBe(401);
    expect(scrapeUrlMock).not.toHaveBeenCalled();
  });
});
