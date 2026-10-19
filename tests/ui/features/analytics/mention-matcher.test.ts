import { describe, expect, it } from "vitest";
import { matchMentionSegments } from "@/components/features/analytics/mention-matcher";

describe("matchMentionSegments", () => {
  it("uses Unicode case-insensitive matching consistently for Greek final sigma", () => {
    expect(matchMentionSegments("οξενν", "οξενν", []).map((segment) => segment.kind)).toEqual([
      "brand",
    ]);
    expect(matchMentionSegments("ΟΣ", "Ος", []).map((segment) => segment.kind)).toEqual([
      "brand",
    ]);
  });

  it("matches common Arabic/Persian Yeh and Kaf variants", () => {
    const segments = matchMentionSegments("از ديجي‌كالا خرید کنید", "Oxenn", ["دیجی‌کالا"]);
    expect(segments.find((segment) => segment.kind === "competitor")?.text).toBe("دیجی‌کالا");
  });

  it("marks a normalized brand/competitor collision as ambiguous", () => {
    const segments = matchMentionSegments("نام کالا", "کالا", ["كالا"]);
    expect(segments.find((segment) => segment.text === "کالا")?.kind).toBe("ambiguous");
  });

  it("marks case-fold-equivalent brand and competitor names as ambiguous", () => {
    const segments = matchMentionSegments("ΟΣ", "ΟΣ", ["ος"]);
    expect(segments.find((segment) => segment.text === "ΟΣ")?.kind).toBe("ambiguous");
  });

  it("treats regex metacharacters literally", () => {
    const segments = matchMentionSegments("use .* [ safely", "Oxenn", [".* ["]);
    expect(segments.find((segment) => segment.kind === "competitor")?.text).toBe(".* [");
  });

  it("does not match a short Latin name inside another word", () => {
    const segments = matchMentionSegments("CHAIR is not AI", "AI", []);
    expect(segments.filter((segment) => segment.kind === "brand").map((segment) => segment.text)).toEqual([
      "AI",
    ]);
  });

  it("keeps zero-width non-joiner inside a word for boundary checks", () => {
    const segments = matchMentionSegments("خانه‌خلاق", "خلاق", []);
    expect(segments.every((segment) => segment.kind !== "brand")).toBe(true);
  });
});
