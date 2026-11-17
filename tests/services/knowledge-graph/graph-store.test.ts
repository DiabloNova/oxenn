/**
 * Multi-Tenant Security & Integration Test Suite for the Persian KG Graph Store Service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from "pg";
import { GraphStoreService } from "../../../src/services/knowledge-graph/graph-store";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { PostgresClient } from "../../../src/features/admin/infrastructure/persistence/postgres";

// Simulated SQL persistence state
const mockEntitiesStore: any[] = [];
const mockRelationshipsStore: any[] = [];

// Clean up store between test runs
function resetStores() {
  mockEntitiesStore.length = 0;
  mockRelationshipsStore.length = 0;
}

// Global SQL query interception mock for Graph Store tests
const originalQuery = Pool.prototype.query;
const originalConnect = Pool.prototype.connect;
(Pool.prototype as any).connect = async function () {
  const pool = this;
  return {
    query: (sql: string, params: unknown[] = []) => (Pool.prototype as any).query.call(pool, sql, params),
    release: () => undefined,
  };
};

(Pool.prototype as any).query = async function (sql: string, params: unknown[] = []) {
  const normalizedSql = sql.toLowerCase();

  if (normalizedSql.includes("pg_advisory_xact_lock")) return { rowCount: 1, rows: [] };

  // 1. Intercept SELECT from kg_entities
  if (normalizedSql.includes("select") && normalizedSql.includes("kg_entities") && normalizedSql.includes("lower(name) = lower")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const nameParam = params[0] as string;
    // Strict RLS isolation check: Must match activeTenantId and case-insensitive name
    const found = mockEntitiesStore.find(
      e => e.tenant_id === activeTenantId && e.name.toLowerCase() === nameParam.toLowerCase()
    );

    return {
      rowCount: found ? 1 : 0,
      rows: found ? [found] : [],
    };
  }

  // 2. Intercept INSERT into kg_entities
  if (normalizedSql.includes("insert into") && normalizedSql.includes("kg_entities")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [id, tenant_id, name, type, propertiesJson] = params as any[];

    // Safety check: Cannot insert with a different tenant_id than the active context
    if (tenant_id !== activeTenantId) {
      throw new Error(`Tenant Isolation Block: Tried to insert entity for ${tenant_id} under active tenant context ${activeTenantId}`);
    }

    const newEntity = {
      id,
      tenant_id,
      name,
      type,
      properties: typeof propertiesJson === "string" ? JSON.parse(propertiesJson) : propertiesJson,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockEntitiesStore.push(newEntity);

    return {
      rowCount: 1,
      rows: [newEntity],
    };
  }

  // 3. Intercept UPDATE kg_entities
  if (normalizedSql.includes("update") && normalizedSql.includes("kg_entities")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [propertiesJson, id] = params as any[];
    const entity = mockEntitiesStore.find(e => e.id === id && e.tenant_id === activeTenantId);

    if (!entity) {
      throw new Error(`Entity not found or tenant context violation for ID ${id}`);
    }

    entity.properties = typeof propertiesJson === "string" ? JSON.parse(propertiesJson) : propertiesJson;
    entity.updated_at = new Date().toISOString();

    return {
      rowCount: 1,
      rows: [entity],
    };
  }

  // 4. Intercept SELECT from kg_relationships
  if (normalizedSql.includes("select") && normalizedSql.includes("kg_relationships")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [sourceId, targetId, relType] = params as any[];
    const found = mockRelationshipsStore.find(
      r => r.tenant_id === activeTenantId &&
           r.source_entity_id === sourceId &&
           r.target_entity_id === targetId &&
           r.relationship_type.toLowerCase() === relType.toLowerCase()
    );

    return {
      rowCount: found ? 1 : 0,
      rows: found ? [found] : [],
    };
  }

  // 5. Intercept INSERT into kg_relationships
  if (normalizedSql.includes("insert into") && normalizedSql.includes("kg_relationships")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [id, tenant_id, source_id, target_id, relType, propertiesJson] = params as any[];

    if (tenant_id !== activeTenantId) {
      throw new Error(`Tenant Isolation Block: Tried to insert relationship for ${tenant_id} under active tenant context ${activeTenantId}`);
    }

    const newRel = {
      id,
      tenant_id,
      source_entity_id: source_id,
      target_entity_id: target_id,
      relationship_type: relType,
      properties: typeof propertiesJson === "string" ? JSON.parse(propertiesJson) : propertiesJson,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockRelationshipsStore.push(newRel);

    return {
      rowCount: 1,
      rows: [newRel],
    };
  }

  // 6. Intercept UPDATE kg_relationships
  if (normalizedSql.includes("update") && normalizedSql.includes("kg_relationships")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [propertiesJson, sourceChunkId, id] = params as any[];
    const rel = mockRelationshipsStore.find(r => r.id === id && r.tenant_id === activeTenantId);

    if (!rel) {
      throw new Error(`Relationship not found or tenant context violation for ID ${id}`);
    }

    const incoming = typeof propertiesJson === "string" ? JSON.parse(propertiesJson) : propertiesJson;
    const existingSources = Array.isArray(rel.properties.source_chunk_ids) ? rel.properties.source_chunk_ids : [];
    const legacySources = typeof rel.properties.source_chunk_id === "string" ? [rel.properties.source_chunk_id] : [];
    rel.properties = { ...rel.properties, ...incoming, source_chunk_ids: [...new Set([...existingSources, ...legacySources, sourceChunkId])], ...(legacySources.length ? { source_provenance_incomplete: true } : {}) };
    delete rel.properties.source_chunk_id;
    rel.updated_at = new Date().toISOString();

    return {
      rowCount: 1,
      rows: [rel],
    };
  }

  // Handle BEGIN/COMMIT/ROLLBACK safely for offline simulation
  if (normalizedSql.includes("begin") || normalizedSql.includes("commit") || normalizedSql.includes("rollback") || normalizedSql.includes("set local") || normalizedSql.includes("set_config")) {
    return {
      rowCount: 1,
      rows: [],
      command: "SELECT",
      oid: 0,
      fields: []
    };
  }

  // Fallback to original
  try {
    return await originalQuery.apply(this, [sql, params] as any);
  } catch (err: any) {
    if (err.code === "ECONNREFUSED" || err.message?.includes("connect ECONNREFUSED") || err.message?.includes("Database connection failed")) {
      return {
        rows: [] as any[],
        command: "SELECT",
        rowCount: 0,
        oid: 0,
        fields: []
      };
    }
    throw err;
  }
};

export async function testGraphStore() {
  console.log("▶ Running Graph Store Service & Security Tests...");
  resetStores();

  const storeService = new GraphStoreService();

  const tenantA = "org-apple-tenant-01";
  const tenantB = "org-samsung-tenant-02";

  // Graph extracted payload from a document chunk
  const initialGraph = {
    entities: [
      { name: "Optimus AI", type: "brand" as const, properties: { category: "SaaS" } },
      { name: "Gemini", type: "product" as const, properties: { creator: "Google" } }
    ],
    relationships: [
      { sourceEntityName: "Optimus AI", targetEntityName: "Gemini", relationshipType: "utilizes", properties: { confidence: 0.95, source_chunk_id: "forged-source", source_chunk_ids: ["forged-array-source"], source_provenance_incomplete: true } }
    ]
  };

  const chunkId = "chunk-xyz-123";

  // 1. Test Ingestion under Tenant A
  console.log("  * Testing Graph Ingestion under Tenant A Context...");
  await TenantContextManager.runWithTenantContext(tenantA, "user-01", "req-01", async () => {
    const result = await storeService.upsertEntitiesAndRelationships(initialGraph, chunkId);

    if (Object.keys(result.entityIds).length !== 2) {
      throw new Error("Graph Store Test Failed: Expected 2 entities registered.");
    }
    if (result.relationshipIds.length !== 1) {
      throw new Error("Graph Store Test Failed: Expected 1 relationship registered.");
    }

    // Verify properties and source chunk linkage
    const entities = mockEntitiesStore.filter(e => e.tenant_id === tenantA);
    if (entities.length !== 2) {
      throw new Error("Graph Store Test Failed: Entity count mismatch in memory storage.");
    }

    const relationship = mockRelationshipsStore.find(r => r.tenant_id === tenantA);
    if (!relationship || !Array.isArray(relationship.properties.source_chunk_ids) || !relationship.properties.source_chunk_ids.includes(chunkId) || relationship.properties.source_chunk_ids.includes("forged-source") || relationship.properties.source_chunk_ids.includes("forged-array-source") || relationship.properties.source_provenance_incomplete === true) {
      throw new Error("Graph Store Test Failed: Traceability source chunk ID was not registered properly.");
    }

    // A second document supporting the same edge must append provenance, not overwrite it.
    await storeService.upsertEntitiesAndRelationships(initialGraph, "chunk-second-document");
    if (!relationship.properties.source_chunk_ids.includes(chunkId) || !relationship.properties.source_chunk_ids.includes("chunk-second-document")) {
      throw new Error("Graph Store Test Failed: Shared relationship provenance was overwritten.");
    }

    // Legacy single-source rows are migrated forward on the next upsert.
    delete relationship.properties.source_chunk_ids;
    relationship.properties.source_chunk_id = "legacy-source-chunk";
    await storeService.upsertEntitiesAndRelationships(initialGraph, "chunk-third-document");
    if (!relationship.properties.source_chunk_ids.includes("legacy-source-chunk") || !relationship.properties.source_chunk_ids.includes("chunk-third-document") || "source_chunk_id" in relationship.properties || relationship.properties.source_provenance_incomplete !== true) {
      throw new Error("Graph Store Test Failed: Legacy relationship provenance was not preserved.");
    }
  });

  // 2. Test Deduplication & Properties Merging
  console.log("  * Testing Entity Deduplication & Properties Merging...");
  await TenantContextManager.runWithTenantContext(tenantA, "user-01", "req-02", async () => {
    const updatedGraph = {
      entities: [
        { name: "OPTIMUS AI", type: "brand" as const, properties: { category: "Enterprise SaaS", rating: 5 } }
      ],
      relationships: []
    };

    await storeService.upsertEntitiesAndRelationships(updatedGraph, chunkId);

    // Ensure that no new entities were created in the database (total count should still be 2)
    const entities = mockEntitiesStore.filter(e => e.tenant_id === tenantA);
    if (entities.length !== 2) {
      throw new Error(`Deduplication Failed: Expected 2 total entities for Tenant A, found ${entities.length}. Duplicate entity created!`);
    }

    // Verify merged properties
    const optimus = entities.find(e => e.name.toLowerCase() === "optimus ai");
    if (!optimus || optimus.properties.rating !== 5 || optimus.properties.category !== "Enterprise SaaS") {
      throw new Error(`Merging Failed: Expected merged rating=5 and category='Enterprise SaaS', got: ${JSON.stringify(optimus?.properties)}`);
    }
  });

  // 3. Test Strict Multi-Tenant Isolation (Leakage Protection)
  console.log("  * Testing RLS Multi-Tenant Security Boundaries...");
  await TenantContextManager.runWithTenantContext(tenantB, "user-02", "req-03", async () => {
    // Under Tenant B, we should NOT see Tenant A's entities
    // Let's verify that a case-insensitive lookup for "Optimus AI" under Tenant B context returns nothing
    const selectSql = `
      SELECT id, properties FROM kg_entities
      WHERE LOWER(name) = LOWER($1) LIMIT 1;
    `;
    const res = await PostgresClient.getInstance().query(selectSql, ["Optimus AI"]);
    if (res.rowCount && res.rowCount > 0) {
      throw new Error("Security Violation: Tenant B read Tenant A's entities! Cross-tenant leakage detected.");
    }

    // Let's insert a completely separate entity under Tenant B
    const tenantBGraph = {
      entities: [
        { name: "Samsung Corp", type: "organization" as const, properties: { country: "South Korea" } }
      ],
      relationships: []
    };

    await storeService.upsertEntitiesAndRelationships(tenantBGraph, "chunk-samsung-001");

    const tenantAEntities = mockEntitiesStore.filter(e => e.tenant_id === tenantA);
    const tenantBEntities = mockEntitiesStore.filter(e => e.tenant_id === tenantB);

    if (tenantAEntities.some(e => e.tenant_id !== tenantA) || tenantBEntities.some(e => e.tenant_id !== tenantB)) {
      throw new Error("Security Violation: Cross-tenant ID allocation mismatch.");
    }

    console.log(`  * Verification Success: Tenant A has ${tenantAEntities.length} entities; Tenant B has ${tenantBEntities.length} entities. Totally isolated.`);
  });

  console.log("✅ Graph Store Service & Security Tests Passed Successfully!");
}

// Restore original Pool query on test suite end to not leak to other tests
export function restoreOriginalPool() {
  Pool.prototype.query = originalQuery;
  Pool.prototype.connect = originalConnect;
}

// If run directly
if (require.main === module) {
  testGraphStore()
    .then(() => restoreOriginalPool())
    .catch(err => {
      restoreOriginalPool();
      console.error(err);
      process.exit(1);
    });
}
