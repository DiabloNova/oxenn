import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLLMClient, MockLLMClient } from '@/services/ai/llm-client';

afterEach(() => vi.unstubAllEnvs());

describe('getLLMClient production safety', () => {
  it('rejects missing provider credentials in production instead of returning a mock', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GOOGLE_AI_API_KEY', '');
    expect(() => getLLMClient()).toThrow(/GOOGLE_AI_API_KEY is required in production/);
  });

  it('keeps deterministic mocks available to tests', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('GOOGLE_AI_API_KEY', '');
    expect(getLLMClient()).toBeInstanceOf(MockLLMClient);
  });
});
