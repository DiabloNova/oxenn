import { describe, it, expect } from "vitest";
import { FirecrawlCrawlProvider } from "@/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";

function request(): CrawlRequest {
  const normalized = normalizeUrl("https://example.com/");
  if (!normalized.ok) {
    throw normalized.error;
  }
  return {
    tenantId: "a0000000-0000-4000-8000-00000000000a",
    requestedUrl: "https://example.com/",
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({ robotsPolicy: "ignore" }),
    priority: 0
  };
}

describe("testProviders", () => {
  it("runs", async () => {
  const provider = new FirecrawlCrawlProvider({
    crawlUrl: async () => ({
      success: true,
      status: "completed",
      data: [
        {
          url: "https://example.com/",
          markdown: "hello"
        }
      ]
    })
  });
  const originalKey = process.env.FIRECRAWL_API_KEY;
  process.env.FIRECRAWL_API_KEY = "test-key";
  try {
    const crawlRequest = request();
    const result = await provider.execute(
      crawlRequest,
      crawlRequest.policy,
      new AbortController().signal
    );
    expect(result.provider.id).toEqual("firecrawl");
    expect(result.documents[0]?.text).toEqual("hello");
    expect(result.partial).toEqual(false);
    const partial = new FirecrawlCrawlProvider({
      crawlUrl: async () => ({
        success: true,
        status: "partial",
        data: [{ url: "https://example.com/", markdown: "partial" }]
      })
    });
    expect((await partial.execute(crawlRequest, crawlRequest.policy, new AbortController().signal)).partial).toEqual(true);
    await expect(new FirecrawlCrawlProvider({
      crawlUrl: async () => ({ success: false, error: "401 Unauthorized" })
    }).execute(request(), request().policy, new AbortController().signal))
      .rejects.toSatisfy((e: unknown) => e instanceof CrawlError && e.code === "AUTHENTICATION_ERROR");
    await expect(new FirecrawlCrawlProvider({
      crawlUrl: async () => ({ success: true, data: "invalid" })
    }).execute(request(), request().policy, new AbortController().signal))
      .rejects.toSatisfy((e: unknown) => e instanceof CrawlError && e.code === "PROVIDER_ERROR");
    await expect(new FirecrawlCrawlProvider({
      crawlUrl: async () => {
        throw new Error("request timed out");
      }
    }).execute(request(), request().policy, new AbortController().signal))
      .rejects.toSatisfy((e: unknown) => e instanceof CrawlError && e.code === "TIMEOUT");
    await expect(new FirecrawlCrawlProvider({
      crawlUrl: async () => ({ success: false, error: "429 Too Many Requests" })
    }).execute(request(), request().policy, new AbortController().signal))
      .rejects.toSatisfy((e: unknown) => e instanceof CrawlError && e.code === "RATE_LIMITED");
  } finally {
    if (originalKey === undefined) {
      delete process.env.FIRECRAWL_API_KEY;
    } else {
      process.env.FIRECRAWL_API_KEY = originalKey;
    }
  }
  });
});
