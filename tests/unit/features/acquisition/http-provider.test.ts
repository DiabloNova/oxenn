import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { HttpCrawlProvider } from "@/features/acquisition/infrastructure/providers/http-crawl-provider";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";
import type { Resolver } from "@/features/acquisition/infrastructure/security/ssrf-guard";

function makeRequest(url: string, policy: CrawlRequest["policy"]): CrawlRequest {
  const normalized = normalizeUrl(url);
  if (!normalized.ok) throw normalized.error;
  return {
    tenantId: "a0000000-0000-4000-8000-00000000000a",
    requestedUrl: normalized.value.canonical,
    normalizedUrl: normalized.value,
    policy,
    priority: 0
  };
}

const resolver = (async () => [{ address: "127.0.0.1", family: 4 }]) satisfies Resolver;
const hostValidator = async () => ({ ok: true as const, ips: ["127.0.0.1"] });

describe("HttpCrawlProvider resource and origin boundaries", () => {
  it("does not enqueue links outside the seed origin", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      requested.push(`${host}${request.url ?? "/"}`);
      const body = request.url === "/"
        ? `<a href="http://a.test:${port}/inside">inside</a><a href="http://b.test:${port}/outside">outside</a>`
        : `<title>inside</title>`;
      response.writeHead(200, { "content-type": "text/html" }).end(body);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    port = address.port;
    try {
      const url = `http://a.test:${port}/`;
      const request = makeRequest(url, resolveCrawlPolicy({
        robotsPolicy: "ignore", maxPages: 10, maxDepth: 2, maxConcurrency: 2
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );
      expect(result.pageCount).toBe(2);
      expect(requested.some(value => value.startsWith("b.test"))).toBe(false);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("enforces one aggregate byte budget across concurrent responses and returns actual usage", async () => {
    let port = 0;
    const body = "x".repeat(80);
    const server = createServer((request, response) => {
      if (request.url === "/") {
        response.writeHead(200, { "content-type": "text/html" })
          .end(`<a href="http://a.test:${port}/one">one</a><a href="http://a.test:${port}/two">two</a>`);
        return;
      }
      response.writeHead(200, { "content-type": "text/html" });
      response.write(body.slice(0, 40));
      setTimeout(() => response.end(body.slice(40)), 10);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    port = address.port;
    try {
      const url = `http://a.test:${port}/`;
      const request = makeRequest(url, resolveCrawlPolicy({
        robotsPolicy: "ignore", maxPages: 10, maxDepth: 1, maxConcurrency: 2,
        maxResponseBytes: 128, maxTotalBytes: 128
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );
      expect(result.partial).toBe(true);
      expect(result.errors[0]?.code).toBe("BYTE_BUDGET_EXCEEDED");
      expect(result.errors[0]?.details.bytesRetained).toBeLessThanOrEqual(128);
      expect(result.bytesProcessed).toBeGreaterThanOrEqual(result.errors[0]?.details.bytesRetained as number);
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
  it("cancels an in-flight request when the job-wide duration expires", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" });
      response.flushHeaders();
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    try {
      const url = `http://timeout.test:${address.port}/`;
      const request = makeRequest(url, resolveCrawlPolicy({
        robotsPolicy: "ignore", maxDurationMs: 50, requestTimeoutMs: 1_000, connectTimeoutMs: 1_000
      }));
      await expect(new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      )).rejects.toMatchObject({ code: "TIMEOUT" });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

});
