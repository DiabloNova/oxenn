import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  embedQuery: vi.fn(async () => [0.1, 0.2]),
  retrieve: vi.fn(async () => []),
  getLLMClient: vi.fn(() => ({ generateText: vi.fn(async () => "answer") })),
}));

vi.mock("@/services/ai/query-embedding", () => ({ embedQuery: mocks.embedQuery }));
vi.mock("@/services/rag/context-retrieval", () => ({ retrieveRelevantContext: mocks.retrieve }));
vi.mock("@/services/ai/llm-client", () => ({ getLLMClient: mocks.getLLMClient }));

import { answerQuestion } from "@/services/rag/query-service";

describe("answerQuestion resource boundary", () => {
  it("rejects oversized retrieval limits before embedding or model invocation", async () => {
    await expect(answerQuestion("سلام", "tenant-test", 21)).rejects.toThrow();

    expect(mocks.embedQuery).not.toHaveBeenCalled();
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.getLLMClient).not.toHaveBeenCalled();
  });

  it("rejects oversized questions before embedding or model invocation", async () => {
    await expect(answerQuestion("x".repeat(8 * 1024 + 1), "tenant-test", 5)).rejects.toThrow(RangeError);

    expect(mocks.embedQuery).not.toHaveBeenCalled();
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.getLLMClient).not.toHaveBeenCalled();
  });
});
