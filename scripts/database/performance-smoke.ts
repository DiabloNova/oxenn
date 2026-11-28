import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { Pool } from "pg";
import { assertEphemeralDatabaseUrl, summarizeLatencySamples } from "./performance-metrics";

const DATASET_ROWS = 10_000;
const POOL_MAX = 5;
const WARMUP_ITERATIONS = 10;
const MEASURED_ITERATIONS = 100;
const CONCURRENCY_WORKERS = 5;
const QUERIES_PER_WORKER = 20;

async function measureQuery(
  pool: Pool,
  sql: string,
  parameters: unknown[]
): Promise<ReturnType<typeof summarizeLatencySamples>> {
  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) {
    await pool.query(sql, parameters);
  }

  const samples: number[] = [];
  for (let index = 0; index < MEASURED_ITERATIONS; index += 1) {
    const startedAt = performance.now();
    await pool.query(sql, parameters);
    samples.push(performance.now() - startedAt);
  }

  return summarizeLatencySamples(samples);
}

export async function runDatabasePerformanceSmoke(): Promise<Record<string, unknown>> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the local performance smoke.");
  }
  const target = assertEphemeralDatabaseUrl(connectionString);

  // Pass every connection target field explicitly; never let pg parse query overrides
  // or fall back to PGHOST/PGPORT/PGDATABASE from the runner environment.
  const pool = new Pool({
    host: target.hostname,
    port: 5432,
    database: "isolation_test_db",
    user: decodeURIComponent(target.username),
    password: decodeURIComponent(target.password),
    ssl: false,
    max: POOL_MAX,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  const schemaName = "benchmark_" + randomUUID().replace(/-/g, "");
  const quotedSchema = '"' + schemaName + '"';
  const qualifiedTable = quotedSchema + '."records"';
  let operationFailed = false;

  try {
    await pool.query("CREATE SCHEMA " + quotedSchema);

    await pool.query(
      "CREATE TABLE " + qualifiedTable + " (" +
        "id BIGINT PRIMARY KEY, " +
        "tenant_id INTEGER NOT NULL, " +
        "created_at TIMESTAMPTZ NOT NULL, " +
        "payload JSONB NOT NULL)"
    );

    await pool.query(
      "INSERT INTO " + qualifiedTable + " (id, tenant_id, created_at, payload) " +
        "SELECT value, value % 10, NOW() - ((value % 365) * INTERVAL '1 day'), " +
        "jsonb_build_object('tier', CASE WHEN value % 2 = 0 THEN 'pro' ELSE 'free' END, " +
        "'score', value % 100) " +
        "FROM generate_series(1, $1) AS series(value)",
      [DATASET_ROWS]
    );

    await pool.query(
      "CREATE INDEX " + '"' + schemaName + '_tenant_created_idx" ON ' +
        qualifiedTable + " (tenant_id, created_at)"
    );
    await pool.query(
      "CREATE INDEX " + '"' + schemaName + '_payload_gin_idx" ON ' +
        qualifiedTable + " USING GIN (payload)"
    );
    await pool.query("ANALYZE " + qualifiedTable);

    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const tenantRangeSql =
      "SELECT count(*) FROM " + qualifiedTable +
      " WHERE tenant_id = $1 AND created_at >= $2";
    const jsonbSql =
      "SELECT count(*) FROM " + qualifiedTable +
      " WHERE tenant_id = $1 AND payload @> $2::jsonb";
    const pointLookupSql =
      "SELECT id FROM " + qualifiedTable + " WHERE tenant_id = $1 AND id = $2";

    const scenarios = {
      tenantRangeScan: await measureQuery(pool, tenantRangeSql, [3, cutoff]),
      jsonbFilter: await measureQuery(pool, jsonbSql, [2, JSON.stringify({ tier: "pro" })]),
      tenantPointLookup: await measureQuery(pool, pointLookupSql, [3, 3003]),
    };

    const concurrentStartedAt = performance.now();
    await Promise.all(
      Array.from({ length: CONCURRENCY_WORKERS }, async () => {
        for (let index = 0; index < QUERIES_PER_WORKER; index += 1) {
          await pool.query(pointLookupSql, [3, 3003]);
        }
      })
    );
    const concurrentDurationMs = performance.now() - concurrentStartedAt;
    const concurrentQueryCount = CONCURRENCY_WORKERS * QUERIES_PER_WORKER;

    const explainResult = await pool.query(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + tenantRangeSql,
      [3, cutoff]
    );
    const explainEnvelope = explainResult.rows[0] as Record<string, unknown> | undefined;
    const explainPlans = explainEnvelope?.["QUERY PLAN"] as Array<Record<string, unknown>> | undefined;
    const explainPlan = explainPlans?.[0] ?? {};
    const planDetails = (explainPlan["Plan"] as Record<string, unknown> | undefined) ?? {};

    const report = {
      generatedAt: new Date().toISOString(),
      databaseName: "isolation_test_db",
      datasetRows: DATASET_ROWS,
      pool: {
        max: POOL_MAX,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
      scenarios,
      concurrency: {
        workers: CONCURRENCY_WORKERS,
        queries: concurrentQueryCount,
        durationMs: Math.round(concurrentDurationMs * 100) / 100,
        queriesPerSecond:
          Math.round((concurrentQueryCount / (concurrentDurationMs / 1000)) * 100) / 100,
      },
      queryPlan: {
        nodeType: planDetails["Node Type"] ?? null,
        executionMs: explainPlan["Execution Time"] ?? null,
        sharedHitBlocks: planDetails["Shared Hit Blocks"] ?? null,
        sharedReadBlocks: planDetails["Shared Read Blocks"] ?? null,
      },
      baselineMode: "report-only",
    };

    const outputPath = process.env.PERFORMANCE_OUTPUT_PATH ?? "database-performance.json";
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    let cleanupFailed = false;
    try {
      await pool.query("DROP SCHEMA IF EXISTS " + quotedSchema + " CASCADE");
    } catch {
      cleanupFailed = true;
    }
    try {
      await pool.end();
    } catch {
      cleanupFailed = true;
    }
    if (cleanupFailed && !operationFailed) {
      throw new Error("Database performance smoke could not clean up its temporary resources.");
    }
  }
}

if (process.argv[1]?.endsWith("performance-smoke.ts")) {
  runDatabasePerformanceSmoke().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Database performance smoke failed.";
    console.error(message);
    process.exitCode = 1;
  });
}
