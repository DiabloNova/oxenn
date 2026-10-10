import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { normalizeUrl, isSafeUrl } from '@/lib/audit-engine/url-validator';
import { normalizeFeatures } from '@/lib/audit-engine/normalizer';
import { executeAudit } from '@/lib/audit-engine/builder';
import { AuditLogger } from '@/lib/audit-engine/logger';

// Standard Mock Pages for crawl interception
const MOCK_PAGES: Record<string, { status: number; body: string; headers?: Record<string, string> }> = {
  "https://secure-site.com": {
    status: 200,
    headers: { "content-type": "text/html" },
    body: `
      <html>
        <head>
          <title>بهینه‌سازی هوش مصنوعی - شرکت دانش‌بنیان رشا گستر</title>
          <meta name="description" content="سیستم مدیریت معنایی داده‌ها مبتنی بر هوش مصنوعی و گراف دانش برای ارتقای رتبه و ریتریوال مچینگ">
          <meta name="robots" content="index, follow">
          <link rel="canonical" href="https://secure-site.com">
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Rasha Gostar",
              "url": "https://secure-site.com"
            }
          </script>
        </head>
        <body>
          <h1>موتور هوشمند رشا گستر</h1>
          <p>سامانه مدیریت معنایی رشا گستر برای بهینه‌سازی دیده شدن برند شما در چت‌بات‌ها و دستیارها طراحی شده است.</p>
          <a href="/about">درباره رشا گستر</a>
          <a href="https://external-competitor.com">رقیب خارجی</a>
          <img src="/logo.png" alt="لوگو رشا گستر">
          <img src="/banner.png"> <!-- Missing Alt tag -->
        </body>
      </html>
    `
  },
  "https://secure-site.com/about": {
    status: 200,
    headers: { "content-type": "text/html" },
    body: `
      <html>
        <head><title>درباره ما</title></head>
        <body><p>اطلاعات تماس و آدرس.</p></body>
      </html>
    `
  },
  "https://redirect-site.com": {
    status: 301,
    headers: { "location": "https://secure-site.com" },
    body: "Redirecting..."
  },
  "https://ssrf-redirect-site.com": {
    status: 301,
    headers: { "location": "http://127.0.0.1/admin" },
    body: "Redirecting..."
  },
  "https://loop-redirect-1.com": {
    status: 302,
    headers: { "location": "https://loop-redirect-2.com" },
    body: "Redirecting..."
  },
  "https://loop-redirect-2.com": {
    status: 302,
    headers: { "location": "https://loop-redirect-1.com" },
    body: "Redirecting..."
  },
  "https://malformed-schema-site.com": {
    status: 200,
    headers: { "content-type": "text/html" },
    body: `
      <html>
        <head>
          <title>Malformed JSON-LD</title>
          <script type="application/ld+json">
            { "@context": "https://schema.org", "name": "Broken JSON"
          </script>
        </head>
        <body><p>This page has invalid schema format.</p></body>
      </html>
    `
  },
  "https://robots.txt": {
    status: 200,
    body: "User-agent: *\nAllow: /"
  },
  "https://sitemap.xml": {
    status: 200,
    body: "<urlset></urlset>"
  }
};

