/**
 * Optimus AI — GraphRAG Pipeline Vector Store Service
 * Implements high-performance dense semantic search over multi-tenant document embeddings.
 */

import { PostgresClient } from "../../features/admin/infrastructure/persistence/postgres";
import { DocumentEmbedding } from "../../features/ai-intelligence/domain/types";
import { MAX_CHUNK_SIZE, validateMetadata, validateRagResultLimit } from "../ai/resource-limits";
import { acquireTenantGraphWriteLock } from "./graph-write-lock";

export class VectorStoreService {
  private pg: PostgresClient;

  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  public async insertEmbedding(
    tenantId: string,
    contentChunk: string,
    embedding: number[],
    metadata: Record<string, unknown>
  ): Promise<DocumentEmbedding> {
    const safeMetadata = validateMetadata(metadata);
    if (contentChunk.length > MAX_CHUNK_SIZE) {
      throw new RangeError("Content chunk exceeds the maximum allowed size.");
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const vectorString = `[${embedding.join(",")}]`;

    const sql = `
      INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at)
      VALUES ($1, $2, $3, $4, $5::vector, $6)
      RETURNING id, tenant_id, content_chunk, metadata, created_at;
    `;

    const params = [
      id,
      tenantId,
      contentChunk,
      JSON.stringify(safeMetadata),
      vectorString,
      createdAt
    ];

    const res = await this.pg.query(sql, params);

    if (!res.rowCount || res.rowCount === 0) {
      return {
        id,
        tenantId,
        contentChunk,
        metadata: safeMetadata,
        embedding,
        createdAt
      };
    }

    const row = res.rows[0];
    return {
      id: row.id || id,
      tenantId: row.tenant_id || tenantId,
      contentChunk: row.content_chunk || contentChunk,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || safeMetadata),
      embedding,
      createdAt: row.created_at || createdAt
    };
  }

