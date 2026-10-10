import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { HttpCrawlProvider } from "@/features/acquisition/infrastructure/providers/http-crawl-provider";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "@/features/acquisition/domain/contracts";
import type { Resolver } from "@/features/acquisition/infrastructure/security/ssrf-guard";

describe("testHttpProviderLimits", () => {
  it("runs", async () => {
  let active = 0;
  let peak = 0;
  const starts = new Map<string, number[]>();
  let port = 0;
  const server = createServer((request, response) => {
    const host = (request.headers.host ?? "").split(":")[0];
    const key = `${host}${request.url ?? "/"}`;
    const hostStarts = starts.get(host) ?? [];
    hostStarts.push(Date.now());
    starts.set(host, hostStarts);
    active += 1;
    peak = Math.max(peak, active);
    setTimeout(() => {
      active -= 1;
      const links = host === "a.test"
        ? `<a href="http://a.test:${port}/a1">a1</a><a href="http://b.test:${port}/b1">b1</a>`
        : `<a href="http://b.test:${port}/b2">b2</a><a href="http://a.test:${port}/a2">a2</a>`;
      response
        .writeHead(200, { "content-type": "text/html" })
        .end(`<title>${key}</title>${links}`);
    }, 40);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server did not bind");
  }
  port = address.port;
  const normalized = normalizeUrl(`http://a.test:${port}/`);
  if (!normalized.ok) {
    throw normalized.error;
  }
  const request: CrawlRequest = {
    tenantId: "a0000000-0000-4000-8000-00000000000a",
    requestedUrl: normalized.value.canonical,
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({
      robotsPolicy: "ignore",
      maxPages: 4,
      maxDepth: 2,
      maxConcurrency: 2,
      perHostRequestsPerSecond: 10
    }),
    priority: 0
  };
  const provider = new HttpCrawlProvider({
    resolver: (async () => [
      { address: "127.0.0.1", family: 4 }
    ]) satisfies Resolver,
    hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
  });
  const result = await provider.execute(request, request.policy, new AbortController().signal);
  expect(result.pageCount).toEqual(4);
  expect(peak <= 2).toBeTruthy();
  for (const times of starts.values()) {
    for (let index = 1; index < times.length; index += 1) {
      expect(times[index] - times[index - 1] >= 90).toBeTruthy();
    }
  }
  await new Promise<void>(resolve => server.close(() => resolve()));
  });
});
