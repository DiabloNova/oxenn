import { PostgresClient } from "../../../features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { InMemoryCacheStore } from "../../../services/cache/store";
import { ICacheStore } from "../../../services/cache/types";

class UpstashRateLimitStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  // Returns [allowed, remaining]
  async checkRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean, remaining: number }> {
    const epochSec = Math.floor(Date.now() / 1000);
    const windowId = Math.floor(epochSec / windowSec);
    const redisKey = `ratelimit:${key}:${windowId}`;

    // Pipeline format:
    // [["INCR", "ratelimit:mykey:100"], ["EXPIRE", "ratelimit:mykey:100", 60, "NX"]]
    const payload = [
      ["INCR", redisKey],
      ["EXPIRE", redisKey, windowSec, "NX"]
    ];

    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Upstash response not OK: ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length !== 2) {
      throw new Error(`Unexpected pipeline response: ${JSON.stringify(data)}`);
    }

    // data[0] contains the result of INCR
    const currentCount = typeof data[0].result === 'number' ? data[0].result : parseInt(data[0].result, 10);
    if (isNaN(currentCount)) {
        throw new Error(`Unexpected INCR response: ${data[0].result}`);
    }

    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount <= limit;

    return { allowed, remaining };
  }
}

let upstashStore: UpstashRateLimitStore | null = null;
const fallbackStore: ICacheStore = new InMemoryCacheStore();

export class ApiQuotaService {
  private pg: PostgresClient;

  constructor() {
    this.pg = PostgresClient.getInstance();
  }

  /**
   * Enforces usage limits for API tokens (or other metrics depending on endpoint).
   * Throws if quota is exceeded.
   */
  public async enforceAndConsumeQuota(tenantId: string, tokensToConsume: number = 1): Promise<void> {
    if (!Number.isInteger(tokensToConsume) || tokensToConsume <= 0) {
      throw new Error("Tokens to consume must be a positive integer.");
    }

    await TenantContextManager.runWithTenantContext(
      tenantId,
      "system",
      "api-quota-check",
      async () => {
        const sql = `
          UPDATE tenant_quotas
          SET used_tokens_this_month = used_tokens_this_month + $1, updated_at = NOW()
          WHERE tenant_id = $2
            AND used_tokens_this_month + $1 <= monthly_token_limit
          RETURNING *;
        `;
        const res = await this.pg.query(sql, [tokensToConsume, tenantId]);

        if (res.rowCount === 0) {
          const exists = await this.pg.query(`SELECT 1 FROM tenant_quotas WHERE tenant_id = $1 LIMIT 1;`, [tenantId]);
          if (!exists.rows || exists.rows.length === 0) {
            throw new Error("Quota Not Found");
          }
          throw new Error("Usage Limit Exceeded");
        }
      }
    );
  }

  /**
   * Enforces rate limiting per tenant using Redis INCR + EXPIRE fixed-window semantics.
   * Uses Upstash REST adapter in production. Fails closed if missing config in prod.
   */
  public async checkRateLimit(tenantId: string, maxRequests: number = 100, windowMs: number = 60000): Promise<{ allowed: boolean, remaining: number }> {
    const isProd = process.env.NODE_ENV === "production";
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        if (!upstashStore) {
          upstashStore = new UpstashRateLimitStore(redisUrl, redisToken);
        }
        return await upstashStore.checkRateLimit(tenantId, maxRequests, windowSec);
      }

      if (isProd) {
        console.error("[ApiQuotaService] Missing Upstash Redis configuration in production. Failing closed.");
        return { allowed: false, remaining: 0 };
      }

      // Fallback for non-production environments missing config
      const now = Date.now();
      const windowStart = now - windowMs;
      const key = `ratelimit_fallback:${tenantId}`;

      const timestampsRaw = await fallbackStore.get<number[]>(key) || [];
      const validTimestamps = timestampsRaw.filter(t => t > windowStart);

      if (validTimestamps.length >= maxRequests) {
        await fallbackStore.set(key, validTimestamps, { ttlSeconds: windowSec });
        return { allowed: false, remaining: 0 };
      }

      validTimestamps.push(now);
      await fallbackStore.set(key, validTimestamps, { ttlSeconds: windowSec });

      return { allowed: true, remaining: maxRequests - validTimestamps.length };
    } catch (err) {
      console.error("[ApiQuotaService] Rate limiting error:", err);
      // Fail closed on error (e.g. fetch fails)
      return { allowed: false, remaining: 0 };
    }
  }
}
