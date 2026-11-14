/**
 * Optimus AI — Ingestion Pipeline & GraphRAG Orchestration
 * Handles document chunking, semantic vector indexing, and background KG population with fail-safe error boundaries.
 */

import { chunkText } from "../ai/text-chunker";
import { generateEmbedding } from "../ai/embed-client";
import { analyzeSentiment } from "../ai/sentiment-analysis";
import { VectorStoreService } from "../knowledge-graph/vector-store";
import { extractGraphEntities } from "../ai/graph-extraction";
import { GraphStoreService } from "../knowledge-graph/graph-store";
import { TenantContextManager } from "../../core/database/tenant-context";
import {
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  validateIngestionInput,
} from "../ai/resource-limits";

export interface ChunkError {
  chunkIndex: number;
  error: string;
}

export interface IngestedChunkResult {
  chunkId: string;
  contentChunk: string;
  isGraphExtracted: boolean;
  graphError?: string;
}

export interface IngestionResult {
  success: boolean;
  tenantId: string;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errors: ChunkError[];
}

export class DocumentIngestionService {
  constructor(
    private vectorStore: VectorStoreService = new VectorStoreService(),
    private graphStore: GraphStoreService = new GraphStoreService()
  ) {}

  public async ingestDocument(
    rawText: string,
    metadata: Record<string, unknown> = {},
    chunkingOptions?: { maxChunkSize?: number; overlap?: number }
  ): Promise<IngestionResult> {
    const tenantId = TenantContextManager.getRequiredTenantId();

    // Validate again at the service boundary so direct callers cannot bypass API/action schemas.
    const validated = validateIngestionInput(rawText, metadata, chunkingOptions);
    const maxChunkSize = validated.chunkingOptions?.maxChunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = validated.chunkingOptions?.overlap ?? DEFAULT_CHUNK_OVERLAP;

    const chunks = chunkText(validated.text, maxChunkSize, overlap);
    const totalChunks = chunks.length;

    if (totalChunks === 0) {
      return {
        success: true,
        tenantId,
        totalChunks: 0,
        processedChunks: 0,
        failedChunks: 0,
        errors: [],
      };
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: ChunkError[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      let chunkId = `chunk_${tenantId}_${i}_${Date.now()}`;

      try {
        const embedding = await generateEmbedding(chunk);
        const sentiment = await analyzeSentiment(chunk);

        const chunkMetadata = {
          ...validated.metadata,
          chunkIndex: i,
          sentiment: {
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
          },
        };

        const insertResult = await this.vectorStore.insertEmbedding(
          tenantId,
          chunk,
          embedding,
          chunkMetadata
        );

        chunkId = (insertResult as { id?: string })?.id || chunkId;

        try {
          const extractedGraph = await extractGraphEntities(chunk);
          await this.graphStore.upsertEntitiesAndRelationships(extractedGraph, chunkId);
        } catch (kgErr: unknown) {
          console.error(
            `[DocumentIngestionService] Fail-safe active. KG population failed for chunk ${i} (ID: ${chunkId}):`,
            kgErr instanceof Error ? kgErr.message : String(kgErr)
          );
        }

        processedCount++;
      } catch (err: unknown) {
        failedCount++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({ chunkIndex: i, error: errorMessage });

        console.error(
          `[DocumentIngestionService] Critical failure for chunk ${i}:`,
          errorMessage
        );
      }
    }

    return {
      success: processedCount > 0,
      tenantId,
      totalChunks,
      processedChunks: processedCount,
      failedChunks: failedCount,
      errors,
    };
  }
}
