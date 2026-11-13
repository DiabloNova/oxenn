import { describe, expect, it } from "vitest";
import {
  chunkRequestSchema,
  ingestionRequestSchema,
  MAX_METADATA_BYTES,
  ragQueryRequestSchema,
  readBoundedJson,
  sentimentRequestSchema,
  validateChunkingOptions,
} from "@/services/ai/resource-limits";

describe("shared AI request resource limits", () => {
  it("accepts ingestion input with bounded metadata and chunk options", () => {
    const result = ingestionRequestSchema.safeParse({
      text: "یک سند فارسی",
      metadata: { source: "test", nested: { locale: "fa" } },
      chunkingOptions: { maxChunkSize: 500, overlap: 50 },
    });

    expect(result.success).toBe(true);
  });

  it("rejects oversized and excessively nested metadata", () => {
    const oversized = ingestionRequestSchema.safeParse({
      text: "document",
      metadata: { payload: "x".repeat(13 * 1024) },
    });
    const nested: Record<string, unknown> = { value: "too deep" };
    let cursor = nested;
    for (let index = 0; index < 6; index += 1) {
      const child: Record<string, unknown> = {};
      cursor.child = child;
      cursor = child;
    }

    const tooDeep = ingestionRequestSchema.safeParse({
      text: "document",
      metadata: nested,
    });

    expect(oversized.success).toBe(false);
    expect(tooDeep.success).toBe(false);
  });

  it("reserves metadata capacity for ingestion enrichment before provider work", () => {
    const tooManyKeys = Object.fromEntries(
      Array.from({ length: 96 }, (_, index) => [`key${index}`, index]),
    );
    const tooManyBytes = { payload: "x".repeat(MAX_METADATA_BYTES - 32) };

    expect(ingestionRequestSchema.safeParse({ text: "document", metadata: tooManyKeys }).success).toBe(false);
    expect(ingestionRequestSchema.safeParse({ text: "document", metadata: tooManyBytes }).success).toBe(false);
  });

  it("uses UTF-8 bytes rather than JavaScript character count for text caps", () => {
    const result = sentimentRequestSchema.safeParse({ text: "😀".repeat(8_193) });
    expect(result.success).toBe(false);
  });

  it("derives a compatible default overlap for smaller custom chunk sizes", () => {
    const chunkRequest = chunkRequestSchema.safeParse({
      text: "content",
      maxChunkSize: 100,
    });
    const ingestionRequest = ingestionRequestSchema.safeParse({
      text: "document",
      chunkingOptions: { maxChunkSize: 100 },
    });

    expect(chunkRequest.success).toBe(true);
    if (chunkRequest.success) {
      expect(chunkRequest.data).toMatchObject({ maxChunkSize: 100, overlap: 96 });
    }

    expect(ingestionRequest.success).toBe(true);
    if (ingestionRequest.success) {
      expect(ingestionRequest.data.chunkingOptions).toEqual({
        maxChunkSize: 100,
        overlap: 96,
      });
    }

    expect(validateChunkingOptions(100)).toEqual({
      maxChunkSize: 100,
      overlap: 96,
    });
    expect(validateChunkingOptions(4_000)).toEqual({
      maxChunkSize: 4_000,
      overlap: 1_000,
    });
    expect(validateChunkingOptions(3)).toEqual({
      maxChunkSize: 3,
      overlap: 0,
    });
  });

  it("rejects chunk parameters outside the shared contract", () => {
    expect(chunkRequestSchema.safeParse({
      text: "content",
      maxChunkSize: 4_001,
      overlap: 10,
    }).success).toBe(false);

    expect(chunkRequestSchema.safeParse({
      text: "content",
      maxChunkSize: 50,
      overlap: 50,
    }).success).toBe(false);

    expect(chunkRequestSchema.safeParse({
      text: "content",
      maxChunkSize: 10,
      overlap: 7,
    }).success).toBe(false);
  });

  it("caps RAG retrieval at the supported maximum", () => {
    expect(ragQueryRequestSchema.safeParse({ question: "سلام", limit: 20 }).success).toBe(true);
    expect(ragQueryRequestSchema.safeParse({ question: "سلام", limit: 21 }).success).toBe(false);
    expect(ragQueryRequestSchema.safeParse({ question: "سلام", limit: 0 }).success).toBe(false);
  });
});

describe("readBoundedJson", () => {
  it("accepts a payload exactly at the byte limit", async () => {
    const body = JSON.stringify({ value: "x".repeat(8) });
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    const result = await readBoundedJson(request, new TextEncoder().encode(body).byteLength);
    expect(result.ok).toBe(true);
  });

  it("rejects a streamed payload that exceeds the limit without Content-Length", async () => {
    const body = JSON.stringify({ value: "x".repeat(32) });
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    const result = await readBoundedJson(request, 8);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects malformed JSON without leaking parser details", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: "{not-json",
    });

    const result = await readBoundedJson(request, 128);
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Request body must contain valid UTF-8 JSON.",
    });
  });
});
