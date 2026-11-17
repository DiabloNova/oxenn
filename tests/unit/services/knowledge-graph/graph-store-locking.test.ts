import { describe, expect, it, vi } from "vitest";
import type { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { GraphStoreService } from "@/services/knowledge-graph/graph-store";

const mocks = vi.hoisted(() => ({
  getRequiredTenantId: vi.fn(() => "tenant-a"),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { getRequiredTenantId: mocks.getRequiredTenantId },
}));

describe("GraphStoreService transaction locking", () => {
  it("acquires the shared tenant graph lock before reading or writing graph rows", async () => {
    const query = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rowCount: 0, rows: [] }));
    const store = new GraphStoreService({ query } as unknown as PostgresClient);

    await store.upsertEntitiesAndRelationships({
      entities: [
        { name: "Source", type: "concept", properties: {} },
        { name: "Target", type: "concept", properties: {} },
      ],
      relationships: [
        { sourceEntityName: "Source", targetEntityName: "Target", relationshipType: "related_to", properties: {} },
      ],
    }, "chunk-a");

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("pg_advisory_xact_lock"),
      ["tenant-a", "oxenn:tenant-graph-write"],
    );
    expect(query.mock.calls[1][0]).toContain("FROM kg_entities");
  });
});
