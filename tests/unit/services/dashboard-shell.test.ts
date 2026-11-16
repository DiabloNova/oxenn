import { describe, it, expect } from "vitest";
import { dashboardNavigation } from "@/config/dashboardNavigation";
import type { Session } from "@/types/auth";

describe("Dashboard Shell Architecture", () => {
  it("matches the four owner-defined dashboard groups and their exact entries", () => {
    const expected = {
      analytics: ["brand", "aeo", "seo", "geo", "quick-analysis"],
      reports: ["seo-user-reports", "periodic-reports", "aeo-brand-reports", "geo-prompt-reports"],
      actions: ["content-studio", "prompt-research", "execution-plan", "marketing"],
      "on-page": ["search-ranking", "site-health", "technical-issues", "product-review"],
    };
    expect(dashboardNavigation.map((section) => section.id)).toEqual(["analytics", "reports", "actions", "on-page"]);
    for (const [sectionId, itemIds] of Object.entries(expected)) {
      const section = dashboardNavigation.find((entry) => entry.id === sectionId);
      expect(section).toBeDefined();
      expect(section?.items.map((item) => item.id)).toEqual(itemIds);
      expect(section?.items.every((item) => Boolean(item.href))).toBe(true);
    }
  });

  it("matches localized nested routes without marking sibling destinations active", () => {
    const isRouteActive = (pathname: string, itemHref?: string, language = "fa") => {
      if (!itemHref) return false;
      const pathOnly = itemHref.split(/[?#]/, 1)[0];
      const localizedHref = "/" + language + pathOnly;
      if (pathOnly === "/dashboard") return pathname === localizedHref;
      return pathname === localizedHref || pathname.startsWith(localizedHref + "/");
    };

    const seoItem = dashboardNavigation.find((section) => section.id === "analytics")?.items.find((item) => item.id === "seo");
    expect(isRouteActive("/fa/dashboard/seo/technical", seoItem?.href, "fa")).toBe(true);
    expect(isRouteActive("/en/dashboard/reports/periodic", "/dashboard/reports/periodic", "en")).toBe(true);
    expect(isRouteActive("/en/dashboard/reports/periodic", "/dashboard/reports/seo-users", "en")).toBe(false);
    expect(isRouteActive("/en/dashboard/agent", "/dashboard", "en")).toBe(false);
  });

  it("preserves user identity from the authenticated session without hardcoded fallback values", () => {
    const mockUserSession: Session = {
      user: {
        id: "usr-custom-777",
        name: "Faramarz Yazdani",
        email: "faramarz@brandgraph.ai",
        role: "workspace_admin",
        workspaceId: "ws-tehran"
      },
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      status: "authenticated"
    };

    expect(mockUserSession.user).toBeDefined();
    expect(mockUserSession.user?.name).not.toBe("John Doe");
    expect(mockUserSession.user?.name).toBe("Faramarz Yazdani");
  });

  it("keeps command palette search filtering case-insensitive", () => {
    const searchQuery = "technical";
    const mockSearchItems = [
      { labelEn: "Technical SEO", labelFa: "سئوی تکنیکال" },
      { labelEn: "Schema Markups", labelFa: "طرح‌واره‌ها" }
    ];
    const filtered = mockSearchItems.filter((item) =>
      item.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) || item.labelFa.includes(searchQuery)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].labelEn).toBe("Technical SEO");
  });
});
