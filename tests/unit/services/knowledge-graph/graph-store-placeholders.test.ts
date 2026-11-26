import { describe, expect, it, vi } from "vitest";
import type { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { GraphStoreService } from "@/services/knowledge-graph/graph-store";

const mocks = vi.hoisted(() => ({
  getRequiredTenantId: vi.fn(() => "tenant-a"),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { getRequiredTenantId: mocks.getRequiredTenantId },
}));

type KgEntityRow = {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  tenant_id: string;
};

type QueryCall = {
  sql: string;
  params: unknown[];
};

function createHarness(existingEntities: KgEntityRow[] = []) {
  const calls: QueryCall[] = [];
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });

    if (/SELECT id, type, properties, name FROM kg_entities/i.test(sql)) {
      const name = String(params[0]);
      const tenantId = String(params[1]);
      const exactNameLookup = /AND name = \$1/i.test(sql);
      const typeScopedLookup = /AND type = \$3/i.test(sql);
      const rows = existingEntities.filter((entity) => {
        const nameMatches = exactNameLookup
          ? entity.name === name
          : entity.name.trim().toLowerCase() === name.trim().toLowerCase();
        return tenantId === "tenant-a" &&
          entity.tenant_id === tenantId &&
          nameMatches &&
          (!typeScopedLookup || entity.type === String(params[2]));
      }).slice(0, 2);
      return { rowCount: rows.length, rows };
    }

    if (/FROM entities/i.test(sql)) {
      return { rowCount: 0, rows: [] };
    }

    if (/SELECT id, properties FROM kg_relationships/i.test(sql)) {
      return { rowCount: 0, rows: [] };
    }

    if (/INSERT INTO kg_entities/i.test(sql)) {
      return { rowCount: 1, rows: [{ id: params[0], type: params[3], properties: JSON.parse(String(params[4])) }] };
    }

    if (/INSERT INTO kg_relationships/i.test(sql)) {
      return { rowCount: 1, rows: [{ id: params[0] }] };
    }

    return { rowCount: 1, rows: [] };
  });

  return {
    calls,
    store: new GraphStoreService({ query } as unknown as PostgresClient),
  };
}

function existingEntity(
  id: string,
  name: string,
  type: string,
  properties: Record<string, unknown> = {},
): KgEntityRow {
  return { id, name, type, properties, tenant_id: id.split(":")[0] };
}

