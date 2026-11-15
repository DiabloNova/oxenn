import { describe, expect, it } from "vitest";
import { getLandingContent, landingContent } from "@/components/marketing/landing-content";

describe("bilingual public homepage content", () => {
  it("provides complete copy for both supported locales", () => {
    for (const locale of ["fa", "en"] as const) {
      const copy = getLandingContent(locale);
      expect(copy.hero.title).toBeTruthy();
      expect(copy.tracks.items).toHaveLength(2);
      expect(copy.method.steps).toHaveLength(5);
      expect(copy.offers.types).toHaveLength(3);
      expect(copy.evidence.items).toHaveLength(6);
      expect(copy.closing.primary).toBeTruthy();
    }
  });

  it("keeps the three Offer natures separate from sales channels", () => {
    expect(landingContent.en.offers.types.map((item) => item.title)).toEqual(["Physical product", "Digital product", "Service"]);
    expect(landingContent.en.offers.channelNote).toContain("not a fourth Offer nature");
    expect(landingContent.fa.offers.channelNote).toContain("نه ماهیت چهارم محصول");
  });

  it("keeps independent SEO, AEO, and GEO available without making the bundle mandatory", () => {
    for (const locale of ["fa", "en"] as const) {
      const digitalTrack = landingContent[locale].tracks.items[0];
      const points = digitalTrack.points.join(" ");
      expect(points).toContain("SEO");
      expect(points).toContain("AEO");
      expect(points).toContain("GEO");
      if (locale === "en") expect(digitalTrack.note.toLowerCase()).toContain("optional");
      else expect(digitalTrack.note).toContain("اختیاری");
    }
  });

  it("labels modeled information and does not imply autonomous external execution", () => {
    expect(landingContent.en.evidence.items.some((item) => item.title === "Simulation")).toBe(true);
    expect(landingContent.en.evidence.note).toContain("UNKNOWN does not mean ZERO");
    expect(landingContent.en.boundaries.items.join(" ").toLowerCase()).toContain("autonomous execution");
    expect(landingContent.fa.boundaries.items.join(" ")).toContain("اجرای خودکار");
  });

  it("does not contain fabricated prices, live metrics, or percentage claims", () => {
    for (const locale of ["fa", "en"] as const) {
      const allText = JSON.stringify(landingContent[locale]);
      expect(allText).not.toMatch(/\b\d+(?:\.\d+)?%/);
      expect(allText).not.toMatch(/\$\s?\d/);
      expect(allText.toLowerCase()).not.toContain("real-time");
      if (locale === "en") expect(allText.toLowerCase()).toContain("does not display live data");
      else expect(allText).toContain("داده زنده");
    }
  });
});
