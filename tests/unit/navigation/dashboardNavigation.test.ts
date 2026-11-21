import { describe, expect, it } from "vitest";
import {
  dashboardNavigation,
  isDashboardRouteActive,
  matchesDashboardNavigationSearch,
} from "@/config/dashboardNavigation";

describe("owner-defined dashboard navigation", () => {
  it("matches Persian search across Arabic letters and whitespace variants", () => {
    const item = { labelEn: "Your brand", labelFa: "برندهای هوش مصنوعی" };
    expect(matchesDashboardNavigationSearch(item, "برندهاي هوش مصنوعي")).toBe(true);
    expect(matchesDashboardNavigationSearch(item, "برند های هوش مصنوعی")).toBe(true);
  });

  it("contains the four approved groups in their exact order", () => {
    expect(dashboardNavigation.map((section) => section.titleFa)).toEqual([
      "تجزیه و تحلیل",
      "گزارش‌ها",
      "اقدامات",
      "در صفحه",
    ]);
    expect(dashboardNavigation.map((section) => section.items.length)).toEqual([5, 4, 4, 4]);
  });

  it("contains exactly the 17 approved item ids and routes in their approved order", () => {
    expect(dashboardNavigation.flatMap((section) => section.items.map((item) => item.id))).toEqual([
      "brand",
      "aeo",
      "seo",
      "geo",
      "quick-analysis",
      "seo-user-reports",
      "periodic-reports",
      "aeo-brand-reports",
      "geo-prompt-reports",
      "content-studio",
      "prompt-research",
      "execution-plan",
      "marketing",
      "search-ranking",
      "site-health",
      "technical-issues",
      "product-review",
    ]);
    expect(dashboardNavigation.flatMap((section) => section.items.map((item) => item.href))).toEqual([
      "/dashboard/brand",
      "/dashboard/aeo",
      "/dashboard/seo",
      "/dashboard/geo",
      "/dashboard/audit/free",
      "/dashboard/reports/seo-users",
      "/dashboard/reports/periodic",
      "/dashboard/reports/aeo-brand",
      "/dashboard/reports/geo-prompts",
      "/dashboard/content/studio",
      "/dashboard/aeo/playground",
      "/dashboard/planning",
      "/dashboard/services",
      "/dashboard/seo/technical",
      "/dashboard/audit/premium",
      "/dashboard/technical-issues",
      "/dashboard/product-review",
    ]);
  });

  it("routes prompt research to Prompt Intelligence and does not expose RAG as that item", () => {
    const promptResearch = dashboardNavigation.flatMap((section) => section.items)
      .find((item) => item.id === "prompt-research");
    expect(promptResearch?.href).toBe("/dashboard/aeo/playground");
    expect(dashboardNavigation.flatMap((section) => section.items).some((item) => item.href === "/dashboard/query")).toBe(false);
  });

  it("preserves active state for nested routes without matching sibling prefixes", () => {
    expect(isDashboardRouteActive("/fa/dashboard/aeo/playground", "/dashboard/aeo", "fa")).toBe(true);
    expect(isDashboardRouteActive("/en/dashboard/reports/geo-prompts/2026", "/dashboard/reports/geo-prompts", "en")).toBe(true);
    expect(isDashboardRouteActive("/fa/dashboard/aeo-extra", "/dashboard/aeo", "fa")).toBe(false);
  });

  it("keeps the AEO root separate from the Prompt Research destination", () => {
    expect(isDashboardRouteActive("/fa/dashboard/aeo", "/dashboard/aeo", "fa", true)).toBe(true);
    expect(isDashboardRouteActive("/fa/dashboard/aeo/playground", "/dashboard/aeo", "fa", true)).toBe(false);
    expect(isDashboardRouteActive("/fa/dashboard/aeo/playground", "/dashboard/aeo/playground", "fa")).toBe(true);
  });

  it("keeps the SEO root separate from on-page SEO child routes", () => {
    expect(isDashboardRouteActive("/fa/dashboard/seo", "/dashboard/seo", "fa", true)).toBe(true);
    expect(isDashboardRouteActive("/fa/dashboard/seo/technical", "/dashboard/seo", "fa", true)).toBe(false);
    expect(isDashboardRouteActive("/fa/dashboard/seo/technical", "/dashboard/seo/technical", "fa")).toBe(true);
  });
});
