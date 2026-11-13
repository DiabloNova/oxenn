import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getSession } from "@/services/auth/session";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { POST, type FreeAuditResponse } from "@/app/api/v1/audit/free/route";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  query: vi.fn(),
  execute: vi.fn(),
  runWithSystemContext: vi.fn()
}));

vi.mock("@/services/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: mocks.runWithSystemContext,
    getDbClient: () => ({ query: mocks.query })
  }
}));
vi.mock("@/features/acquisition/infrastructure/providers/http-crawl-provider", () => ({
  HttpCrawlProvider: class {
    execute = mocks.execute;
  }
}));

const html = `<!doctype html><html lang="en"><head>
  <title>Example company technical services and solutions for modern teams</title>
  <meta name="description" content="${"A detailed description of the services, products, and technical capabilities offered by this example company for modern enterprise teams. ".repeat(2).slice(0, 155)}">
  <meta name="robots" content="index,follow">
</head><body><h1>Example company</h1></body></html>`;

function makeRequest(url = "https://example.com/", headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/v1/audit/free", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ url })
  });
}

function crawlResult() {
  return {
    documents: [{ html, finalUrl: "https://example.com/" }],
    pageCount: 1,
    bytesProcessed: Buffer.byteLength(html),
    partial: false,
    durationMs: 35,
    provider: { id: "internal-http" },
    errors: []
  };
}

