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
});
