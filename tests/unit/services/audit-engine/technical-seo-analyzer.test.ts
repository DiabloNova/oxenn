if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  analyzeStructuredData,
  analyzeCrawlability,
  analyzeIndexability,
  analyzeInternalLinking,
  analyzeSitemap,
  analyzeCanonical,
  analyzeRobots,
  analyzeCoreWebVitals,
  TechnicalSeoAnalyzerService
} from "@/services/technical-seo-analyzer";
import { SeoSignals } from "@/types/seo-signals";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";

describe("Technical SEO Analyzer", () => {
  beforeEach(() => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn()
    };
    const pgClient = PostgresClient.getInstance();
    vi.spyOn(pgClient, "connectClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const healthySignals: SeoSignals = {
    page: {
      url: "https://example.com/home",
      normalizedUrl: "https://example.com/home",
      crawledAt: "2026-08-31T00:00:00.000Z",
      charset: "utf-8",
      language: "en"
    },
    metadata: {
      title: { value: "Healthy Home", present: true, count: 1, source: "tag" },
      description: { value: "Healthy Description", present: true, count: 1, source: "tag" },
      robots: { value: "index, follow", present: true },
      viewport: { value: "width=device-width", present: true },
      language: "en",
      charset: "utf-8",
      openGraph: {},
      twitter: {},
      rawMetadata: []
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], counts: {}, sequence: [] },
    canonical: { present: true, url: "https://example.com/home", normalizedUrl: "https://example.com/home", multiple: false, isValid: true, matchesPageUrl: true, occurrences: ["https://example.com/home"] },
    robots: { metaDirectives: ["index"], headerDirectives: [], directives: ["index"], indexAllowed: true, followAllowed: true, rawMeta: "index", rawHeader: null },
    sitemap: { discovered: true, url: "https://example.com/sitemap.xml", status: 200, parsedSuccessfully: true, urlsCount: 1, entries: ["https://example.com/home"], isIndex: false, lastModified: null, parseError: null },
    structuredData: { hasJsonLd: true, blocks: [{ type: "Article", payload: { headline: "Headline", author: "Author", publisher: "Publisher", datePublished: "2026-08-31" }, isParsed: true, parseError: null }], blocksCount: 1, schemaTypes: ["Article"], parseErrors: [], microdata: [] },
    internalLinks: { links: [{ sourceUrl: "https://example.com/home", targetUrl: "https://example.com/about", normalizedTargetUrl: "https://example.com/about", anchorText: "About Us", rel: null, isRelative: true, isExternal: false, isFragmentOnly: false }], internalCount: 1, externalCount: 0, relativeCount: 1, absoluteCount: 0, fragmentOnlyCount: 0, uniqueTargets: ["https://example.com/about"] },
    http: { statusCode: 200, isSuccess: true, isRedirect: false, isClientError: false, isServerError: false, headers: {} },
    redirects: { initialUrl: "https://example.com/home", finalUrl: "https://example.com/home", redirectChain: [], redirectStatusCodes: [], redirectLocations: [], redirectCount: 0, isLoop: false, excessiveCount: false },
    indexability: { isIndexable: true, status: "indexable", evidence: { statusCode: 200, robotsIndexAllowed: true, canonicalMatches: true, hasNoIndexDirective: false }, limitations: [] },
    contentStructure: { hasBody: true, hasMain: true, paragraphCount: 5, textBlockCount: 5, listCount: 0, tableCount: 0, imageCount: 1, videoCount: 0, semanticElements: [], wordCount: 300, textLength: 1200, headingToContentRatio: 0 },
    performance: { responseTimeMs: 150, downloadDurationMs: 50, responseSize: 1024, resourceCount: 5, isMeasured: true }
  };

  const criticalSignals: SeoSignals = {
    page: {
      url: "https://example.com/error-page",
      normalizedUrl: "https://example.com/error-page",
      crawledAt: "2026-08-31T00:00:00.000Z",
      charset: "utf-8",
      language: "en"
    },
    metadata: {
      title: { value: null, present: false, count: 0, source: "none" },
      description: { value: null, present: false, count: 0, source: "none" },
      robots: { value: "noindex, follow", present: true },
      viewport: { value: null, present: false },
      language: "en",
      charset: "utf-8",
      openGraph: {},
      twitter: {},
      rawMetadata: []
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], counts: {}, sequence: [] },
    canonical: { present: true, url: "https://example.com/different-target", normalizedUrl: "https://example.com/different-target", multiple: true, isValid: true, matchesPageUrl: false, occurrences: ["https://example.com/different-target", "https://example.com/another-one"] },
    robots: { metaDirectives: ["noindex", "index"], headerDirectives: [], directives: ["noindex", "index"], indexAllowed: false, followAllowed: true, rawMeta: "noindex, index", rawHeader: null },
    sitemap: { discovered: false, url: null, status: null, parsedSuccessfully: null, urlsCount: null, entries: [], isIndex: null, lastModified: null, parseError: null },
    structuredData: { hasJsonLd: true, blocks: [{ type: "Article", payload: {}, isParsed: false, parseError: "Malformed JSON" }], blocksCount: 1, schemaTypes: [], parseErrors: ["Malformed JSON"], microdata: [] },
    internalLinks: { links: [], internalCount: 0, externalCount: 0, relativeCount: 0, absoluteCount: 0, fragmentOnlyCount: 0, uniqueTargets: [] },
    http: { statusCode: 500, isSuccess: false, isRedirect: false, isClientError: false, isServerError: true, headers: {} },
    redirects: { initialUrl: "https://example.com/error-page", finalUrl: "https://example.com/error-page", redirectChain: ["https://example.com/1", "https://example.com/2"], redirectStatusCodes: [301, 301], redirectLocations: [], redirectCount: 2, isLoop: true, excessiveCount: true },
    indexability: { isIndexable: false, status: "non_200_status", evidence: { statusCode: 500, robotsIndexAllowed: false, canonicalMatches: false, hasNoIndexDirective: true }, limitations: ["HTTP Status 500"] },
    contentStructure: { hasBody: true, hasMain: false, paragraphCount: 0, textBlockCount: 0, listCount: 0, tableCount: 0, imageCount: 0, videoCount: 0, semanticElements: [], wordCount: 10, textLength: 100, headingToContentRatio: 0 },
    performance: { responseTimeMs: 3500, downloadDurationMs: 150, responseSize: 2000000, resourceCount: 50, isMeasured: true }
  };

  describe("Structured Data Analyzer", () => {
    it("returns no findings for healthy structured data", () => {
      const sdHealthy = analyzeStructuredData(healthySignals);
      expect(sdHealthy.length).toBe(0);
    });

    it("detects malformed JSON-LD", () => {
      const sdCritical = analyzeStructuredData(criticalSignals);
      const hasMalformed = sdCritical.some((f) => f.code === "ERR_STRUCT_JSONLD_MALFORMED");
      expect(hasMalformed).toBe(true);
    });

    it("detects missing required properties", () => {
      const missingRequiredSignals: SeoSignals = {
        ...healthySignals,
        structuredData: {
          hasJsonLd: true,
          blocks: [{ type: "Article", payload: { headline: "Just Headline" }, isParsed: true, parseError: null }],
          blocksCount: 1,
          schemaTypes: ["Article"],
          parseErrors: [],
          microdata: []
        }
      };
      const sdMissing = analyzeStructuredData(missingRequiredSignals);
      const hasMissingReq = sdMissing.some((f) => f.code === "ERR_STRUCT_REQUIRED_PROPERTY_MISSING");
      expect(hasMissingReq).toBe(true);
    });
  });

  describe("Crawlability Analyzer", () => {
    it("returns no findings for healthy crawlability", () => {
      const crawlHealthy = analyzeCrawlability(healthySignals);
      expect(crawlHealthy.length).toBe(0);
    });

    it("detects HTTP errors and redirect issues", () => {
      const crawlCritical = analyzeCrawlability(criticalSignals);
      const hasHttpError = crawlCritical.some((f) => f.code === "ERR_CRAWL_HTTP_ERROR");
      const hasRedirectIssue = crawlCritical.some((f) => f.code === "ERR_CRAWL_REDIRECT_ISSUE");
      expect(hasHttpError).toBe(true);
      expect(hasRedirectIssue).toBe(true);
    });
  });

  describe("Indexability Analyzer", () => {
    it("returns no findings for indexable page", () => {
      const idxHealthy = analyzeIndexability(healthySignals);
      expect(idxHealthy.length).toBe(0);
    });

    it("detects noindex directive", () => {
      const idxCritical = analyzeIndexability(criticalSignals);
      const hasNoindex = idxCritical.some((f) => f.code === "ERR_INDEX_NOINDEX");
      expect(hasNoindex).toBe(true);
    });
  });

  describe("Internal Linking Analyzer", () => {
    it("returns no findings for page with internal links", () => {
      const linkHealthy = analyzeInternalLinking(healthySignals);
      expect(linkHealthy.length).toBe(0);
    });

    it("detects orphan page without internal links", () => {
      const linkCritical = analyzeInternalLinking(criticalSignals);
      const hasOrphan = linkCritical.some((f) => f.code === "ERR_LINK_ORPHAN_PAGE");
      expect(hasOrphan).toBe(true);
    });
  });

  describe("Sitemap Analyzer", () => {
    it("returns no findings for healthy sitemap", () => {
      const sitemapHealthy = analyzeSitemap(healthySignals);
      expect(sitemapHealthy.length).toBe(0);
    });

    it("detects missing sitemap", () => {
      const sitemapCritical = analyzeSitemap(criticalSignals);
      const hasMissingSitemap = sitemapCritical.some((f) => f.code === "ERR_SITEMAP_MISSING");
      expect(hasMissingSitemap).toBe(true);
    });
  });

  describe("Canonical Analyzer", () => {
    it("returns no findings for healthy canonical tag", () => {
      const canonHealthy = analyzeCanonical(healthySignals);
      expect(canonHealthy.length).toBe(0);
    });

    it("detects multiple canonical tags", () => {
      const canonCritical = analyzeCanonical(criticalSignals);
      const hasMultipleCanon = canonCritical.some((f) => f.code === "ERR_CANONICAL_MULTIPLE");
      expect(hasMultipleCanon).toBe(true);
    });
  });

  describe("Robots Analyzer", () => {
    it("returns no findings for non-conflicting directives", () => {
      const robHealthy = analyzeRobots(healthySignals);
      expect(robHealthy.length).toBe(0);
    });

    it("detects robots directives conflicts", () => {
      const robCritical = analyzeRobots(criticalSignals);
      const hasConflict = robCritical.some((f) => f.code === "ERR_ROBOTS_DIRECTIVES_CONFLICT");
      expect(hasConflict).toBe(true);
    });
  });

  describe("Core Web Vitals Analyzer", () => {
    it("returns no findings for good web vitals", () => {
      const cwvHealthy = analyzeCoreWebVitals(healthySignals);
      expect(cwvHealthy.length).toBe(0);
    });

    it("detects slow response times and large page sizes", () => {
      const cwvCritical = analyzeCoreWebVitals(criticalSignals);
      const hasSlowResponse = cwvCritical.some((f) => f.code === "ERR_CWV_SLOW_RESPONSE");
      const hasLargePage = cwvCritical.some((f) => f.code === "ERR_CWV_LARGE_PAGE");
      expect(hasSlowResponse).toBe(true);
      expect(hasLargePage).toBe(true);
    });

    it("detects insufficient evidence when performance is unmeasured", () => {
      const unmeasuredSignals: SeoSignals = {
        ...healthySignals,
        performance: { responseTimeMs: null, downloadDurationMs: null, responseSize: 0, resourceCount: null, isMeasured: false }
      };
      const cwvUnmeasured = analyzeCoreWebVitals(unmeasuredSignals);
      const hasInsufficientEvidence = cwvUnmeasured.some((f) => f.code === "ERR_CWV_INSUFFICIENT_EVIDENCE");
      expect(hasInsufficientEvidence).toBe(true);
    });
  });

  describe("TechnicalSeoAnalyzerService Aggregation & Security Boundaries", () => {
    const tenantA = "tenant-alpha-uuid";
    const tenantB = "tenant-beta-uuid";
    const websiteId = "web-site-a1";

    const service = new TechnicalSeoAnalyzerService();

    it("aggregates findings across all domains for authorized tenant", async () => {
      await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-tech-test", async () => {
        const result = await service.executeTechnicalAudit(tenantA, websiteId, criticalSignals);
        expect(result.findings.length).toBeGreaterThan(5);

        const httpFailed = result.findings.find((f) => f.code === "ERR_CRAWL_HTTP_ERROR");
        expect(httpFailed).toBeDefined();
        expect(httpFailed?.category).toBe("technical");
        expect(httpFailed?.severity).toBe("critical");
      });
    });

    it("blocks cross-tenant operations with security violation error", async () => {
      await expect(
        TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-malicious", async () => {
          await service.executeTechnicalAudit(tenantA, websiteId, criticalSignals);
        })
      ).rejects.toThrow(/Security Violation: Cross-tenant operation blocked/);
    });
  });
});
