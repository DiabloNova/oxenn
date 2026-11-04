import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  request as httpRequest,
  type ClientRequest,
  type IncomingMessage,
  type IncomingHttpHeaders,
} from "node:http";
import { request as httpsRequest } from "node:https";

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
  maxRedirects?: number;
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

const BLOCKED_IPV4_CIDRS: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_IPV6_CIDRS: ReadonlyArray<readonly [string, number]> = [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
];

function ipv4ToBigInt(address: string): bigint | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  let result = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    result = (result << 8n) | BigInt(octet);
  }
  return result;
}

function ipv6ToBigInt(address: string): bigint | null {
  let normalized = address.toLowerCase().split("%")[0];

  // Convert an embedded dotted IPv4 suffix into its two hexadecimal groups.
  if (normalized.includes(".")) {
    const lastColon = normalized.lastIndexOf(":");
    if (lastColon < 0) return null;
    const ipv4 = ipv4ToBigInt(normalized.slice(lastColon + 1));
    if (ipv4 === null) return null;
    const high = Number((ipv4 >> 16n) & 0xffffn).toString(16);
    const low = Number(ipv4 & 0xffffn).toString(16);
    normalized = normalized.slice(0, lastColon + 1) + high + ":" + low;
  }

  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;

  if (halves.length === 1 && missing !== 0) return null;
  if (halves.length === 2 && missing < 1) return null;

  const groups = halves.length === 2
    ? [...left, ...Array<string>(missing).fill("0"), ...right]
    : left;

  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }

  let result = 0n;
  for (const group of groups) {
    result = (result << 16n) | BigInt(Number.parseInt(group, 16));
  }
  return result;
}

function inCidr(value: bigint, network: bigint, prefix: number, bits: number): boolean {
  const shift = BigInt(bits - prefix);
  return (value >> shift) === (network >> shift);
}

function isPublicIpv4(address: string): boolean {
  const value = ipv4ToBigInt(address);
  if (value === null) return false;

  return !BLOCKED_IPV4_CIDRS.some(([network, prefix]) => {
    const networkValue = ipv4ToBigInt(network);
    return networkValue !== null && inCidr(value, networkValue, prefix, 32);
  });
}

/**
 * Conservative global-unicast check. Non-global IPv6 ranges, transition
 * mechanisms and special-purpose ranges are rejected for outbound crawling.
 */
function isPublicIpv6(address: string): boolean {
  const value = ipv6ToBigInt(address);
  if (value === null) return false;

  const globalUnicastBase = 0x20000000000000000000000000000000n;
  if (!inCidr(value, globalUnicastBase, 3, 128)) return false;

  return !BLOCKED_IPV6_CIDRS.some(([network, prefix]) => {
    const networkValue = ipv6ToBigInt(network);
    return networkValue !== null && inCidr(value, networkValue, prefix, 128);
  });
}

/** Returns true only for globally routable IPv4 or IPv6 addresses. */
export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family === 6) return isPublicIpv6(address);
  return false;
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

    let request: ClientRequest;
    let hardTimeout: ReturnType<typeof setTimeout> | undefined;
    const clearHardTimeout = () => {
      if (hardTimeout) clearTimeout(hardTimeout);
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

      const chunks: Buffer[] = [];
      let receivedBytes = 0;

      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += buffer.length;
        if (receivedBytes > maxBytes) {
          const error = new Error("Crawler response exceeded the configured size limit.");
          clearHardTimeout();
          request.destroy(error);
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

    request = url.protocol === "https:"
      ? httpsRequest(options, onResponse)
      : httpRequest(options, onResponse);

    hardTimeout = setTimeout(() => {
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
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const visited = new Set<string>();
  let currentUrl = parsePublicHttpUrl(input);

  for (let redirects = 0; ; redirects++) {
    const normalizedUrl = currentUrl.toString();
    if (visited.has(normalizedUrl)) {
      throw new Error("Crawler detected a redirect loop.");
    }
    visited.add(normalizedUrl);

    const address = await resolvePublicAddress(currentUrl, timeoutMs);
    const response = await requestOnce(currentUrl, address, timeoutMs, maxBytes);

    if (response.redirectLocation) {
      if (redirects >= maxRedirects) {
        throw new Error("Crawler exceeded the maximum redirect count.");
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
