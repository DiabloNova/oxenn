/**
 * Optimus AI — Context Retrieval Service
 * Retrieves top-K relevant chunks with strict multi-tenant isolation boundaries.
 */

import { validateRagResultLimit } from "../ai/resource-limits";
import { VectorStoreService } from "../knowledge-graph/vector-store";

export interface RetrievedChunk {
  id: string;
  content: string;
  similarityScore: number;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  } | null;
  metadata: Record<string, unknown>;
}

export async function retrieveRelevantContext(
  queryEmbedding: number[],
  organizationId: string,
  limit: number = 5
): Promise<RetrievedChunk[]> {
  if (!organizationId) {
    throw new Error("Tenant context violation: organizationId must be provided for context retrieval");
  }

  const boundedLimit = validateRagResultLimit(limit);
  const vectorStore = new VectorStoreService();
  const similar = await vectorStore.findSimilarEmbeddings(organizationId, queryEmbedding, boundedLimit);

  return similar.map((item) => {
    const similarityScore = 1 - item.distance;
    let sentiment: RetrievedChunk['sentiment'] = null;
    const meta = item.metadata as Record<string, unknown> | null;

    if (meta && typeof meta === 'object' && meta.sentiment) {
      const s = meta.sentiment as Record<string, unknown> | null;
      if (
        s &&
        typeof s === 'object' &&
        typeof s.score === 'number' &&
        typeof s.label === 'string' &&
        ['positive', 'negative', 'neutral'].includes(s.label)
      ) {
        sentiment = {
          score: s.score,
          label: s.label as 'positive' | 'negative' | 'neutral',
        };
      }
    }

    return {
      id: item.id,
      content: item.contentChunk,
      similarityScore,
      sentiment,
      metadata: meta || {},
    };
  });
}
