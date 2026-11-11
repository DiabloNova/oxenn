import * as cheerio from "cheerio";
import { convert } from "html-to-text";
import { CrawlError } from "../../domain/errors";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument
} from "../../domain/contracts";
import type { CrawlPolicy } from "../../domain/policy";
import { normalizeUrl } from "../../domain/url/normalizer";
import { safeFetch } from "../http/safe-fetcher";
import { CrawlByteBudget } from "../http/crawl-byte-budget";
import { PerHostRateLimiter } from "../http/per-host-rate-limiter";
import type { HostValidationResult, Resolver } from "../security/ssrf-guard";

interface QueueEntry {
  url: string;
  depth: number;
}

class RobotsDisallowedError extends Error {
  public constructor() {
    super("Robots policy disallows this crawl URL");
    this.name = "RobotsDisallowedError";
  }
}

function isOriginBoundaryViolation(error: unknown): error is CrawlError {
  return error instanceof CrawlError &&
    error.code === "POLICY_VIOLATION" &&
    error.details.boundary === "origin";
}

function contentType(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").split(";")[0];
}

function robotsDisallows(robots: string, path: string): boolean {
  let applies = false;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (name === "user-agent") {
      applies = value === "*" || value.toLowerCase() === "seorchable-crawler";
    } else if (applies && name === "disallow" && value && path.startsWith(value)) {
      return true;
    }
  }
  return false;
}

function linksFromHtml(html: string, baseUrl: string, allowedOrigin: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }
    try {
      const resolved = new URL(href, baseUrl);
      if ((resolved.protocol !== "http:" && resolved.protocol !== "https:") || resolved.origin !== allowedOrigin) {
        return;
      }
      const normalized = normalizeUrl(resolved.toString());
      if (normalized.ok) {
        links.add(normalized.value.canonical);
      }
    } catch {
      return;
    }
  });
  return [...links];
}

function documentFromResponse(
  requestedUrl: string,
  finalUrl: string,
  allowedOrigin: string,
  depth: number,
  response: Awaited<ReturnType<typeof safeFetch>>
): CrawledDocument {
  const html = response.body.toString("utf8");
  return {
    canonicalUrl: response.finalUrl.canonical,
    requestedUrl,
    finalUrl,
    httpStatus: response.status,
    contentType: contentType(response.headers["content-type"]),
    text: convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "nav", format: "skip" },
        { selector: "footer", format: "skip" }
      ]
    }),
    html,
    links: linksFromHtml(html, finalUrl, allowedOrigin),
    metadata: {
      title: cheerio.load(html)("title").first().text() || undefined
    },
    fetchedAt: new Date().toISOString(),
    bytes: response.body.byteLength,
    depth
  };
}

export class HttpCrawlProvider implements CrawlProvider {
  public constructor(
    private readonly fetchOptions: {
      resolver?: Resolver;
      hostValidator?: (host: string) => Promise<HostValidationResult>;
    } = {}
  ) {}
  public readonly id = "internal-http";
  public readonly capabilities = {
    supportsJavaScript: false,
    supportsRobots: true,
    supportsTraversal: true
  };

