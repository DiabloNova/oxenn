import { describe, expect, it } from "vitest";
import { analyzeBrandName } from "@/components/features/analytics/brand-name-quality";

describe("analyzeBrandName", () => {
  it("suggests a Persian equivalent for a recognized English term without changing the official name", () => {
    const findings = analyzeBrandName("Optimus AI", "fa");
    const finding = findings.find((item) => item.code === "english-term");

    expect(finding?.severity).toBe("info");
    expect(finding?.suggestions[0]?.suggestedName).toBe("Optimus هوش مصنوعی");
    expect(finding?.suggestions[0]?.matchedTerms).toEqual(["AI"]);
  });

  it("matches longer terms before shorter terms and suggests a single replacement", () => {
    const findings = analyzeBrandName("AI Cloud", "fa");
    const suggestion = findings.find((item) => item.code === "english-term")?.suggestions[0];

    expect(suggestion?.suggestedName).toBe("هوش مصنوعی رایانش ابری");
    expect(suggestion?.matchedTerms).toEqual(["AI", "cloud"]);
  });

  it("does not treat AI as a term inside an unrelated English word", () => {
    expect(analyzeBrandName("OpenAI", "fa")).toEqual([]);
  });

  it("reports mixed scripts as informational, not an error", () => {
    const findings = analyzeBrandName("خانه Optimus", "fa");
    expect(findings).toHaveLength(1);
    expect(findings[0]?.code).toBe("mixed-script");
    expect(findings[0]?.severity).toBe("info");
  });

  it("flags Arabic Yeh/Kaf in a Persian-script brand name", () => {
    const findings = analyzeBrandName("ديجي‌كالا", "fa");
    expect(findings.some((item) => item.code === "arabic-persian-variant")).toBe(true);
  });

  it("flags invisible formatting characters but not Persian ZWNJ", () => {
    expect(analyzeBrandName("خانه\u200bخلاق", "fa").some((item) => item.code === "invisible-character")).toBe(true);
    expect(analyzeBrandName("خانه‌خلاق", "fa").some((item) => item.code === "invisible-character")).toBe(false);
  });

  it("does not warn for an ordinary Latin-only brand name", () => {
    expect(analyzeBrandName("OpenAI", "en")).toEqual([]);
  });

  it("returns no findings for an empty name", () => {
    expect(analyzeBrandName("  ", "fa")).toEqual([]);
  });
});
