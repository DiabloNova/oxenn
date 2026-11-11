import FirecrawlApp from "@mendable/firecrawl-js";
import { CrawlError } from "../../../domain/errors";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument
} from "../../../domain/contracts";
import type { CrawlPolicy } from "../../../domain/policy";
import { normalizeUrl } from "../../../domain/url/normalizer";
import { resolveAndValidateHost } from "../../security/ssrf-guard";
import { isCanonicalSeedRedirect } from "../../http/safe-fetcher";

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
  total?: unknown;
  completed?: unknown;
  next?: unknown;
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

type SeedUrlResolver = (
  url: string,
  policy: CrawlPolicy,
  signal: AbortSignal
) => Promise<string>;

export class FirecrawlCrawlProvider implements CrawlProvider {
  public readonly id = "firecrawl";
  public readonly capabilities = {
    supportsJavaScript: true,
    supportsRobots: true,
    supportsTraversal: true
  };
  private readonly client: FirecrawlClient;
  private readonly seedUrlResolver: SeedUrlResolver;

  public constructor(client?: FirecrawlClient, seedUrlResolver?: SeedUrlResolver) {
    this.client = client ?? (new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY ?? ""
    }) as unknown as FirecrawlClient);
    this.seedUrlResolver = seedUrlResolver ?? (async (url, policy, signal) => {
      const normalized = normalizeUrl(url, policy.stripTrackingParams);
      if (!normalized.ok) throw normalized.error;
      if (!policy.allowedSchemes.includes(normalized.value.scheme)) {
        throw new CrawlError("POLICY_VIOLATION", "Seed URL uses a disallowed scheme");
      }
      const validation = await resolveAndValidateHost(
        normalized.value.asciiHost,
        undefined,
        signal
      );
      if (!validation.ok) throw validation.error;
      return normalized.value.canonical;
    });
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
    const maxTotalBytes = policy.maxTotalBytes ?? 100 * 1024 * 1024;
    try {
      // Use the same validated canonical seed origin as the internal HTTP provider.
      const canonicalSeedUrl = await this.seedUrlResolver(
        request.normalizedUrl.canonical,
        policy,
        controller.signal
      );
      let parsedSeedUrl: URL;
      try {
        parsedSeedUrl = new URL(canonicalSeedUrl);
      } catch {
        throw new CrawlError("INVALID_URL", "Seed URL resolver returned an invalid URL");
      }
      const seedScheme = parsedSeedUrl.protocol.slice(0, -1);
      if (!policy.allowedSchemes.includes(seedScheme)) {
        throw new CrawlError("POLICY_VIOLATION", "Resolved seed URL uses a disallowed scheme");
      }
      const originalSeed = normalizeUrl(canonicalSeedUrl, policy.stripTrackingParams);
      if (!originalSeed.ok) throw originalSeed.error;
      let seedOrigin = parsedSeedUrl.origin;
      const response = await this.client.crawlUrl(
        canonicalSeedUrl,
        {
          limit: policy.maxPages,
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

      // Firecrawl performs the page request itself. Do not issue a second direct GET
      // that could be blocked by a site's WAF or bypass its own crawl/robots handling.
      // Accept a canonical seed alias only when the first-party response stays within
      // the same host or its www-pair, with no scheme downgrade or port change.
      const canonicalSeedAlias = parsed.find(item => {
        const candidate = normalizeUrl(item.url, policy.stripTrackingParams);
        return candidate.ok &&
          new URL(candidate.value.canonical).origin !== seedOrigin &&
          isCanonicalSeedRedirect(originalSeed.value, candidate.value);
      });
      if (canonicalSeedAlias) {
        const validatedAliasUrl = await this.seedUrlResolver(
          canonicalSeedAlias.url,
          policy,
          controller.signal
        );
        const validatedAlias = normalizeUrl(validatedAliasUrl, policy.stripTrackingParams);
        if (!validatedAlias.ok || !isCanonicalSeedRedirect(originalSeed.value, validatedAlias.value)) {
          throw new CrawlError("POLICY_VIOLATION", "Firecrawl seed redirect is outside the canonical seed boundary");
        }
        if (!policy.allowedSchemes.includes(validatedAlias.value.scheme)) {
          throw new CrawlError("POLICY_VIOLATION", "Firecrawl canonical seed uses a disallowed scheme");
        }
        seedOrigin = new URL(validatedAlias.value.canonical).origin;
      }

      const reportedTotal = typeof response.total === "number" ? response.total : null;
      const reportedCompleted = typeof response.completed === "number" ? response.completed : null;
      // Hitting the configured cap is conservatively partial: the adapter cannot prove
      // that Firecrawl had no additional eligible pages to discover.
      let pageLimitReached =
        data.length >= policy.maxPages ||
        (reportedTotal !== null && reportedTotal >= policy.maxPages) ||
        (reportedCompleted !== null && reportedCompleted >= policy.maxPages) ||
        (typeof response.next === "string" && response.next.length > 0);
      for (const item of parsed.slice(0, policy.maxPages)) {
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
