import { describe, expect, it } from "vitest";
import { chunkText } from "@/services/ai/text-chunker";
import { MAX_CHUNK_COUNT, MAX_CHUNK_SIZE, MAX_INGESTION_TEXT_BYTES } from "@/services/ai/resource-limits";

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

describe("chunkText resource boundaries", () => {
  it("keeps every final chunk within maxChunkSize when overlap is enabled", () => {
    const source = ("این یک جمله فارسی برای آزمون اندازه chunk است. ").repeat(120);
    const chunks = chunkText(source, 100, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
  });

  it("preserves Unicode surrogate pairs across chunk boundaries", () => {
    const source = ("متن آزمایشی 😀 برای بررسی نویسه‌های یونیکد. ").repeat(20);
    const chunks = chunkText(source, 31, 0);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => !hasUnpairedSurrogate(chunk))).toBe(true);
    expect(chunks.every((chunk) => chunk.length <= 31)).toBe(true);
  });

  it("keeps a surrogate pair intact when a ZWNJ follows it at the requested boundary", () => {
    const source = `${"x".repeat(8)}😀\u200C${"y".repeat(20)}`;
    const chunks = chunkText(source, 10, 0);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toBe(`${"x".repeat(8)}😀`);
    expect(chunks.every((chunk) => !hasUnpairedSurrogate(chunk))).toBe(true);
  });

  it("keeps a Persian quoted phrase intact when its closing quote fits", () => {
    const chunks = chunkText("«الف ب ج د»متن طولانی برای آزمون", 11, 0);

    expect(chunks[0]).toBe("«الف ب ج د»");
    expect(chunks.every((chunk) => chunk.length <= 11)).toBe(true);
  });

  it("chunks the full advertised ingestion size with the dashboard defaults", () => {
    const chunks = chunkText("x".repeat(MAX_INGESTION_TEXT_BYTES), 4_000, 1_000);

    expect(chunks.length).toBeLessThanOrEqual(MAX_CHUNK_COUNT);
  });

  it("rejects documents that exceed the configured chunk count before downstream processing", () => {
    const source = "X".repeat((MAX_CHUNK_COUNT + 1) * 10);

    expect(() => chunkText(source, 10, 0)).toThrow(/chunk count/i);
  });

  it("rejects chunk options that cannot make forward progress or preserve a code point", () => {
    expect(() => chunkText("some text", 10, 10)).toThrow(RangeError);
    expect(() => chunkText("some text", 2, 0)).toThrow(RangeError);
    expect(() => chunkText("some text", 50, 47)).toThrow(RangeError);
    expect(() => chunkText("some text", 1, 0)).toThrow(RangeError);
  });

  it("keeps emoji code points intact at the minimum supported chunk size", () => {
    const chunks = chunkText("😀".repeat(100), 3, 0);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => !hasUnpairedSurrogate(chunk))).toBe(true);
    expect(chunks.every((chunk) => chunk.length <= 3)).toBe(true);
  });

  it("never emits chunks larger than the global maximum", () => {
    const source = "کلمه ".repeat(2_000);
    const chunks = chunkText(source, MAX_CHUNK_SIZE, 500);

    expect(chunks.every((chunk) => chunk.length <= MAX_CHUNK_SIZE)).toBe(true);
  });
});
