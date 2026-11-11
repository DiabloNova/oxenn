import FirecrawlApp from "@mendable/firecrawl-js";
import { CrawlError } from "../../../domain/errors";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument
} from "../../../domain/contracts";
import type { CrawlPolicy } from "../../../domain/policy";

interface FirecrawlClient {
  crawlUrl(
    url: string,
    params?: Record<string, unknown>,
    pollInterval?: number,
    signal?: AbortSignal
  ): Promise<unknown>;
}

interface FirecrawlDocument {
  url?: unknown;
  markdown?: unknown;
  html?: unknown;
}

interface FirecrawlResponse {
  id?: unknown;
  success?: unknown;
  status?: unknown;
  data?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapProviderError(error: unknown): CrawlError {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string" ? error : "Firecrawl request failed";
  const status = message.match(/\b(401|403|429|5\d\d)\b/)?.[1];
  if (status === "401" || status === "403") {
    return new CrawlError("AUTHENTICATION_ERROR", "Firecrawl authentication failed");
  }
  if (status === "429") return new CrawlError("RATE_LIMITED", "Firecrawl rate limit reached");
  if (/timeout|timed out/i.test(message)) return new CrawlError("TIMEOUT", "Firecrawl request timed out");
  return new CrawlError("PROVIDER_ERROR", "Firecrawl request failed", { transient: true });
}

function readDocument(value: unknown): { url: string; text: string; contentType: string; bytes: number } {
  if (!isRecord(value)) throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned malformed data");
  const item = value as FirecrawlDocument;
  const url = typeof item.url === "string" ? item.url : "";
  const markdown = typeof item.markdown === "string" ? item.markdown : "";
  const html = typeof item.html === "string" ? item.html : "";
  const text = markdown || html;
  if (!url || !text) throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned an incomplete document");
  try {
    new URL(url);
  } catch {
    throw new CrawlError("INVALID_URL", "Firecrawl returned an invalid document URL");
  }
  return {
    url,
    text,
    contentType: markdown ? "text/markdown" : "text/html",
    bytes: Buffer.byteLength(text)
  };
}

export class FirecrawlCrawlProvider implements CrawlProvider {
  public readonly id = "firecrawl";
  public readonly capabilities = {
    supportsJavaScript: true,
    supportsRobots: true,
    supportsTraversal: true
  };
  private readonly client: FirecrawlClient;

