import { describe, expect, it, vi } from "vitest";
import type { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { VectorStoreService } from "@/services/knowledge-graph/vector-store";

describe("VectorStoreService resource boundary", () => {
  it("rejects oversized metadata before issuing an insert", async () => {
    const query = vi.fn();
    const store = new VectorStoreService({ query } as unknown as PostgresClient);

    await expect(
      store.insertEmbedding("tenant-test", "content", [0.1], { payload: "x".repeat(13 * 1024) })
    ).rejects.toThrow(RangeError);

    expect(query).not.toHaveBeenCalled();
  });

  it("rejects oversized chunks before issuing an insert", async () => {
    const query = vi.fn();
    const store = new VectorStoreService({ query } as unknown as PostgresClient);

    await expect(
      store.insertEmbedding("tenant-test", "x".repeat(4_001), [0.1], {})
    ).rejects.toThrow(RangeError);

    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an excessive retrieval limit before issuing a query", async () => {
    const query = vi.fn();
    const store = new VectorStoreService({ query } as unknown as PostgresClient);

    await expect(store.findSimilarEmbeddings("tenant-test", [0.1], 21)).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });

  it("serializes and removes only the selected tenant document and its source-linked edges", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SELECT id FROM document_embeddings")) {
        return { rowCount: 2, rows: [{ id: "chunk-a" }, { id: "chunk-b" }] };
      }
      return { rowCount: 2, rows: [] };
    });
    const store = new VectorStoreService({ query } as unknown as PostgresClient);

    await store.replaceDocument("tenant-a", "brand-profile");

    expect(query).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("pg_advisory_xact_lock"),
      ["tenant-a", "brand-profile"],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("metadata ->> 'source' = 'brand-profile-form'"),
      ["tenant-a", "brand-profile", null],
    );
    expect(query.mock.calls[1][0]).toContain("metadata ->> 'documentType' = 'brand-context'");
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("source_chunk_ids"),
      ["tenant-a", ["chunk-a", "chunk-b"]],
    );
    expect(query.mock.calls[2][0]).toContain("jsonb_array_elements_text");
    expect(query.mock.calls[2][0]).toContain("DELETE FROM kg_relationships");
    expect(query.mock.calls[2][0]).toContain("source_provenance_incomplete");
    expect(query.mock.calls[2][0]).toContain("FOR UPDATE");
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("DELETE FROM document_embeddings"),
      ["tenant-a", "brand-profile", null],
    );
  });


  it("uses the original filename to clean up legacy supporting-file chunks", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SELECT id FROM document_embeddings")) {
        return { rowCount: 1, rows: [{ id: "legacy-file-chunk" }] };
      }
      return { rowCount: 1, rows: [] };
    });
    const store = new VectorStoreService({ query } as unknown as PostgresClient);

    await store.replaceDocument("tenant-a", "brand-supporting-document:abc123", "Market Notes.md");

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("metadata ->> 'originalFilename' = $3"),
      ["tenant-a", "brand-supporting-document:abc123", "Market Notes.md"],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("DELETE FROM document_embeddings"),
      ["tenant-a", "brand-supporting-document:abc123", "Market Notes.md"],
    );
  });

});
