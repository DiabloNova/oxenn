import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicIpAddress } from "@/core/network/ip-address-policy";
export { isPublicIpAddress, isPublicIpv6Address } from "@/core/network/ip-address-policy";
import {
  request as httpRequest,
  type ClientRequest,
  type IncomingMessage,
  type IncomingHttpHeaders,
} from "node:http";
import { request as httpsRequest } from "node:https";
import { MAX_REDIRECT_CHAIN_DURATION_MS } from "@/core/network/crawler-redirect-policy";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export interface SafeHttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
}

export interface SafeHttpFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number | null;
  maxRedirectDurationMs?: number;
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

interface RawHttpResponse {
  status: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  body: Buffer;
  redirectLocation?: string;
}

function normalizedHostname(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

/**
 * Parses a crawler URL and rejects URL forms that must never be fetched.
 * DNS-resolved addresses are checked separately before the socket is opened.
 */
export function parsePublicHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Crawler URL is invalid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Crawler URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Crawler URL must not contain embedded credentials.");
  }

  const hostname = normalizedHostname(url);
  if (!hostname) throw new Error("Crawler URL is missing a hostname.");

  const blockedSuffixes = [".localhost", ".local", ".internal", ".test", ".invalid", ".example"];
  if (
    hostname === "localhost" ||
    hostname === "metadata" ||
    blockedSuffixes.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new Error("Crawler URL resolves to a reserved hostname.");
  }

  const family = isIP(hostname);
  if (family !== 0 && !isPublicIpAddress(hostname)) {
    throw new Error("Crawler URL must not target a non-public IP address.");
  }
  if (family === 0 && !hostname.includes(".")) {
    throw new Error("Crawler URL must use a fully qualified public hostname.");
  }

  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) {
    throw new Error("Crawler URL uses a non-standard port.");
  }

  url.hash = "";
  return url;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function resolvePublicAddress(url: URL, timeoutMs: number): Promise<ResolvedAddress> {
  const hostname = normalizedHostname(url);
  const family = isIP(hostname);

  const addresses = family === 0
    ? await withTimeout(
        lookup(hostname, { all: true, verbatim: true }),
        timeoutMs,
        "Crawler DNS lookup timed out."
      )
    : [{ address: hostname, family }];

  if (addresses.length === 0 || addresses.some((entry) => !isPublicIpAddress(entry.address))) {
    throw new Error("Crawler refused a hostname with a non-public DNS address.");
  }

  const selected = addresses[0];
  return {
    address: selected.address,
    family: selected.family as 4 | 6,
  };
}

function headerValue(headers: IncomingHttpHeaders, name: string): string | null {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return String(value);
  return value ?? null;
}

function requestOnce(
  url: URL,
  address: ResolvedAddress,
  timeoutMs: number,
  maxBytes: number
): Promise<RawHttpResponse> {
  return new Promise((resolve, reject) => {
    const hostname = normalizedHostname(url);
    const requestOptions = {
      hostname: address.address,
      family: address.family,
      port: Number(url.port) || (url.protocol === "https:" ? 443 : 80),
      method: "GET",
      path: url.pathname + url.search,
      headers: {
        host: url.host,
        "user-agent": "OxennCrawler/1.0",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-encoding": "identity",
      },
    };

    const requestRef: { current?: ClientRequest } = {};
    const timeoutRef: { current?: ReturnType<typeof setTimeout> } = {};
    const clearHardTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    const onResponse = (response: IncomingMessage) => {
      const status = response.statusCode ?? 0;
      const location = headerValue(response.headers, "location");

      if (REDIRECT_STATUSES.has(status) && location) {
        // Redirect bodies are irrelevant; close the hop instead of draining an
        // untrusted response body before validating and opening the next target.
        response.destroy();
        clearHardTimeout();
        resolve({
          status,
          statusText: response.statusMessage ?? "",
          headers: response.headers,
          body: Buffer.alloc(0),
          redirectLocation: location,
        });
        return;
      }

      const declaredLength = headerValue(response.headers, "content-length");
      if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
        const error = new Error("Crawler response exceeded the configured size limit.");
        clearHardTimeout();
        requestRef.current?.destroy(error);
        reject(error);
        return;
      }

      const chunks: Buffer[] = [];
      let receivedBytes = 0;

      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += buffer.length;
        if (receivedBytes > maxBytes) {
          const error = new Error("Crawler response exceeded the configured size limit.");
          clearHardTimeout();
          requestRef.current?.destroy(error);
          reject(error);
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => {
        clearHardTimeout();
        resolve({
          status,
          statusText: response.statusMessage ?? "",
          headers: response.headers,
          body: Buffer.concat(chunks),
        });
      });
      response.on("aborted", () => {
        clearHardTimeout();
        reject(new Error("Crawler response was interrupted."));
      });
      response.on("error", (error) => {
        clearHardTimeout();
        reject(error);
      });
    };

    const options = url.protocol === "https:"
      ? {
          ...requestOptions,
          servername: isIP(hostname) === 0 ? hostname : undefined,
        }
      : requestOptions;

    const request = url.protocol === "https:"
      ? httpsRequest(options, onResponse)
      : httpRequest(options, onResponse);
    requestRef.current = request;

    timeoutRef.current = setTimeout(() => {
      const error = new Error("Crawler request exceeded the absolute time limit.");
      request.destroy(error);
      clearHardTimeout();
      reject(error);
    }, timeoutMs);
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error("Crawler request timed out due to inactivity."));
    });
    request.on("error", (error) => {
      clearHardTimeout();
      reject(error);
    });
    request.end();
  });
}

