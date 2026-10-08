import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractSeoSignals } from "@/lib/audit-engine/seo-extractor";
import { CrawlResult } from "@/types/audit";

function makeCrawl(options: Partial<CrawlResult> & { rawHtml?: string }): CrawlResult {
  const html = options.rawHtml ?? "<html><body></body></html>";
  return {
    url: "https://example.com",
    statusCode: 200,
    headers: {},
    isHttps: true,
    redirectChain: [],
    redirectDepth: 0,
    bodySize: Buffer.byteLength(html, "utf-8"),
    rawHtml: html,
    ...options
  };
}

describe("SEO Signal Extraction Layer", () => {
  const originalFetch = globalThis.fetch;
  const sitemapMockData: Record<string, { status: number; body: string }> = {};

  beforeEach(() => {
    // Clear mock sitemap data before each test
    for (const key of Object.keys(sitemapMockData)) {
      delete sitemapMockData[key];
    }

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();

      if (init?.signal?.aborted) {
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        throw err;
      }

      if (sitemapMockData[urlStr]) {
        const matched = sitemapMockData[urlStr];
        return {
          ok: matched.status >= 200 && matched.status < 300,
          status: matched.status,
          statusText: matched.status === 200 ? "OK" : "Error",
          headers: new Headers(),
          text: async () => matched.body
        } as unknown as Response;
      }

      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        text: async () => "Not Found"
      } as unknown as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Metadata Extraction", () => {
    it("handles missing title and description gracefully", async () => {
      const crawlMetaEmpty = makeCrawl({ rawHtml: "<html><head></head><body></body></html>" });
      const signalsMetaEmpty = await extractSeoSignals(crawlMetaEmpty);
      expect(signalsMetaEmpty.metadata.title.present).toBe(false);
      expect(signalsMetaEmpty.metadata.description.present).toBe(false);
      expect(signalsMetaEmpty.metadata.title.count).toBe(0);
    });

    it("extracts title, description, viewport, and charset when present", async () => {
      const crawlMetaFull = makeCrawl({
        rawHtml: `
          <html>
            <head>
              <title>My Primary Title</title>
              <title>My Duplicate Title</title>
              <meta name="description" content="My primary description.">
              <meta property="og:title" content="OG Title">
              <meta name="twitter:description" content="Twitter Desc">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta charset="utf-8">
            </head>
            <body></body>
          </html>
        `
      });
      const signalsMetaFull = await extractSeoSignals(crawlMetaFull);
      expect(signalsMetaFull.metadata.title.present).toBe(true);
      expect(signalsMetaFull.metadata.title.value).toBe("My Primary Title");
      expect(signalsMetaFull.metadata.title.count).toBe(2);
      expect(signalsMetaFull.metadata.title.source).toBe("tag");

      expect(signalsMetaFull.metadata.description.present).toBe(true);
      expect(signalsMetaFull.metadata.description.value).toBe("My primary description.");
      expect(signalsMetaFull.metadata.description.count).toBe(1);

      expect(signalsMetaFull.metadata.viewport.present).toBe(true);
      expect(signalsMetaFull.metadata.viewport.value).toBe("width=device-width, initial-scale=1.0");
      expect(signalsMetaFull.metadata.charset).toBe("utf-8");
    });
  });

  describe("Heading Hierarchy", () => {
    it("handles missing headings", async () => {
      const crawlHeadEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
      const signalsHeadEmpty = await extractSeoSignals(crawlHeadEmpty);
      expect(signalsHeadEmpty.headings.sequence.length).toBe(0);
      expect(signalsHeadEmpty.headings.counts.h1).toBe(0);
    });

    it("extracts multi-level headings and preserves document order", async () => {
      const crawlHeadHierarchy = makeCrawl({
        rawHtml: `
          <html>
            <body>
              <h2>Second Heading</h2>
              <h1>Main H1 First</h1>
              <h3>Third Heading</h3>
              <h1>Duplicate H1</h1>
              <h6>Very Low Heading</h6>
            </body>
          </html>
        `
      });
      const signalsHeadHierarchy = await extractSeoSignals(crawlHeadHierarchy);
      expect(signalsHeadHierarchy.headings.counts.h1).toBe(2);
      expect(signalsHeadHierarchy.headings.counts.h2).toBe(1);
      expect(signalsHeadHierarchy.headings.counts.h6).toBe(1);

      expect(signalsHeadHierarchy.headings.sequence[0].text).toBe("Second Heading");
      expect(signalsHeadHierarchy.headings.sequence[0].level).toBe(2);
      expect(signalsHeadHierarchy.headings.sequence[1].text).toBe("Main H1 First");
      expect(signalsHeadHierarchy.headings.sequence[1].level).toBe(1);
    });
  });

  describe("Canonical Link Extraction", () => {
    it("handles missing canonical tag", async () => {
      const crawlCanEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
      const signalsCanEmpty = await extractSeoSignals(crawlCanEmpty);
      expect(signalsCanEmpty.canonical.present).toBe(false);
      expect(signalsCanEmpty.canonical.url).toBeNull();
    });

    it("handles multiple canonical tags and checks page match", async () => {
      const crawlCanComplex = makeCrawl({
        url: "https://example.com/subpage",
        rawHtml: `
          <html>
            <head>
              <link rel="canonical" href="https://example.com/subpage">
              <link rel="canonical" href="/relative-path">
            </head>
            <body></body>
          </html>
        `
      });
      const signalsCanComplex = await extractSeoSignals(crawlCanComplex);
      expect(signalsCanComplex.canonical.present).toBe(true);
      expect(signalsCanComplex.canonical.url).toBe("https://example.com/subpage");
      expect(signalsCanComplex.canonical.multiple).toBe(true);
      expect(signalsCanComplex.canonical.isValid).toBe(true);
      expect(signalsCanComplex.canonical.matchesPageUrl).toBe(true);
      expect(signalsCanComplex.canonical.occurrences.length).toBe(2);
    });
  });

  describe("Robots Directives Parsing", () => {
    it("parses meta robots and X-Robots-Tag header directives", async () => {
      const crawlRobots = makeCrawl({
        headers: { "X-Robots-Tag": "noarchive, noimageindex" },
        rawHtml: `
          <html>
            <head>
              <meta name="robots" content="noindex, follow">
            </head>
            <body></body>
          </html>
        `
      });
      const signalsRobots = await extractSeoSignals(crawlRobots);
      expect(signalsRobots.robots.metaDirectives).toEqual(["noindex", "follow"]);
      expect(signalsRobots.robots.headerDirectives).toEqual(["noarchive", "noimageindex"]);
      expect(signalsRobots.robots.directives.includes("noindex")).toBe(true);
      expect(signalsRobots.robots.directives.includes("noarchive")).toBe(true);
      expect(signalsRobots.robots.indexAllowed).toBe(false);
      expect(signalsRobots.robots.followAllowed).toBe(true);
    });
  });

  describe("XML Sitemap Discovery & Parsing", () => {
    it("handles missing sitemap (404)", async () => {
      sitemapMockData["https://example.com/sitemap.xml"] = { status: 404, body: "Not Found" };
      const crawlSitemap404 = makeCrawl({ url: "https://example.com" });
      const signalsSitemap404 = await extractSeoSignals(crawlSitemap404);
      expect(signalsSitemap404.sitemap.discovered).toBe(false);
      expect(signalsSitemap404.sitemap.status).toBe(404);
      expect(signalsSitemap404.sitemap.parsedSuccessfully).toBe(false);
    });

    it("parses valid standard XML urlset sitemap", async () => {
      sitemapMockData["https://example.com/sitemap.xml"] = {
        status: 200,
        body: `
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
              <loc>https://example.com/home</loc>
              <lastmod>2026-08-11</lastmod>
            </url>
            <url>
              <loc>https://example.com/blog</loc>
              <lastmod>2026-08-10</lastmod>
            </url>
          </urlset>
        `
      };
      const crawl = makeCrawl({ url: "https://example.com" });
      const signals = await extractSeoSignals(crawl);
      expect(signals.sitemap.discovered).toBe(true);
      expect(signals.sitemap.isIndex).toBe(false);
      expect(signals.sitemap.urlsCount).toBe(2);
      expect(signals.sitemap.lastModified).toBe("2026-08-11");
      expect(signals.sitemap.entries).toEqual([
        "https://example.com/home",
        "https://example.com/blog"
      ]);
    });

    it("parses nested sitemap index", async () => {
      sitemapMockData["https://example.com/sitemap.xml"] = {
        status: 200,
        body: `
          <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <sitemap>
              <loc>https://example.com/sub-sitemap-1.xml</loc>
              <lastmod>2026-08-15</lastmod>
            </sitemap>
          </sitemapindex>
        `
      };
      const crawl = makeCrawl({ url: "https://example.com" });
      const signals = await extractSeoSignals(crawl);
      expect(signals.sitemap.discovered).toBe(true);
      expect(signals.sitemap.isIndex).toBe(true);
      expect(signals.sitemap.urlsCount).toBe(1);
      expect(signals.sitemap.entries[0]).toBe("https://example.com/sub-sitemap-1.xml");
    });

    it("handles malformed XML resiliently", async () => {
      sitemapMockData["https://example.com/sitemap.xml"] = {
        status: 200,
        body: "<invalid-xml><url><loc>broken"
      };
      const crawl = makeCrawl({ url: "https://example.com" });
      const signals = await extractSeoSignals(crawl);
      expect(signals.sitemap.discovered).toBe(true);
      expect(signals.sitemap.parsedSuccessfully).toBe(true);
    });
  });

  describe("Structured Data Extraction", () => {
    it("extracts valid and malformed JSON-LD plus microdata", async () => {
      const crawlStructured = makeCrawl({
        rawHtml: `
          <html>
            <head>
              <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": "Super AI Engine"
                }
              </script>
              <script type="application/ld+json">
                { "@context": "https://schema.org", "name": "Broken Schema"
              </script>
            </head>
            <body>
              <div itemscope itemtype="https://schema.org/LocalBusiness">
                <span itemprop="name">Snapp HQ</span>
                <span itemprop="telephone">021-12345</span>
              </div>
            </body>
          </html>
        `
      });
      const signalsStructured = await extractSeoSignals(crawlStructured);
      expect(signalsStructured.structuredData.hasJsonLd).toBe(true);
      expect(signalsStructured.structuredData.blocksCount).toBe(2);

      expect(signalsStructured.structuredData.blocks[0].isParsed).toBe(true);
      expect(signalsStructured.structuredData.blocks[0].type).toBe("Product");

      expect(signalsStructured.structuredData.blocks[1].isParsed).toBe(false);
      expect(signalsStructured.structuredData.blocks[1].parseError).not.toBeNull();

      expect(signalsStructured.structuredData.schemaTypes).toEqual(["Product"]);

      expect(signalsStructured.structuredData.microdata.length).toBe(1);
      expect(signalsStructured.structuredData.microdata[0].type).toBe("https://schema.org/LocalBusiness");
      expect(signalsStructured.structuredData.microdata[0].properties.name).toBe("Snapp HQ");
      expect(signalsStructured.structuredData.microdata[0].properties.telephone).toBe("021-12345");
    });
  });

  describe("Internal & External Links Verification", () => {
    it("classifies internal, external, relative, and fragment links correctly", async () => {
      const crawlLinks = makeCrawl({
        url: "https://sub.my-site.com:8080/landing?ref=1",
        rawHtml: `
          <html>
            <body>
              <a href="/pricing">Relative path</a>
              <a href="./about">Relative dot</a>
              <a href="https://sub.my-site.com:8080/contact#faq">Absolute Internal with Query/Port</a>
              <a href="https://different-site.com/home">Absolute External</a>
              <a href="#section-2">Fragment Only</a>
              <a href="/pricing">Duplicate relative pricing</a>
            </body>
          </html>
        `
      });
      const signalsLinks = await extractSeoSignals(crawlLinks);
      expect(signalsLinks.internalLinks.links.length).toBe(6);
      expect(signalsLinks.internalLinks.internalCount).toBe(5);
      expect(signalsLinks.internalLinks.externalCount).toBe(1);
      expect(signalsLinks.internalLinks.relativeCount).toBe(3);
      expect(signalsLinks.internalLinks.fragmentOnlyCount).toBe(1);

      expect(signalsLinks.internalLinks.uniqueTargets.includes("https://sub.my-site.com:8080/pricing")).toBe(true);
      expect(signalsLinks.internalLinks.uniqueTargets.includes("https://different-site.com/home")).toBe(true);
    });
  });

  describe("HTTP Response Codes & Redirects", () => {
    it("handles HTTP 200 OK", async () => {
      const crawl200 = makeCrawl({ statusCode: 200 });
      const signals200 = await extractSeoSignals(crawl200);
      expect(signals200.http.statusCode).toBe(200);
      expect(signals200.http.isSuccess).toBe(true);
      expect(signals200.http.isRedirect).toBe(false);
    });

    it("handles HTTP 404 Client Error", async () => {
      const crawl404 = makeCrawl({ statusCode: 404 });
      const signals404 = await extractSeoSignals(crawl404);
      expect(signals404.http.statusCode).toBe(404);
      expect(signals404.http.isClientError).toBe(true);
    });

    it("handles redirect chains", async () => {
      const crawlRedirectChain = makeCrawl({
        statusCode: 200,
        url: "https://example.com/final",
        redirectChain: ["https://example.com/start", "https://example.com/middle"],
        redirectDepth: 2
      });
      const signalsRedirect = await extractSeoSignals(crawlRedirectChain);
      expect(signalsRedirect.redirects.redirectCount).toBe(2);
      expect(signalsRedirect.redirects.initialUrl).toBe("https://example.com/start");
      expect(signalsRedirect.redirects.finalUrl).toBe("https://example.com/final");
      expect(signalsRedirect.redirects.isLoop).toBe(false);
      expect(signalsRedirect.redirects.excessiveCount).toBe(false);
    });

    it("detects redirect loops", async () => {
      const crawlRedirectLoop = makeCrawl({
        statusCode: 200,
        url: "https://example.com/loop-1",
        redirectChain: ["https://example.com/loop-1", "https://example.com/loop-2"],
        redirectDepth: 2
      });
      const signalsRedirectLoop = await extractSeoSignals(crawlRedirectLoop);
      expect(signalsRedirectLoop.redirects.isLoop).toBe(true);
    });
  });

  describe("Indexability Assessment", () => {
    it("evaluates clean 200 response as indexable", async () => {
      const crawlIndexable = makeCrawl({
        rawHtml: "<html><head><title>OK</title></head><body></body></html>"
      });
      const signalsIndexable = await extractSeoSignals(crawlIndexable);
      expect(signalsIndexable.indexability.isIndexable).toBe(true);
      expect(signalsIndexable.indexability.status).toBe("indexable");
    });

    it("evaluates meta noindex response as non-indexable", async () => {
      const crawlNoIndex = makeCrawl({
        rawHtml: '<html><head><meta name="robots" content="noindex"></head><body></body></html>'
      });
      const signalsNoIndex = await extractSeoSignals(crawlNoIndex);
      expect(signalsNoIndex.indexability.isIndexable).toBe(false);
      expect(signalsNoIndex.indexability.status).toBe("noindex");
    });

    it("evaluates non-200 HTTP response status as non-indexable", async () => {
      const crawlNon200 = makeCrawl({ statusCode: 500, rawHtml: "Error" });
      const signalsNon200 = await extractSeoSignals(crawlNon200);
      expect(signalsNon200.indexability.isIndexable).toBe(false);
      expect(signalsNon200.indexability.status).toBe("non_200_status");
    });
  });

  describe("Content Structure Observations", () => {
    it("extracts structural element counts and word counts", async () => {
      const crawlContentStructure = makeCrawl({
        rawHtml: `
          <html>
            <body>
              <main>
                <h1>Main Title</h1>
                <p>This is paragraph number one which contains some simple text content.</p>
                <p>This is paragraph number two with SnappSnappSnapp Snapp.</p>
                <ul>
                  <li>List Item 1</li>
                  <li>List Item 2</li>
                </ul>
                <table>
                  <tr><td>Cell</td></tr>
                </table>
                <img src="/logo.png">
                <video src="/trailer.mp4"></video>
              </main>
            </body>
          </html>
        `
      });
      const signalsContent = await extractSeoSignals(crawlContentStructure);
      expect(signalsContent.contentStructure.hasBody).toBe(true);
      expect(signalsContent.contentStructure.hasMain).toBe(true);
      expect(signalsContent.contentStructure.paragraphCount).toBe(2);
      expect(signalsContent.contentStructure.listCount).toBe(1);
      expect(signalsContent.contentStructure.tableCount).toBe(1);
      expect(signalsContent.contentStructure.imageCount).toBe(1);
      expect(signalsContent.contentStructure.videoCount).toBe(1);
      expect(signalsContent.contentStructure.wordCount).toBeGreaterThan(10);
    });
  });

  describe("Performance Timing Data Extraction", () => {
    it("extracts performance measurements when provided", async () => {
      const crawlPerf = makeCrawl({ bodySize: 1024 });
      const signalsPerf = await extractSeoSignals(crawlPerf, { responseTimeMs: 420, downloadDurationMs: 80 });
      expect(signalsPerf.performance.isMeasured).toBe(true);
      expect(signalsPerf.performance.responseTimeMs).toBe(420);
      expect(signalsPerf.performance.downloadDurationMs).toBe(80);
      expect(signalsPerf.performance.responseSize).toBe(1024);
    });

    it("handles missing performance options gracefully", async () => {
      const crawlPerf = makeCrawl({ bodySize: 1024 });
      const signalsPerfMissing = await extractSeoSignals(crawlPerf);
      expect(signalsPerfMissing.performance.isMeasured).toBe(false);
      expect(signalsPerfMissing.performance.responseTimeMs).toBeNull();
      expect(signalsPerfMissing.performance.downloadDurationMs).toBeNull();
    });
  });
});
