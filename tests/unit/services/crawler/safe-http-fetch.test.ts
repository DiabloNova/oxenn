import { describe, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import { fetchPublicUrl, isPublicIpAddress, parsePublicHttpUrl } from "@/services/crawler/safe-http-fetch";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

describe("crawler outbound URL policy", () => {
  it("allows globally routable IPv4 addresses", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("1.1.1.1")).toBe(true);
  });

  it("rejects private, loopback, link-local and reserved IPv4 addresses", () => {
    for (const address of [
      "0.0.0.0",
      "10.0.0.1",
      "100.64.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "192.168.1.1",
      "198.18.0.1",
      "203.0.113.10",
      "224.0.0.1",
    ]) {
      expect(isPublicIpAddress(address), address).toBe(false);
    }
  });

  it("allows global-unicast IPv6 and rejects non-public IPv6 ranges", () => {
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
    expect(isPublicIpAddress("2001:4860:4860::8888")).toBe(true);
    expect(isPublicIpAddress("::1")).toBe(false);
    expect(isPublicIpAddress("fc00::1")).toBe(false);
    expect(isPublicIpAddress("fe80::1")).toBe(false);
    expect(isPublicIpAddress("2001:db8::1")).toBe(false);
    expect(isPublicIpAddress("::ffff:127.0.0.1")).toBe(false);
  });

  it("rejects a hostname when any DNS answer is non-public", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.8", family: 4 },
    ]);

    await expect(fetchPublicUrl("https://example.com/"))
      .rejects.toThrow("non-public DNS address");
  });

  it("normalizes valid public HTTP URLs and removes fragments", () => {
    expect(parsePublicHttpUrl("https://example.com/docs#section").toString())
      .toBe("https://example.com/docs");
  });

  it.each([
    "file:///etc/passwd",
    "ftp://example.com/file",
    "http://localhost/",
    "http://service.local/",
    "http://metadata.google.internal/",
    "http://127.0.0.1/",
    "http://169.254.169.254/",
    "http://[::1]/",
    "http://[fc00::1]/",
    "https://user:pass@example.com/",
    "http://example.com:8080/",
  ])("rejects unsafe URL %s", (url) => {
    expect(() => parsePublicHttpUrl(url)).toThrow();
  });
});