describe('Core Intelligence Audit Engine', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (init?.signal?.aborted) {
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        throw err;
      }

      if (urlStr.includes("slow-site.com")) {
        await new Promise(r => setTimeout(r, 100));
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        throw err;
      }

      if (urlStr.includes("huge-payload-site.com")) {
        const hugeBody = "X".repeat(3 * 1024 * 1024);
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers({ "content-type": "text/plain", "content-length": hugeBody.length.toString() }),
          text: async () => hugeBody,
          body: {
            getReader() {
              let readCount = 0;
              return {
                async read() {
                  if (readCount >= 3) return { done: true, value: undefined };
                  readCount++;
                  return { done: false, value: new Uint8Array(1.1 * 1024 * 1024) };
                },
                releaseLock() {}
              };
            }
          }
        } as unknown as Response;
      }

      const cleanUrlStr = urlStr.endsWith("/") ? urlStr.slice(0, -1) : urlStr;
      const matched = MOCK_PAGES[cleanUrlStr] || MOCK_PAGES[cleanUrlStr.replace(/\/robots\.txt|\/sitemap\.xml/, "")];
      if (matched) {
        const headers = new Headers(matched.headers || {});
        return {
          ok: matched.status < 400,
          status: matched.status,
          statusText: "OK",
          headers,
          text: async () => matched.body,
          body: {
            getReader() {
              let done = false;
              return {
                async read() {
                  if (done) return { done: true, value: undefined };
                  done = true;
                  return { done: false, value: new TextEncoder().encode(matched.body) };
                },
                releaseLock() {}
              };
            }
          }
        } as unknown as Response;
      }

      if (urlStr.endsWith("/robots.txt") || urlStr.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => ""
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        text: async () => "Not Found"
      } as unknown as Response;
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('normalizes URLs correctly', () => {
    const norm1 = normalizeUrl("example.com");
    expect(norm1.normalizedUrl).toBe("https://example.com/");

    const norm2 = normalizeUrl("http://MY-SITE.com/blog/");
    expect(norm2.normalizedUrl).toBe("http://my-site.com/blog");

    const norm3 = normalizeUrl("invalid-scheme://example.com");
    expect(norm3.isValid).toBe(false);
  });

  it('blocks SSRF and private IP addresses while permitting safe public URLs', () => {
    const unsafeUrls = [
      "https://localhost/admin",
      "http://127.0.0.1:8080",
      "http://[::1]/debug",
      "https://10.15.20.1/status",
      "http://172.19.4.200/secrets",
      "https://192.168.1.50/",
      "http://169.254.169.254/latest/meta-data",
      "https://metadata.google.internal/some-secret",
      "https://test-site.local",
      "https://something.internal"
    ];

    for (const url of unsafeUrls) {
      expect(isSafeUrl(url)).toBe(false);
    }

    const safeUrls = [
      "https://google.com",
      "https://snapp.ir/blog",
      "https://github.com/trending",
      "https://digikala.com"
    ];

    for (const url of safeUrls) {
      expect(isSafeUrl(url)).toBe(true);
    }
  });

  it('validates redirects and prevents redirect loops and SSRF redirects', async () => {
    const auditRedirect = await executeAudit("https://redirect-site.com");
    expect(auditRedirect.normalizedUrl).toBe("https://secure-site.com/");

    await expect(executeAudit("https://ssrf-redirect-site.com")).rejects.toThrow("SSRF Protection");
    await expect(executeAudit("https://loop-redirect-1.com")).rejects.toThrow("Maximum redirect depth");
  });

  it('enforces response body size limits (>2MB)', async () => {
    await expect(executeAudit("https://huge-payload-site.com")).rejects.toThrow("size limit exceeded");
  });

  it('handles request timeouts', async () => {
    await expect(executeAudit("https://slow-site.com")).rejects.toThrow(/timed out|aborted/);
  });

  it('validates JSON-LD schema extraction and scoring', async () => {

    const signalsRaw1 = await normalizeFeatures({
      technical: { statusCode: 200, isHttps: true, hasCanonical: true, robotsTxtAllowed: true, sitemapAvailable: true, responseTimeMs: 100, headers: {} },
      metadata: {},
      content: { wordCount: 100, headingHierarchy: {}, paragraphCount: 1, internalLinksCount: 1, externalLinksCount: 1, imageCount: 0, missingAltCount: 0, hasAuthor: false, hasPublishDate: false },
      entities: { detectedEntities: [], entityDensity: 0, hasBrandEntity: false },
      structuredData: { hasJsonLd: true, schemaTypes: ["Organization"], isValidSchema: true }
    });

    const signalsRaw2 = await normalizeFeatures({
      technical: { statusCode: 200, isHttps: true, hasCanonical: true, robotsTxtAllowed: true, sitemapAvailable: true, responseTimeMs: 100, headers: {} },
      metadata: {},
      content: { wordCount: 100, headingHierarchy: {}, paragraphCount: 1, internalLinksCount: 1, externalLinksCount: 1, imageCount: 0, missingAltCount: 0, hasAuthor: false, hasPublishDate: false },
      entities: { detectedEntities: [], entityDensity: 0, hasBrandEntity: false },
      structuredData: { hasJsonLd: true, schemaTypes: [], isValidSchema: false }
    });

    expect(signalsRaw1.structuredDataSignals.score).toBeGreaterThanOrEqual(80);
    expect(signalsRaw2.structuredDataSignals.score).toBeLessThanOrEqual(50);
  });

  it('produces 100% deterministic scoring reproducibility', async () => {
    const audit1 = await executeAudit("https://secure-site.com");
    const audit2 = await executeAudit("https://secure-site.com");

    expect(audit1.scores.overall).toBe(audit2.scores.overall);
    expect(JSON.stringify(audit1.scores.breakdown)).toBe(JSON.stringify(audit2.scores.breakdown));
    expect(JSON.stringify(audit1.recommendations)).toBe(JSON.stringify(audit2.recommendations));
  });
});
