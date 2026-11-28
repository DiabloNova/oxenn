import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Pool, type PoolClient } from "pg";
import {
  assertLocalLifecycleAuditUrl,
  findExpiryIndexCoverage,
  summarizeLifecycleInventory,
  type LifecycleIndexMetric,
  type LifecycleTableMetric,
  type LifecycleTemporalColumn,
} from "./data-lifecycle-metrics";

const TABLE_INVENTORY_SQL = [
  "SELECT",
  "  n.nspname AS schema_name,",
  "  c.relname AS table_name,",
  "  GREATEST(c.reltuples, 0)::bigint AS estimated_rows,",
  "  COALESCE(s.n_live_tup, 0)::bigint AS live_rows,",
  "  COALESCE(s.n_dead_tup, 0)::bigint AS dead_rows,",
  "  pg_relation_size(c.oid)::bigint AS table_bytes,",
  "  pg_indexes_size(c.oid)::bigint AS index_bytes,",
  "  pg_total_relation_size(c.oid)::bigint AS total_bytes,",
  "  c.relrowsecurity AS rls_enabled,",
  "  c.relforcerowsecurity AS force_rls,",
  "  s.last_vacuum, s.last_autovacuum, s.last_analyze, s.last_autoanalyze",
  "FROM pg_class c",
  "JOIN pg_namespace n ON n.oid = c.relnamespace",
  "LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid",
  "WHERE c.relkind IN ('r', 'p')",
  "  AND n.nspname NOT IN ('pg_catalog', 'information_schema')",
  "  AND n.nspname NOT LIKE 'pg_toast%'",
  "ORDER BY pg_total_relation_size(c.oid) DESC, n.nspname, c.relname",
].join("\n");

const INDEX_INVENTORY_SQL = [
  "SELECT",
  "  usi.schemaname AS schema_name,",
  "  usi.relname AS table_name,",
  "  usi.indexrelname AS index_name,",
  "  definitions.indexdef AS index_definition,",
  "  ARRAY(",
  "    SELECT pg_get_indexdef(usi.indexrelid, key_position, true)",
  "    FROM generate_series(1, index_metadata.indnkeyatts) AS key_position",
  "    ORDER BY key_position",
  "  ) AS index_columns,",
  "  usi.idx_scan::bigint AS index_scans,",
  "  usi.idx_tup_read::bigint AS tuples_read,",
  "  usi.idx_tup_fetch::bigint AS tuples_fetched,",
  "  pg_relation_size(usi.indexrelid)::bigint AS index_bytes",
  "FROM pg_stat_user_indexes usi",
  "JOIN pg_index index_metadata ON index_metadata.indexrelid = usi.indexrelid",
  "JOIN pg_indexes definitions",
  "  ON definitions.schemaname = usi.schemaname",
  "  AND definitions.tablename = usi.relname",
  "  AND definitions.indexname = usi.indexrelname",
  "WHERE usi.schemaname NOT IN ('pg_catalog', 'information_schema')",
  "ORDER BY pg_relation_size(usi.indexrelid) DESC, usi.schemaname, usi.relname",
].join("\n");

const TEMPORAL_COLUMNS_SQL = [
  "SELECT table_schema, table_name, column_name, data_type, is_nullable",
  "FROM information_schema.columns",
  "WHERE table_schema NOT IN ('pg_catalog', 'information_schema')",
  "  AND table_schema NOT LIKE 'pg_toast%'",
  "  AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')",
  "ORDER BY table_schema, table_name, ordinal_position",
].join("\n");

export async function runDataLifecycleAudit(): Promise<Record<string, unknown>> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the local lifecycle audit.");
  }
  const target = assertLocalLifecycleAuditUrl(connectionString);

  const pool = new Pool({
    host: target.hostname,
    port: 5432,
    database: "isolation_test_db",
    user: decodeURIComponent(target.username),
    password: decodeURIComponent(target.password),
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  let client: PoolClient | undefined;
  let transactionOpen = false;
  let operationFailed = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN READ ONLY");
    transactionOpen = true;
    await client.query("SET LOCAL statement_timeout = '5000ms'");
    await client.query("SET LOCAL lock_timeout = '1000ms'");

    const readOnlyState = await client.query("SHOW transaction_read_only");
    if (readOnlyState.rows[0]?.transaction_read_only !== "on") {
      throw new Error("Lifecycle audit could not verify a read-only transaction.");
    }

    const tableResult = await client.query<LifecycleTableMetric>(TABLE_INVENTORY_SQL);
    const indexResult = await client.query<LifecycleIndexMetric>(INDEX_INVENTORY_SQL);
    const temporalResult = await client.query<LifecycleTemporalColumn>(TEMPORAL_COLUMNS_SQL);
    const tables = tableResult.rows;
    const indexes = indexResult.rows;
    const temporalColumns = temporalResult.rows;

    const report = {
      generatedAt: new Date().toISOString(),
      databaseName: "isolation_test_db",
      databaseScope: "workspace",
      platformAdminDatabaseInspected: false,
      readOnly: true,
      rowContentsRead: false,
      queryLimits: {
        statementTimeoutMs: 5_000,
        lockTimeoutMs: 1_000,
      },
      summary: summarizeLifecycleInventory(tables),
      tables,
      indexes,
      temporalColumns,
      expiryIndexCoverage: findExpiryIndexCoverage(temporalColumns, indexes),
      interpretationNotes: [
        "Row estimates and vacuum counters are PostgreSQL statistics, not exact COUNT(*) results.",
        "No application row contents were read and no full-table row counts were executed.",
        "An expires_at column is a TTL signal, not authorization to delete; cleanup policy and index coverage must be reviewed separately.",
        "Index scan counters can reset and must not be used alone to drop indexes.",
        "The audit transaction is READ ONLY; this script does not delete, archive, partition, alter indexes, or apply migrations.",
      ],
    };

    await client.query("COMMIT");
    transactionOpen = false;

    const outputPath =
      process.env.DATABASE_LIFECYCLE_AUDIT_OUTPUT_PATH ?? "database-lifecycle-audit.json";
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    let cleanupFailed = false;
    if (client && transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch {
        cleanupFailed = true;
      }
    }
    if (client) {
      try {
        client.release();
      } catch {
        cleanupFailed = true;
      }
    }
    try {
      await pool.end();
    } catch {
      cleanupFailed = true;
    }
    if (cleanupFailed && !operationFailed) {
      throw new Error("Lifecycle audit could not clean up its read-only session.");
    }
  }
}

if (process.argv[1]?.endsWith("data-lifecycle-audit.ts")) {
  runDataLifecycleAudit().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Database lifecycle audit failed.";
    console.error(message);
    process.exitCode = 1;
  });
}
