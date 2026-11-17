/**
 * Integration Test for Document Ingestion Pipeline and Multi-Tenant KG Querying
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from "pg";
import { DocumentIngestionService } from "../../../src/services/ingestion/document-ingestion";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { PostgresClient } from "../../../src/features/admin/infrastructure/persistence/postgres";

const mockEmbeddingsStore: any[] = [];
const mockEntitiesStore: any[] = [];
const mockRelationshipsStore: any[] = [];
let transactionSnapshot: { embeddings: any[]; entities: any[]; relationships: any[] } | null = null;

// Clean database mocks
function resetMocks() {
  mockEmbeddingsStore.length = 0;
  mockEntitiesStore.length = 0;
  mockRelationshipsStore.length = 0;
  transactionSnapshot = null;
}

const originalQuery = Pool.prototype.query;
const originalConnect = Pool.prototype.connect;
(Pool.prototype as any).connect = async function () {
  const pool = this;
  return {
    query: (sql: string, params: unknown[] = []) => (Pool.prototype as any).query.call(pool, sql, params),
    release: () => undefined,
  };
};

// Query mock to intercept database writes and queries for Document Ingestion integration tests
(Pool.prototype as any).query = async function (sql: string, params: unknown[] = []) {
  const normalizedSql = sql.toLowerCase();

  if (normalizedSql.includes("pg_advisory_xact_lock")) return { rowCount: 1, rows: [] };
  if (normalizedSql.trim() === "begin") {
    transactionSnapshot = {
      embeddings: structuredClone(mockEmbeddingsStore),
      entities: structuredClone(mockEntitiesStore),
      relationships: structuredClone(mockRelationshipsStore),
    };
    return { rowCount: 1, rows: [] };
  }
  if (normalizedSql.trim() === "rollback") {
    if (transactionSnapshot) {
      mockEmbeddingsStore.splice(0, mockEmbeddingsStore.length, ...transactionSnapshot.embeddings);
      mockEntitiesStore.splice(0, mockEntitiesStore.length, ...transactionSnapshot.entities);
      mockRelationshipsStore.splice(0, mockRelationshipsStore.length, ...transactionSnapshot.relationships);
    }
    transactionSnapshot = null;
    return { rowCount: 1, rows: [] };
  }
  if (normalizedSql.trim() === "commit") {
    transactionSnapshot = null;
    return { rowCount: 1, rows: [] };
  }

  // 1. document_embeddings INSERT
  if (normalizedSql.includes("insert into document_embeddings")) {
    TenantContextManager.getRequiredTenantId();
    const [id, tenantId, contentChunk, metadataJson, embeddingStr, createdAt] = params as any[];
    const embedding = JSON.parse(embeddingStr);
    const metadata = typeof metadataJson === "string" ? JSON.parse(metadataJson) : metadataJson;

    const newRecord = {
      id,
      tenant_id: tenantId,
      content_chunk: contentChunk,
      metadata,
      embedding,
      created_at: createdAt
    };
    mockEmbeddingsStore.push(newRecord);

    return { rowCount: 1, rows: [newRecord] };
  }

  // 2. kg_entities SELECT case-insensitive
  if (normalizedSql.includes("select") && normalizedSql.includes("kg_entities") && normalizedSql.includes("lower(name) = lower")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const nameParam = params[0] as string;
    const found = mockEntitiesStore.find(
      e => e.tenant_id === activeTenantId && e.name.toLowerCase() === nameParam.toLowerCase()
    );

    return { rowCount: found ? 1 : 0, rows: found ? [found] : [] };
  }

  // 3. kg_entities INSERT
  if (normalizedSql.includes("insert into") && normalizedSql.includes("kg_entities")) {
    TenantContextManager.getRequiredTenantId();
    const [id, tenant_id, name, type, propertiesJson] = params as any[];
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

    return { rowCount: 1, rows: [newEntity] };
  }

  // 4. kg_entities UPDATE
  if (normalizedSql.includes("update") && normalizedSql.includes("kg_entities")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();
    const [propertiesJson, id] = params as any[];
    const entity = mockEntitiesStore.find(e => e.id === id && e.tenant_id === activeTenantId);
    if (entity) {
      entity.properties = typeof propertiesJson === "string" ? JSON.parse(propertiesJson) : propertiesJson;
      entity.updated_at = new Date().toISOString();
    }
    return { rowCount: entity ? 1 : 0, rows: entity ? [entity] : [] };
  }

  // 5. kg_relationships SELECT
  if (normalizedSql.includes("select") && normalizedSql.includes("kg_relationships") && normalizedSql.includes("source_entity_id")) {
    const activeTenantId = TenantContextManager.getRequiredTenantId();

    if (normalizedSql.includes("join kg_entities s") && normalizedSql.includes("join kg_entities t")) {
      const entityId = params[0] as string;
      const matchedRels = mockRelationshipsStore.filter(
        r => r.tenant_id === activeTenantId && (r.source_entity_id === entityId || r.target_entity_id === entityId)
      );

      const rows = matchedRels.map(r => {
        const sourceEntity = mockEntitiesStore.find(e => e.id === r.source_entity_id);
        const targetEntity = mockEntitiesStore.find(e => e.id === r.target_entity_id);
        return {
          id: r.id,
          source_entity_id: r.source_entity_id,
          target_entity_id: r.target_entity_id,
          relationship_type: r.relationship_type,
          properties: r.properties,
          created_at: r.created_at,
          updated_at: r.updated_at,
          source_name: sourceEntity ? sourceEntity.name : "",
          source_type: sourceEntity ? sourceEntity.type : "",
          target_name: targetEntity ? targetEntity.name : "",
          target_type: targetEntity ? targetEntity.type : "",
        };
      });

      return { rowCount: rows.length, rows };
    }

    const [sourceId, targetId, relType] = params as any[];
    const found = mockRelationshipsStore.find(
      r => r.tenant_id === activeTenantId &&
           r.source_entity_id === sourceId &&
           r.target_entity_id === targetId &&
           r.relationship_type.toLowerCase() === relType.toLowerCase()
    );

    return { rowCount: found ? 1 : 0, rows: found ? [found] : [] };
  }

  // 6. kg_relationships INSERT
  if (normalizedSql.includes("insert into") && normalizedSql.includes("kg_relationships")) {
    TenantContextManager.getRequiredTenantId();
    const [id, tenant_id, source_id, target_id, relType, propertiesJson] = params as any[];
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

    return { rowCount: 1, rows: [newRel] };
  }

  // 7. Transaction control SQLs safely resolved for offline simulation
  if (normalizedSql.includes("begin") || normalizedSql.includes("commit") || normalizedSql.includes("rollback") || normalizedSql.includes("set local") || normalizedSql.includes("set_config")) {
    return { rowCount: 1, rows: [], command: "SELECT", oid: 0, fields: [] };
  }

  // Fallback
  return { rowCount: 0, rows: [] };
};

export async function testDocumentIngestionPipeline() {
  console.log("▶ Running Document Ingestion & KG Pipeline Integration Tests...");
  resetMocks();

  const ingestionService = new DocumentIngestionService();
  const tenantId = "org-test-ingestion-001";

  const docText = "Optimus AI solves brand intelligence problems by using Gemini models beautifully.";

  console.log("  * Executing Document Ingestion Process...");
  const ingestionResult = await ingestionService.ingestDocument(docText, { source: "test-suite" }, undefined, { tenantId, userId: "user-01", requestId: "req-01" });

  if (ingestionResult.totalChunks !== 1) {
    throw new Error(`Ingestion Integration Error: Expected 1 chunk, got ${ingestionResult.totalChunks}`);
  }

  if (ingestionResult.processedChunks !== 1) {
    throw new Error(`Ingestion Integration Error: Expected 1 processed chunk, got ${ingestionResult.processedChunks}`);
  }

  if (mockEmbeddingsStore.length !== 1) {
    throw new Error("Ingestion Integration Error: Chunks were not indexed inside vector-store.");
  }

  if (mockEntitiesStore.length !== 2) {
    throw new Error(`Ingestion Integration Error: Expected 2 entities, found ${mockEntitiesStore.length}`);
  }

  if (mockRelationshipsStore.length !== 1) {
    throw new Error(`Ingestion Integration Error: Expected 1 relationship, found ${mockRelationshipsStore.length}`);
  }

  const rel = mockRelationshipsStore[0];
  if (!rel.properties || !Array.isArray(rel.properties.source_chunk_ids) || rel.properties.source_chunk_ids.length !== 1) {
    throw new Error("Traceability Error: Expected source_chunk_ids in relationship properties");
  }

  console.log("  * Testing sub-graph 1-hop Query logic...");
  await TenantContextManager.runWithTenantContext(tenantId, "user-01", "req-02", async () => {
    const pg = PostgresClient.getInstance();

    const entRes = await pg.query("SELECT id, name FROM kg_entities WHERE LOWER(name) = LOWER($1) LIMIT 1", ["optimus ai"]);
    const entity = entRes.rows[0];

    const relRes = await pg.query(
      `SELECT r.id, s.name as source_name, t.name as target_name, r.relationship_type
       FROM kg_relationships r
       JOIN kg_entities s ON r.source_entity_id = s.id
       JOIN kg_entities t ON r.target_entity_id = t.id
       WHERE r.source_entity_id = $1 OR r.target_entity_id = $1`,
      [entity.id]
    );

    if (relRes.rowCount !== 1) {
      throw new Error(`Query Error: Expected 1-hop relationship in query result, found ${relRes.rowCount}`);
    }

    const row = relRes.rows[0];
    if (row.source_name !== "Optimus AI" || row.target_name !== "Gemini") {
      throw new Error(`Query Error: Path resolution mismatch. Got source='${row.source_name}', target='${row.target_name}'`);
    }

    console.log("  * Success: Sub-graph querying successfully mapped paths.");
  });

  console.log("✅ Document Ingestion & KG Pipeline Integration Tests Passed Successfully!");
}

export function restoreOriginalPool() {
  Pool.prototype.query = originalQuery;
  Pool.prototype.connect = originalConnect;
}

// ✅ FIXED: Properly closed the catch block for the first test suite
if (require.main === module) {
  testDocumentIngestionPipeline()
    .then(() => restoreOriginalPool())
    .catch(err => {
      restoreOriginalPool();
      console.error(err);
      process.exit(1);
    });
}

/**
 * Programmatic Enterprise Test Suite for Document Ingestion Pipeline
 * Verifies provider preparation, atomic database persistence/rollback, and zero-trust multi-tenant isolation.
 */

