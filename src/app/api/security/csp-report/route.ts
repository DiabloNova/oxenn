const PREVIEW_ENVIRONMENT = "preview";
const MAX_REPORT_BODY_BYTES = 16 * 1024;
const MAX_REPORTS_PER_REQUEST = 20;
const SUPPORTED_CONTENT_TYPES = new Set([
  "application/reports+json",
  "application/csp-report",
  "application/json",
]);

type JsonRecord = Record<string, unknown>;

interface SanitizedCspReport {
  directive: string;
  disposition: "report" | "enforce" | "unknown";
  documentOrigin: string | null;
  blockedOrigin: string | null;
  sourceOrigin: string | null;
  statusCode: number | null;
}

type BodyReadResult =
  | { ok: true; text: string }
  | { ok: false; status: 400 | 413 };

export const runtime = "nodejs";

/**
 * CSP reports are browser-generated, attacker-controlled input. This endpoint
 * intentionally does not authenticate, query a database, persist raw reports,
 * or log raw URLs, samples, referrers, cookies, or user-agent strings.
 *
 * The Preview-only Vercel Firewall rule supplies distributed IP rate limiting.
 */
export async function POST(request: Request): Promise<Response> {
  if (process.env.VERCEL_ENV !== PREVIEW_ENVIRONMENT) {
    return response(null, 404);
  }

  const contentType = getMediaType(request.headers.get("content-type"));
  if (!contentType || !SUPPORTED_CONTENT_TYPES.has(contentType)) {
    return response(null, 415);
  }

  const body = await readBoundedBody(request);
  if (!body.ok) {
    return response(null, body.status);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.text);
  } catch {
    return response(null, 400);
  }

  const entries = extractCspReports(payload);
  if (!entries) {
    return response(null, 400);
  }
  if (entries.length > MAX_REPORTS_PER_REQUEST) {
    return response(null, 413);
  }

  const sanitized = entries.map(sanitizeCspReport);
  if (sanitized.length > 0) {
    console.info(
      "[CSP_REPORT]",
      JSON.stringify({
        event: "csp_violation",
        environment: PREVIEW_ENVIRONMENT,
        reportCount: sanitized.length,
        reports: sanitized,
      }),
    );
  }

  return response(null, 204);
}

function response(body: BodyInit | null, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getMediaType(value: string | null): string | null {
  if (!value) return null;
  const mediaType = value.split(";")[0]?.trim().toLowerCase();
  return mediaType || null;
}

async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength)) {
    const declaredLength = Number(contentLength);
    if (
      Number.isSafeInteger(declaredLength) &&
      declaredLength > MAX_REPORT_BODY_BYTES
    ) {
      return { ok: false, status: 413 };
    }
  }

  if (!request.body) {
    return { ok: false, status: 400 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      if (!result.value) continue;

      totalBytes += result.value.byteLength;
      if (totalBytes > MAX_REPORT_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413 };
      }

      chunks.push(result.value);
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, status: 400 };
  }
}

function extractCspReports(payload: unknown): JsonRecord[] | null {
  if (Array.isArray(payload)) {
    // Ignore non-CSP Reporting API entries first; only accepted CSP entries
    // count toward the per-batch report limit.
    return payload
      .filter(
        (entry): entry is JsonRecord =>
          isRecord(entry) &&
          entry.type === "csp-violation" &&
          isRecord(entry.body),
      )
      .map((entry) => entry.body as JsonRecord);
  }

  if (!isRecord(payload)) {
    return null;
  }

  // Legacy CSP Report format: { "csp-report": { ... } }.
  if (isRecord(payload["csp-report"])) {
    return [payload["csp-report"]];
  }

  // Some Reporting API implementations may deliver a single report object.
  if (payload.type === "csp-violation" && isRecord(payload.body)) {
    return [payload.body];
  }

  return null;
}

function sanitizeCspReport(report: JsonRecord): SanitizedCspReport {
  const directiveValue =
    firstString(report, "effectiveDirective", "effective-directive") ??
    firstString(report, "violatedDirective", "violated-directive");

  const dispositionValue = firstString(report, "disposition");
  const disposition =
    dispositionValue === "report" || dispositionValue === "enforce"
      ? dispositionValue
      : "unknown";

  const statusValue = report.statusCode ?? report["status-code"];
  const statusCode =
    typeof statusValue === "number" &&
    Number.isInteger(statusValue) &&
    statusValue >= 100 &&
    statusValue <= 599
      ? statusValue
      : null;

  return {
    directive: sanitizeDirective(directiveValue),
    disposition,
    documentOrigin: safeOrigin(
      firstString(report, "documentURL", "document-uri"),
    ),
    blockedOrigin: safeOrigin(
      firstString(report, "blockedURL", "blocked-uri"),
    ),
    sourceOrigin: safeOrigin(
      firstString(report, "sourceFile", "source-file"),
    ),
    statusCode,
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(
  record: JsonRecord,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length <= 2_048) {
      return value;
    }
  }
  return undefined;
}

function sanitizeDirective(value: string | undefined): string {
  if (!value) return "unknown";
  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9-]{0,79}$/.test(normalized)
    ? normalized
    : "unknown";
}

function safeOrigin(value: string | undefined): string | null {
  if (!value) return null;

  const normalized = value.trim();
  if (
    normalized === "inline" ||
    normalized === "eval" ||
    normalized === "wasm-eval" ||
    normalized === "self"
  ) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.origin === "null"
      ? parsed.protocol
      : parsed.origin.toLowerCase();
  } catch {
    return null;
  }
}
