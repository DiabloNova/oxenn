import { afterEach, describe, it, expect, vi } from 'vitest';
import { extractGraphEntities } from '@/services/ai/graph-extraction';

afterEach(() => vi.unstubAllEnvs());

describe('Graph Extraction Service', () => {
  it('fails closed in production when the real provider is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GOOGLE_AI_API_KEY', '');
    await expect(extractGraphEntities('Apple makes products')).rejects.toThrow(/GOOGLE_AI_API_KEY is required in production/);
  });

  it('extracts entities and relationships from Optimus AI text', async () => {
    const text1 = "سیستم هوشمند اپتیموس ای آی (Optimus AI) از هوش مصنوعی گوگل استفاده می‌کند.";
    const graph1 = await extractGraphEntities(text1);

    expect(graph1.entities).toBeDefined();
    expect(graph1.entities.length).toBeGreaterThan(0);

    const optimusEntity = graph1.entities.find(e => e.name.toLowerCase().includes("optimus"));
    expect(optimusEntity).toBeDefined();
    expect(optimusEntity?.type).toBe("brand");

    const geminiEntity = graph1.entities.find(e => e.name.toLowerCase().includes("gemini"));
    expect(geminiEntity).toBeDefined();
    expect(geminiEntity?.type).toBe("product");

    expect(graph1.relationships).toBeDefined();
    expect(graph1.relationships.length).toBeGreaterThan(0);

    const relationship = graph1.relationships[0];
    expect(relationship.sourceEntityName).toBe("Optimus AI");
    expect(relationship.targetEntityName).toBe("Gemini");
  });

  it('extracts Apple entity from Apple text', async () => {
    const text2 = "شرکت اپل گوشی آیفون را معرفی کرد.";
    const graph2 = await extractGraphEntities(text2);
    const appleEntity = graph2.entities.find(e => e.name.toLowerCase() === "apple");
    expect(appleEntity).toBeDefined();
  });
});
