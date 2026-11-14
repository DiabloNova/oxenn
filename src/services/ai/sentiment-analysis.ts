import { generateObject } from 'ai';
import { z } from 'zod';
import { getLLMClient, GeminiLLMClient, geminiFlashModel } from './llm-client';
import { sentimentRequestSchema } from './resource-limits';

export interface SentimentVO {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
}

export const sentimentSchema = z.object({
  score: z.number().min(-1).max(1),
  label: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  emotions: z.array(z.string()),
});

const systemPrompt = `You are an expert Persian language sentiment analyzer.
Analyze the following Persian text and return a JSON object with:
- score: number between -1 (very negative) and 1 (very positive)
- label: 'positive' | 'negative' | 'neutral'
- confidence: number between 0 and 1
- emotions: array of detected emotions (e.g., 'anger', 'joy', 'sadness')

Please ensure that your analysis correctly accounts for Persian language contexts, metaphors, idioms, and sarcastic undertones (e.g., تعارف or کنایه).

Examples:
Text: "این محصول واقعاً عالی بود، خیلی راضی هستم"
Output: {"score": 0.9, "label": "positive", "confidence": 0.95, "emotions": ["joy"]}

Text: "خدمات مشتری افتضاح بود، دیگه خرید نمی‌کنم"
Output: {"score": -0.8, "label": "negative", "confidence": 0.92, "emotions": ["anger"]}

Now analyze the following text:`;

export async function analyzeSentiment(text: string): Promise<SentimentVO> {
  const parsedInput = sentimentRequestSchema.safeParse({ text });
  if (!parsedInput.success) {
    throw new RangeError("Sentiment input is empty or exceeds the allowed size.");
  }

  const boundedText = parsedInput.data.text;
  const client = getLLMClient();

  if (client instanceof GeminiLLMClient && geminiFlashModel) {
    const result = await generateObject({
      model: geminiFlashModel,
      schema: sentimentSchema,
      prompt: `${systemPrompt}\n\n"${boundedText}"`,
    });

    return result.object;
  }

  const generatedText = await client.generateText(boundedText, {
    systemPrompt,
  });

  try {
    const parsed = JSON.parse(generatedText);
    return sentimentSchema.parse(parsed);
  } catch {
    return {
      score: 0.0,
      label: 'neutral',
      confidence: 0.5,
      emotions: ['neutral']
    };
  }
}
