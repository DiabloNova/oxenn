import { describe, expect, it, vi } from "vitest";
import type { VectorStoreService } from "@/services/knowledge-graph/vector-store";
import type { GraphStoreService } from "@/services/knowledge-graph/graph-store";

const mocks = vi.hoisted(() => ({
  getTenantId: vi.fn(() => "tenant-test"),
  chunkText: vi.fn(() => ["chunk"]),
  generateEmbedding: vi.fn(async () => [0.1, 0.2]),
  analyzeSentiment: vi.fn(async () => ({
    score: 0,
    label: "neutral",
    confidence: 0.5,
    emotions: ["neutral"],
  })),
  extractGraphEntities: vi.fn(async () => ({ entities: [], relationships: [] })),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { getRequiredTenantId: mocks.getTenantId },
}));
vi.mock("@/services/ai/text-chunker", () => ({ chunkText: mocks.chunkText }));
vi.mock("@/services/ai/embed-client", () => ({ generateEmbedding: mocks.generateEmbedding }));
vi.mock("@/services/ai/sentiment-analysis", () => ({ analyzeSentiment: mocks.analyzeSentiment }));
vi.mock("@/services/ai/graph-extraction", () => ({ extractGraphEntities: mocks.extractGraphEntities }));

import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";

describe("DocumentIngestionService resource boundary", () => {
  it("rejects oversized text before chunking or any provider/database operation", async () => {
    const vectorStore = { insertEmbedding: vi.fn() } as unknown as VectorStoreService;
    const graphStore = { upsertEntitiesAndRelationships: vi.fn() } as unknown as GraphStoreService;
    const service = new DocumentIngestionService(vectorStore, graphStore);

    await expect(service.ingestDocument("x".repeat(3 * 1024 * 1024 + 1))).rejects.toThrow(RangeError);

    expect(mocks.chunkText).not.toHaveBeenCalled();
    expect(mocks.generateEmbedding).not.toHaveBeenCalled();
    expect(mocks.analyzeSentiment).not.toHaveBeenCalled();
    expect(vectorStore.insertEmbedding).not.toHaveBeenCalled();
    expect(graphStore.upsertEntitiesAndRelationships).not.toHaveBeenCalled();
  });

  it("rejects oversized metadata before chunking or provider work", async () => {
    const vectorStore = { insertEmbedding: vi.fn() } as unknown as VectorStoreService;
    const graphStore = { upsertEntitiesAndRelationships: vi.fn() } as unknown as GraphStoreService;
    const service = new DocumentIngestionService(vectorStore, graphStore);

    await expect(
      service.ingestDocument("valid text", { payload: "x".repeat(13 * 1024) })
    ).rejects.toThrow(RangeError);

    expect(mocks.chunkText).not.toHaveBeenCalled();
    expect(mocks.generateEmbedding).not.toHaveBeenCalled();
  });
});
