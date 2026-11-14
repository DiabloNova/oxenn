/**
 * Optimus AI — RAG Query Service
 * Orchestrates query embedding, multi-tenant context retrieval, prompt construction, and LLM query answering.
 */

import { getLLMClient } from "../ai/llm-client";
import { embedQuery } from "../ai/query-embedding";
import { ragQueryRequestSchema } from "../ai/resource-limits";
import { retrieveRelevantContext, RetrievedChunk } from "./context-retrieval";

export interface RAGResponse {
  answer: string;
  sources: RetrievedChunk[];
  confidence: number;
}

export const RAG_SYSTEM_PROMPT = `You are an expert brand intelligence analyst for Optimus AI.

Your task is to answer the user's question based ONLY on the provided context from brand intelligence data.

Rules:
1. If the answer is not in the context, say "I don't have enough information to answer this question based on the available data."
2. Cite the source chunks by their IDs when making specific claims.
3. If the context contains conflicting information, mention the different perspectives.
4. Maintain a professional, analytical tone.
5. Answer in the same language as the question (Persian or English).

Context:
{context}

Question: {question}

Answer:`;

export async function answerQuestion(
  question: string,
  organizationId: string,
  limit: number = 5
): Promise<RAGResponse> {
  if (!organizationId) {
    throw new Error("Tenant context violation: organizationId must be provided for RAG Query Service");
  }

  const parsedInput = ragQueryRequestSchema.safeParse({ question, limit });
  if (!parsedInput.success) {
    throw new RangeError("RAG question or retrieval limit exceeds the allowed bounds.");
  }

  const boundedQuestion = parsedInput.data.question;
  const boundedLimit = parsedInput.data.limit;

  const queryEmbedding = await embedQuery(boundedQuestion);
  const sources = await retrieveRelevantContext(queryEmbedding, organizationId, boundedLimit);
  const confidence = sources.length > 0 ? Math.max(0, Math.min(1, sources[0].similarityScore)) : 0;

  const contextText = sources.length > 0
    ? sources
        .map((source, index) => `[Source ${index + 1}] ID: ${source.id}\nContent: ${source.content}`)
        .join("\n\n")
    : "No relevant context found in brand intelligence data.";

  const finalPrompt = RAG_SYSTEM_PROMPT
    .replace("{context}", contextText)
    .replace("{question}", boundedQuestion);

  const llm = getLLMClient();
  const answer = await llm.generateText(finalPrompt, {
    temperature: 0.1,
  });

  return { answer, sources, confidence };
}
