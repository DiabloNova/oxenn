if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import {
  SiteArchitectureAnalyzerService,
  normalizeGraphUrl
} from "@/features/ai-intelligence/services/site-architecture-analyzer-service";
import { Page } from "@/features/ai-intelligence/domain/types";

describe("Site Architecture Intelligence", () => {
  const tenantA = "tenant-alpha-001";
  const tenantB = "tenant-beta-002";
  const websiteId = "web-site-arch-01";

  const analyzer = new SiteArchitectureAnalyzerService();

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

  function createMockPage(url: string, path: string, title?: string): Page {
    return {
      id: `pg-${path.replace(/\//g, "-")}`,
      organizationId: tenantA,
      websiteId,
      url,
      normalizedUrl: url,
      path,
      statusCode: 200,
      indexability: "indexable",
      title: title || path,
      audit: {
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        createdBy: "test",
        updatedBy: "test",
        version: 1
      }
    };
  }

  it("calculates crawl depth accurately via BFS", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-1", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/section", "/section"),
        createMockPage("https://site.com/section/topic", "/section/topic"),
        createMockPage("https://site.com/section/topic/page", "/section/topic/page")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/section", normalizedTargetUrl: "https://site.com/section" },
        { sourceUrl: "https://site.com/section", targetUrl: "https://site.com/section/topic", normalizedTargetUrl: "https://site.com/section/topic" },
        { sourceUrl: "https://site.com/section/topic", targetUrl: "https://site.com/section/topic/page", normalizedTargetUrl: "https://site.com/section/topic/page" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const depthMap = new Map(res.crawlDepths.map((cd) => [normalizeGraphUrl(cd.url), cd.crawlDepth]));

      expect(depthMap.get(normalizeGraphUrl("https://site.com/"))).toBe(0);
      expect(depthMap.get(normalizeGraphUrl("https://site.com/section"))).toBe(1);
      expect(depthMap.get(normalizeGraphUrl("https://site.com/section/topic"))).toBe(2);
      expect(depthMap.get(normalizeGraphUrl("https://site.com/section/topic/page"))).toBe(3);
      expect(res.metrics.maxCrawlDepth).toBe(3);
    });
  });

  it("detects orphan pages", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-2", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/products", "/products"),
        createMockPage("https://site.com/products/a", "/products/a"),
        createMockPage("https://site.com/orphan", "/orphan")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/products", normalizedTargetUrl: "https://site.com/products" },
        { sourceUrl: "https://site.com/products", targetUrl: "https://site.com/products/a", normalizedTargetUrl: "https://site.com/products/a" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      expect(res.orphanCandidates.includes("https://site.com/orphan")).toBe(true);
      const orphanFinding = res.findings.find(
        (f) => f.code === "ERR_ORPHAN_PAGE_DETECTED" && f.affectedResource === "https://site.com/orphan"
      );
      expect(orphanFinding).toBeDefined();
      expect(orphanFinding?.severity).toBe("high");
    });
  });

  it("identifies weak internal linking", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-3", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/p1", "/p1"),
        createMockPage("https://site.com/p2", "/p2"),
        createMockPage("https://site.com/p3", "/p3"),
        createMockPage("https://site.com/p4", "/p4"),
        createMockPage("https://site.com/p5", "/p5"),
        createMockPage("https://site.com/weak-page", "/weak-page")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/p1", normalizedTargetUrl: "https://site.com/p1" },
        { sourceUrl: "https://site.com/p1", targetUrl: "https://site.com/p2", normalizedTargetUrl: "https://site.com/p2" },
        { sourceUrl: "https://site.com/p2", targetUrl: "https://site.com/p3", normalizedTargetUrl: "https://site.com/p3" },
        { sourceUrl: "https://site.com/p3", targetUrl: "https://site.com/p4", normalizedTargetUrl: "https://site.com/p4" },
        { sourceUrl: "https://site.com/p4", targetUrl: "https://site.com/p5", normalizedTargetUrl: "https://site.com/p5" },
        { sourceUrl: "https://site.com/p5", targetUrl: "https://site.com/weak-page", normalizedTargetUrl: "https://site.com/weak-page" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const weakFinding = res.findings.find(
        (f) => f.code === "WARN_INTERNAL_LINK_WEAK" && f.affectedResource === "https://site.com/weak-page"
      );
      expect(weakFinding).toBeDefined();
      expect(weakFinding?.category).toBe("internal-linking");
    });
  });

  it("analyzes content hierarchy and identifies missing parent categories", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-4", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/products", "/products"),
        createMockPage("https://site.com/products/a", "/products/a"),
        createMockPage("https://site.com/products/a/item", "/products/a/item"),
        createMockPage("https://site.com/guides/seo/audit", "/guides/seo/audit")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/products", normalizedTargetUrl: "https://site.com/products" },
        { sourceUrl: "https://site.com/products", targetUrl: "https://site.com/products/a", normalizedTargetUrl: "https://site.com/products/a" },
        { sourceUrl: "https://site.com/products/a", targetUrl: "https://site.com/products/a/item", normalizedTargetUrl: "https://site.com/products/a/item" },
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/guides/seo/audit", normalizedTargetUrl: "https://site.com/guides/seo/audit" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const hierarchyFinding = res.findings.find((f) => f.code === "WARN_HIERARCHY_PARENT_MISSING");
      expect(hierarchyFinding).toBeDefined();
      expect(hierarchyFinding?.category).toBe("content-hierarchy");
    });
  });

  it("handles cyclic graphs safely without infinite loops", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-5", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/a", "/a"),
        createMockPage("https://site.com/b", "/b"),
        createMockPage("https://site.com/c", "/c")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" },
        { sourceUrl: "https://site.com/a", targetUrl: "https://site.com/b", normalizedTargetUrl: "https://site.com/b" },
        { sourceUrl: "https://site.com/b", targetUrl: "https://site.com/c", normalizedTargetUrl: "https://site.com/c" },
        { sourceUrl: "https://site.com/c", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      expect(res.crawlDepths.length).toBe(4);
      expect(res.crawlDepths.every((cd) => cd.isReachableFromRoot)).toBe(true);
    });
  });

  it("guarantees output determinism for identical inputs", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-6", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/a", "/a"),
        createMockPage("https://site.com/b", "/b")
      ];
      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" },
        { sourceUrl: "https://site.com/a", targetUrl: "https://site.com/b", normalizedTargetUrl: "https://site.com/b" }
      ];

      const res1 = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });
      const res2 = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      expect(JSON.stringify(res1)).toBe(JSON.stringify(res2));
    });
  });

  it("handles incomplete data gracefully without fabricating findings", async () => {
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-7", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/p1", "/p1")
      ];
      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links: [], rootUrl: "https://site.com/" });

      expect(res.orphanCandidates.length).toBe(0);
    });
  });

  it("enforces multi-tenant zero-trust security isolation", async () => {
    await expect(
      TenantContextManager.runWithTenantContext(tenantB, "usr-2", "ctx-malicious", async () => {
        analyzer.analyzeArchitecture(tenantA, websiteId, { pages: [], links: [] });
      })
    ).rejects.toThrow(/Tenant Context Violation/);
  });
});
