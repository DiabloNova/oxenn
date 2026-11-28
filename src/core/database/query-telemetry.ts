import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

export type DatabasePoolName = "workspace" | "authenticator";

interface DatabaseQueryObservation {
  poolName: DatabasePoolName;
  sql: string;
  traceId?: string;
}

interface DatabasePoolAcquireObservation {
  poolName: DatabasePoolName;
  waitMs: number;
  traceId?: string;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

function isTelemetryEnabled(): boolean {
  return process.env.DATABASE_QUERY_TELEMETRY_ENABLED === "true";
}

function normalizeSqlForFingerprint(sql: string): string {
  return sql
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*|)\$[\s\S]*?\$\1\$/g, "?")
    .replace(/'(?:''|\\.|[^'])*'/g, "?")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\r\n]*/g, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, "?")
    .replace(/\b(?:true|false)\b/gi, "?")
    .replace(/\s*(::|->>|->|#>>|#>|<=|>=|<>|!=|=|<|>|\|\||&&|@>|<@)\s*/g, "$1")
    .replace(/\s*([(),;.])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** A stable fingerprint that does not retain SQL literal values. */
export function createQueryFingerprint(sql: string): string {
  return createHash("sha256").update(normalizeSqlForFingerprint(sql)).digest("hex").slice(0, 16);
}


function getSafeTraceId(traceId?: string): string | undefined {
  return traceId && /^[A-Za-z0-9_-]{1,128}$/.test(traceId) ? traceId : undefined;
}

function getSafeErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Za-z0-9_]{1,16}$/.test(code) ? code : undefined;
}

function emitTelemetry(event: Record<string, unknown>): void {
  if (!isTelemetryEnabled()) {
    return;
  }

  try {
    console.debug(JSON.stringify(event));
  } catch {
    // Observability must never change database query or connection behavior.
  }
}

/** Wraps a query without exposing SQL text, parameter values, or error messages. */
export async function observeDatabaseQuery<T extends { rowCount?: number | null }>(
  observation: DatabaseQueryObservation,
  execute: () => Promise<T>
): Promise<T> {
  if (!isTelemetryEnabled()) {
    return execute();
  }

  const startedAt = performance.now();
  try {
    const result = await execute();
    emitTelemetry({
      event: "oxenn.database.query",
      poolName: observation.poolName,
      queryFingerprint: createQueryFingerprint(observation.sql),
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      rowCount: result.rowCount ?? null,
      outcome: "success",
      ...(getSafeTraceId(observation.traceId) ? { traceId: getSafeTraceId(observation.traceId) } : {}),
    });
    return result;
  } catch (error) {
    emitTelemetry({
      event: "oxenn.database.query",
      poolName: observation.poolName,
      queryFingerprint: createQueryFingerprint(observation.sql),
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      rowCount: null,
      outcome: "error",
      ...(getSafeTraceId(observation.traceId) ? { traceId: getSafeTraceId(observation.traceId) } : {}),
      ...(getSafeErrorCode(error) ? { errorCode: getSafeErrorCode(error) } : {}),
    });
    throw error;
  }
}

/** Records pool queue wait and counters separately from query execution time. */
export function recordDatabasePoolAcquire(observation: DatabasePoolAcquireObservation): void {
  emitTelemetry({
    event: "oxenn.database.pool.acquire",
    poolName: observation.poolName,
    waitMs: Math.round(observation.waitMs * 100) / 100,
    totalCount: observation.totalCount,
    idleCount: observation.idleCount,
    waitingCount: observation.waitingCount,
    ...(getSafeTraceId(observation.traceId) ? { traceId: getSafeTraceId(observation.traceId) } : {}),
  });
}