import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";
import { TenantContextViolationException } from "../../../src/core/database/tenant-context";

class MockFailingVectorStore extends VectorStoreService {
  override async insertEmbedding(
    tenantId: string,
    contentChunk: string,
    embedding: number[],
    metadata: Record<string, unknown>
  ) {
    if (contentChunk.includes("فیلتر_خطا")) {
      throw new Error("Simulated database insertion failure for this chunk");
    }
    return super.insertEmbedding(tenantId, contentChunk, embedding, metadata);
  }
}

export async function testDocumentIngestion() {
  console.log("▶ Running Document Ingestion Pipeline Tests...");

  const tenantAId = "org-enterprise-01";
  const tenantBId = "org-startup-02";

  // 1. Test Ingestion without active Tenant Context
  console.log("  * Testing Tenant Context enforcement...");
  const orphanedService = new DocumentIngestionService();
  try {
    await orphanedService.ingestDocument("تست عدم وجود کانکست برای امنیت اطلاعات.", { source: "test" });
    throw new Error("Ingestion Test Failure: Ingesting without context should have thrown a TenantContextViolationException!");
  } catch (err) {
    if (!(err instanceof TenantContextViolationException)) {
      throw new Error(`Ingestion Test Failure: Expected TenantContextViolationException, got: ${err}`);
    }
    console.log("    ✅ Successfully blocked ingestion outside active Tenant Context.");
  }

  // 2. Test Success Pipeline Flow
  console.log("  * Testing normal success ingestion flow...");
  const ingestionService = new DocumentIngestionService();
  const rawText = "موتور بهینه‌سازی جی ای او. اپتیموس بهترین راهکار گراف دانش است؛ حتماً استفاده کنید!";

  const result = await ingestionService.ingestDocument(rawText, { docType: "article" }, { maxChunkSize: 50, overlap: 5 }, { tenantId: tenantAId, userId: "user-01", requestId: "req-ingest-01" });

  if (!result.success) {
    throw new Error(`Ingestion Test Failure: Expected success, got result: ${JSON.stringify(result)}`);
  }
  if (result.totalChunks === 0 || result.processedChunks !== result.totalChunks) {
    throw new Error(`Ingestion Test Failure: Mismatch in processed chunks. Result: ${JSON.stringify(result)}`);
  }
  console.log(`    ✅ Successfully ingested document into ${result.processedChunks} chunks.`);

  // 3. Test Partial Success and Error Recovery
  console.log("  * Testing partial success error handling...");
  const failingVectorStore = new MockFailingVectorStore();
  const failingIngestionService = new DocumentIngestionService(failingVectorStore);
  const partialRawText = "بخش اول متن بسیار خوب است. بخش دوم فیلتر_خطا حاوی ارور شبیه‌سازی شده است. بخش سوم هم بدون مشکل است.";

  const beforeFailedWrite = {
    embeddings: mockEmbeddingsStore.length,
    entities: mockEntitiesStore.length,
    relationships: mockRelationshipsStore.length,
  };
  let databaseFailureWasPropagated = false;
  try {
    await failingIngestionService.ingestDocument(partialRawText, { docType: "partial" }, { maxChunkSize: 30, overlap: 0 }, { tenantId: tenantAId, userId: "user-01", requestId: "req-ingest-02" });
  } catch {
    databaseFailureWasPropagated = true;
  }
  if (!databaseFailureWasPropagated) {
    throw new Error("Ingestion Test Failure: Database write errors must abort the atomic write transaction.");
  }
  if (mockEmbeddingsStore.length !== beforeFailedWrite.embeddings || mockEntitiesStore.length !== beforeFailedWrite.entities || mockRelationshipsStore.length !== beforeFailedWrite.relationships) {
    throw new Error("Ingestion Test Failure: Database transaction rollback did not restore the pre-write state.");
  }
  console.log("    ✅ Database write failure rolled back all partial database changes.");

  // 4. Test Multi-Tenant Isolation
  console.log("  * Testing end-to-end multi-tenant isolation...");
  const isolationText = "اطلاعات محرمانه سازمانی آلفا برای امنیت پیشرفته.";

  await ingestionService.ingestDocument(isolationText, { source: "internal-alpha" }, undefined, { tenantId: tenantAId, userId: "user-01", requestId: "req-ingest-03" });

  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-ingest-04", async () => {
    const vectorStore = new VectorStoreService();
    const queryEmbedding = Array.from({ length: 768 }, () => 0.01);
    const results = await vectorStore.findSimilarEmbeddings(tenantAId, queryEmbedding, 10);

    const found = results.some(r => r.contentChunk.includes("اطلاعات محرمانه سازمانی آلفا"));
    if (!found) {
      throw new Error("Ingestion Test Failure: Ingested document was not found under Tenant A's own context.");
    }
  });

  await TenantContextManager.runWithTenantContext(tenantBId, "user-02", "req-ingest-05", async () => {
    const vectorStore = new VectorStoreService();
    const queryEmbedding = Array.from({ length: 768 }, () => 0.01);
    const results = await vectorStore.findSimilarEmbeddings(tenantBId, queryEmbedding, 10);

    const leaked = results.some(r => r.contentChunk.includes("اطلاعات محرمانه سازمانی آلفا") || r.tenantId === tenantAId);
    if (leaked) {
      throw new Error("Ingestion Test Failure: SECURITY VIOLATION! Tenant B was able to retrieve Tenant A's document chunk!");
    }
    console.log("    ✅ Securely verified zero-trust tenant isolation boundaries.");
  });

  console.log("✅ All Document Ingestion Pipeline Tests Passed Successfully!");
}

// Support executing directly
if (require.main === module) {
  testDocumentIngestion()
    .then(() => console.log("Test finished!"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
