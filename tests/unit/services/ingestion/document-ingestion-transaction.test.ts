import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const client = { query: vi.fn(async () => ({ rowCount: 1, rows: [] })), release: vi.fn() };
  return {
    client,
    connectClient: vi.fn(async () => client),
    chunkText: vi.fn(() => ["prepared chunk"]),
    generateEmbedding: vi.fn(async () => [0.1, 0.2]),
    analyzeSentiment: vi.fn(async () => ({ score: 0, label: "neutral", confidence: 0.5 })),
    extractGraphEntities: vi.fn(async () => ({ entities: [], relationships: [] })),
  };
});

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ connectClient: mocks.connectClient }) },
}));
vi.mock("@/services/ai/text-chunker", () => ({ chunkText: mocks.chunkText }));
vi.mock("@/services/ai/embed-client", () => ({ generateEmbedding: mocks.generateEmbedding }));
vi.mock("@/services/ai/sentiment-analysis", () => ({ analyzeSentiment: mocks.analyzeSentiment }));
vi.mock("@/services/ai/graph-extraction", () => ({ extractGraphEntities: mocks.extractGraphEntities }));

import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";

describe("document replacement transaction boundary", () => {
  it("rolls back the actual tenant transaction when a database write fails", async () => {
    mocks.client.query.mockClear();
    mocks.client.release.mockClear();
    mocks.connectClient.mockClear();
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => { throw new Error("simulated database write failure"); }),
    };
    const graphStore = { upsertEntitiesAndRelationships: vi.fn() };
    const service = new DocumentIngestionService(vectorStore as never, graphStore as never);

    const result = await service.ingestDocument(
      "profile text",
      { source: "brand-profile", documentType: "brand-context" },
      undefined,
      { tenantId: "tenant-a", userId: "user-a", requestId: "request-a" },
    );

    const statements = mocks.client.query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toContain("BEGIN");
    expect(statements.some((sql) => sql.includes("set_config('app.current_tenant_id'"))).toBe(true);
    expect(statements).toContain("ROLLBACK");
    expect(statements).not.toContain("COMMIT");
    expect(vectorStore.replaceDocument).toHaveBeenCalledWith("tenant-a", "brand-profile");
    expect(result).toMatchObject({ success: false, rolledBack: true, processedChunks: 0, failedChunks: 1 });
    expect(mocks.client.release).toHaveBeenCalledTimes(1);
  });
});
