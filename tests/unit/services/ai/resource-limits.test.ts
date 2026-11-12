import { describe, expect, it } from "vitest";
import {
  chunkRequestSchema,
  ingestionRequestSchema,
  ragQueryRequestSchema,
  readBoundedJson,
  sentimentRequestSchema,
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

  it("uses UTF-8 bytes rather than JavaScript character count for text caps", () => {
    const result = sentimentRequestSchema.safeParse({ text: "😀".repeat(8_193) });
    expect(result.success).toBe(false);
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
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});
