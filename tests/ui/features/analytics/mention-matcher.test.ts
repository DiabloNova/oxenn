import { describe, expect, it } from "vitest";
import { matchMentionSegments } from "@/components/features/analytics/mention-matcher";

describe("matchMentionSegments", () => {
  it("matches English names regardless of case", () => {
    expect(matchMentionSegments("OPENAI", "OpenAI", []).map((segment) => segment.kind)).toEqual([
      "brand",
    ]);
  });

  it("uses Unicode case-insensitive matching consistently for Greek final sigma", () => {
    expect(matchMentionSegments("οξενν", "οξενν", []).map((segment) => segment.kind)).toEqual([
      "brand",
    ]);
    expect(matchMentionSegments("ΟΣ", "Ος", []).map((segment) => segment.kind)).toEqual([
      "brand",
    ]);
  });

  it("matches common Arabic/Persian Yeh and Kaf variants while preserving source spelling", () => {
    const source = "از ديجي‌كالا خرید کنید";
    const segments = matchMentionSegments(source, "Oxenn", ["دیجی‌کالا"]);
    expect(segments.find((segment) => segment.kind === "competitor")?.text).toBe("ديجي‌كالا");
    expect(segments.map((segment) => segment.text).join("")).toBe(source);
  });

  it("preserves Arabic letters in unhighlighted response text", () => {
    const source = "في هذا المثال، نام برند Oxenn است.";
    const segments = matchMentionSegments(source, "Oxenn", []);
    expect(segments.map((segment) => segment.text).join("")).toBe(source);
    expect(segments[0]?.text).toContain("في");
  });

  it("preserves original text when no entity matches", () => {
    const source = "في متن عربی و فارسی، هیچ نامی پیدا نشد.";
    const segments = matchMentionSegments(source, "Oxenn", []);
    expect(segments).toEqual([{ text: source, kind: "text" }]);
  });

  it("preserves the original text when no entities are configured", () => {
    const source = "في متن؛ ي و ك";
    const segments = matchMentionSegments(source, " ", []);
    expect(segments).toEqual([{ text: source, kind: "text" }]);
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

  it("highlights confirmed Persian aliases as the brand without replacing source text", () => {
    const source = "Optimus هوش مصنوعی را بررسی کنید.";
    const segments = matchMentionSegments(source, "Optimus AI", [], ["Optimus هوش مصنوعی"]);
    expect(segments.find((segment) => segment.kind === "brand")?.text).toBe("Optimus هوش مصنوعی");
    expect(segments.map((segment) => segment.text).join("")).toBe(source);
  });

  it("maps NFC-equivalent matches back to the exact original grapheme sequence", () => {
    const source = "Cafe\u0301 is a brand";
    const segments = matchMentionSegments(source, "Café", []);
    expect(segments.map((segment) => segment.text).join("")).toBe(source);
    expect(segments.find((segment) => segment.kind === "brand")?.text).toBe("Cafe\u0301");
  });
});