  /**
   * Removes one tenant-owned document and detaches only that document's graph provenance.
   * Shared relationships survive while at least one source chunk still supports them.
   * Call only inside TenantContextManager.runWithTenantContext so replacement is atomic.
   */
  public async replaceDocument(
    tenantId: string,
    documentId: string,
    legacyOriginalFilename?: string,
  ): Promise<void> {
    if (!tenantId || !documentId.trim()) {
      throw new RangeError("A tenant and stable document ID are required for replacement.");
    }

    // Acquire the shared graph lock before any document or relationship row locks.
    // Graph upserts take this same transaction-scoped lock first.
    await acquireTenantGraphWriteLock(this.pg, tenantId);

    // Serialize concurrent updates to this specific document.
    await this.pg.query(
      "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
      [tenantId, documentId],
    );

    const documentPredicate = `(
      (metadata ->> 'documentId' = $2 AND (
        (metadata ->> 'source' IN ('brand-profile', 'brand-profile-form')
          AND metadata ->> 'documentType' = 'brand-context')
        OR (metadata ->> 'source' = 'brand-profile-file'
          AND metadata ->> 'documentType' = 'brand-supporting-document')
      ))
      OR ($2 = 'brand-profile' AND metadata ->> 'source' = 'brand-profile-form'
          AND metadata ->> 'documentType' = 'brand-context')
      OR ($3::text IS NOT NULL AND metadata ->> 'source' = 'brand-profile-file'
          AND metadata ->> 'documentType' = 'brand-supporting-document'
          AND metadata ->> 'originalFilename' = $3)
    )`;
    const params = [tenantId, documentId, legacyOriginalFilename ?? null];
    const existing = await this.pg.query(
      `SELECT id FROM document_embeddings WHERE tenant_id = $1 AND ${documentPredicate}`,
      params,
    );
    const chunkIds = existing.rows.map((row) => String(row.id));

    if (chunkIds.length > 0) {
      // Preserve all known provenance, including the legacy single-source field,
      // while removing only chunks belonging to the document being replaced.
      // Relationships with unknown/no provenance are deliberately left untouched.
      // Legacy single-source rows are marked incomplete and retained because older
      // writes may already have overwritten other supporting chunk IDs.
      await this.pg.query(
        `WITH locked_relationships AS MATERIALIZED (
           SELECT id, properties
           FROM kg_relationships
           WHERE tenant_id = $1
             AND (
               properties ->> 'source_chunk_id' = ANY($2::text[])
               OR (jsonb_typeof(properties -> 'source_chunk_ids') = 'array'
                   AND properties -> 'source_chunk_ids' ?| $2::text[])
             )
           FOR UPDATE
         ), affected_relationships AS (
           SELECT locked.id,
             (COALESCE(jsonb_typeof(locked.properties -> 'source_chunk_id') = 'string', FALSE)
               OR COALESCE(locked.properties ->> 'source_provenance_incomplete' = 'true', FALSE)) AS provenance_incomplete,
             COALESCE((
               SELECT jsonb_agg(DISTINCT known_source.source_id)
               FROM jsonb_array_elements_text(
                 (CASE
                   WHEN jsonb_typeof(locked.properties -> 'source_chunk_ids') = 'array'
                   THEN locked.properties -> 'source_chunk_ids'
                   ELSE '[]'::jsonb
                 END)
                 || (CASE
                   WHEN jsonb_typeof(locked.properties -> 'source_chunk_id') = 'string'
                   THEN jsonb_build_array(locked.properties ->> 'source_chunk_id')
                   ELSE '[]'::jsonb
                 END)
               ) AS known_source(source_id)
               WHERE known_source.source_id IS NOT NULL
                 AND known_source.source_id <> ALL($2::text[])
             ), '[]'::jsonb) AS remaining_source_ids
           FROM locked_relationships AS locked
         ), updated_shared_relationships AS (
           UPDATE kg_relationships AS relationship
           SET properties = (relationship.properties - 'source_chunk_id')
             || jsonb_build_object('source_chunk_ids', affected_relationships.remaining_source_ids)
             || CASE WHEN affected_relationships.provenance_incomplete
                 THEN jsonb_build_object('source_provenance_incomplete', TRUE)
                 ELSE '{}'::jsonb END,
             updated_at = NOW()
           FROM affected_relationships
           WHERE relationship.id = affected_relationships.id
             AND relationship.tenant_id = $1
             AND (jsonb_array_length(affected_relationships.remaining_source_ids) > 0
               OR affected_relationships.provenance_incomplete)
           RETURNING relationship.id
         )
         DELETE FROM kg_relationships AS relationship
         USING affected_relationships
         WHERE relationship.id = affected_relationships.id
           AND relationship.tenant_id = $1
           AND jsonb_array_length(affected_relationships.remaining_source_ids) = 0
           AND NOT affected_relationships.provenance_incomplete`,
        [tenantId, chunkIds],
      );
    }

    await this.pg.query(
      `DELETE FROM document_embeddings WHERE tenant_id = $1 AND ${documentPredicate}`,
      params,
    );
  }

  public async findSimilarEmbeddings(
    tenantId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<(DocumentEmbedding & { distance: number })[]> {
    const boundedLimit = validateRagResultLimit(limit);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    const sql = `
      SELECT
        id,
        tenant_id,
        content_chunk,
        metadata,
        (embedding <=> $2::vector) AS distance,
        created_at
      FROM document_embeddings
      WHERE tenant_id = $1
      ORDER BY embedding <=> $2::vector
      LIMIT $3;
    `;

    const params = [tenantId, vectorString, boundedLimit];
    const res = await this.pg.query(sql, params);

    if (!res.rowCount || res.rowCount === 0) return [];

    interface DbVectorRow {
      id: string;
      tenant_id: string;
      content_chunk: string;
      metadata: string | Record<string, unknown>;
      distance: number | string;
      created_at: string;
    }

    return (res.rows as unknown as DbVectorRow[]).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      contentChunk: row.content_chunk,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
      embedding: queryEmbedding,
      distance: Number(row.distance),
      createdAt: row.created_at
    }));
  }
}
