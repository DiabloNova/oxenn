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
  outcome: "success" | "error";
  errorCode?: string;
}

function isTelemetryEnabled(): boolean {
  return process.env.DATABASE_QUERY_TELEMETRY_ENABLED === "true";
}

function skipSingleQuotedLiteral(sql: string, quoteIndex: number, escapeBackslashes: boolean): number {
  let index = quoteIndex + 1;
  while (index < sql.length) {
    if (escapeBackslashes && sql[index] === "\\") {
      index += 2;
      continue;
    }
    if (sql[index] === "'") {
      if (sql[index + 1] === "'") {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return sql.length;
}

function normalizeSqlForFingerprint(sql: string): string {
  const tokens: string[] = [];
  let index = 0;

  while (index < sql.length) {
    const char = sql[index];

    if (/\s/.test(char)) {
      tokens.push(" ");
      index += 1;
      continue;
    }

    if (char === "-" && sql[index + 1] === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n" && sql[index] !== "\r") {
        index += 1;
      }
      tokens.push(" ");
      continue;
    }

    if (char === "/" && sql[index + 1] === "*") {
      let depth = 1;
      index += 2;
      while (index < sql.length && depth > 0) {
        if (sql[index] === "/" && sql[index + 1] === "*") {
          depth += 1;
          index += 2;
        } else if (sql[index] === "*" && sql[index + 1] === "/") {
          depth -= 1;
          index += 2;
        } else {
          index += 1;
        }
      }
      tokens.push(" ");
      continue;
    }

    const isEscapeStringPrefix =
      (char === "E" || char === "e") &&
      sql[index + 1] === "'" &&
      (index === 0 || !/[A-Za-z0-9_$]/.test(sql[index - 1]));
    if (isEscapeStringPrefix) {
      index = skipSingleQuotedLiteral(sql, index + 1, true);
      tokens.push("?");
      continue;
    }

    const isUnicodeStringPrefix =
      (char === "U" || char === "u") && sql[index + 1] === "&" && sql[index + 2] === "'";
    if (isUnicodeStringPrefix) {
      index = skipSingleQuotedLiteral(sql, index + 2, true);
      tokens.push("?");
      continue;
    }

    const isOtherStringPrefix =
      /[NnBbXx]/.test(char) &&
      sql[index + 1] === "'" &&
      (index === 0 || !/[A-Za-z0-9_$]/.test(sql[index - 1]));
    if (isOtherStringPrefix) {
      index = skipSingleQuotedLiteral(sql, index + 1, false);
      tokens.push("?");
      continue;
    }

    if (char === "'") {
      index = skipSingleQuotedLiteral(sql, index, false);
      tokens.push("?");
      continue;
    }

    if (char === "$") {
      const delimiter = sql.slice(index).match(/^\$([A-Za-z_][A-Za-z0-9_]*|)\$/)?.[0];
      if (delimiter) {
        const closingIndex = sql.indexOf(delimiter, index + delimiter.length);
        if (closingIndex !== -1) {
          index = closingIndex + delimiter.length;
          tokens.push("?");
          continue;
        }
      }
    }

    if (char === '"') {
      const identifierStart = index;
      index += 1;
      while (index < sql.length) {
        if (sql[index] === '"') {
          if (sql[index + 1] === '"') {
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        index += 1;
      }
      tokens.push(sql.slice(identifierStart, index));
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const wordStart = index;
      index += 1;
      while (index < sql.length && /[A-Za-z0-9_$]/.test(sql[index])) {
        index += 1;
      }
      const word = sql.slice(wordStart, index).toLowerCase();
      tokens.push(word === "true" || word === "false" ? "?" : word);
      continue;
    }

    const numericLiteral = sql.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/)?.[0];
    if (numericLiteral) {
      index += numericLiteral.length;
      tokens.push("?");
      continue;
    }

    tokens.push(char);
    index += 1;
  }

  return tokens
    .join("")
    .replace(/\s*(::|->>|->|#>>|#>|<=|>=|<>|!=|=|<|>|\|\||&&|@>|<@)\s*/g, "$1")
    .replace(/\s*([(),;.])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
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
    outcome: observation.outcome,
    ...(getSafeTraceId(observation.traceId) ? { traceId: getSafeTraceId(observation.traceId) } : {}),
    ...(getSafeErrorCode({ code: observation.errorCode }) ? { errorCode: getSafeErrorCode({ code: observation.errorCode }) } : {}),
  });
}
