if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryCacheStore } from "@/services/cache/store";
import { CacheService } from "@/services/cache/service";
import { InMemoryDeduplicationStore } from "@/services/cache/deduplication";
import { createSession, setCookiesMock } from "@/services/auth/session";
import { User } from "@/types/auth";
import { TenantContextManager } from "@/core/database/tenant-context";

const mockCookieStore = {
  store: new Map<string, unknown>(),
  get(name: string) {
    return this.store.get(name);
  },
  set(name: string, value: unknown, options?: Record<string, unknown>) {
    this.store.set(name, { value, name, ...options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
  clear() {
    this.store.clear();
  }
};

setCookiesMock(() => Promise.resolve(mockCookieStore));

describe("Secure Cache Layer Integration Suite", () => {
  let store: InMemoryCacheStore;
  let service: CacheService;
  let deduplicator: InMemoryDeduplicationStore;

  const tenantA = "a0000000-0000-0000-0000-00000000000a";
  const tenantB = "b0000000-0000-0000-0000-00000000000b";

  const mockUserA: User = {
    id: "usr-1",
    name: "Alice",
    email: "alice@test.com",
    role: "viewer",
    workspaceId: tenantA
  };

  beforeEach(async () => {
    mockCookieStore.clear();
    store = new InMemoryCacheStore();
    service = new CacheService(store);
    deduplicator = new InMemoryDeduplicationStore();

    TenantContextManager.runWithSystemContext = (async function (userId: string | null, purpose: unknown, cb: () => Promise<unknown>) {
      if (!cb) return;
      const orig = TenantContextManager.getDbClient;
      TenantContextManager.getDbClient = () => ({
        query: async (sql: string) => {
          if (sql.includes('INSERT INTO sessions')) {
            return { rows: [{ id: 'mock-session-uuid' }] };
          }
          if (sql.includes('SELECT s.id')) {
            return { rows: [{
              id: 'mock-session-uuid',
              userId: mockUserA.id,
              workspaceId: mockUserA.workspaceId,
              expiresAt: new Date(Date.now() + 24*3600*1000),
              revokedAt: null,
              replacedBy: null,
              email: mockUserA.email,
              name: mockUserA.name,
              role: mockUserA.role
            }]};
          }
          return { rows: [] };
        }
      });
      try {
        return await cb();
      } finally {
        TenantContextManager.getDbClient = orig;
      }
    }) as unknown as typeof TenantContextManager.runWithSystemContext;

    await createSession(mockUserA);
  });

  describe("CACHE-001 & CACHE-002: Set/Get & Cache Miss", () => {
    it("returns null on cache miss and retrieves stored value on cache hit", async () => {
      const key1 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "Hello" } });

      const miss = await service.get(tenantA, key1);
      expect(miss).toBeNull();

      await service.set(tenantA, key1, "cached-response", "llm");
      const hit = await service.get(tenantA, key1);
      expect(hit).toBe("cached-response");
    });
  });

  describe("CACHE-003: TTL Expiration", () => {
    it("expires entries after TTL policy duration", async () => {
      const shortStore = new InMemoryCacheStore();
      const shortService = new CacheService(shortStore, { llmResponse: 1, crawlResult: 1, queryResult: 1 });

      const expireKey = shortService.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "Short TTL" } });
      await shortService.set(tenantA, expireKey, "expiring-soon", "llm");

      const freshHit = await shortService.get(tenantA, expireKey);
      expect(freshHit).toBe("expiring-soon");

      await new Promise((resolve) => setTimeout(resolve, 1100));
      const expiredHit = await shortService.get(tenantA, expireKey);
      expect(expiredHit).toBeNull();
    });
  });

  describe("CACHE-004: Delete Key", () => {
    it("invalidates target key successfully", async () => {
      const delKey = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "To be deleted" } });
      await service.set(tenantA, delKey, "temp-value", "llm");

      await service.invalidateKey(tenantA, delKey);
      const delHit = await service.get(tenantA, delKey);
      expect(delHit).toBeNull();
    });
  });

  describe("CACHE-005, CACHE-006 & CACHE-SEC-001/002: Tenant Keys & Cross-Tenant Isolation", () => {
    it("generates distinct keys for different tenants and blocks cross-tenant reads and writes", async () => {
      const promptInputs = { prompt: "Common Prompt" };
      const keyTenantA = service.generateKey({ tenantId: tenantA, category: "llm", inputs: promptInputs });
      const keyTenantB = service.generateKey({ tenantId: tenantB, category: "llm", inputs: promptInputs });

      expect(keyTenantA).not.toBe(keyTenantB);

      await service.set(tenantA, keyTenantA, "Tenant A Private Data", "llm");

      await expect(service.set(tenantB, keyTenantB, "Hacker Data", "llm")).rejects.toThrow(
        /Security Violation/
      );

      await expect(service.get(tenantA, keyTenantB)).rejects.toThrow(/Security Violation/);
    });
  });

  describe("CACHE-SEC-003: Cross-Tenant Invalidation Protection", () => {
    it("blocks unauthorized single key and namespace invalidations", async () => {
      const promptInputs = { prompt: "Common Prompt" };
      const keyTenantB = service.generateKey({ tenantId: tenantB, category: "llm", inputs: promptInputs });

      await expect(service.invalidateKey(tenantB, keyTenantB)).rejects.toThrow(
        /Security Violation/
      );

      await expect(service.invalidateTenantNamespace(tenantB)).rejects.toThrow(
        /Security Violation/
      );
    });
  });

  describe("CACHE-SEC-004: Forged Tenant Identifier Prevention", () => {
    it("rejects forged tenant context when logged in as another tenant", async () => {
      const promptInputs = { prompt: "Common Prompt" };
      const keyTenantB = service.generateKey({ tenantId: tenantB, category: "llm", inputs: promptInputs });

      await expect(service.set(tenantB, keyTenantB, "Hacked", "llm")).rejects.toThrow(
        /Security Violation/
      );
    });
  });

  describe("CACHE-007: Tenant Namespace Invalidation", () => {
    it("selectively invalidates specified category namespace or full tenant namespace", async () => {
      const crawlKey = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "test.com" } });
      await service.set(tenantA, crawlKey, "crawl-data", "crawl");

      await service.invalidateTenantNamespace(tenantA, "llm");

      const crawlHit = await service.get(tenantA, crawlKey);
      expect(crawlHit).toBe("crawl-data");

      await service.invalidateTenantNamespace(tenantA);
      const crawlHitDeleted = await service.get(tenantA, crawlKey);
      expect(crawlHitDeleted).toBeNull();
    });
  });

  describe("CACHE-008, CACHE-009 & CACHE-010: Key Determinism & Versioning", () => {
    it("produces deterministic hash regardless of key order and respects versioning", () => {
      const keyDet1 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { b: 2, a: 1 } });
      const keyDet2 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { a: 1, b: 2 } });
      expect(keyDet1).toBe(keyDet2);

      const keyVer1 = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "a.com" }, version: "v1" });
      const keyVer2 = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "a.com" }, version: "v2" });
      expect(keyVer1).not.toBe(keyVer2);
    });
  });

  describe("CACHE-011 & CACHE-012: Request Deduplication & Cleanup", () => {
    it("deduplicates concurrent identical calls and cleans up in-flight promises on failure", async () => {
      let executionCount = 0;

      const expensiveOperation = async () => {
        executionCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "expensive-result";
      };

      const dedupKey = "ws-tenant-a:compute-x";
      const p1 = deduplicator.deduplicate(dedupKey, expensiveOperation);
      const p2 = deduplicator.deduplicate(dedupKey, expensiveOperation);
      const p3 = deduplicator.deduplicate(dedupKey, expensiveOperation);

      const results = await Promise.all([p1, p2, p3]);

      expect(executionCount).toBe(1);
      expect(results).toEqual(["expensive-result", "expensive-result", "expensive-result"]);

      let failedRunCount = 0;
      const failingOperation = async () => {
        failedRunCount++;
        throw new Error("Simulation Fail");
      };

      const failKey = "ws-tenant-a:compute-fail";
      await expect(deduplicator.deduplicate(failKey, failingOperation)).rejects.toThrow("Simulation Fail");
      expect(failedRunCount).toBe(1);

      expect(deduplicator.hasInFlight(failKey)).toBe(false);
    });
  });
});
