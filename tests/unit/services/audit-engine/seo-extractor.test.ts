/**
 * Automated Enterprise Test Suite for SEO Signal Extraction Layer.
 * Verifies all 12 SEO Signal categories: metadata, headings, canonicals, robots,
 * sitemaps, structured data, links, HTTP status codes, redirects, indexability,
 * content structure, and performance.
 */

import { extractSeoSignals } from "@/lib/audit-engine/seo-extractor";
import { CrawlResult } from "@/types/audit";
import { describe, it, expect } from "vitest";


// Helper to construct a standard CrawlResult
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

// Global Fetch Interception Mock specifically for sitemap tests
const originalFetch = globalThis.fetch;
const sitemapMockData: Record<string, { status: number; body: string }> = {};

function setupSitemapFetchMock() {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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
  };
}

function restoreSitemapFetchMock() {
  globalThis.fetch = originalFetch;
}

describe("seo-extractor", () => {
  it("runs all tests", async () => {
  console.log("=========================================================================");
  console.log("SEO SIGNAL EXTRACTION LAYER — AUTOMATED UNIT & INTEGRATION TEST SUITE");
  console.log("=========================================================================");

  setupSitemapFetchMock();

  try {
    // ----------------------------------------------------
    // 1. Metadata Extraction Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Metadata Extraction...");

    // Case: Missing Title & Description
    const crawlMetaEmpty = makeCrawl({ rawHtml: "<html><head></head><body></body></html>" });
    const signalsMetaEmpty = await extractSeoSignals(crawlMetaEmpty);
    expect(signalsMetaEmpty.metadata.title.present).toBe(false);
    expect(signalsMetaEmpty.metadata.description.present).toBe(false);
    expect(signalsMetaEmpty.metadata.title.count).toBe(0);

    // Case: Title & Description Present, OG/Twitter fallbacks, duplicate title
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
    console.log("  ✅ Metadata Extraction verified successfully.");

    // ----------------------------------------------------
    // 2. Heading Hierarchy Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Heading Hierarchy...");

    // Case: No Headings
    const crawlHeadEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
    const signalsHeadEmpty = await extractSeoSignals(crawlHeadEmpty);
    expect(signalsHeadEmpty.headings.sequence.length).toBe(0);
    expect(signalsHeadEmpty.headings.counts.h1).toBe(0);

    // Case: Multi-level, document order, multiple H1s
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

    // Validate sequence preserves document order
    expect(signalsHeadHierarchy.headings.sequence[0].text).toBe("Second Heading");
    expect(signalsHeadHierarchy.headings.sequence[0].level).toBe(2);
    expect(signalsHeadHierarchy.headings.sequence[1].text).toBe("Main H1 First");
    expect(signalsHeadHierarchy.headings.sequence[1].level).toBe(1);
    console.log("  ✅ Heading Hierarchy verified successfully.");

    // ----------------------------------------------------
    // 3. Canonical Verification Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Canonical Link Extraction...");

    // Case: Missing Canonical
    const crawlCanEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
    const signalsCanEmpty = await extractSeoSignals(crawlCanEmpty);
    expect(signalsCanEmpty.canonical.present).toBe(false);
    expect(signalsCanEmpty.canonical.url).toBe(null);

    // Case: Multiple canonicals, invalid URL, relative URL
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
    console.log("  ✅ Canonical Link Extraction verified successfully.");

    // ----------------------------------------------------
    // 4. Robots Directives Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Robots Directives Parsing...");

    // Case: Meta robots index, follow + Header noarchive, noimageindex
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
    console.log("  ✅ Robots Directives Parsing verified successfully.");

    // ----------------------------------------------------
    // 5. XML Sitemap Discovery & Parsing Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Sitemap Processing & XML parsing...");

    // Case A: Missing sitemap (404)
    sitemapMockData["https://example.com/sitemap.xml"] = { status: 404, body: "Not Found" };
    const crawlSitemap404 = makeCrawl({ url: "https://example.com" });
    const signalsSitemap404 = await extractSeoSignals(crawlSitemap404);
    expect(signalsSitemap404.sitemap.discovered).toBe(false);
    expect(signalsSitemap404.sitemap.status).toBe(404);
    expect(signalsSitemap404.sitemap.parsedSuccessfully).toBe(false);

    // Case B: Valid standard Sitemap URL Set
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
    const signalsSitemap200 = await extractSeoSignals(crawlSitemap404);
    expect(signalsSitemap200.sitemap.discovered).toBe(true);
    expect(signalsSitemap200.sitemap.isIndex).toBe(false);
    expect(signalsSitemap200.sitemap.urlsCount).toBe(2);
    expect(signalsSitemap200.sitemap.lastModified).toBe("2026-08-11");
    expect(signalsSitemap200.sitemap.entries).toEqual([
      "https://example.com/home",
      "https://example.com/blog"
    ]);

    // Case C: Nested Sitemap Index
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
    const signalsSitemapIndex = await extractSeoSignals(crawlSitemap404);
    expect(signalsSitemapIndex.sitemap.discovered).toBe(true);
    expect(signalsSitemapIndex.sitemap.isIndex).toBe(true);
    expect(signalsSitemapIndex.sitemap.urlsCount).toBe(1);
    expect(signalsSitemapIndex.sitemap.entries[0]).toBe("https://example.com/sub-sitemap-1.xml");

    // Case D: Malformed XML (Parse resilience)
    sitemapMockData["https://example.com/sitemap.xml"] = {
      status: 200,
      body: "<invalid-xml><url><loc>broken"
    };
    const signalsSitemapMalformed = await extractSeoSignals(crawlSitemap404);
    expect(signalsSitemapMalformed.sitemap.discovered).toBe(true);
    // Cheerio/xmlMode parses broken tags leniently
    expect(signalsSitemapMalformed.sitemap.parsedSuccessfully).toBe(true);
    console.log("  ✅ XML Sitemap Processing verified successfully.");

    // ----------------------------------------------------
    // 6. Structured Data Extraction Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Structured Data Extraction...");

    // Case: Valid JSON-LD block + Malformed JSON-LD block + Microdata
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

    // Block 0: Valid Product block
    expect(signalsStructured.structuredData.blocks[0].isParsed).toBe(true);
    expect(signalsStructured.structuredData.blocks[0].type).toBe("Product");

    // Block 1: Malformed block
    expect(signalsStructured.structuredData.blocks[1].isParsed).toBe(false);
    expect(signalsStructured.structuredData.blocks[1].parseError).not.toBe(null);

    // Schema Types Collected
    expect(signalsStructured.structuredData.schemaTypes).toEqual(["Product"]);

    // Microdata Extraction
    expect(signalsStructured.structuredData.microdata.length).toBe(1);
    expect(signalsStructured.structuredData.microdata[0].type).toBe("https://schema.org/LocalBusiness");
    expect(signalsStructured.structuredData.microdata[0].properties.name).toBe("Snapp HQ");
    expect(signalsStructured.structuredData.microdata[0].properties.telephone).toBe("021-12345");
    console.log("  ✅ Structured Data Extraction verified successfully.");

    // ----------------------------------------------------
    // 7. Internal & External Links Verification Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Internal & External Links...");

    // Case: Subdomains, ports, relative/absolute links, query strings, duplicates
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
    expect(signalsLinks.internalLinks.internalCount).toBe(5); // /pricing, ./about, contact, fragment, duplicate
    expect(signalsLinks.internalLinks.externalCount).toBe(1); // different-site.com
    expect(signalsLinks.internalLinks.relativeCount).toBe(3); // /pricing, ./about, duplicate pricing
    expect(signalsLinks.internalLinks.fragmentOnlyCount).toBe(1); // #section-2

    // Unique targets count (no duplicates)
    expect(signalsLinks.internalLinks.uniqueTargets.includes("https://sub.my-site.com:8080/pricing")).toBe(true);
    expect(signalsLinks.internalLinks.uniqueTargets.includes("https://different-site.com/home")).toBe(true);
    console.log("  ✅ Links Classification verified successfully.");

    // ----------------------------------------------------
    // 8. HTTP Status Codes & Redirects Tests
    // ----------------------------------------------------
    console.log("▶ TEST: HTTP Response Codes & Redirects...");

    // Case 1: HTTP 200 OK
    const crawl200 = makeCrawl({ statusCode: 200 });
    const signals200 = await extractSeoSignals(crawl200);
    expect(signals200.http.statusCode).toBe(200);
    expect(signals200.http.isSuccess).toBe(true);
    expect(signals200.http.isRedirect).toBe(false);

    // Case 2: HTTP 404 Client Error
    const crawl404 = makeCrawl({ statusCode: 404 });
    const signals404 = await extractSeoSignals(crawl404);
    expect(signals404.http.statusCode).toBe(404);
    expect(signals404.http.isClientError).toBe(true);

    // Case 3: Redirect loops & chains
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

    // Case 4: Redirect Loop
    const crawlRedirectLoop = makeCrawl({
      statusCode: 200,
      url: "https://example.com/loop-1",
      redirectChain: ["https://example.com/loop-1", "https://example.com/loop-2"],
      redirectDepth: 2
    });
    const signalsRedirectLoop = await extractSeoSignals(crawlRedirectLoop);
    expect(signalsRedirectLoop.redirects.isLoop).toBe(true);
    console.log("  ✅ HTTP & Redirects verified successfully.");

    // ----------------------------------------------------
    // 9. Indexability Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Indexability Assessment...");

    // Case A: Success 200, clean index/follow → Indexable
    const crawlIndexable = makeCrawl({
      rawHtml: "<html><head><title>OK</title></head><body></body></html>"
    });
    const signalsIndexable = await extractSeoSignals(crawlIndexable);
    expect(signalsIndexable.indexability.isIndexable).toBe(true);
    expect(signalsIndexable.indexability.status).toBe("indexable");

    // Case B: Success 200, meta noindex → Noindex
    const crawlNoIndex = makeCrawl({
      rawHtml: '<html><head><meta name="robots" content="noindex"></head><body></body></html>'
    });
    const signalsNoIndex = await extractSeoSignals(crawlNoIndex);
    expect(signalsNoIndex.indexability.isIndexable).toBe(false);
    expect(signalsNoIndex.indexability.status).toBe("noindex");

    // Case C: non-200 Status
    const crawlNon200 = makeCrawl({ statusCode: 500, rawHtml: "Error" });
    const signalsNon200 = await extractSeoSignals(crawlNon200);
    expect(signalsNon200.indexability.isIndexable).toBe(false);
    expect(signalsNon200.indexability.status).toBe("non_200_status");
    console.log("  ✅ Indexability Evidence verified successfully.");

    // ----------------------------------------------------
    // 10. Content Structure Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Content Structure Observations...");

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
    expect(signalsContent.contentStructure.wordCount > 10).toBe(true);
    console.log("  ✅ Content Structure verified successfully.");

    // ----------------------------------------------------
    // 11. Performance Metrics Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Performance Timing data extraction...");

    // Case A: Performance data measured
    const crawlPerf = makeCrawl({ bodySize: 1024 });
    const signalsPerf = await extractSeoSignals(crawlPerf, { responseTimeMs: 420, downloadDurationMs: 80 });
    expect(signalsPerf.performance.isMeasured).toBe(true);
    expect(signalsPerf.performance.responseTimeMs).toBe(420);
    expect(signalsPerf.performance.downloadDurationMs).toBe(80);
    expect(signalsPerf.performance.responseSize).toBe(1024);

    // Case B: Performance data missing/unavailable
    const signalsPerfMissing = await extractSeoSignals(crawlPerf);
    expect(signalsPerfMissing.performance.isMeasured).toBe(false);
    expect(signalsPerfMissing.performance.responseTimeMs).toBe(null);
    expect(signalsPerfMissing.performance.downloadDurationMs).toBe(null);
    console.log("  ✅ Performance Timing verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL SEO SIGNAL EXTRACTION TESTS COMPLETED SUCCESSFULLY!");
    console.log("=========================================================================");

  } finally {
    restoreSitemapFetchMock();
  }
  });
});

