import * as cheerio from "cheerio";
import { convert } from "html-to-text";
import { MAX_REDIRECT_CHAIN_DURATION_MS } from "@/core/network/crawler-redirect-policy";
import {
  CrawlerFetchError,
  fetchPublicUrl,
  parsePublicHttpUrl,
  type SafeHttpFetchOptions,
} from "./safe-http-fetch";

export interface SafeCrawledPage {
  url: string;
  markdown: string;
  metadata: { title?: string; description?: string };
}

export interface SafeSiteCrawlOptions {
  maxPages?: number;
  timeoutMs?: number;
  pageTimeoutMs?: number;
  maxTotalBytes?: number;
  maxRedirects?: number | null;
  maxRedirectDurationMs?: number;
  fetcher?: typeof fetchPublicUrl;
}

const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const DEFAULT_CRAWL_TIMEOUT_MS = 25_000;
const DEFAULT_PAGE_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

/**
 * Crawls a bounded set of same-origin pages. Every page request is made by
 * fetchPublicUrl, which pins DNS resolution and revalidates every redirect.
 * Discovered links are only queued; they are never fetched by a third-party
 * crawler or by an unguarded HTTP client.
 */
export async function crawlPublicSite(
  inputUrl: string,
  options: SafeSiteCrawlOptions = {}
): Promise<SafeCrawledPage[]> {
  const maxPages = Math.max(1, Math.min(50, Math.floor(options.maxPages ?? 10)));
  const timeoutMs = options.timeoutMs ?? DEFAULT_CRAWL_TIMEOUT_MS;
  const pageTimeoutMs = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;
  const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
  const fetcher = options.fetcher ?? fetchPublicUrl;

  if (![timeoutMs, pageTimeoutMs, maxTotalBytes].every(Number.isSafeInteger) ||
      timeoutMs <= 0 || pageTimeoutMs <= 0 || maxTotalBytes <= 0) {
    throw new Error("Safe crawler limits must be positive safe integers.");
  }

  const seed = parsePublicHttpUrl(inputUrl);
  const allowedOrigin = seed.origin;
  const queue = [seed.toString()];
  const queued = new Set(queue);
  const pages: SafeCrawledPage[] = [];
  const startedAt = Date.now();
  let totalBytes = 0;

  while (queue.length > 0 && pages.length < maxPages) {
    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs <= 0 || totalBytes >= maxTotalBytes) break;

    const pageUrl = queue.shift()!;
    const remainingBytes = maxTotalBytes - totalBytes;
    const fetchOptions: SafeHttpFetchOptions = {
      timeoutMs: Math.min(pageTimeoutMs, remainingMs),
      maxBytes: Math.min(MAX_PAGE_BYTES, remainingBytes),
      maxRedirects: options.maxRedirects === undefined ? 5 : options.maxRedirects,
      maxRedirectDurationMs: Math.min(
        options.maxRedirectDurationMs ?? MAX_REDIRECT_CHAIN_DURATION_MS,
        remainingMs
      ),
    };

    let response: Awaited<ReturnType<typeof fetchPublicUrl>>;
    try {
      response = await fetcher(pageUrl, fetchOptions);
      if (!response.ok) {
        if (pages.length === 0) {
          throw new CrawlerFetchError(`Failed to fetch the requested website (${response.status}).`);
        }
        continue;
      }

      const html = await response.text();
      totalBytes += Buffer.byteLength(html, "utf8");
      const $ = cheerio.load(html);
      const title = $("title").first().text().trim() || undefined;
      const description = $("meta[name='description']").attr("content")?.trim() ||
        $("meta[property='og:description']").attr("content")?.trim() || undefined;
      const markdown = convert(html, {
        wordwrap: false,
        selectors: [
          { selector: "script", format: "skip" },
          { selector: "style", format: "skip" },
          { selector: "nav", format: "skip" },
          { selector: "footer", format: "skip" },
        ],
      }).trim();

      pages.push({ url: response.url, markdown, metadata: { title, description } });

      $("a[href]").each((_, element) => {
        if (queue.length + pages.length >= maxPages) return;
        const href = $(element).attr("href")?.trim();
        if (!href) return;
        try {
          const discovered = parsePublicHttpUrl(new URL(href, response.url).toString());
          const normalized = discovered.toString();
          if (discovered.origin === allowedOrigin && !queued.has(normalized)) {
            queued.add(normalized);
            queue.push(normalized);
          }
        } catch {
          // Ignore malformed, non-HTTP(S), credentialed, and reserved URLs.
        }
      });
    } catch (error) {
      if (pages.length === 0) throw error;
      // A failed secondary page must not discard already safely fetched pages.
    }
  }

  if (pages.length === 0) {
    throw new Error("The requested website could not be safely crawled.");
  }
  return pages;
}