  public constructor(client?: FirecrawlClient) {
    this.client = client ?? (new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY ?? ""
    }) as unknown as FirecrawlClient);
  }

  public get isConfigured(): boolean {
    return Boolean(process.env.FIRECRAWL_API_KEY);
  }

  public async execute(
    request: CrawlRequest,
    policy: CrawlPolicy,
    signal: AbortSignal
  ): Promise<CrawlResult> {
    if (!this.isConfigured) throw new CrawlError("CONFIGURATION_ERROR", "Firecrawl is not configured");
    if (signal.aborted) throw new CrawlError("CANCELLED", "Crawl was cancelled");
    const startedAt = Date.now();
    const controller = new AbortController();
    const abortFromCaller = (): void => controller.abort(signal.reason);
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", abortFromCaller, { once: true });
    let durationExpired = false;
    const durationTimer = setTimeout(() => {
      durationExpired = true;
      controller.abort();
    }, policy.maxDurationMs);
    const seedOrigin = new URL(request.normalizedUrl.canonical).origin;
    const maxTotalBytes = policy.maxTotalBytes ?? 100 * 1024 * 1024;
    // Without a provider-side byte cap, constrain worst-case page count by the per-page ceiling.
    const providerPageLimit = Math.min(
      policy.maxPages,
      Math.max(1, Math.floor(maxTotalBytes / policy.maxResponseBytes))
    );
    try {
      const response = await this.client.crawlUrl(
        request.normalizedUrl.canonical,
        {
          limit: providerPageLimit,
          maxDiscoveryDepth: policy.maxDepth,
          crawlEntireDomain: true,
          // Firecrawl exposes domain-level scope controls; exact URL.origin is checked on every result below.
          // The upstream service may already have fetched an off-origin URL before this adapter can reject it.
          allowSubdomains: false,
          allowExternalLinks: false,
          maxConcurrency: policy.maxConcurrency,
          scrapeOptions: { formats: ["markdown"] }
        },
        2,
        controller.signal
      ) as FirecrawlResponse;
      if (controller.signal.aborted) {
        throw new CrawlError(durationExpired ? "TIMEOUT" : "CANCELLED", "Firecrawl crawl was interrupted");
      }
      if (!isRecord(response)) throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned malformed data");
      if (response.success === false || response.error) throw mapProviderError(response.error);
      const data = Array.isArray(response.data) ? response.data : [];
      if (!data.length) throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned no documents");

      const parsed: ReturnType<typeof readDocument>[] = [];
      let observedBytes = 0;
      for (const value of data) {
        if (Date.now() - startedAt >= policy.maxDurationMs) {
          throw new CrawlError("TIMEOUT", "Firecrawl result processing exceeded its duration limit");
        }
        const item = readDocument(value);
        parsed.push(item);
        observedBytes += item.bytes;
      }
      const documents: CrawledDocument[] = [];
      const errors: CrawlError[] = [];
      let retainedBytes = 0;
      let pageLimitReached = data.length > providerPageLimit;
      for (const item of parsed.slice(0, providerPageLimit)) {
        if (Date.now() - startedAt >= policy.maxDurationMs) {
          throw new CrawlError("TIMEOUT", "Firecrawl result processing exceeded its duration limit");
        }
        if (new URL(item.url).origin !== seedOrigin) {
          errors.push(new CrawlError("POLICY_VIOLATION", "Firecrawl returned a document outside the seed origin", {
            documentOrigin: new URL(item.url).origin
          }));
          pageLimitReached = true;
          continue;
        }
        if (item.bytes > policy.maxResponseBytes) {
          errors.push(new CrawlError("RESPONSE_TOO_LARGE", "Firecrawl document exceeded the per-response limit", {
            maxResponseBytes: policy.maxResponseBytes,
            documentBytes: item.bytes
          }));
          pageLimitReached = true;
          continue;
        }
        if (item.bytes > maxTotalBytes - retainedBytes) {
          pageLimitReached = true;
          continue;
        }
        documents.push({
          canonicalUrl: item.url,
          requestedUrl: item.url,
          finalUrl: item.url,
          httpStatus: 200,
          contentType: item.contentType,
          text: item.text,
          links: [],
          metadata: {},
          fetchedAt: new Date().toISOString(),
          bytes: item.bytes,
          depth: documents.length
        });
        retainedBytes += item.bytes;
      }
      if (observedBytes > maxTotalBytes) {
        errors.push(new CrawlError("BYTE_BUDGET_EXCEEDED", "Firecrawl output exceeded the aggregate response byte budget", {
          maxTotalBytes,
          bytesProcessed: observedBytes,
          bytesRetained: retainedBytes
        }));
        pageLimitReached = true;
      }
      return {
        documents,
        pageCount: documents.length,
        // The provider response has already been downloaded; this reports all observed text bytes,
        // while documents retained by this adapter remain within the configured limits.
        bytesProcessed: observedBytes,
        partial: response.status === "partial" || pageLimitReached || errors.length > 0,
        durationMs: Date.now() - startedAt,
        provider: {
          id: this.id,
          jobId: typeof response.id === "string" ? response.id : undefined
        },
        errors
      };
    } catch (error) {
      if (durationExpired) throw new CrawlError("TIMEOUT", "Firecrawl crawl exceeded its duration limit");
      if (signal.aborted) throw new CrawlError("CANCELLED", "Crawl was cancelled");
      if (error instanceof CrawlError) throw error;
      throw mapProviderError(error);
    } finally {
      clearTimeout(durationTimer);
      signal.removeEventListener("abort", abortFromCaller);
    }
  }
}
