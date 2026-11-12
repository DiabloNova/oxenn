import { z } from "zod";

export const MAX_INGESTION_REQUEST_BYTES = 4 * 1024 * 1024;
export const MAX_AI_REQUEST_BYTES = 256 * 1024;
export const MAX_RAG_REQUEST_BYTES = 16 * 1024;

export const MAX_INGESTION_TEXT_BYTES = 3 * 1024 * 1024;
export const MAX_CHUNK_TEXT_BYTES = 256 * 1024;
export const MAX_SENTIMENT_TEXT_BYTES = 32 * 1024;
export const MAX_RAG_QUESTION_BYTES = 8 * 1024;

export const MAX_METADATA_BYTES = 12 * 1024;
export const MAX_METADATA_DEPTH = 5;
export const MAX_METADATA_KEYS = 100;
export const MAX_METADATA_NODES = 1_000;

export const MAX_CHUNK_SIZE = 4_000;
export const MAX_CHUNK_OVERLAP = 1_000;
export const MAX_CHUNK_COUNT = 2_048;
export const DEFAULT_CHUNK_SIZE = 500;
export const DEFAULT_CHUNK_OVERLAP = 50;

export const MAX_RAG_RETRIEVAL_RESULTS = 20;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isBoundedJsonMetadata(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

  let keyCount = 0;
  let nodeCount = 0;
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new WeakSet<object>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    nodeCount += 1;
    if (nodeCount > MAX_METADATA_NODES || current.depth > MAX_METADATA_DEPTH) return false;

    const item = current.value;
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    ) {
      continue;
    }

    if (typeof item !== "object") return false;
    if (seen.has(item)) return false;
    seen.add(item);

    if (Array.isArray(item)) {
      if (item.length > MAX_METADATA_NODES) return false;
      for (const child of item) {
        stack.push({ value: child, depth: current.depth + 1 });
      }
      continue;
    }

    const prototype = Object.getPrototypeOf(item);
    if (prototype !== Object.prototype && prototype !== null) return false;

    const entries = Object.entries(item as Record<string, unknown>);
    keyCount += entries.length;
    if (keyCount > MAX_METADATA_KEYS) return false;

    for (const [key, child] of entries) {
      if (typeof key !== "string") return false;
      stack.push({ value: child, depth: current.depth + 1 });
    }
  }

  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" && utf8ByteLength(serialized) <= MAX_METADATA_BYTES;
  } catch {
    return false;
  }
}

const metadataSchema = z
  .record(z.string(), z.unknown())
  .refine(isBoundedJsonMetadata, {
    message: `Metadata must be JSON-safe, at most ${MAX_METADATA_BYTES} UTF-8 bytes, ${MAX_METADATA_DEPTH} levels deep, and contain at most ${MAX_METADATA_KEYS} object keys.`,
  });

const chunkingOptionsSchema = z
  .object({
    maxChunkSize: z.number().int().min(2).max(MAX_CHUNK_SIZE).optional(),
    overlap: z.number().int().min(0).max(MAX_CHUNK_OVERLAP).optional(),
  })
  .superRefine((options, context) => {
    const maxChunkSize = options.maxChunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap ?? DEFAULT_CHUNK_OVERLAP;
    if (overlap >= maxChunkSize) {
      context.addIssue({
        code: "custom",
        path: ["overlap"],
        message: "Overlap must be smaller than maxChunkSize.",
      });
    }
  });

const boundedText = (maxBytes: number, label: string) =>
  z.string().min(1, `${label} must be provided`).refine(
    (value) => utf8ByteLength(value) <= maxBytes,
    { message: `${label} exceeds the maximum allowed UTF-8 size of ${maxBytes} bytes.` },
  );

export const ingestionRequestSchema = z.object({
  text: boundedText(MAX_INGESTION_TEXT_BYTES, "Text to ingest"),
  metadata: metadataSchema.optional().default(() => ({})),
  chunkingOptions: chunkingOptionsSchema.optional(),
});

export const chunkRequestSchema = z.object({
  text: boundedText(MAX_CHUNK_TEXT_BYTES, "Text to chunk"),
  maxChunkSize: z.number().int().min(2).max(MAX_CHUNK_SIZE).optional().default(DEFAULT_CHUNK_SIZE),
  overlap: z.number().int().min(0).max(MAX_CHUNK_OVERLAP).optional().default(DEFAULT_CHUNK_OVERLAP),
}).superRefine((data, context) => {
  if (data.overlap >= data.maxChunkSize) {
    context.addIssue({
      code: "custom",
      path: ["overlap"],
      message: "Overlap must be smaller than maxChunkSize.",
    });
  }
});

export const sentimentRequestSchema = z.object({
  text: boundedText(MAX_SENTIMENT_TEXT_BYTES, "Text to analyze"),
});

export const ragResultLimitSchema = z.number().int().min(1).max(MAX_RAG_RETRIEVAL_RESULTS);

export function validateRagResultLimit(limit: number): number {
  return ragResultLimitSchema.parse(limit);
}

export const ragQueryRequestSchema = z.object({
  question: boundedText(MAX_RAG_QUESTION_BYTES, "Question"),
  limit: ragResultLimitSchema.optional().default(5),
});

export function validateMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const parsed = metadataSchema.safeParse(metadata);
  if (!parsed.success) {
    throw new RangeError("Invalid metadata: metadata exceeds the allowed JSON structure or size.");
  }
  return parsed.data;
}

export type ChunkingOptions = {
  maxChunkSize?: number;
  overlap?: number;
};

export function validateIngestionInput(
  text: string,
  metadata: Record<string, unknown> = {},
  chunkingOptions?: ChunkingOptions,
) {
  const parsed = ingestionRequestSchema.safeParse({ text, metadata, chunkingOptions });
  if (!parsed.success) {
    throw new RangeError(`Invalid ingestion input: ${parsed.error.issues.map((issue) => issue.message).join(" ")}`);
  }
  return parsed.data;
}

export function validateChunkingOptions(maxChunkSize: number, overlap: number) {
  const parsed = chunkingOptionsSchema.safeParse({ maxChunkSize, overlap });
  if (!parsed.success) {
    throw new RangeError(`Invalid chunking options: ${parsed.error.issues.map((issue) => issue.message).join(" ")}`);
  }
  return {
    maxChunkSize: parsed.data.maxChunkSize ?? DEFAULT_CHUNK_SIZE,
    overlap: parsed.data.overlap ?? DEFAULT_CHUNK_OVERLAP,
  };
}

export type BoundedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 413; error: string };

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<BoundedJsonResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      return { ok: false, status: 400, error: "Invalid Content-Length header." };
    }
    if (declaredLength > maxBytes) {
      try {
        await request.body?.cancel();
      } catch {
        // The response is already determined by the declared size.
      }
      return { ok: false, status: 413, error: "Request body exceeds the maximum allowed size." };
    }
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Request body must contain valid JSON." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation failures after the size limit is exceeded.
        }
        return { ok: false, status: 413, error: "Request body exceeds the maximum allowed size." };
      }
      chunks.push(value);
    }
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
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, data: JSON.parse(decoded) as unknown };
  } catch {
    return { ok: false, status: 400, error: "Request body must contain valid UTF-8 JSON." };
  }
}
