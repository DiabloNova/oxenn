/** Document ingestion: prepare remote work first, persist in a short tenant transaction. */
import { createHash } from "node:crypto";
import { chunkText } from "../ai/text-chunker";
import { generateEmbedding } from "../ai/embed-client";
import { analyzeSentiment } from "../ai/sentiment-analysis";
import { VectorStoreService } from "../knowledge-graph/vector-store";
import { extractGraphEntities, type ExtractedGraph } from "../ai/graph-extraction";
import { GraphStoreService } from "../knowledge-graph/graph-store";
import { TenantContextManager, TenantContextViolationException } from "../../core/database/tenant-context";
import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE, validateIngestionInput } from "../ai/resource-limits";

export interface ChunkError { chunkIndex: number; error: string }
export interface IngestionTenantContext { tenantId: string; userId: string | null; requestId: string | null }
export interface IngestionResult {
  success: boolean; tenantId: string; totalChunks: number; processedChunks: number; failedChunks: number;
  errors: ChunkError[];
  rolledBack?: boolean;
  preservationStatus?: "preserved" | "unknown";
  failureCode?: "DOCUMENT_REPLACEMENT_FAILED";
  failureStage?: "preparation";
  attemptedProcessedChunks?: number;
}
interface PreparedChunk {
  index: number; content: string; embedding: number[];
  sentiment: { score: number; label: string; confidence: number };
  graph: ExtractedGraph | null;
}

export class DocumentIngestionService {
  constructor(
    private vectorStore: VectorStoreService = new VectorStoreService(),
    private graphStore: GraphStoreService = new GraphStoreService(),
  ) {}

  public async ingestDocument(
    rawText: string,
    metadata: Record<string, unknown> = {},
    chunkingOptions?: { maxChunkSize?: number; overlap?: number },
    tenantContext?: IngestionTenantContext,
  ): Promise<IngestionResult> {
    // Validate at the service boundary before any provider/database operation.
    const validated = validateIngestionInput(rawText, metadata, chunkingOptions);

    // Caller identity comes only from the authenticated server boundary. Never run
    // provider calls while an outer transaction owns a pooled database connection.
    if (!tenantContext?.tenantId) {
      throw new TenantContextViolationException("Ingestion requires an explicit authenticated tenant context.");
    }
    if (TenantContextManager.getContext()?.dbClient) {
      throw new TenantContextViolationException("Document ingestion must start outside an active database transaction.");
    }

    const { tenantId, userId, requestId } = tenantContext;
    const safeMetadata = { ...validated.metadata };
    delete safeMetadata.documentId; // server-owned identity; ignore caller-supplied values

    const maxChunkSize = validated.chunkingOptions?.maxChunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = validated.chunkingOptions?.overlap ?? DEFAULT_CHUNK_OVERLAP;
    const chunks = chunkText(validated.text, maxChunkSize, overlap);
    const totalChunks = chunks.length;
    if (totalChunks === 0) return { success: true, tenantId, totalChunks: 0, processedChunks: 0, failedChunks: 0, errors: [] };

    const source = safeMetadata.source;
    const isBrandProfile = (source === "brand-profile" || source === "brand-profile-form")
      && safeMetadata.documentType === "brand-context";
    const isSupportingFile = source === "brand-profile-file"
      && safeMetadata.documentType === "brand-supporting-document";
    let documentId: string | null = null;
    if (isBrandProfile) {
      documentId = "brand-profile";
    } else if (isSupportingFile) {
      const originalFilename = safeMetadata.originalFilename;
      if (typeof originalFilename !== "string" || !originalFilename.trim()) {
        throw new RangeError("A supporting-file name is required for safe replacement.");
      }
      // NFC keeps canonically equivalent Unicode names stable without collapsing case-distinct files.
      const normalizedFilename = originalFilename.normalize("NFC");
      documentId = `brand-supporting-document:${createHash("sha256").update(normalizedFilename).digest("hex")}`;
    }

    // Phase 1: provider work runs without a database transaction. Graph extraction
    // is optional; embedding/sentiment failures are required-work failures.
    const prepared: PreparedChunk[] = [];
    const errors: ChunkError[] = [];
    for (let index = 0; index < totalChunks; index++) {
      const content = chunks[index];
      try {
        const embedding = await generateEmbedding(content);
        const sentiment = await analyzeSentiment(content);
        let graph: ExtractedGraph | null = null;
        try {
          graph = await extractGraphEntities(content);
        } catch (error) {
          console.error(`[DocumentIngestionService] Optional graph extraction failed for chunk ${index}:`, error instanceof Error ? error.message : String(error));
        }
        prepared.push({ index, content, embedding, sentiment, graph });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ chunkIndex: index, error: message });
        console.error(`[DocumentIngestionService] Provider preparation failed for chunk ${index}:`, message);
        if (documentId) break; // preserve the previous document and avoid wasted provider calls
      }
    }

    const failedChunks = errors.length;
    if (documentId && failedChunks > 0) {
      return {
        success: false,
        tenantId,
        totalChunks,
        processedChunks: 0,
        failedChunks,
        errors,
        rolledBack: false,
        preservationStatus: "preserved",
        failureCode: "DOCUMENT_REPLACEMENT_FAILED",
        failureStage: "preparation",
        attemptedProcessedChunks: prepared.length,
      };
    }
    if (prepared.length === 0) return { success: false, tenantId, totalChunks, processedChunks: 0, failedChunks, errors };

    // Phase 2: all database writes, including replacement and provenance updates,
    // share one short transaction. Database errors cannot be swallowed as provider errors.
    await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
        if (documentId) {
          const legacyFilename = source === "brand-profile-file" && typeof safeMetadata.originalFilename === "string"
            ? safeMetadata.originalFilename : undefined;
          if (legacyFilename) await this.vectorStore.replaceDocument(tenantId, documentId, legacyFilename);
          else await this.vectorStore.replaceDocument(tenantId, documentId);
        }
        for (const chunk of prepared) {
          const chunkMetadata = {
            ...safeMetadata,
            ...(documentId ? { documentId } : {}),
            chunkIndex: chunk.index,
            sentiment: { score: chunk.sentiment.score, label: chunk.sentiment.label, confidence: chunk.sentiment.confidence },
          };
          const inserted = await this.vectorStore.insertEmbedding(tenantId, chunk.content, chunk.embedding, chunkMetadata);
          const chunkId = (inserted as { id?: string })?.id;
          if (chunk.graph && chunkId) await this.graphStore.upsertEntitiesAndRelationships(chunk.graph, chunkId);
        }
    }, documentId ? { reportTransactionOutcome: true } : undefined);

    return { success: failedChunks === 0 && prepared.length === totalChunks, tenantId, totalChunks,
      processedChunks: prepared.length, failedChunks, errors };
  }
}
