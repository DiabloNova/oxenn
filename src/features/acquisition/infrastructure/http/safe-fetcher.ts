import {
  request as httpRequest,
  type IncomingMessage,
  type RequestOptions
} from "node:http";
import { request as httpsRequest } from "node:https";
import { CrawlError } from "../../domain/errors";
import { MAX_REDIRECT_CHAIN_DURATION_MS } from "@/core/network/crawler-redirect-policy";
import type { CrawlPolicy } from "../../domain/policy";
import {
  normalizeUrl,
  type NormalizedUrl
} from "../../domain/url/normalizer";
import {
  resolveAndValidateHost,
  type HostValidationResult,
  type Resolver
} from "../security/ssrf-guard";

export interface SafeFetcherResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
  finalUrl: NormalizedUrl;
  redirects: number;
}

const DNS_TIMEOUT_MS = 10_000;

export interface SafeFetcherOptions {
  policy: CrawlPolicy;
  signal?: AbortSignal;
  resolver?: Resolver;
  hostValidator?: (
    host: string,
    signal?: AbortSignal
  ) => Promise<HostValidationResult>;
}

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  error: CrawlError,
  onTimeout?: () => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(error);
    }, timeoutMs);
    operation.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      cause => {
        clearTimeout(timer);
        reject(cause);
      }
    );
  });
}

function contentLength(headers: IncomingMessage["headers"]): number | null {
  const raw = headers["content-length"];
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function contentType(headers: IncomingMessage["headers"]): string {
  return (headers["content-type"]?.split(";")[0] ?? "").toLowerCase();
}

function contentEncoding(headers: IncomingMessage["headers"]): string {
  return (headers["content-encoding"] ?? "").toString().toLowerCase();
}

export async function safeFetch(
  input: string,
  options: SafeFetcherOptions
): Promise<SafeFetcherResponse> {
  const startedAt = Date.now();
  let current = normalizeUrl(input, options.policy.stripTrackingParams);

  if (!current.ok) {
    throw current.error;
  }
  if (!options.policy.allowedSchemes.includes(current.value.scheme)) {
    throw new CrawlError(
      "POLICY_VIOLATION",
      "URL scheme is not allowed by crawl policy"
    );
  }

  const visited = new Set<string>();
  let redirects = 0;
  // Older persisted crawl jobs may not contain this field; treat them as Free.
  const maxRedirects = options.policy.maxRedirects === undefined
    ? 5
    : options.policy.maxRedirects;
  let redirectChainStartedAt: number | null = null;
  while (true) {
    if (Date.now() - startedAt >= options.policy.maxDurationMs) {
      throw new CrawlError("TIMEOUT", "Crawl request exceeded its deadline");
    }
    if (visited.has(current.value.canonical)) {
      throw new CrawlError("REDIRECT_LIMIT", "Redirect loop detected");
    }
    visited.add(current.value.canonical);

    const remaining = options.policy.maxDurationMs - (Date.now() - startedAt);
    const redirectRemaining = redirectChainStartedAt === null
      ? remaining
      : MAX_REDIRECT_CHAIN_DURATION_MS - (Date.now() - redirectChainStartedAt);
    const hopBudget = Math.min(remaining, redirectRemaining);
    if (hopBudget <= 0) {
      throw new CrawlError("TIMEOUT", "Crawl or redirect chain exceeded its time budget");
    }
    if (options.signal?.aborted) {
      throw new CrawlError("CANCELLED", "Request cancelled");
    }
    const validationController = new AbortController();
    const abortValidation = () => validationController.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", abortValidation, { once: true });
    let validation: HostValidationResult;
    try {
      validation = await withTimeout(
        options.hostValidator
          ? options.hostValidator(current.value.asciiHost, validationController.signal)
          : resolveAndValidateHost(
              current.value.asciiHost,
              options.resolver,
              validationController.signal
            ),
        Math.min(DNS_TIMEOUT_MS, hopBudget),
        new CrawlError("TIMEOUT", "DNS lookup timed out"),
        () => validationController.abort()
      );
    } catch (error) {
      if (options.signal?.aborted) {
        throw new CrawlError("CANCELLED", "Request cancelled");
      }
      throw error;
    } finally {
      options.signal?.removeEventListener("abort", abortValidation);
    }
    if (!validation.ok) {
      throw validation.error;
    }

    const afterDnsRemaining = options.policy.maxDurationMs - (Date.now() - startedAt);
    const afterDnsRedirectRemaining = redirectChainStartedAt === null
      ? afterDnsRemaining
      : MAX_REDIRECT_CHAIN_DURATION_MS - (Date.now() - redirectChainStartedAt);
    const requestBudget = Math.min(afterDnsRemaining, afterDnsRedirectRemaining);
    if (requestBudget <= 0) {
      throw new CrawlError("TIMEOUT", "Crawl or redirect chain exceeded its time budget");
    }
    const response = await requestOnce(
      current.value,
      validation.ips,
      options,
      requestBudget
    );

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      if (
        !options.policy.followRedirects ||
        (maxRedirects !== null && redirects >= maxRedirects)
      ) {
        throw new CrawlError("REDIRECT_LIMIT", "Redirect limit exceeded", {
          redirects
        });
      }
      if (redirectChainStartedAt === null) {
        redirectChainStartedAt = Date.now();
      } else if (Date.now() - redirectChainStartedAt >= MAX_REDIRECT_CHAIN_DURATION_MS) {
        throw new CrawlError("TIMEOUT", "Redirect chain exceeded its time budget");
      }
      const location = Array.isArray(response.headers.location)
        ? response.headers.location[0]
        : response.headers.location;
      if (!location) {
        throw new CrawlError("REDIRECT_LIMIT", "Redirect location is empty");
      }
      const normalized = normalizeUrl(
        new URL(location, current.value.canonical).toString(),
        options.policy.stripTrackingParams
      );
      if (!normalized.ok) {
        throw normalized.error;
      }
      if (!options.policy.allowedSchemes.includes(normalized.value.scheme)) {
        throw new CrawlError(
          "POLICY_VIOLATION",
          "Redirect scheme is not allowed by crawl policy"
        );
      }
      current = normalized;
      redirects += 1;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new CrawlError(
        "HTTP_ERROR",
        "HTTP request returned an error status",
        { status: response.status }
      );
    }
    const encoding = contentEncoding(response.headers);
    if (encoding && encoding !== "identity") {
      throw new CrawlError(
        "CONTENT_TYPE_UNSUPPORTED",
        "Compressed response encoding is not supported"
      );
    }
    const type = contentType(response.headers);
    if (
      !options.policy.allowedContentTypes.some(
        allowed => type === allowed.toLowerCase()
      )
    ) {
      throw new CrawlError(
        "CONTENT_TYPE_UNSUPPORTED",
        "Response content type is not allowed",
        { contentType: type }
      );
    }
    return {
      ...response,
      finalUrl: current.value,
      redirects
    };
  }
}

