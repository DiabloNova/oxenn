import { generateObject } from 'ai';
import { z } from 'zod';
import { getLLMClient, GeminiLLMClient, geminiFlashModel } from './llm-client';

export type EntityType = 'brand' | 'person' | 'product' | 'organization' | 'concept' | 'location';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  properties?: Record<string, unknown>;
}

export interface ExtractedRelationship {
  sourceEntityName: string;
  targetEntityName: string;
  relationshipType: string;
  properties?: Record<string, unknown>;
}

export interface ExtractedGraph {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

export const extractedGraphSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['brand', 'person', 'product', 'organization', 'concept', 'location']),
      // ✅ اصلاح شده: اضافه کردن z.string() به عنوان نوع کلید
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  relationships: z.array(
    z.object({
      sourceEntityName: z.string(),
      targetEntityName: z.string(),
      relationshipType: z.string(), // e.g., 'competes_with', 'owns', 'mentions', 'located_in'
      // ✅ اصلاح شده: اضافه کردن z.string() به عنوان نوع کلید
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ),
});

const systemPrompt = `You are an expert knowledge graph extraction engine for brand intelligence.
Analyze the provided text and extract all relevant entities and the relationships between them.
Focus on brands, competitors, key people, products, and market concepts.
Return the result strictly as a JSON object matching the provided schema.`;

/**
 * Extracts semantic entities and their relationships from a text chunk.
 * Leverages structured output parsing with Vercel AI SDK when Gemini API is active,
 * or falls back to robust deterministic mock extraction for testing and offline environments.
 */
export async function extractGraphEntities(text: string): Promise<ExtractedGraph> {
  const client = getLLMClient();

  if (client instanceof GeminiLLMClient && geminiFlashModel) {
    const result = await generateObject({
      model: geminiFlashModel,
      schema: extractedGraphSchema,
      prompt: `${systemPrompt}\n\nAnalyze this text:\n"${text}"`,
    });

    return result.object as ExtractedGraph;
  }

  // Deterministic extraction is a test/development fixture only, never production output.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Graph extraction provider unavailable: a configured Gemini model is required in production.');
  }

  const normalizedText = text.toLowerCase();

  // Custom mock response based on text content to support test verification
  if (normalizedText.includes('optimus') || normalizedText.includes('اپتیموس')) {
    return {
      entities: [
        {
          name: 'Optimus AI',
          type: 'brand',
          properties: { relevance: 1.0, lang: 'fa' },
        },
        {
          name: 'Gemini',
          type: 'product',
          properties: { developer: 'Google' },
        },
      ],
      relationships: [
        {
          sourceEntityName: 'Optimus AI',
          targetEntityName: 'Gemini',
          relationshipType: 'uses',
          properties: { integration: 'native' },
        },
      ],
    };
  }

  if (normalizedText.includes('apple') || normalizedText.includes('اپل')) {
    return {
      entities: [
        {
          name: 'Apple',
          type: 'brand',
          properties: { origin: 'US' },
        },
        {
          name: 'iPhone',
          type: 'product',
          properties: { category: 'smartphone' },
        },
      ],
      relationships: [
        {
          sourceEntityName: 'Apple',
          targetEntityName: 'iPhone',
          relationshipType: 'manufactures',
          properties: { main_product: true },
        },
      ],
    };
  }

  // Default standard fallback graph
  return {
    entities: [
      {
        name: 'Optimus AI Platform',
        type: 'brand',
        properties: { status: 'active' },
      },
    ],
    relationships: [],
  };
}
