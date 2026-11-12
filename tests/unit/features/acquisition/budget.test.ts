import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { CrawlByteBudget } from "@/features/acquisition/infrastructure/http/crawl-byte-budget";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import { safeFetch } from "@/features/acquisition/infrastructure/http/safe-fetcher";

describe("Acquisition fetch aggregate byte and origin limits", () => {
  it("counts chunks before retaining them and rejects aggregate overflow", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/plain" });
      response.flushHeaders();
      response.write("1234");
      setTimeout(() => response.end("5678"), 25);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    const budget = new CrawlByteBudget(5);
    try {
      await expect(safeFetch(`http://budget.test:${address.port}/`, {
        policy: resolveCrawlPolicy({ allowedContentTypes: ["text/plain"] }),
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] }),
        byteBudget: budget
      })).rejects.toMatchObject({ code: "BYTE_BUDGET_EXCEEDED" });
      expect(budget.bytesProcessed).toBe(8);
      expect(budget.bytesRetained).toBe(4);
      expect(budget.isExceeded).toBe(true);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("rejects a redirect that crosses the seed origin before resolving its target", async () => {
    const requestedHosts: string[] = [];
    const server = createServer((_request, response) => {
      response.writeHead(302, { location: "http://other.test/target" }).end();
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server did not bind");
    try {
      await expect(safeFetch(`http://seed.test:${address.port}/`, {
        policy: resolveCrawlPolicy({ allowedContentTypes: ["text/plain"] }),
        allowedOrigin: `http://seed.test:${address.port}`,
        hostValidator: async host => {
          requestedHosts.push(host);
          return { ok: true, ips: ["127.0.0.1"] };
        }
      })).rejects.toMatchObject({ code: "POLICY_VIOLATION" });
      expect(requestedHosts).toEqual(["seed.test"]);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