describe("GraphStoreService relationship-only placeholders", () => {
  it("reuses a unique same-tenant entity regardless of type and preserves its type", async () => {
    const existing = existingEntity("tenant-a:optimus", "Optimus", "brand", { source: "curated" });
    const harness = createHarness([existing]);

    const result = await harness.store.upsertEntitiesAndRelationships({
      entities: [],
      relationships: [{
        sourceEntityName: " OPTIMUS ",
        targetEntityName: "New Concept",
        relationshipType: "related_to",
      }],
    }, "chunk-placeholder");

    const placeholderLookup = harness.calls.find(({ sql, params }) =>
      /SELECT id, type, properties, name FROM kg_entities/i.test(sql) &&
      /LOWER\(BTRIM\(name\)\)/i.test(sql) &&
      params[0] === " OPTIMUS "
    );
    const canonicalLookup = harness.calls.find(({ sql, params }) =>
      /FROM entities/i.test(sql) && params[1] === " OPTIMUS "
    );
    const insertedEntityNames = harness.calls
      .filter(({ sql }) => /INSERT INTO kg_entities/i.test(sql))
      .map(({ params }) => params[2]);

    expect(placeholderLookup?.sql).not.toMatch(/AND type = \$3/i);
    expect(placeholderLookup?.params).toEqual([" OPTIMUS ", "tenant-a"]);
    expect(result.entityIds.optimus).toBe("tenant-a:optimus");
    expect(insertedEntityNames).not.toContain(" OPTIMUS ");
    expect(canonicalLookup?.params).toEqual(["tenant-a", " OPTIMUS ", "brand"]);

    const placeholderUpdate = harness.calls.find(({ sql, params }) =>
      /UPDATE kg_entities/i.test(sql) && params[1] === "tenant-a:optimus"
    );
    expect(JSON.parse(String(placeholderUpdate?.params[0]))).toEqual({ source: "curated" });
    expect(placeholderUpdate?.sql).not.toMatch(/SET[^]*\btype\s*=/i);
  });

  it("does not reuse another tenant's same-name entity", async () => {
    const harness = createHarness([
      existingEntity("tenant-b:optimus", "Optimus", "brand", { source: "other-tenant" }),
    ]);

    const result = await harness.store.upsertEntitiesAndRelationships({
      entities: [],
      relationships: [{
        sourceEntityName: "Optimus",
        targetEntityName: "New Concept",
        relationshipType: "related_to",
      }],
    }, "chunk-tenant-isolation");

    const normalizedLookup = harness.calls.find(({ sql, params }) =>
      /SELECT id, type, properties, name FROM kg_entities/i.test(sql) &&
      /LOWER\(BTRIM\(name\)\)/i.test(sql) &&
      params[0] === "Optimus"
    );
    const insertedNames = harness.calls
      .filter(({ sql }) => /INSERT INTO kg_entities/i.test(sql))
      .map(({ params }) => params[2]);

    expect(normalizedLookup?.sql).toContain("tenant_id = $2");
    expect(normalizedLookup?.params).toEqual(["Optimus", "tenant-a"]);
    expect(insertedNames).toContain("Optimus");
    expect(result.entityIds.optimus).not.toBe("tenant-b:optimus");
  });

  it("fails closed for an ambiguous placeholder without aborting unrelated ingestion", async () => {
    const harness = createHarness([
      existingEntity("tenant-a:optimus-1", "Optimus", "brand"),
      existingEntity("tenant-a:optimus-2", "optimus ", "organization"),
    ]);

    const result = await harness.store.upsertEntitiesAndRelationships({
      entities: [{ name: "Independent", type: "brand", properties: {} }],
      relationships: [{
        sourceEntityName: "OPTIMUS",
        targetEntityName: "Independent",
        relationshipType: "related_to",
      }],
    }, "chunk-ambiguous");

    expect(result.ambiguousEntityNames).toEqual(["optimus"]);
    expect(result.entityIds.optimus).toBeUndefined();
    expect(result.entityIds.independent).toBeDefined();
    expect(result.relationshipIds).toEqual([]);
    expect(harness.calls.some(({ sql, params }) =>
      /INSERT INTO kg_entities/i.test(sql) && params[2] === "OPTIMUS"
    )).toBe(false);
    expect(harness.calls.some(({ sql }) => /INSERT INTO kg_relationships/i.test(sql))).toBe(false);
  });

  it("prefers one exact spelling when legacy whitespace variants normalize to the same identity", async () => {
    const harness = createHarness([
      existingEntity("tenant-a:apple", "Apple", "brand"),
      existingEntity("tenant-a:apple-space", "Apple ", "brand"),
    ]);

    const result = await harness.store.upsertEntitiesAndRelationships({
      entities: [{ name: "Apple", type: "brand", properties: { source: "new" } }],
      relationships: [],
    }, "chunk-whitespace-legacy");

    const exactLookup = harness.calls.find(({ sql }) =>
      /SELECT id, type, properties, name FROM kg_entities/i.test(sql) && /AND name = \$1/i.test(sql)
    );
    const normalizedLookup = harness.calls.find(({ sql }) =>
      /SELECT id, type, properties, name FROM kg_entities/i.test(sql) && /LOWER\(BTRIM\(name\)\)/i.test(sql)
    );

    expect(exactLookup).toBeDefined();
    expect(normalizedLookup).toBeUndefined();
    expect(result.entityIds.apple).toBe("tenant-a:apple");
    expect(result.ambiguousEntityNames).toEqual([]);
  });

  it("keeps an explicitly extracted concept type exact instead of treating it as a placeholder", async () => {
    const harness = createHarness([
      existingEntity("tenant-a:optimus-brand", "Optimus", "brand"),
    ]);

    await harness.store.upsertEntitiesAndRelationships({
      entities: [{ name: "Optimus", type: "concept", properties: { explicit: true } }],
      relationships: [],
    }, "chunk-explicit-concept");

    const lookup = harness.calls.find(({ sql }) =>
      /SELECT id, type, properties, name FROM kg_entities/i.test(sql) && /AND type = \$3/i.test(sql)
    );
    expect(lookup?.sql).toContain("AND type = $3");
    expect(lookup?.params).toEqual(["Optimus", "tenant-a", "concept"]);
    const insert = harness.calls.find(({ sql }) => /INSERT INTO kg_entities/i.test(sql));
    expect(insert?.params[2]).toBe("Optimus");
    expect(insert?.params[3]).toBe("concept");
  });

  it("reports conflicting explicit types and skips that identity before persistence", async () => {
    const harness = createHarness();

    const result = await harness.store.upsertEntitiesAndRelationships({
      entities: [
        { name: "Optimus", type: "brand", properties: {} },
        { name: " optimus ", type: "organization", properties: {} },
      ],
      relationships: [],
    }, "chunk-conflicting-types");

    expect(result.ambiguousEntityNames).toEqual(["optimus"]);
    expect(result.entityIds.optimus).toBeUndefined();
    expect(harness.calls.some(({ sql }) => /SELECT id, type, properties, name FROM kg_entities/i.test(sql))).toBe(false);
    expect(harness.calls.some(({ sql }) => /INSERT INTO kg_entities/i.test(sql))).toBe(false);
    expect(harness.calls.some(({ sql }) => /INSERT INTO kg_relationships/i.test(sql))).toBe(false);
  });
});
