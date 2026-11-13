import { describe, expect, it, vi } from "vitest";
import { HttpCrawlProvider } from "@/features/acquisition/infrastructure/providers/http-crawl-provider";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";

const mocks = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock("@/features/acquisition/infrastructure/http/safe-fetcher", () => ({ safeFetch: mocks.safeFetch }));

const html = "<!doctype html><html><head><title>Example</title></head><body><h1>Example</h1></body></html>";

function makePolicy() {
  return resolveCrawlPolicy({
    maxPages: 1,
    maxDepth: 0,
    maxDurationMs: 5000,
    maxResponseBytes: 1024 * 1024,
    maxTotalBytes: 1024 * 1024,
    maxRedirects: 2,
    maxConcurrency: 1,
    requestTimeoutMs: 1000,
    connectTimeoutMs: 1000,
    maxAttempts: 1,
    retryBaseDelayMs: 0,
    retryMaxDelayMs: 0,
    allowedSchemes: ["http", "https"],
    allowedContentTypes: ["text/html", "application/xhtml+xml"],
    robotsPolicy: "respect",
    perHostRequestsPerSecond: 100,
    stripTrackingParams: true,
    cacheTtlMs: 0,
    followRedirects: true
  });
}

function makeRequest(policy: ReturnType<typeof makePolicy>): CrawlRequest {
  const normalized = normalizeUrl("https://example.com/", true);
  if (!normalized.ok) throw new Error("Test URL failed normalization");
  return {
    tenantId: "tenant-1",
    requestedUrl: "https://example.com/",
    normalizedUrl: normalized.value,
    policy,
    priority: 0,
    correlationId: "robots-404-test"
  };
}

function pageResponse() {
  return {
    body: Buffer.from(html),
    finalUrl: { canonical: "https://example.com/", asciiHost: "example.com", path: "/" },
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" }
  };
}

describe("HttpCrawlProvider robots handling", () => {
  it("continues with a seed page when robots.txt returns 404", async () => {
    mocks.safeFetch.mockReset();
    mocks.safeFetch
      .mockRejectedValueOnce(new CrawlError("HTTP_ERROR", "robots file not found", { status: 404 }))
      .mockResolvedValueOnce(pageResponse());
    const policy = makePolicy();
    const result = await new HttpCrawlProvider().execute(makeRequest(policy), policy, new AbortController().signal);
    expect(result.pageCount).toBe(1);
    expect(result.documents[0]?.finalUrl).toBe("https://example.com/");
    expect(mocks.safeFetch).toHaveBeenCalledTimes(2);
  });

  it("fails closed when robots.txt returns a server error", async () => {
    mocks.safeFetch.mockReset();
    mocks.safeFetch.mockRejectedValueOnce(new CrawlError("HTTP_ERROR", "robots service unavailable", { status: 503 }));
    const policy = makePolicy();
    await expect(
      new HttpCrawlProvider().execute(makeRequest(policy), policy, new AbortController().signal)
    ).rejects.toMatchObject({ code: "HTTP_ERROR", details: { status: 503 } });
    expect(mocks.safeFetch).toHaveBeenCalledTimes(1);
  });
});
