/**
 * Optimus AI — Ingestion Pipeline & GraphRAG Orchestration
 * Handles document chunking, semantic vector indexing, and background KG population with fail-safe error boundaries.
 */

import { createHash } from "node:crypto";
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
  rolledBack?: boolean;
  attemptedProcessedChunks?: number;
}

class DocumentReplacementFailure extends Error {
  constructor(readonly result: IngestionResult) {
    super("Document replacement did not process every chunk.");
    this.name = "DocumentReplacementFailure";
  }
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

    // Only the explicit brand-profile sources may replace existing documents.
    // Supporting-file identities are derived on the server, never trusted from the client.
    const source = validated.metadata.source;
    const isLegacyBrandProfile = source === "brand-profile-form" && validated.metadata.documentType === "brand-context";
    let documentId: string | null = null;
    if (source === "brand-profile" || isLegacyBrandProfile) {
      documentId = "brand-profile";
    } else if (source === "brand-profile-file") {
      const originalFilename = validated.metadata.originalFilename;
      if (typeof originalFilename !== "string" || !originalFilename.trim()) {
        throw new RangeError("A supporting-file name is required for safe replacement.");
      }
      const normalizedFilename = originalFilename.normalize("NFKC").trim().toLowerCase();
      const filenameDigest = createHash("sha256").update(normalizedFilename).digest("hex");
      documentId = `brand-supporting-document:${filenameDigest}`;
    }

    const processChunks = async (): Promise<IngestionResult> => {
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
            ...(documentId ? { documentId } : {}),
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
            if (documentId) throw kgErr;
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
        success: failedCount === 0 && processedCount === totalChunks,
        tenantId,
        totalChunks,
        processedChunks: processedCount,
        failedChunks: failedCount,
        errors,
      };
    };

    if (!documentId) return processChunks();

    const activeContext = TenantContextManager.getContext();
    if (activeContext?.tenantId && activeContext.tenantId !== tenantId) {
      throw new Error("Document replacement tenant does not match the active tenant context.");
    }

    try {
      return await TenantContextManager.runWithTenantContext(
        tenantId,
        activeContext?.userId ?? null,
        activeContext?.requestId ?? null,
        async () => {
          const legacyOriginalFilename =
            source === "brand-profile-file" && typeof validated.metadata.originalFilename === "string"
              ? validated.metadata.originalFilename
              : undefined;
          if (legacyOriginalFilename) {
            await this.vectorStore.replaceDocument(tenantId, documentId, legacyOriginalFilename);
          } else {
            await this.vectorStore.replaceDocument(tenantId, documentId);
          }
          const result = await processChunks();
          if (!result.success) throw new DocumentReplacementFailure(result);
          return result;
        },
        { requireNewSavepoint: true },
      );
    } catch (error: unknown) {
      if (error instanceof DocumentReplacementFailure) {
        return {
          ...error.result,
          success: false,
          rolledBack: true,
          attemptedProcessedChunks: error.result.processedChunks,
          processedChunks: 0,
        };
      }
      throw error;
    }
  }
}
