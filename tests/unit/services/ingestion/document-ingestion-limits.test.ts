import { describe, expect, it, vi } from "vitest";
import type { VectorStoreService } from "@/services/knowledge-graph/vector-store";
import type { GraphStoreService } from "@/services/knowledge-graph/graph-store";

const mocks = vi.hoisted(() => ({
  getTenantId: vi.fn(() => "tenant-test"),
  getTenantContext: vi.fn(() => ({ tenantId: "tenant-test", userId: "user-test", requestId: "request-test", dbClient: {} })),
  runWithTenantContext: vi.fn(async (...args: unknown[]) => {
    const callback = args[3] as () => Promise<unknown>;
    return callback();
  }),
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
  TenantContextManager: {
    getRequiredTenantId: mocks.getTenantId,
    getContext: mocks.getTenantContext,
    runWithTenantContext: mocks.runWithTenantContext,
  },
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

  it("rolls back a profile replacement when any chunk fails", async () => {
    mocks.chunkText.mockReturnValue(["first chunk", "second chunk"]);
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn()
        .mockResolvedValueOnce({ id: "new-chunk-1" })
        .mockRejectedValueOnce(new Error("embedding provider unavailable")),
    } as unknown as VectorStoreService;
    const graphStore = { upsertEntitiesAndRelationships: vi.fn(async () => ({ entityIds: {}, relationshipIds: [] })) } as unknown as GraphStoreService;
    const service = new DocumentIngestionService(vectorStore, graphStore);

    const result = await service.ingestDocument("brand profile content", {
      source: "brand-profile",
      documentType: "brand-context",
    });

    expect(vectorStore.replaceDocument).toHaveBeenCalledWith("tenant-test", "brand-profile");
    expect(mocks.runWithTenantContext).toHaveBeenCalledWith(
      "tenant-test", "user-test", "request-test", expect.any(Function), { requireNewSavepoint: true }
    );
    expect(result).toMatchObject({
      success: false,
      rolledBack: true,
      totalChunks: 2,
      processedChunks: 0,
      attemptedProcessedChunks: 1,
      failedChunks: 1,
    });
  });

  it("commits a profile replacement only when every chunk succeeds", async () => {
    mocks.chunkText.mockReturnValue(["first chunk", "second chunk"]);
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn()
        .mockResolvedValueOnce({ id: "new-chunk-1" })
        .mockResolvedValueOnce({ id: "new-chunk-2" }),
    } as unknown as VectorStoreService;
    const graphStore = { upsertEntitiesAndRelationships: vi.fn(async () => ({ entityIds: {}, relationshipIds: [] })) } as unknown as GraphStoreService;
    const service = new DocumentIngestionService(vectorStore, graphStore);

    const result = await service.ingestDocument("brand profile content", {
      source: "brand-profile",
      documentType: "brand-context",
    });

    expect(result).toMatchObject({ success: true, totalChunks: 2, processedChunks: 2, failedChunks: 0 });
    expect(result.rolledBack).toBeUndefined();
    expect(vectorStore.insertEmbedding).toHaveBeenCalledWith(
      "tenant-test",
      "first chunk",
      expect.any(Array),
      expect.objectContaining({ documentId: "brand-profile" }),
    );
  });


  it("derives a stable server-side identity for each supporting file", async () => {
    mocks.chunkText.mockReturnValue(["supporting file chunk"]);
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => ({ id: "supporting-chunk" })),
    } as unknown as VectorStoreService;
    const graphStore = { upsertEntitiesAndRelationships: vi.fn(async () => ({ entityIds: {}, relationshipIds: [] })) } as unknown as GraphStoreService;
    const service = new DocumentIngestionService(vectorStore, graphStore);

    const result = await service.ingestDocument("supporting file content", {
      source: "brand-profile-file",
      documentType: "brand-supporting-document",
      originalFilename: "Market Notes.md",
    });

    expect(result.success).toBe(true);
    expect(vectorStore.replaceDocument).toHaveBeenCalledWith(
      "tenant-test",
      expect.stringMatching(/^brand-supporting-document:[a-f0-9]{64}$/),
      "Market Notes.md",
    );
    expect(vectorStore.insertEmbedding).toHaveBeenCalledWith(
      "tenant-test",
      "supporting file chunk",
      expect.any(Array),
      expect.objectContaining({ documentId: expect.stringMatching(/^brand-supporting-document:[a-f0-9]{64}$/) }),
    );
  });

});
