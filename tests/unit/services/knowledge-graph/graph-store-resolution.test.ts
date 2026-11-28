import { describe, expect, it, vi } from "vitest";
import type { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { GraphStoreService } from "@/services/knowledge-graph/graph-store";

const mocks = vi.hoisted(() => ({
  getRequiredTenantId: vi.fn(() => "tenant-a"),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { getRequiredTenantId: mocks.getRequiredTenantId },
}));

function createHarness(canonicalRows: Array<{ id: string }>) {
  const query = vi.fn(async (sql: string, _params?: unknown[]) => {
    if (sql.toLowerCase().includes("from entities")) {
      return { rowCount: canonicalRows.length, rows: canonicalRows };
    }
    return { rowCount: 0, rows: [] };
  });

  return {
    query,
    store: new GraphStoreService({ query } as unknown as PostgresClient),
  };
}

async function resolveOne(canonicalRows: Array<{ id: string }>) {
  const harness = createHarness(canonicalRows);
  const result = await harness.store.upsertEntitiesAndRelationships(
    {
      entities: [{ name: "Optimus", type: "brand", properties: { source: "test" } }],
      relationships: [],
    },
    "chunk-1",
  );

  const canonicalQuery = harness.query.mock.calls.find(([sql]) => sql.toLowerCase().includes("from entities"));
  const resolutionUpdate = harness.query.mock.calls.find(([sql]) => sql.includes("UPDATE kg_entities AS kg"));

  return { ...harness, result, canonicalQuery, resolutionUpdate };
}

describe("GraphStoreService canonical Entity resolution", () => {
  it("links only a unique same-tenant name/type match without mutating the canonical Entity", async () => {
    const { query, result, canonicalQuery, resolutionUpdate } = await resolveOne([{ id: "canonical-optimus" }]);

    expect(result.entityIds.optimus).toBeTruthy();
    expect(canonicalQuery?.[1]).toEqual(["tenant-a", "Optimus", "brand"]);
    expect(canonicalQuery?.[0]).toContain("LOWER(BTRIM(name)) = LOWER(BTRIM($2))");
    expect(canonicalQuery?.[0]).toContain("LOWER(BTRIM(entity_type)) = LOWER(BTRIM($3))");
    expect(resolutionUpdate?.[1]).toEqual([
      "canonical-optimus",
      "matched",
      "chunk-1",
      expect.any(String),
      "tenant-a",
    ]);
    expect(query.mock.calls.some(([sql]) => /INSERT INTO entities/i.test(sql))).toBe(false);
    expect(query.mock.calls.some(([sql]) => /UPDATE entities/i.test(sql))).toBe(false);
  });

  it("does not guess when multiple canonical candidates match", async () => {
    const { resolutionUpdate } = await resolveOne([
      { id: "canonical-optimus-a" },
      { id: "canonical-optimus-b" },
    ]);

    expect(resolutionUpdate?.[1]).toEqual([
      null,
      "ambiguous",
      "chunk-1",
      expect.any(String),
      "tenant-a",
    ]);
  });

  it("keeps an observation unresolved when no canonical candidate matches", async () => {
    const { resolutionUpdate } = await resolveOne([]);

    expect(resolutionUpdate?.[1]).toEqual([
      null,
      "unresolved",
      "chunk-1",
      expect.any(String),
      "tenant-a",
    ]);
  });
});
