import { TenantContextManager } from "@/core/database/tenant-context";

/**
 * Delete only expired Free Audit counters in a bounded batch.
 * The existing expires_at index bounds the candidate scan.
 */
export async function cleanupExpiredFreeAuditRateLimits(): Promise<number> {
  return TenantContextManager.runWithSystemContext(null, "sys-free-audit", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Free audit cleanup database context is unavailable");

    const { rows } = await client.query(
      `WITH expired AS (
        SELECT ctid
        FROM auth_rate_limits
        WHERE endpoint LIKE 'free-audit-%'
          AND expires_at <= NOW()
        ORDER BY expires_at
        LIMIT 5000
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM auth_rate_limits AS rate_limit
      USING expired
      WHERE rate_limit.ctid = expired.ctid
      RETURNING 1`
    );

    return rows.length;
  });
}
