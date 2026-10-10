import { describe, it, expect } from "vitest";
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

describe("testFetcher", () => {
  it("runs", async () => {
  let remote = "";
  const server = createServer((request, response) => {
    remote = request.socket.remoteAddress ?? "";
    if (request.url === "/redirect") {
      response.writeHead(302, { location: "/final" }).end();
      return;
    }
    if (request.url === "/gzip") {
      response
        .writeHead(200, {
          "content-type": "text/plain",
          "content-encoding": "gzip"
        })
        .end("bad");
      return;
    }
    if (request.url === "/large") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.write("0123456789");
      response.end("0123456789");
      return;
    }
    response
      .writeHead(200, {
        "content-type": "text/plain",
        "set-cookie": "secret=x"
      })
      .end("ok");
  });
  const port = await listen(server, "127.0.0.1");
  const policy = resolveCrawlPolicy({
    allowedContentTypes: ["text/plain"],
    maxResponseBytes: 12
  });
  const response = await safeFetch(`http://pinned.example:${port}/`, {
    policy,
    hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
  });
  expect(remote).toEqual("127.0.0.1");
  expect(response.body.toString()).toEqual("ok");
  expect("set-cookie" in response.headers).toEqual(false);
  await expect(
    () =>
      safeFetch(`http://pinned.example:${port}/gzip`, {
        policy,
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "CONTENT_TYPE_UNSUPPORTED"
  ).rejects.toThrow();
  await expect(
    () =>
      safeFetch(`http://pinned.example:${port}/large`, {
        policy: { ...policy, maxResponseBytes: 5 },
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "RESPONSE_TOO_LARGE"
  ).rejects.toThrow();
  await expect(
    () =>
      safeFetch(`http://pinned.example:${port}/redirect`, {
        policy: { ...policy, maxRedirects: 0 },
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "REDIRECT_LIMIT"
  ).rejects.toThrow();
  await new Promise<void>(resolve => server.close(() => resolve()));

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
