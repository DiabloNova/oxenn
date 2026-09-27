import { describe, it, expect } from "vitest";
import { calculateEntityAuthority, calculateEntityCompleteness } from "./entity-service";
import type { Entity } from "../domain/types";

// Minimal mock satisfying the visible domain contract

describe("calculateEntityAuthority", () => {
  describe("Baseline confidence contribution", () => {
    it("defaults to 40 when confidence is undefined", () => {
      const entity = {} as unknown as Entity;
      // 40 (default) + 0 + 0 + 0 = 40
      expect(calculateEntityAuthority(entity, 0)).toBe(40);
    });

    it("calculates correctly for a score of 0.5", () => {
      const entity = { confidence: { score: 0.5 } } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(20);
    });

    it("calculates correctly for a score of 0", () => {
      const entity = { confidence: { score: 0 } } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(0);
    });

    it("documents behavior for confidence score > 1.0 (potential defect)", () => {
      const entity = { confidence: { score: 1.5 } } as unknown as Entity;
      // score += 1.5 * 40 = 60
      const result = calculateEntityAuthority(entity, 0);
      expect(result).toBe(60);
    });
  });

  describe("External presence contribution", () => {
    it("adds 15 for valid wikidataId", () => {
      const entity = { wikidataId: "Q12345" } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(55); // 40 + 15
    });

    it("adds 15 for valid wikipediaUrl", () => {
      const entity = { wikipediaUrl: "https://en.wikipedia.org/wiki/Test" } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(55); // 40 + 15
    });

    it("adds 30 for both valid wikidataId and wikipediaUrl", () => {
      const entity = {
        wikidataId: "Q12345",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Test"
      } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(70); // 40 + 15 + 15
    });

    it("ignores whitespace-only or empty external IDs", () => {
      const entity = { wikidataId: "   ", wikipediaUrl: "" } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(40);
    });
  });

  describe("Relationship density contribution", () => {
    it("adds 0 for 0 relationships", () => {
      const entity = {} as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(40);
    });

    it("adds 15 for 5 relationships (5 * 3)", () => {
      const entity = {} as unknown as Entity;
      expect(calculateEntityAuthority(entity, 5)).toBe(55); // 40 + 15
    });

    it("caps at 30 for exactly 10 relationships", () => {
      const entity = {} as unknown as Entity;
      expect(calculateEntityAuthority(entity, 10)).toBe(70); // 40 + 30
    });

    it("caps at 30 for >10 relationships (e.g., 15)", () => {
      const entity = {} as unknown as Entity;
      expect(calculateEntityAuthority(entity, 15)).toBe(70); // 40 + 30
    });

    it("documents behavior for negative relationship counts (potential defect)", () => {
      const entity = {} as unknown as Entity;
      // Math.min(-5, 10) is -5. -5 * 3 = -15. 40 - 15 = 25
      const result = calculateEntityAuthority(entity, -5);
      expect(result).toBe(25);
    });
  });

  describe("Boundary and composite scenarios", () => {
    it("calculates maximum theoretical score (100)", () => {
      const entity = {
        confidence: { score: 1.0 },
        wikidataId: "Q1",
        wikipediaUrl: "https://example.com"
      } as unknown as Entity;
      // 40 (confidence) + 15 (wikidata) + 15 (wikipedia) + 30 (10 rels) = 100
      expect(calculateEntityAuthority(entity, 10)).toBe(100);
    });

    it("calculates minimum theoretical score (0)", () => {
      const entity = { confidence: { score: 0 } } as unknown as Entity;
      expect(calculateEntityAuthority(entity, 0)).toBe(0);
    });

    it("caps result at 100", () => {
      const entity = {
        confidence: { score: 2.0 }, // 80
        wikidataId: "Q1", // 15
        wikipediaUrl: "https://example.com" // 15
      } as unknown as Entity;
      // 80 + 15 + 15 + 30 = 140 -> capped at 100
      expect(calculateEntityAuthority(entity, 10)).toBe(100);
    });

    it("caps result at 0 minimum", () => {
      const entity = { confidence: { score: -1.0 } } as unknown as Entity;
      // -40 -> capped at 0
      expect(calculateEntityAuthority(entity, -10)).toBe(0);
    });
  });
});

describe("calculateEntityCompleteness", () => {
  it("calculates baseline score of 40", () => {
    const entity = {} as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(40);
  });

  it("adds 20 for valid description", () => {
    const entity = { description: "Valid desc" } as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(60);
  });

  it("adds 15 for valid wikidataId", () => {
    const entity = { wikidataId: "Q1" } as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(55);
  });

  it("adds 15 for valid wikipediaUrl", () => {
    const entity = { wikipediaUrl: "url" } as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(55);
  });

  it("adds 10 for valid aliases", () => {
    const entity = { aliases: ["alias1"] } as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(50);
  });

  it("calculates total up to 100", () => {
    const entity = {
      description: "Desc",
      wikidataId: "Q1",
      wikipediaUrl: "url",
      aliases: ["alias1"]
    } as unknown as Entity;
    expect(calculateEntityCompleteness(entity)).toBe(100);
  });
});
