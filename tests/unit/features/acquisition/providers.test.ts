import { describe, it, expect } from "vitest";
import { FirecrawlCrawlProvider } from "@/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";

function request(): CrawlRequest {
  const normalized = normalizeUrl("https://example.com/");
  if (!normalized.ok) throw normalized.error;
  return {
    tenantId: "a0000000-0000-4000-8000-00000000000a",
    requestedUrl: "https://example.com/",
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({ robotsPolicy: "ignore" }),
    priority: 0
  };
}

function withApiKey<T>(operation: () => Promise<T>): Promise<T> {
  const original = process.env.FIRECRAWL_API_KEY;
  process.env.FIRECRAWL_API_KEY = "test-key";
  return operation().finally(() => {
    if (original === undefined) delete process.env.FIRECRAWL_API_KEY;
    else process.env.FIRECRAWL_API_KEY = original;
  });
}

describe("FirecrawlCrawlProvider", () => {
  it("requests same-origin markdown-only crawling with bounded concurrency", async () => {
    let params: Record<string, unknown> | undefined;
    const provider = new FirecrawlCrawlProvider({
      crawlUrl: async (_url, requestParams) => {
        params = requestParams;
        return { success: true, status: "completed", data: [{ url: "https://example.com/", markdown: "hello" }] };
      }
    });
    await withApiKey(async () => {
      const crawlRequest = request();
      const result = await provider.execute(crawlRequest, crawlRequest.policy, new AbortController().signal);
      expect(result.documents[0]?.text).toBe("hello");
      expect(result.partial).toBe(false);
      expect(params).toMatchObject({
        allowExternalLinks: false,
        allowSubdomains: false,
        crawlEntireDomain: true,
        maxConcurrency: crawlRequest.policy.maxConcurrency,
        scrapeOptions: { formats: ["markdown"] }
      });
    });
  });

  it("retains no more than the aggregate budget and records returned bytes", async () => {
    let params: Record<string, unknown> | undefined;
    const provider = new FirecrawlCrawlProvider({
      crawlUrl: async (_url, requestParams) => {
        params = requestParams;
        return {
          success: true,
          status: "completed",
          data: [
            { url: "https://example.com/one", markdown: "123456" },
            { url: "https://example.com/two", markdown: "abcdef" }
          ]
        };
      }
    });
    await withApiKey(async () => {
      const crawlRequest = request();
      const policy = resolveCrawlPolicy({ robotsPolicy: "ignore", maxResponseBytes: 8, maxTotalBytes: 10 });
      const result = await provider.execute({ ...crawlRequest, policy }, policy, new AbortController().signal);
      expect(params?.limit).toBe(1);
      expect(result.partial).toBe(true);
      expect(result.documents).toHaveLength(1);
      expect(result.bytesProcessed).toBe(12);
      expect(result.errors[0]?.code).toBe("BYTE_BUDGET_EXCEEDED");
      expect(result.errors[0]?.details.bytesRetained).toBeLessThanOrEqual(10);
    });
  });

  it("does not retain Firecrawl documents outside the exact seed origin", async () => {
    const provider = new FirecrawlCrawlProvider({
      crawlUrl: async () => ({
        success: true,
        status: "completed",
        data: [
          { url: "https://example.com/inside", markdown: "inside" },
          { url: "https://other.example/outside", markdown: "outside" }
        ]
      })
    });
    await withApiKey(async () => {
      const crawlRequest = request();
      const result = await provider.execute(crawlRequest, crawlRequest.policy, new AbortController().signal);
      expect(result.documents.map(document => document.finalUrl)).toEqual(["https://example.com/inside"]);
      expect(result.errors.some(error => error.code === "POLICY_VIOLATION")).toBe(true);
      expect(result.partial).toBe(true);
    });
  });

  it("preserves provider authentication and malformed-response errors", async () => {
    await withApiKey(async () => {
      await expect(new FirecrawlCrawlProvider({
        crawlUrl: async () => ({ success: false, error: "401 Unauthorized" })
      }).execute(request(), request().policy, new AbortController().signal))
        .rejects.toSatisfy((error: unknown) => error instanceof CrawlError && error.code === "AUTHENTICATION_ERROR");
      await expect(new FirecrawlCrawlProvider({
        crawlUrl: async () => ({ success: true, data: "invalid" })
      }).execute(request(), request().policy, new AbortController().signal))
        .rejects.toSatisfy((error: unknown) => error instanceof CrawlError && error.code === "PROVIDER_ERROR");
    });
  });
});
