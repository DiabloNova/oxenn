import { describe, it, expect } from "vitest";
import { chunkText } from "@/services/ai/text-chunker";
import { getLLMClient, MockLLMClient } from "@/services/ai/llm-client";
import { analyzeSentiment } from "@/services/ai/sentiment-analysis";

describe("AI Orchestration Layer", () => {
  describe("Persian Text Chunker", () => {
    it("splits Persian text into multiple chunks at punctuation sentence boundaries", () => {
      const text = "کیفیت محصول فوق‌العاده‌ست. اصلاً به درد نمی‌خوره! بسته‌بندی خوب بود؟ بله خوب بود؛ حتماً بخرید.";
      const chunks = chunkText(text, 50, 5);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]).toContain("کیفیت محصول فوق‌العاده‌ست.");
    });

    it("does not break text exactly at zero-width non-joiner boundary", () => {
      const halfSpaceText = "این یک محصول فوق‌العاده‌ست که ویژگی‌های بی‌نظیری دارد.";
      const chunkWithHalfSpace = chunkText(halfSpaceText, 25, 0);
      expect(chunkWithHalfSpace.length).toBeGreaterThan(0);
      const hasBrokenHalfSpace = chunkWithHalfSpace.some(
        (c) => c.startsWith("\u200C") || c.endsWith("\u200C")
      );
      expect(hasBrokenHalfSpace).toBe(false);
    });

    it("preserves Persian quotation marks nicely inside chunks", () => {
      const quoteText = "او گفت: «این محصول عالی است» و سپس خارج شد.";
      const quoteChunks = chunkText(quoteText, 30, 5);
      expect(quoteChunks.length).toBeGreaterThan(0);
      const hasIntactQuotes = quoteChunks.some(
        (c) => c.includes("«این محصول عالی است»") || (c.includes("«") && c.includes("»"))
      );
      expect(hasIntactQuotes).toBe(true);
    });

    it("splits giant sentences with hard limit fallback", () => {
      const longSentence =
        "این‌یک‌جمله بسیاربسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار طولانی است.";
      const giantChunks = chunkText(longSentence, 40, 5);
      expect(giantChunks.length).toBeGreaterThan(1);
      expect(giantChunks[0].length).toBeLessThanOrEqual(40);
    });
  });

  describe("LLM Client Abstraction", () => {
    it("returns MockLLMClient instance in test environment and produces Persian mock text responses", async () => {
      const client = getLLMClient();
      expect(client).toBeInstanceOf(MockLLMClient);

      const responseText = await client.generateText("راهنمای خرید گوشی تلفن همراه");
      expect(responseText).toContain("شبیه‌سازی شده");
    });
  });

  describe("Persian Sentiment Analysis", () => {
    const testCases = [
      { text: "کیفیت محصول فوق‌العاده‌ست، حتماً بخرید", expectedLabel: "positive" },
      { text: "اصلاً به درد نمی‌خوره، پولمو دور ریختم", expectedLabel: "negative" },
      { text: "بسته‌بندی خوب بود، ولی ارسال دیر بود", expectedLabel: "neutral" },
    ];

    it.each(testCases)(
      "analyzes sentiment correctly for '$expectedLabel' case",
      async ({ text, expectedLabel }) => {
        const result = await analyzeSentiment(text);
        expect(result.label).toBe(expectedLabel);
        expect(result.score).toBeGreaterThanOrEqual(-1);
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.emotions)).toBe(true);
      }
    );
  });
});
