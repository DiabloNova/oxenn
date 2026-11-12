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