  public async execute(
    request: CrawlRequest,
    policy: CrawlPolicy,
    signal: AbortSignal
  ): Promise<CrawlResult> {
    const startedAt = Date.now();
    const queue: QueueEntry[] = [
      { url: request.normalizedUrl.canonical, depth: 0 }
    ];
    const visited = new Set<string>();
    const deferredPageLimitUrls = new Set<string>();
    const documents: CrawledDocument[] = [];
    // Robots redirects remain authoritative only for the origin that requested them.
    const robotsCache = new Map<string, Promise<string>>();
    const rateLimiter = new PerHostRateLimiter();
    let allowedOrigin = new URL(request.normalizedUrl.canonical).origin;
    const crawlErrors: CrawlError[] = [];
    // Older persisted jobs may not contain maxTotalBytes; use the platform ceiling.
    const byteBudget = new CrawlByteBudget(policy.maxTotalBytes ?? 100 * 1024 * 1024);
    const controller = new AbortController();
    const abortFromCaller = (): void => controller.abort(signal.reason);
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", abortFromCaller, { once: true });
    const crawlSignal = controller.signal;
    let durationExpired = false;
    const durationTimer = setTimeout(() => {
      durationExpired = true;
      controller.abort();
    }, policy.maxDurationMs);
    const active = new Set<Promise<CrawledDocument | null>>();

    const requestHost = (host: string): Promise<void> =>
      rateLimiter.waitForSlot(host, policy.perHostRequestsPerSecond, crawlSignal);
    const fetchOptions = {
      signal: crawlSignal,
      byteBudget,
      onBudgetExceeded: () => controller.abort(),
      ...this.fetchOptions
    };
    const getRobots = async (
      url: { canonical: string; asciiHost: string },
      isSeed: boolean
    ): Promise<string> => {
      const origin = new URL(url.canonical).origin;
      let robots = robotsCache.get(origin);
      if (!robots) {
        robots = (async () => {
          await requestHost(url.asciiHost);
          const response = await safeFetch(`${origin}/robots.txt`, {
            policy: {
              ...policy,
              maxPages: 1,
              allowedContentTypes: ["text/plain", "text/html"]
            },
            ...fetchOptions,
            ...(isSeed
              ? { allowCanonicalSeedRedirects: true }
              : { allowedOrigin }),
            beforeRedirect: target => requestHost(target.asciiHost)
          });
          return response.body.toString("utf8");
        })();
        robotsCache.set(origin, robots);
      }
      return robots;
    };
    const assertRobotsAllowed = async (
      url: { canonical: string; asciiHost: string; path: string },
      isSeed: boolean
    ): Promise<void> => {
      const robots = await getRobots(url, isSeed);
      if (robotsDisallows(robots, url.path)) throw new RobotsDisallowedError();
    };
    const processEntry = async (entry: QueueEntry): Promise<CrawledDocument | null> => {
      if (crawlSignal.aborted) {
        throw new CrawlError("CANCELLED", "Crawl was cancelled");
      }
      if (Date.now() - startedAt >= policy.maxDurationMs) {
        throw new CrawlError("TIMEOUT", "Crawl exceeded its duration limit");
      }
      const normalized = normalizeUrl(entry.url, policy.stripTrackingParams);
      if (!normalized.ok || visited.has(normalized.value.canonical)) return null;
      if (new URL(normalized.value.canonical).origin !== allowedOrigin) return null;
      visited.add(normalized.value.canonical);
      try {
        const isSeed = entry.depth === 0;
        const host = normalized.value.asciiHost;
        if (policy.robotsPolicy === "respect") {
          await assertRobotsAllowed(normalized.value, isSeed);
        }
        await requestHost(host);
        const response = await safeFetch(normalized.value.canonical, {
          policy,
          ...fetchOptions,
          ...(isSeed ? { allowCanonicalSeedRedirects: true } : { allowedOrigin }),
          beforeRedirect: async target => {
            if (policy.robotsPolicy === "respect") {
              await assertRobotsAllowed(target, isSeed);
            }
            await requestHost(target.asciiHost);
          }
        });
        if (isSeed) {
          // The exact boundary becomes the seed's final, validated URL origin.
          allowedOrigin = new URL(response.finalUrl.canonical).origin;
        }
        const document = documentFromResponse(
          isSeed ? request.normalizedUrl.canonical : normalized.value.canonical,
          response.finalUrl.canonical,
          allowedOrigin,
          entry.depth,
          response
        );
        if (Date.now() - startedAt >= policy.maxDurationMs) {
          throw new CrawlError("TIMEOUT", "Crawl exceeded its duration limit");
        }
        return document;
      } catch (error) {
        if (error instanceof RobotsDisallowedError) return null;
        if (entry.depth > 0 && isOriginBoundaryViolation(error)) {
          crawlErrors.push(new CrawlError(
            "POLICY_VIOLATION",
            "Skipped a crawl entry because it redirected outside the seed origin",
            { ...error.details, requestedUrl: normalized.value.canonical }
          ));
          return null;
        }
        throw error;
      }
    };

    try {
      while (queue.length > 0 || active.size > 0) {
        if (crawlSignal.aborted) {
          if (byteBudget.isExceeded) break;
          throw new CrawlError("CANCELLED", "Crawl was cancelled");
        }
        while (
          queue.length > 0 &&
          active.size < policy.maxConcurrency &&
          documents.length + active.size < policy.maxPages
        ) {
          const entry = queue.shift();
          if (!entry) break;
          const task = processEntry(entry);
          active.add(task);
          void task.then(
            () => active.delete(task),
            () => active.delete(task)
          );
        }
        if (active.size === 0) break;
        try {
          const document = await Promise.race(active);
          if (!document) continue;
          documents.push(document);
          if (document.depth < policy.maxDepth) {
            for (const link of document.links) {
              const normalizedLink = normalizeUrl(link, policy.stripTrackingParams);
              if (!normalizedLink.ok) continue;
              const candidateUrl = normalizedLink.value.canonical;
              if (new URL(candidateUrl).origin !== allowedOrigin || visited.has(candidateUrl)) continue;
              if (queue.some(entry => entry.url === candidateUrl)) continue;
              if (queue.length + documents.length + active.size >= policy.maxPages) {
                deferredPageLimitUrls.add(candidateUrl);
                continue;
              }
              queue.push({ url: candidateUrl, depth: document.depth + 1 });
            }
          }
        } catch (error) {
          if (!byteBudget.isExceeded) throw error;
          break;
        }
      }
    } catch (error) {
      controller.abort(error);
      await Promise.allSettled([...active]);
      if (durationExpired) {
        throw new CrawlError("TIMEOUT", "Crawl exceeded its duration limit");
      }
      throw error;
    } finally {
      clearTimeout(durationTimer);
      if (byteBudget.isExceeded) controller.abort();
      await Promise.allSettled([...active]);
      signal.removeEventListener("abort", abortFromCaller);
    }

    if (signal.aborted && !byteBudget.isExceeded) {
      throw new CrawlError("CANCELLED", "Crawl was cancelled");
    }
    const budgetError = byteBudget.isExceeded ? byteBudget.createError() : null;
    return {
      documents,
      pageCount: documents.length,
      // Includes robots and bytes received for a response that was cancelled mid-stream.
      bytesProcessed: byteBudget.bytesProcessed,
      partial: queue.length > 0 ||
        [...deferredPageLimitUrls].some(url => !visited.has(url)) ||
        crawlErrors.length > 0 ||
        Boolean(budgetError),
      durationMs: Date.now() - startedAt,
      provider: { id: this.id },
      errors: [
        ...crawlErrors,
        ...(budgetError ? [budgetError] : [])
      ]
    };
  }
}
