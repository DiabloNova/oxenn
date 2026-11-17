import type { PostgresClient } from "../../features/admin/infrastructure/persistence/postgres";

const TENANT_GRAPH_WRITE_LOCK_KEY = "oxenn:tenant-graph-write";

/**
 * Serializes graph mutations for one tenant for the lifetime of the current
 * transaction. Graph upserts and document replacement must acquire this lock
 * before reading or locking graph rows, so they always share one lock order.
 */
export async function acquireTenantGraphWriteLock(
  pg: PostgresClient,
  tenantId: string,
): Promise<void> {
  await pg.query(
    "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
    [tenantId, TENANT_GRAPH_WRITE_LOCK_KEY],
  );
}
