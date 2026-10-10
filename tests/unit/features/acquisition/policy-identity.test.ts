import { describe, it, expect } from "vitest";
import {
  CRAWL_POLICY_CEILINGS,
  DEFAULT_CRAWL_POLICY,
  resolveCrawlPolicy,
  validateCrawlPolicy
} from "@/features/acquisition/domain/policy";
import {
  computeCacheKey,
  computeDedupKey
} from "@/features/acquisition/domain/identity";
import { normalizeUrl } from "@/features/acquisition/domain/url/normalizer";

describe("testPolicyIdentity", () => {
  it("runs", () => {
    const policy = resolveCrawlPolicy({});
    for (const [field, ceiling] of Object.entries(CRAWL_POLICY_CEILINGS)) {
      expect(validateCrawlPolicy({ ...policy, [field]: ceiling + 1 }).ok).toBe(false);
    }
    for (const field of [
      "maxPages",
      "maxDurationMs",
      "maxResponseBytes",
      "maxConcurrency",
      "requestTimeoutMs",
      "connectTimeoutMs",
      "maxAttempts",
      "perHostRequestsPerSecond"
    ]) {
      expect(validateCrawlPolicy({ ...policy, [field]: 0 }).ok).toBe(false);
      expect(validateCrawlPolicy({ ...policy, [field]: -1 }).ok).toBe(false);
      expect(validateCrawlPolicy({ ...policy, [field]: 1.5 }).ok).toBe(false);
    }
    expect(validateCrawlPolicy({ ...policy, maxDepth: 0 }).ok).toBe(true);
    expect(validateCrawlPolicy({ ...policy, maxRedirects: 0 }).ok).toBe(true);

    const url = normalizeUrl("https://example.com");
    expect(url.ok).toBe(true);
    if (!url.ok) {
      return;
    }
    expect(computeDedupKey("tenant", url.value, { ...policy, maxPages: 10 })).not.toBe(computeDedupKey("tenant", url.value, { ...policy, maxPages: 100 }));
    expect(computeDedupKey("tenant", url.value, { ...policy, maxAttempts: 1 })).toBe(computeDedupKey("tenant", url.value, { ...policy, maxAttempts: 5 }));
    expect(computeCacheKey("tenant", url.value, policy)).not.toBe(computeCacheKey("other", url.value, policy));
    expect(computeCacheKey("tenant", url.value, policy, "global")).toBe(computeCacheKey("other", url.value, policy, "global"));
    expect(computeCacheKey("tenant", url.value, policy)).toMatch(/^[a-f0-9]{64}$/);
    expect(DEFAULT_CRAWL_POLICY.stripTrackingParams).toBe(true);
  });
});
