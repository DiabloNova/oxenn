import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookupMock, httpRequestMock, httpsRequestMock } = vi.hoisted(() => ({
  lookupMock: vi.fn(),
  httpRequestMock: vi.fn(),
  httpsRequestMock: vi.fn()
}));

vi.mock("node:dns/promises", () => ({ lookup: lookupMock }));
vi.mock("node:http", () => ({ request: httpRequestMock }));
vi.mock("node:https", () => ({ request: httpsRequestMock }));

import { fetchPublicUrl, parsePublicHttpUrl } from "@/services/crawler/safe-http-fetch";
import { isPublicIpAddress } from "@/core/network/ip-address-policy";

interface ResponseSpec {
  status?: number;
  headers?: Record<string, string>;
  chunks?: Array<string | Buffer>;
  hang?: boolean;
}

const routes = new Map<string, ResponseSpec>();

function installFakeTransport(): void {
  const transport = (options: { path?: string }, callback: (response: EventEmitter) => void) => {
    const request = new EventEmitter() as EventEmitter & {
      setTimeout: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    request.setTimeout = vi.fn();
    request.destroy = vi.fn((error?: Error) => {
      if (error) queueMicrotask(() => request.emit("error", error));
      return request;
    });
    request.end = vi.fn(() => {
      const spec = routes.get(options.path ?? "/") ?? { status: 200, chunks: ["ok"] };
      if (spec.hang) return;
      queueMicrotask(() => {
        const response = new EventEmitter() as EventEmitter & {
          statusCode: number;
          statusMessage: string;
          headers: Record<string, string>;
          destroyed?: boolean;
          destroy: ReturnType<typeof vi.fn>;
        };
        response.statusCode = spec.status ?? 200;
        response.statusMessage = "test";
        response.headers = spec.headers ?? {};
        response.destroy = vi.fn(() => {
          response.destroyed = true;
        });
        callback(response);
        if (!response.destroyed) {
          for (const chunk of spec.chunks ?? ["ok"]) response.emit("data", chunk);
          response.emit("end");
        }
      });
      return request;
    });
    return request;
  };
  httpRequestMock.mockImplementation(transport);
  httpsRequestMock.mockImplementation(transport);
}

beforeEach(() => {
  routes.clear();
  vi.clearAllMocks();
  lookupMock.mockReset();
  httpRequestMock.mockReset();
  httpsRequestMock.mockReset();
  lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  installFakeTransport();
});

describe("crawler outbound URL policy", () => {
  it("allows globally routable IPv4 addresses", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("1.1.1.1")).toBe(true);
  });

  it("rejects private, loopback, link-local and reserved IPv4 addresses", () => {
    for (const address of [
      "0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.169.254",
      "172.16.0.1", "192.168.1.1", "198.18.0.1", "203.0.113.10", "224.0.0.1"
    ]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
  });

  it("allows globally reachable IPv6 allocations and rejects reserved ranges", () => {
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
    expect(isPublicIpAddress("2001:4860:4860::8888")).toBe(true);
    for (const address of [
      "2001:1::1", "2001:1::2", "2001:1::3", "2001:3::1", "2001:4:112::1",
      "2001:20::1", "2001:30::1", "::ffff:8.8.8.8"
    ]) {
      expect(isPublicIpAddress(address), address).toBe(true);
    }
    for (const address of ["2001::1", "2001:2::1", "2001:10::1", "3ffe::1", "3fff::1"]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
    for (const address of ["::1", "fc00::1", "fe80::1", "2001:db8::1", "::ffff:127.0.0.1"]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
  });

  it("uses the resolved public IP for HTTPS while preserving the original host for TLS SNI", async () => {
    routes.set("/secure", { status: 200, chunks: ["secure"] });
    const response = await fetchPublicUrl("https://example.com/secure");
    expect(await response.text()).toBe("secure");
    expect(lookupMock).toHaveBeenCalledWith("example.com", { all: true, verbatim: true });
    expect(httpsRequestMock).toHaveBeenCalledTimes(1);
    expect(httpsRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: "93.184.216.34",
        servername: "example.com",
        headers: expect.objectContaining({ host: "example.com" })
      }),
      expect.any(Function)
    );
  });

  it("rejects a hostname when any DNS answer is non-public", async () => {
    lookupMock.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.8", family: 4 }
    ]);
    await expect(fetchPublicUrl("http://example.com/")).rejects.toThrow("non-public DNS address");
    expect(httpRequestMock).not.toHaveBeenCalled();
  });

  it("rejects a private redirect before opening the next request", async () => {
    routes.set("/redirect", { status: 302, headers: { location: "http://127.0.0.1/private" } });
    await expect(fetchPublicUrl("http://example.com/redirect")).rejects.toThrow("non-public IP address");
    expect(httpRequestMock).toHaveBeenCalledTimes(1);
  });

  it("revalidates a redirected hostname's DNS answers before the second request", async () => {
    routes.set("/redirect-host", { status: 302, headers: { location: "http://private-target.com/private" } });
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.8", family: 4 }]);
    await expect(fetchPublicUrl("http://example.com/redirect-host"))
      .rejects.toThrow("non-public DNS address");
    expect(lookupMock).toHaveBeenCalledTimes(2);
    expect(httpRequestMock).toHaveBeenCalledTimes(1);
  });

  it("bounds redirect loops and enforces free and paid redirect policies", async () => {
    routes.set("/loop-a", { status: 302, headers: { location: "/loop-b" } });
    routes.set("/loop-b", { status: 302, headers: { location: "/loop-a" } });
    await expect(fetchPublicUrl("http://example.com/loop-a")).rejects.toThrow("redirect loop");
    expect(httpRequestMock).toHaveBeenCalledTimes(2);

    httpRequestMock.mockClear();
    for (let hop = 0; hop < 8; hop++) {
      routes.set(`/chain/${hop}`, { status: 302, headers: { location: `/chain/${hop + 1}` } });
    }
    routes.set("/chain/8", { status: 200, chunks: ["paid-ok"] });
    await expect(fetchPublicUrl("http://example.com/chain/0", { maxRedirects: 5 }))
      .rejects.toThrow("maximum redirect count");
    expect(httpRequestMock).toHaveBeenCalledTimes(6);

    httpRequestMock.mockClear();
    const paid = await fetchPublicUrl("http://example.com/chain/0", { maxRedirects: 10 });
    expect(await paid.text()).toBe("paid-ok");
    expect(httpRequestMock).toHaveBeenCalledTimes(9);

    httpRequestMock.mockClear();
    for (let hop = 0; hop < 11; hop++) {
      routes.set(`/long-chain/${hop}`, {
        status: 302,
        headers: { location: `/long-chain/${hop + 1}` }
      });
    }
    routes.set("/long-chain/11", { status: 200, chunks: ["too-many"] });
    await expect(fetchPublicUrl("http://example.com/long-chain/0", { maxRedirects: 10 }))
      .rejects.toThrow("maximum redirect count");
    expect(httpRequestMock).toHaveBeenCalledTimes(11);
  });

  it("enforces the wall-clock budget when the caller disables the hop-count cap", async () => {
    routes.set("/time-budget", { status: 302, headers: { location: "/time-budget-next" } });
    routes.set("/time-budget-next", { status: 200, chunks: ["ok"] });
    let call = 0;
    const now = vi.spyOn(Date, "now").mockImplementation(() => {
      call += 1;
      return call <= 1 ? 1_000 : call === 2 ? 1_001 : 7_000;
    });
    try {
      await expect(fetchPublicUrl("http://example.com/time-budget", {
        maxRedirects: null,
        maxRedirectDurationMs: 5
      })).rejects.toThrow("redirect chain exceeded its time budget");
      expect(httpRequestMock).toHaveBeenCalledTimes(1);
    } finally {
      now.mockRestore();
    }
  });

  it("enforces response-size limits from headers and streamed bytes", async () => {
    routes.set("/large-header", { status: 200, headers: { "content-length": "20" }, chunks: ["small"] });
    await expect(fetchPublicUrl("http://example.com/large-header", { maxBytes: 5 }))
      .rejects.toThrow("response exceeded the configured size limit");

    routes.set("/large-stream", { status: 200, chunks: [Buffer.alloc(6)] });
    await expect(fetchPublicUrl("http://example.com/large-stream", { maxBytes: 5 }))
      .rejects.toThrow("response exceeded the configured size limit");
  });

  it("rejects compressed response bodies instead of decoding raw bytes as UTF-8", async () => {
    routes.set("/gzip", {
      status: 200,
      headers: { "content-encoding": "gzip" },
      chunks: [Buffer.from([0x1f, 0x8b, 0x08, 0x00])]
    });

    await expect(fetchPublicUrl("http://example.com/gzip"))
      .rejects.toThrow("does not support encoded responses");
  });

  it("times out DNS and HTTP requests before continuing", async () => {
    vi.useFakeTimers();
    lookupMock.mockReturnValue(new Promise(() => undefined));
    const dnsPending = fetchPublicUrl("http://dns-hang.oxenn.testdomain/", { timeoutMs: 5 });
    const dnsExpectation = expect(dnsPending).rejects.toThrow("DNS lookup timed out");
    await vi.advanceTimersByTimeAsync(6);
    await dnsExpectation;
    expect(httpRequestMock).not.toHaveBeenCalled();

    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    routes.set("/hang", { hang: true });
    const requestPending = fetchPublicUrl("http://example.com/hang", { timeoutMs: 5 });
    const requestExpectation = expect(requestPending).rejects.toThrow("absolute time limit");
    await vi.advanceTimersByTimeAsync(6);
    await requestExpectation;
    vi.useRealTimers();
  });

  it("normalizes valid public HTTP URLs and removes fragments", () => {
    expect(parsePublicHttpUrl("http://example.com/docs#section").toString())
      .toBe("http://example.com/docs");
  });

  it.each([
    "file:///etc/passwd", "ftp://example.com/file", "http://localhost/", "http://service.local/",
    "http://metadata.google.internal/", "http://127.0.0.1/", "http://169.254.169.254/",
    "http://[::1]/", "http://[fc00::1]/", "https://user:pass@example.com/", "http://example.com:8080/"
  ])("rejects unsafe URL %s", (url) => {
    expect(() => parsePublicHttpUrl(url)).toThrow();
  });
});
