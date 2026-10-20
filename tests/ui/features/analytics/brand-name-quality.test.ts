import { describe, expect, it } from "vitest";
import { hasNonPersianBrandCharacter } from "@/components/features/analytics/brand-name-quality";

describe("hasNonPersianBrandCharacter", () => {
  it("does not warn for ordinary Persian names", () => {
    expect(hasNonPersianBrandCharacter("خانه خلاق هوش مصنوعی")).toBe(false);
  });

  it("does not warn for Persian ZWNJ, Persian digits, or standard Persian hamza spelling", () => {
    expect(hasNonPersianBrandCharacter("خانه‌نو ۱۲۳")).toBe(false);
    expect(hasNonPersianBrandCharacter("رئیس")).toBe(false);
  });

  it("does not warn for Persian text with an Arabic combining mark such as fatha", () => {
    expect(hasNonPersianBrandCharacter("فَردا")).toBe(false);
  });

  it("warns when a Latin letter appears, even as a single character", () => {
    expect(hasNonPersianBrandCharacter("نواA")).toBe(true);
  });

  it("warns for Arabic-specific Yeh and Kaf variants in an otherwise Persian name", () => {
    expect(hasNonPersianBrandCharacter("علي")).toBe(true);
    expect(hasNonPersianBrandCharacter("كیان")).toBe(true);
  });

  it("warns for symbols and punctuation outside the accepted Persian name characters", () => {
    expect(hasNonPersianBrandCharacter("نوا™")).toBe(true);
    expect(hasNonPersianBrandCharacter("نوا&نو")).toBe(true);
  });

  it("does not warn for an empty name or whitespace alone", () => {
    expect(hasNonPersianBrandCharacter("")).toBe(false);
    expect(hasNonPersianBrandCharacter("   ")).toBe(false);
  });
});
