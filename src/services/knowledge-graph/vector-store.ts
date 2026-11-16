/**
 * Optimus AI — GraphRAG Pipeline Vector Store Service
 * Implements high-performance dense semantic search over multi-tenant document embeddings.
 */

import { PostgresClient } from "../../features/admin/infrastructure/persistence/postgres";
import { DocumentEmbedding } from "../../features/ai-intelligence/domain/types";
import { MAX_CHUNK_SIZE, validateMetadata, validateRagResultLimit } from "../ai/resource-limits";

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
   * Removes one tenant-owned document and its source-linked graph relationships.
   * Call only inside TenantContextManager.runWithTenantContext so the delete and
   * subsequent inserts are protected by the same transaction/savepoint.
   */
  public async replaceDocument(
    tenantId: string,
    documentId: string,
    legacyOriginalFilename?: string,
  ): Promise<void> {
    if (!tenantId || !documentId.trim()) {
      throw new RangeError("A tenant and stable document ID are required for replacement.");
    }

    // Serialize concurrent updates to the same document without blocking other documents.
    await this.pg.query(
      "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
      [tenantId, documentId],
    );

    const documentPredicate = `(
      metadata ->> 'documentId' = $2
      OR ($2 = 'brand-profile' AND metadata ->> 'source' = 'brand-profile-form')
      OR ($3::text IS NOT NULL AND metadata ->> 'source' = 'brand-profile-file'
          AND metadata ->> 'originalFilename' = $3)
    )`;
    const params = [tenantId, documentId, legacyOriginalFilename ?? null];
    const existing = await this.pg.query(
      `SELECT id FROM document_embeddings WHERE tenant_id = $1 AND ${documentPredicate}`,
      params,
    );
    const chunkIds = existing.rows.map((row) => String(row.id));

    if (chunkIds.length > 0) {
      // Relationships carry source_chunk_id for provenance. Remove only edges
      // sourced by this document; shared knowledge-graph entities are retained.
      await this.pg.query(
        `DELETE FROM kg_relationships
         WHERE tenant_id = $1
           AND properties ->> 'source_chunk_id' = ANY($2::text[])`,
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
