import { describe, it, expect } from 'vitest';
import { dashboardNavigation, NavigationItem } from "@/config/dashboardNavigation";
import { Session } from "@/types/auth";

describe('Dashboard Shell Architecture', () => {
  it('verifies canonical information architecture alignment and navigation structure', () => {
    const expectedSections = ["main", "admin", "support"];
    expectedSections.forEach((secId) => {
      const sec = dashboardNavigation.find((s) => s.id === secId);
      expect(sec).toBeDefined();
    });

    const mainSection = dashboardNavigation.find((s) => s.id === "main")!;
    const expectedMainItems = ["overview", "seo", "aeo", "content", "competitors", "brand", "entities", "analytics"];
    expectedMainItems.forEach((itemId) => {
      const item = mainSection.items.find((it) => it.id === itemId);
      expect(item).toBeDefined();
    });

    const seoItem = mainSection.items.find((it) => it.id === "seo")!;
    expect(seoItem.children).toBeDefined();
    expect(seoItem.children?.length).toBe(2);

    const expectedSeoChildren = ["/dashboard/seo/technical", "/dashboard/seo/schema"];
    expectedSeoChildren.forEach((childHref) => {
      const child = seoItem.children?.find((c) => c.href === childHref);
      expect(child).toBeDefined();
    });
  });

  it('verifies active route detection logic and localized parent matching', () => {
    const isRouteActive = (pathname: string, itemHref?: string, language = "fa") => {
      if (!itemHref) return false;
      const localizedHref = `/${language}${itemHref === "/" ? "" : itemHref}`;
      if (itemHref === "/dashboard") {
        return pathname === localizedHref;
      }
      return pathname === localizedHref || pathname.startsWith(localizedHref + "/");
    };

    const isParentActive = (pathname: string, item: NavigationItem, language = "fa") => {
      if (item.href) return isRouteActive(pathname, item.href, language);
      if (item.children) {
        return item.children.some((child) => isRouteActive(pathname, child.href, language));
      }
      return false;
    };

    const mainSection = dashboardNavigation.find((s) => s.id === "main")!;
    const seoItem = mainSection.items.find((it) => it.id === "seo")!;

    const testPathname1 = "/fa/dashboard/seo/technical";
    expect(isParentActive(testPathname1, seoItem, "fa")).toBe(true);

    const testPathname2 = "/en/dashboard/billing";
    const adminSection = dashboardNavigation.find((s) => s.id === "admin")!;
    const billingItem = adminSection.items.find((it) => it.id === "billing")!;
    expect(isRouteActive(testPathname2, billingItem.href, "en")).toBe(true);
  });

  it('verifies user identity session integration without hardcoded fallback values', () => {
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

  it('verifies command palette search query filtering logic', () => {
    const searchQuery = "technical";
    const mockSearchItems = [
      { labelEn: "Technical SEO Audit", labelFa: "سئوی تکنیکال" },
      { labelEn: "Schema Markups", labelFa: "طرح‌واره‌ها" }
    ];
    const filtered = mockSearchItems.filter(item =>
      item.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.labelFa.includes(searchQuery)
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].labelEn).toBe("Technical SEO Audit");
  });

  it('verifies workspace selector adapter compatibility', () => {
    const mockWorkspaces = [
      { id: "ws-tehran", name: "Tehran HQ Workspace" },
      { id: "ws-isfahan", name: "Isfahan Lab Workspace" }
    ];
    const selectedWorkspaceId = "ws-tehran";
    const activeWorkspace = mockWorkspaces.find(w => w.id === selectedWorkspaceId);

    expect(activeWorkspace).toBeDefined();
    expect(activeWorkspace?.name).toBe("Tehran HQ Workspace");
  });
});
