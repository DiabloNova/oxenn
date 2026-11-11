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

  it("marks the result partial when maxPages prevents an eligible same-origin link from being crawled", async () => {
    let port = 0;
    const server = createServer((request, response) => {
      const body = request.url === "/"
        ? `<a href="http://a.test:${port}/child">child</a>`
        : "<title>child</title>";
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
        robotsPolicy: "ignore", maxPages: 1, maxDepth: 2, maxConcurrency: 1
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.pageCount).toBe(1);
      expect(result.partial).toBe(true);
      expect(result.documents[0]?.links).toContain(`http://a.test:${port}/child`);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("does not count an already-fetched redirect target as a page-limit omission", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);
      if (host === "a.test" && path === "/") {
        response.writeHead(302, { location: `http://www.a.test:${port}/` }).end();
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end(
        `<a href="http://www.a.test:${port}/">self</a>`
      );
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
        robotsPolicy: "ignore", maxPages: 1, maxDepth: 2, maxConcurrency: 1
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.pageCount).toBe(1);
      expect(result.partial).toBe(false);
      expect(requested.filter(value => value === "www.a.test/")).toHaveLength(1);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("does not count robots-disallowed links as page-limit omissions", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);
      if (path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" })
          .end("User-agent: *\nDisallow: /admin");
        return;
      }
      if (path === "/") {
        response.writeHead(200, { "content-type": "text/html" })
          .end('<a href="/admin">admin</a>');
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end("<title>unexpected</title>");
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
        robotsPolicy: "respect", maxPages: 1, maxDepth: 2, maxConcurrency: 1,
        perHostRequestsPerSecond: 100
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.pageCount).toBe(1);
      expect(result.partial).toBe(false);
      expect(requested.filter(value => value === "a.test/robots.txt")).toHaveLength(1);
      expect(requested).not.toContain("a.test/admin");
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("does not let a robots-disallowed link reserve capacity ahead of a permitted sibling", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);
      if (path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" })
          .end("User-agent: *\nDisallow: /admin");
        return;
      }
      if (path === "/") {
        response.writeHead(200, { "content-type": "text/html" })
          .end('<a href="/admin">admin</a><a href="/public">public</a>');
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end("<title>public</title>");
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
        robotsPolicy: "respect", maxPages: 2, maxDepth: 2, maxConcurrency: 1,
        perHostRequestsPerSecond: 100
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.pageCount).toBe(2);
      expect(result.partial).toBe(false);
      expect(requested).toContain("a.test/public");
      expect(requested).not.toContain("a.test/admin");
      expect(requested.filter(value => value === "a.test/robots.txt")).toHaveLength(1);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("does not mark a page-limit truncation when remaining links are ineligible", async () => {
    let port = 0;
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" }).end(
        `<a href="http://a.test:${port}/">self</a><a href="http://b.test:${port}/outside">outside</a>`
      );
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
        robotsPolicy: "ignore", maxPages: 1, maxDepth: 2, maxConcurrency: 1
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.pageCount).toBe(1);
      expect(result.partial).toBe(false);
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

  it("resolves a canonical www seed before enforcing the crawl origin and skips redirected child pages", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);

      if (host === "a.test" && path === "/") {
        response.writeHead(302, { location: `http://www.a.test:${port}/` }).end();
        return;
      }
      if (path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *");
        return;
      }
      if (path === "/") {
        response.writeHead(200, { "content-type": "text/html" })
          .end('<a href="/redirect-child">redirect</a><a href="/good">good</a>');
        return;
      }
      if (path === "/redirect-child") {
        response.writeHead(302, { location: `http://login.test:${port}/sso` }).end();
        return;
      }
      if (path === "/good") {
        response.writeHead(200, { "content-type": "text/html" }).end("<title>good</title>");
        return;
      }
      response.writeHead(404).end();
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
        maxPages: 10, maxDepth: 2, maxConcurrency: 2,
        perHostRequestsPerSecond: 100, robotsPolicy: "respect"
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      );

      expect(result.documents.map(document => document.finalUrl)).toEqual([
        `http://www.a.test:${port}/`,
        `http://www.a.test:${port}/good`
      ]);
      expect(result.documents[0]?.requestedUrl).toBe(url);
      expect(result.partial).toBe(true);
      expect(result.errors).toEqual([
        expect.objectContaining({
          code: "POLICY_VIOLATION",
          details: expect.objectContaining({
            boundary: "origin",
            requestedUrl: `http://www.a.test:${port}/redirect-child`
          })
        })
      ]);
      expect(requested.indexOf("a.test/robots.txt")).toBeLessThan(requested.indexOf("a.test/"));
      expect(requested).toContain("www.a.test/robots.txt");
      expect(requested.some(value => value.startsWith("login.test"))).toBe(false);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("rejects a seed redirect that is not a same-host or www canonical transition", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      requested.push(`${host}${request.url ?? "/"}`);
      if (host === "a.test") {
        response.writeHead(302, { location: `http://evil.test:${port}/` }).end();
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end("<title>unexpected</title>");
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
      const request = makeRequest(url, resolveCrawlPolicy({ robotsPolicy: "ignore" }));
      await expect(new HttpCrawlProvider({ resolver, hostValidator }).execute(
        request, request.policy, new AbortController().signal
      )).rejects.toMatchObject({
        code: "POLICY_VIOLATION",
        details: expect.objectContaining({ boundary: "origin" })
      });
      expect(requested.some(value => value.startsWith("evil.test"))).toBe(false);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("checks robots.txt for a canonical redirect target before requesting its page body", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);
      if (host === "a.test" && path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *\nAllow: /");
        return;
      }
      if (host === "a.test" && path === "/") {
        response.writeHead(302, { location: `http://www.a.test:${port}/private` }).end();
        return;
      }
      if (host === "www.a.test" && path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *\nDisallow: /private");
        return;
      }
      if (host === "www.a.test" && path === "/private") {
        response.writeHead(200, { "content-type": "text/html" }).end("<title>must not be fetched</title>");
        return;
      }
      response.writeHead(404).end();
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
      const crawlRequest = makeRequest(url, resolveCrawlPolicy({
        robotsPolicy: "respect",
        perHostRequestsPerSecond: 100,
        maxPages: 5,
        maxConcurrency: 1
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        crawlRequest, crawlRequest.policy, new AbortController().signal
      );

      expect(requested.indexOf("a.test/robots.txt")).toBeLessThan(requested.indexOf("a.test/"));
      expect(requested).toContain("www.a.test/robots.txt");
      expect(requested).not.toContain("www.a.test/private");
      expect(result.documents).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("does not reuse a redirected robots.txt response as another origin's robots policy", async () => {
    let port = 0;
    const requested: string[] = [];
    const server = createServer((request, response) => {
      const host = (request.headers.host ?? "").split(":")[0];
      const path = request.url ?? "/";
      requested.push(`${host}${path}`);

      if (host === "a.test" && path === "/robots.txt") {
        response.writeHead(302, { location: `http://www.a.test:${port}/rules` }).end();
        return;
      }
      if (host === "www.a.test" && path === "/rules") {
        response.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *\nAllow: /");
        return;
      }
      if (host === "www.a.test" && path === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain" }).end("User-agent: *\nDisallow: /private");
        return;
      }
      if (host === "a.test" && path === "/") {
        response.writeHead(302, { location: `http://www.a.test:${port}/private` }).end();
        return;
      }
      if (host === "www.a.test" && path === "/private") {
        response.writeHead(200, { "content-type": "text/html" }).end("<title>must not be fetched</title>");
        return;
      }
      response.writeHead(404).end();
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
      const crawlRequest = makeRequest(url, resolveCrawlPolicy({
        robotsPolicy: "respect",
        perHostRequestsPerSecond: 100,
        maxPages: 5,
        maxConcurrency: 1
      }));
      const result = await new HttpCrawlProvider({ resolver, hostValidator }).execute(
        crawlRequest, crawlRequest.policy, new AbortController().signal
      );

      expect(requested).toContain("www.a.test/rules");
      expect(requested).toContain("www.a.test/robots.txt");
      expect(requested).not.toContain("www.a.test/private");
      expect(result.documents).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

});