describe("Free audit API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1", workspaceId: "workspace-1" } });
    mocks.runWithSystemContext.mockImplementation(async (_userId: string, _purpose: string, work: () => Promise<unknown>) => work());
    mocks.query.mockResolvedValue({ rows: [{ attempts: 1 }] });
    mocks.execute.mockResolvedValue(crawlResult());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects anonymous requests before quota or crawling", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(mocks.runWithSystemContext).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("runs one live internal page audit for an authenticated user", async () => {
    const response = await POST(makeRequest());
    const payload = await response.json() as FreeAuditResponse;
    expect(response.status).toBe(200);
    expect(payload.mode).toBe("LIVE");
    expect(payload.scope).toBe("single-page");
    expect(payload.crawl.provider).toBe("internal-http");
    expect(payload.crawl.pages).toBe(1);
    expect(payload.score).toBeGreaterThanOrEqual(0);
    expect(payload.score).toBeLessThanOrEqual(100);
    expect(mocks.runWithSystemContext).toHaveBeenCalledWith("user-1", "sys-free-audit", expect.any(Function));
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    const endpoints = mocks.query.mock.calls.map((call) => call[1]?.[0]);
    expect(endpoints).toContain("free-audit-global");
    expect(endpoints).toContain("free-audit-user");
    expect(endpoints.indexOf("free-audit-user")).toBeLessThan(endpoints.indexOf("free-audit-global"));
  });

  it("blocks over-quota users before consuming the shared daily cap", async () => {
    mocks.query.mockImplementation(async (_sql: string, params: unknown[]) => ({
      rows: [{ attempts: params[0] === "free-audit-user" ? 4 : 1 }]
    }));
    const response = await POST(makeRequest());
    expect(response.status).toBe(429);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some((call) => call[1]?.[0] === "free-audit-global")).toBe(false);
  });

  it("rejects a repeated idempotency key before consuming another user quota slot", async () => {
    mocks.query.mockImplementation(async (_sql: string, params: unknown[]) => ({
      rows: [{ attempts: params[0] === "free-audit-idempotency" ? 2 : 1 }]
    }));
    const response = await POST(makeRequest("https://example.com/", { "idempotency-key": "same-request-key-001" }));
    expect(response.status).toBe(409);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });

  it("releases an idempotency key when the monthly quota rejects the request", async () => {
    mocks.query.mockImplementation(async (_sql: string, params: unknown[] = []) => ({
      rows: [{ attempts: params[0] === "free-audit-user" ? 4 : 1 }]
    }));
    const response = await POST(makeRequest("https://example.com/", { "idempotency-key": "retry-after-quota-001" }));
    expect(response.status).toBe(429);
    expect(mocks.query.mock.calls.some((call) => String(call[0]).startsWith("DELETE FROM auth_rate_limits") && call[1]?.[0] === "free-audit-idempotency")).toBe(true);
    expect(mocks.query.mock.calls.some((call) => call[1]?.[0] === "free-audit-global")).toBe(false);
  });
  it("applies the trusted ingress IP limit without storing the raw address", async () => {
    vi.stubEnv("VERCEL", "1");
    mocks.query.mockImplementation(async (_sql: string, params: unknown[]) => ({
      rows: [{ attempts: params[0] === "free-audit-ip" ? 11 : 1 }]
    }));
    const response = await POST(makeRequest("https://example.com/", { "x-real-ip": "203.0.113.10" }));
    expect(response.status).toBe(429);
    expect(mocks.execute).not.toHaveBeenCalled();
    const ipCall = mocks.query.mock.calls.find((call) => call[1]?.[0] === "free-audit-ip");
    expect(ipCall?.[1]?.[1]).toBe("631f08140b24b7274d12df3c37a1a80ce5876dafd7007d772e0114fddf88b682");
  });

  it("fails closed when the global daily limit is exhausted", async () => {
    mocks.query.mockImplementation(async (_sql: string, params: unknown[]) => ({
      rows: [{ attempts: params[0] === "free-audit-global" ? 501 : 1 }]
    }));
    const response = await POST(makeRequest());
    expect(response.status).toBe(503);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.query.mock.calls.some((call) => String(call[0]).includes("GREATEST(attempts - 1, 0)"))).toBe(true);
  });

  it("rejects oversized request bodies before quota reservation", async () => {
    const response = await POST(new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "5000" },
      body: JSON.stringify({ url: `https://example.com/${"a".repeat(5000)}` })
    }));
    expect(response.status).toBe(413);
    expect(mocks.runWithSystemContext).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("rejects malformed URLs before quota reservation", async () => {
    const response = await POST(makeRequest("not-a-url"));
    expect(response.status).toBe(400);
    expect(mocks.runWithSystemContext).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("does not expose crawler diagnostics when SSRF policy rejects a target", async () => {
    mocks.execute.mockRejectedValue(new CrawlError("SSRF_BLOCKED", "private address rejected", { rule: "private-rfc1918" }));
    const response = await POST(makeRequest("http://127.0.0.1/", { "idempotency-key": "retry-after-crawl-001" }));
    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.message).not.toContain("private-rfc1918");
    expect(mocks.query.mock.calls.some((call) => String(call[0]).startsWith("UPDATE auth_rate_limits"))).toBe(true);
    expect(mocks.query.mock.calls.some((call) => String(call[0]).startsWith("DELETE FROM auth_rate_limits") && call[1]?.[0] === "free-audit-idempotency")).toBe(true);
  });
  it("preserves the no-document response and attempts reservation release only once", async () => {
    mocks.execute.mockResolvedValue({ ...crawlResult(), documents: [], pageCount: 0 });
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith("UPDATE auth_rate_limits")) throw new Error("simulated release failure");
      return { rows: [{ attempts: 1 }] };
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(422);
    expect(mocks.query.mock.calls.filter((call) => String(call[0]).startsWith("UPDATE auth_rate_limits"))).toHaveLength(1);
    expect(mocks.query.mock.calls.some((call) => String(call[0]).startsWith("DELETE FROM auth_rate_limits") && call[1]?.[0] === "free-audit-idempotency")).toBe(true);
  });

  it("passes the incoming request AbortSignal to the crawler", async () => {
    const request = makeRequest();
    await POST(request);
    expect(mocks.execute.mock.calls[0]?.[2]).toBe(request.signal);
  });
});
