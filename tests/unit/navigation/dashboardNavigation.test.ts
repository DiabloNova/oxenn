import { describe, expect, it } from "vitest";
import { dashboardNavigation } from "@/config/dashboardNavigation";

describe("owner-defined dashboard navigation", () => {
  it("contains exactly the four owner-defined groups", () => {
    expect(dashboardNavigation.map((section) => section.titleFa)).toEqual(["تجزیه و تحلیل", "گزارش‌ها", "اقدامات", "در صفحه"]);
  });

  it("contains the exact item count and no extra categories", () => {
    expect(dashboardNavigation.map((section) => section.items.length)).toEqual([5, 4, 4, 4]);
    expect(dashboardNavigation.flatMap((section) => section.items).every((item) => Boolean(item.href))).toBe(true);
  });
});
