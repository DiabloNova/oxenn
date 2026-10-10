import { describe, it, expect } from "vitest";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";

describe("testUrl", () => {
  it("runs", () => {
    const corpus = [
      "https://example.com",
      "https://EXAMPLE.com:443/a/../b/",
      "https://example.com/a?b=2&a=1&a=0#fragment",
      "https://example.com/a?x=%2f+y",
      "https://[2606:4700::1111]/"
    ];
    for (const input of corpus) {
      const first = normalizeUrl(input);
      expect(first.ok).toEqual(true);
      if (first.ok) {
        const second = normalizeUrl(first.value.canonical);
        expect(second.ok).toEqual(true);
        if (second.ok) {
          expect(second.value.canonical).toEqual(first.value.canonical);
        }
      }
    }
    const result = normalizeUrl(
      "HTTPS://Example.COM:443/a/../b/?utm_source=x&z=2&z=1#fragment"
    );
    expect(result.ok).toEqual(true);
    if (result.ok) {
      expect(result.value.canonical).toEqual("https://example.com/b/?z=1&z=2");
    }
    const trackingOff = normalizeUrl("https://example.com/a?gclid=x", false);
    expect(trackingOff.ok).toEqual(true);
    if (trackingOff.ok) {
      expect(trackingOff.value.query).toEqual("gclid=x");
    }
    expect(normalizeUrl("https://user:pass@example.com").ok).toEqual(false);
    expect(normalizeUrl("ftp://example.com").ok).toEqual(false);
    expect(normalizeUrl("https://例え.テスト").ok).toEqual(true);
    const ipv6 = normalizeUrl("http://[2606:4700::1111]");
    expect(ipv6.ok).toEqual(true);
    if (ipv6.ok) {
      expect(ipv6.value.canonical).toEqual("http://[2606:4700::1111]/");
      expect(normalizeUrl(ipv6.value.canonical).ok).toEqual(true);
    }
  });
});
