import { describe, it, expect } from "vitest";
import {
  dashboardNavigation,
  isDashboardRouteActive,
  matchesDashboardNavigationSearch,
} from "@/config/dashboardNavigation";

describe("Dashboard Shell Architecture", () => {
  it("matches the four owner-defined dashboard groups and their exact entries", () => {
    const expected = {
      analytics: ["brand", "aeo", "seo", "geo", "quick-analysis"],
      reports: ["seo-user-reports", "periodic-reports", "aeo-brand-reports", "geo-prompt-reports"],
      actions: ["content-studio", "prompt-research", "execution-plan", "marketing"],
      "on-page": ["search-ranking", "site-health", "technical-issues", "product-review"],
    };
    expect(dashboardNavigation.map((section) => section.id)).toEqual(["analytics", "reports", "actions", "on-page"]);
    const hrefs = dashboardNavigation.flatMap((section) => section.items.map((item) => item.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const [sectionId, itemIds] of Object.entries(expected)) {
      const section = dashboardNavigation.find((entry) => entry.id === sectionId);
      expect(section).toBeDefined();
      expect(section?.items.map((item) => item.id)).toEqual(itemIds);
      expect(section?.items.every((item) => Boolean(item.href))).toBe(true);
    }
  });

  it("matches localized nested routes using the production matcher", () => {
    const analytics = dashboardNavigation.find((section) => section.id === "analytics");
    const seoItem = analytics?.items.find((item) => item.id === "seo");
    const rankingItem = dashboardNavigation.find((section) => section.id === "on-page")?.items.find((item) => item.id === "search-ranking");
    expect(isDashboardRouteActive("/fa/dashboard/seo", seoItem?.href, "fa", seoItem?.exact)).toBe(true);
    expect(isDashboardRouteActive("/fa/dashboard/seo/technical", seoItem?.href, "fa", seoItem?.exact)).toBe(false);
    expect(isDashboardRouteActive("/fa/dashboard/seo/technical", rankingItem?.href, "fa", rankingItem?.exact)).toBe(true);
    expect(isDashboardRouteActive("/en/dashboard/reports/periodic", "/dashboard/reports/periodic", "en")).toBe(true);
    expect(isDashboardRouteActive("/en/dashboard/reports/periodic", "/dashboard/reports/seo-users", "en")).toBe(false);
    expect(isDashboardRouteActive("/en/dashboard/agent", "/dashboard", "en")).toBe(false);
  });

  it("uses the production command-palette search predicate", () => {
    const searchItems = [
      { labelEn: "Technical SEO Audit", labelFa: "بهینه‌سازی فنی سئو" },
      { labelEn: "Schema Markups", labelFa: "طرح‌واره و متا داتا" },
    ];
    expect(searchItems.filter((item) => matchesDashboardNavigationSearch(item, "technical"))).toHaveLength(1);
    expect(matchesDashboardNavigationSearch(searchItems[0], "فنی")).toBe(true);
    expect(searchItems.filter((item) => matchesDashboardNavigationSearch(item, "unknown"))).toHaveLength(0);
    expect(searchItems.filter((item) => matchesDashboardNavigationSearch(item, "  "))).toHaveLength(2);
  });

});