function requestOnce(
  url: NormalizedUrl,
  ips: string[],
  options: SafeFetcherOptions,
  deadlineMs: number
): Promise<Omit<SafeFetcherResponse, "finalUrl" | "redirects">> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let received = 0;
    const chunks: Buffer[] = [];
    const transport = url.scheme === "https" ? httpsRequest : httpRequest;
    let abortHandler: (() => void) | undefined;
    const request = transport(
      {
        hostname: url.asciiHost,
        port: url.port ?? undefined,
        path: `${url.path}${url.query ? `?${url.query}` : ""}`,
        method: "GET",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "identity",
          "User-Agent": "seorchable-crawler/1.0"
        },
        lookup: createPinnedLookup(ips),
        timeout: Math.min(options.policy.requestTimeoutMs, deadlineMs)
      },
      response => {
        const fail = (error: CrawlError): void => {
          if (!settled) {
            settled = true;
            cleanup();
            request.destroy(error);
            reject(error);
          }
        };
        response.on("error", error =>
          fail(new CrawlError("NETWORK_FAILURE", "Response stream failed", {}, { cause: error }))
        );
        response.on("aborted", () =>
          fail(new CrawlError("NETWORK_FAILURE", "Response stream was aborted"))
        );

        if (
          response.statusCode !== undefined &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          settled = true;
          cleanup();
          const headers = Object.fromEntries(
            Object.entries(response.headers).filter(([key]) => key !== "set-cookie")
          );
          response.destroy();
          resolve({
            status: response.statusCode,
            headers,
            body: Buffer.alloc(0)
          });
          return;
        }

        const declaredLength = contentLength(response.headers);
        if (declaredLength !== null && declaredLength > options.policy.maxResponseBytes) {
          fail(new CrawlError("RESPONSE_TOO_LARGE", "Response exceeded configured limit"));
          return;
        }
        response.on("data", chunk => {
          const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          received += data.length;
          if (received > options.policy.maxResponseBytes) {
            fail(
              new CrawlError(
                "RESPONSE_TOO_LARGE",
                "Response exceeded configured limit"
              )
            );
            return;
          }
          chunks.push(data);
        });
        response.on("end", () => {
          if (!settled) {
            settled = true;
            cleanup();
            resolve({
              status: response.statusCode ?? 0,
              headers: Object.fromEntries(
                Object.entries(response.headers).filter(
                  ([key]) => key !== "set-cookie"
                )
              ),
              body: Buffer.concat(chunks)
            });
          }
        });
      }
    );

    let connectTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => request.destroy(new CrawlError("TIMEOUT", "Connection timed out")),
      options.policy.connectTimeoutMs
    );
    const clearConnectTimer = (): void => {
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = undefined;
      }
    };
    const deadlineTimer = setTimeout(
      () => request.destroy(new CrawlError("TIMEOUT", "Request deadline exceeded")),
      deadlineMs
    );
    const cleanup = (): void => {
      clearConnectTimer();
      clearTimeout(deadlineTimer);
      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
        abortHandler = undefined;
      }
    };

    request.on("socket", socket =>
      socket.once("connect", clearConnectTimer)
    );
    request.on("timeout", () =>
      request.destroy(new CrawlError("TIMEOUT", "Request timed out"))
    );
    request.on("error", error => {
      cleanup();
      if (!settled) {
        settled = true;
        reject(
          error instanceof CrawlError
            ? error
            : new CrawlError("NETWORK_FAILURE", "Network request failed", {}, {
                cause: error
              })
        );
      }
    });
    request.on("close", cleanup);

    if (options.signal) {
      if (options.signal.aborted) {
        request.destroy(new CrawlError("CANCELLED", "Request cancelled"));
      } else {
        abortHandler = () => request.destroy(new CrawlError("CANCELLED", "Request cancelled"));
        options.signal.addEventListener("abort", abortHandler, { once: true });
      }
    }
    request.end();
  });
}

export function createPinnedLookup(
  ips: string[]
): NonNullable<RequestOptions["lookup"]> {
  return (_hostname, lookupOptions, callback) => {
    if (lookupOptions.all) {
      callback(
        null,
        ips.map(address => ({
          address,
          family: address.includes(":") ? 6 : 4
        }))
      );
      return;
    }
    callback(null, ips[0], ips[0].includes(":") ? 6 : 4);
  };
}
