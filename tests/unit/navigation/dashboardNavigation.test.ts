import { describe, expect, it } from "vitest";
import { dashboardNavigation, matchesDashboardNavigationSearch } from "@/config/dashboardNavigation";

describe("owner-defined dashboard navigation", () => {
  it("matches Persian search across Arabic letters and whitespace variants", () => {
    const item = { labelEn: "Your brand", labelFa: "برندهای هوش مصنوعی" };
    expect(matchesDashboardNavigationSearch(item, "برندهاي هوش مصنوعي")).toBe(true);
    expect(matchesDashboardNavigationSearch(item, "برند های هوش مصنوعی")).toBe(true);
  });

  it("contains exactly the four owner-defined groups", () => {
    expect(dashboardNavigation.map((section) => section.titleFa)).toEqual(["تجزیه و تحلیل", "گزارش‌ها", "اقدامات", "در صفحه"]);
  });

  it("contains the exact item count and no extra categories", () => {
    expect(dashboardNavigation.map((section) => section.items.length)).toEqual([12, 4, 9, 5]);
    expect(dashboardNavigation.flatMap((section) => section.items).every((item) => Boolean(item.href) || Boolean(item.children?.length && item.children.every((child) => Boolean(child.href))))).toBe(true);
    expect(dashboardNavigation.flatMap((section) => section.items).find((item) => item.id === "product-review")?.href).toBe("/dashboard/product-review");
  });
});
