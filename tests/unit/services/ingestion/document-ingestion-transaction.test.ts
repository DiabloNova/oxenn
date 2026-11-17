import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const client = {
    query: vi.fn(async (_sql: string, _params?: unknown[]) => ({ rowCount: 1, rows: [] })),
    release: vi.fn(),
  };
  return {
    client,
    connectClient: vi.fn(async () => client),
    chunkText: vi.fn(() => ["prepared chunk"]),
    generateEmbedding: vi.fn(async () => [0.1, 0.2]),
    analyzeSentiment: vi.fn(async () => ({ score: 0, label: "neutral", confidence: 0.5, emotions: [] })),
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

import { TenantTransactionOutcomeError } from "@/core/database/tenant-context";
import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";

const tenantContext = { tenantId: "tenant-a", userId: "user-a", requestId: "request-a" };
const replacementMetadata = { source: "brand-profile", documentType: "brand-context" };

describe("document replacement transaction boundary", () => {
  beforeEach(() => {
    mocks.client.query.mockClear();
    mocks.client.query.mockImplementation(async () => ({ rowCount: 1, rows: [] }));
    mocks.client.release.mockClear();
    mocks.connectClient.mockClear();
    mocks.connectClient.mockImplementation(async () => mocks.client);
    mocks.chunkText.mockClear();
    mocks.chunkText.mockReturnValue(["prepared chunk"]);
    mocks.generateEmbedding.mockReset();
    mocks.generateEmbedding.mockResolvedValue([0.1, 0.2]);
    mocks.analyzeSentiment.mockReset();
    mocks.analyzeSentiment.mockResolvedValue({ score: 0, label: "neutral", confidence: 0.5, emotions: [] });
    mocks.extractGraphEntities.mockReset();
    mocks.extractGraphEntities.mockResolvedValue({ entities: [], relationships: [] });
  });

  it("commits a successful replacement and returns the existing success result", async () => {
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => ({ id: "chunk-1" })),
    };
    const graphStore = { upsertEntitiesAndRelationships: vi.fn(async () => undefined) };
    const service = new DocumentIngestionService(vectorStore as never, graphStore as never);

    const result = await service.ingestDocument("profile text", replacementMetadata, undefined, tenantContext);

    expect(result).toMatchObject({ success: true, totalChunks: 1, processedChunks: 1, failedChunks: 0 });
    expect(vectorStore.replaceDocument).toHaveBeenCalledWith("tenant-a", "brand-profile");
    expect(mocks.client.query).toHaveBeenCalledWith("COMMIT");
    expect(mocks.client.query).not.toHaveBeenCalledWith("ROLLBACK");
    expect(mocks.client.release).toHaveBeenCalledTimes(1);
  });

  it("propagates a persistence failure with a confirmed rollback outcome", async () => {
    const operationError = new Error("simulated database write failure");
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => { throw operationError; }),
    };
    const graphStore = { upsertEntitiesAndRelationships: vi.fn() };
    const service = new DocumentIngestionService(vectorStore as never, graphStore as never);

    const error = await service.ingestDocument("profile text", replacementMetadata, undefined, tenantContext)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "rolled_back", phase: "work", cause: operationError });
    const statements = mocks.client.query.mock.calls.map(([sql]) => String(sql));
    expect(statements).toContain("BEGIN");
    expect(statements.some((sql) => sql.includes("set_config('app.current_tenant_id'"))).toBe(true);
    expect(statements).toContain("ROLLBACK");
    expect(statements).not.toContain("COMMIT");
    expect(vectorStore.replaceDocument).toHaveBeenCalledWith("tenant-a", "brand-profile");
    expect(mocks.client.release).toHaveBeenCalledTimes(1);
  });

  it("propagates rollback failure without claiming that the old document was preserved", async () => {
    const operationError = new Error("simulated database write failure");
    const rollbackError = new Error("rollback connection failure");
    mocks.client.query.mockImplementation(async (sql: string) => {
      if (sql.trim().toUpperCase() === "ROLLBACK") throw rollbackError;
      return { rowCount: 1, rows: [] };
    });
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => { throw operationError; }),
    };
    const service = new DocumentIngestionService(vectorStore as never, { upsertEntitiesAndRelationships: vi.fn() } as never);

    const error = await service.ingestDocument("profile text", replacementMetadata, undefined, tenantContext)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "rollback_failed", cause: operationError, rollbackError });
    expect(mocks.client.release).toHaveBeenCalledWith(rollbackError);
  });

  it("propagates a commit failure as uncertain even when best-effort rollback resolves", async () => {
    const commitError = new Error("connection lost during commit acknowledgement");
    mocks.client.query.mockImplementation(async (sql: string) => {
      if (sql.trim().toUpperCase() === "COMMIT") throw commitError;
      return { rowCount: 1, rows: [] };
    });
    const vectorStore = {
      replaceDocument: vi.fn(async () => undefined),
      insertEmbedding: vi.fn(async () => ({ id: "chunk-1" })),
    };
    const service = new DocumentIngestionService(vectorStore as never, { upsertEntitiesAndRelationships: vi.fn() } as never);

    const error = await service.ingestDocument("profile text", replacementMetadata, undefined, tenantContext)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "commit_uncertain", phase: "commit", cause: commitError });
    expect(mocks.client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mocks.client.release).toHaveBeenCalledWith(commitError);
  });

  it("reports a preparation failure as preserved without claiming that rollback ran", async () => {
    mocks.generateEmbedding.mockRejectedValueOnce(new Error("embedding provider unavailable"));
    const service = new DocumentIngestionService(
      { replaceDocument: vi.fn(), insertEmbedding: vi.fn() } as never,
      { upsertEntitiesAndRelationships: vi.fn() } as never,
    );

    const result = await service.ingestDocument("profile text", replacementMetadata, undefined, tenantContext);

    expect(result).toMatchObject({
      success: false,
      failureCode: "DOCUMENT_REPLACEMENT_FAILED",
      failureStage: "preparation",
      preservationStatus: "preserved",
      rolledBack: false,
    });
    expect(mocks.connectClient).not.toHaveBeenCalled();
  });
});