/**
 * Performs a bounded HTTP(S) GET with DNS validation, IP pinning, redirect
 * revalidation, a response-size cap and a per-request timeout.
 */
export async function fetchPublicUrl(
  input: string,
  options: SafeHttpFetchOptions = {}
): Promise<SafeHttpResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects === undefined
    ? DEFAULT_MAX_REDIRECTS
    : options.maxRedirects;
  const maxRedirectDurationMs = options.maxRedirectDurationMs ?? MAX_REDIRECT_CHAIN_DURATION_MS;
  if (!Number.isSafeInteger(maxRedirectDurationMs) || maxRedirectDurationMs <= 0) {
    throw new Error("Crawler redirect time budget must be a positive safe integer.");
  }
  let redirectChainStartedAt: number | null = null;
  const visited = new Set<string>();
  let currentUrl = parsePublicHttpUrl(input);

  for (let redirects = 0; ; redirects++) {
    const normalizedUrl = currentUrl.toString();
    if (visited.has(normalizedUrl)) {
      throw new Error("Crawler detected a redirect loop.");
    }
    visited.add(normalizedUrl);

    const redirectRemaining = redirectChainStartedAt === null
      ? timeoutMs
      : maxRedirectDurationMs - (Date.now() - redirectChainStartedAt);
    const hopTimeoutMs = Math.min(timeoutMs, redirectRemaining);
    if (hopTimeoutMs <= 0) {
      throw new Error("Crawler redirect chain exceeded its time budget.");
    }
    const address = await resolvePublicAddress(currentUrl, hopTimeoutMs);
    const remainingAfterDns = redirectChainStartedAt === null
      ? timeoutMs
      : maxRedirectDurationMs - (Date.now() - redirectChainStartedAt);
    const requestTimeoutMs = Math.min(timeoutMs, remainingAfterDns);
    if (requestTimeoutMs <= 0) {
      throw new Error("Crawler redirect chain exceeded its time budget.");
    }
    const response = await requestOnce(currentUrl, address, requestTimeoutMs, maxBytes);

    if (response.redirectLocation) {
      if (maxRedirects !== null && redirects >= maxRedirects) {
        throw new Error("Crawler exceeded the maximum redirect count.");
      }
      if (redirectChainStartedAt === null) {
        redirectChainStartedAt = Date.now();
      } else if (Date.now() - redirectChainStartedAt >= maxRedirectDurationMs) {
        throw new Error("Crawler redirect chain exceeded its time budget.");
      }
      currentUrl = parsePublicHttpUrl(new URL(response.redirectLocation, currentUrl).toString());
      continue;
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      url: normalizedUrl,
      headers: {
        get(name: string) {
          return headerValue(response.headers, name);
        },
      },
      async text() {
        return response.body.toString("utf8");
      },
    };
  }
}
