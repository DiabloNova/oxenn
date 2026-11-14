import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLLMClient: vi.fn(),
}));

vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: mocks.getLLMClient,
  GeminiLLMClient: class GeminiLLMClient {},
  geminiFlashModel: null,
}));

import { analyzeSentiment } from "@/services/ai/sentiment-analysis";

describe("analyzeSentiment resource boundary", () => {
  it("rejects oversized text before resolving an LLM client", async () => {
    await expect(analyzeSentiment("x".repeat(32 * 1024 + 1))).rejects.toThrow(RangeError);

    expect(mocks.getLLMClient).not.toHaveBeenCalled();
  });
});
