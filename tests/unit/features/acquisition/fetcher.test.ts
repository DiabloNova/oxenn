import { describe, it, expect, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { CrawlError } from "@/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "@/features/acquisition/domain/policy";
import {
  createPinnedLookup,
  safeFetch
} from "@/features/acquisition/infrastructure/http/safe-fetcher";

function listen(server: Server, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        resolve(address.port);
      } else {
        reject(new Error("server did not bind"));
      }
    });
  });
}

describe("safe crawler fetcher", () => {
  it("pins the validated address, bounds redirects, response size and request time", async () => {
    let remote = "";
    const requestedPaths: string[] = [];
    let port = 0;
    const server = createServer((request, response) => {
      remote = request.socket.remoteAddress ?? "";
      requestedPaths.push(request.url ?? "");
      if (request.url === "/redirect") {
        response.writeHead(302, { location: "/final" }).end();
        return;
      }
      if (request.url === "/chain/0") {
        response.writeHead(302, { location: "/chain/1" }).end();
        return;
      }
      if (request.url === "/chain/1") {
        response.writeHead(302, { location: "/chain/2" }).end();
        return;
      }
      if (request.url === "/chain/2") {
        response.writeHead(302, { location: "/chain/3" }).end();
        return;
      }
      if (request.url === "/chain/3") {
        response.writeHead(302, { location: "/chain/4" }).end();
        return;
      }
      if (request.url === "/chain/4") {
        response.writeHead(302, { location: "/chain/5" }).end();
        return;
      }
      if (request.url === "/chain/5") {
        response.writeHead(302, { location: "/chain/6" }).end();
        return;
      }
      if (request.url === "/chain/6") {
        response.writeHead(302, { location: "/chain/7" }).end();
        return;
      }
      if (request.url === "/chain/7") {
        response.writeHead(200, { "content-type": "text/plain" }).end("paid-ok");
        return;
      }
      if (request.url === "/loop-a") {
        response.writeHead(302, { location: "/loop-b" }).end();
        return;
      }
      if (request.url === "/loop-b") {
        response.writeHead(302, { location: "/loop-a" }).end();
        return;
      }
      if (request.url === "/private-redirect") {
        response.writeHead(302, { location: `http://private.example:${port}/blocked` }).end();
        return;
      }
      if (request.url === "/gzip") {
        response.writeHead(200, {
          "content-type": "text/plain",
          "content-encoding": "gzip"
        }).end("bad");
        return;
      }
      if (request.url === "/large") {
        response.writeHead(200, { "content-type": "text/plain" });
        response.write("0123456789");
        response.end("0123456789");
        return;
      }
      if (request.url === "/large-declared") {
        response.writeHead(200, { "content-type": "text/plain", "content-length": "20" });
        response.end("01234567890123456789");
        return;
      }
      if (request.url === "/hang") {
        response.writeHead(200, { "content-type": "text/plain" });
        return;
      }
      response.writeHead(200, {
        "content-type": "text/plain",
        "set-cookie": "secret=x"
      }).end("ok");
    });
    port = await listen(server, "127.0.0.1");
    const policy = resolveCrawlPolicy({
      allowedContentTypes: ["text/plain"],
      maxResponseBytes: 12
    });
    const localHostValidator = async () => ({ ok: true as const, ips: ["127.0.0.1"] });

    try {
      const response = await safeFetch(`http://pinned.example:${port}/`, {
        policy,
        hostValidator: localHostValidator
      });
      expect(remote).toEqual("127.0.0.1");
      expect(response.body.toString()).toEqual("ok");
      expect("set-cookie" in response.headers).toEqual(false);

      await expect(safeFetch(`http://pinned.example:${port}/gzip`, {
        policy,
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "CONTENT_TYPE_UNSUPPORTED" });

      await expect(safeFetch(`http://pinned.example:${port}/large`, {
        policy: { ...policy, maxResponseBytes: 5 },
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });

      await expect(safeFetch(`http://pinned.example:${port}/large-declared`, {
        policy: { ...policy, maxResponseBytes: 5 },
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });

      await expect(safeFetch(`http://pinned.example:${port}/redirect`, {
        policy: { ...policy, maxRedirects: 0 },
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "REDIRECT_LIMIT" });

      const freeChainStart = requestedPaths.length;
      await expect(safeFetch(`http://pinned.example:${port}/chain/0`, {
        policy: { ...policy, maxRedirects: 5 },
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "REDIRECT_LIMIT" });
      expect(requestedPaths.slice(freeChainStart)).toHaveLength(6);

      const paidChain = await safeFetch(`http://pinned.example:${port}/chain/0`, {
        policy: { ...policy, maxRedirects: null },
        hostValidator: localHostValidator
      });
      expect(paidChain.body.toString()).toEqual("paid-ok");
      expect(paidChain.redirects).toEqual(7);

      await expect(safeFetch(`http://pinned.example:${port}/loop-a`, {
        policy,
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "REDIRECT_LIMIT" });

      const requestedHosts: string[] = [];
      await expect(safeFetch(`http://pinned.example:${port}/private-redirect`, {
        policy,
        hostValidator: async host => {
          requestedHosts.push(host);
          return host === "private.example"
            ? { ok: false, rule: "private-test", error: new CrawlError("SSRF_BLOCKED", "private redirect rejected") }
            : { ok: true, ips: ["127.0.0.1"] };
        }
      })).rejects.toMatchObject({ code: "SSRF_BLOCKED" });
      expect(requestedHosts).toEqual(["pinned.example", "private.example"]);

      await expect(safeFetch(`http://pinned.example:${port}/hang`, {
        policy: { ...policy, requestTimeoutMs: 50, connectTimeoutMs: 50, maxDurationMs: 250 },
        hostValidator: localHostValidator
      })).rejects.toMatchObject({ code: "TIMEOUT" });

    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  }, 10_000);

  it("aborts DNS validation when its timeout expires", async () => {
    vi.useFakeTimers();
    let validationAborted = false;
    try {
      const pending = safeFetch("http://dns-hang.oxenn.testdomain/", {
        policy: resolveCrawlPolicy({}),
        resolver: async (_host, signal) => new Promise<Array<{ address: string; family: number }>>((_, reject) => {
          signal?.addEventListener("abort", () => {
            validationAborted = true;
            reject(new Error("resolver aborted"));
          }, { once: true });
        })
      });
      const expectation = expect(pending).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(10_001);
      await expectation;
      expect(validationAborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("creates a pinned lookup for all and single-address Node callbacks", async () => {
    const lookup = createPinnedLookup(["127.0.0.1", "::1"]);
    await new Promise<void>((resolve, reject) =>
      lookup("x", { all: true }, (error, addresses) => {
        if (error) {
          reject(error);
        } else {
          expect(Array.isArray(addresses)).toEqual(true);
          resolve();
        }
      })
    );
    await new Promise<void>((resolve, reject) =>
      lookup("x", { all: false }, (error, address, family) => {
        if (error) {
          reject(error);
        } else {
          expect(address).toEqual("127.0.0.1");
          expect(family).toEqual(4);
          resolve();
        }
      })
    );
  });
});
