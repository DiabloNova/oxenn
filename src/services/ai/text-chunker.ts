/**
 * Persian Text Chunking Utility
 * - Preserves sentence boundaries where practical.
 * - Avoids splitting Persian zero-width non-joiners and short Persian quotes at boundaries.
 * - Includes overlap inside the configured maximum chunk size.
 */

import {
  MAX_CHUNK_COUNT,
  MAX_INGESTION_TEXT_BYTES,
  validateChunkingOptions,
} from "./resource-limits";

const ZERO_WIDTH_NON_JOINER = "\u200C";

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

function findSafeEnd(text: string, start: number, requestedEnd: number): number {
  let end = requestedEnd;

  if (
    end < text.length &&
    end > start &&
    isHighSurrogate(text.charCodeAt(end - 1)) &&
    isLowSurrogate(text.charCodeAt(end))
  ) {
    end -= 1;
  }

  if (
    end < text.length &&
    (text.charAt(end) === ZERO_WIDTH_NON_JOINER ||
      text.charAt(end - 1) === ZERO_WIDTH_NON_JOINER)
  ) {
    while (
      end > start &&
      (text.charAt(end) === ZERO_WIDTH_NON_JOINER ||
        text.charAt(end - 1) === ZERO_WIDTH_NON_JOINER)
    ) {
      // Never move a boundary into the middle of a preceding surrogate pair.
      if (
        end > start + 1 &&
        isHighSurrogate(text.charCodeAt(end - 2)) &&
        isLowSurrogate(text.charCodeAt(end - 1))
      ) {
        break;
      }
      end -= 1;
    }
  }

  // Keep quoted Persian phrases intact when the closing quote fits in this chunk.
  let preserveQuoteBoundary = false;
  let openingQuote = text.indexOf("«", start);
  while (openingQuote !== -1 && openingQuote < requestedEnd) {
    const closingQuote = text.indexOf("»", openingQuote + 1);
    if (closingQuote === -1) break;

    if (closingQuote < requestedEnd) {
      const lastSpaceInChunk = text.lastIndexOf(" ", end);
      if (lastSpaceInChunk > openingQuote && lastSpaceInChunk < closingQuote) {
        end = closingQuote + 1;
        preserveQuoteBoundary = true;
        break;
      }
    } else if (openingQuote > start) {
      end = openingQuote;
      preserveQuoteBoundary = true;
      break;
    }

    openingQuote = text.indexOf("«", closingQuote + 1);
  }

  if (!preserveQuoteBoundary && end > start && end < text.length) {
    const lastSpace = text.lastIndexOf(" ", end);
    if (lastSpace > start && lastSpace < end) end = lastSpace;
  }

  // Always advance, including when a single long word has no safe space boundary.
  if (end <= start) end = Math.min(start + (requestedEnd - start), text.length);
  return end;
}

function splitLongSentence(sentence: string, maxLength: number): string[] {
  const segments: string[] = [];
  let start = 0;

  while (start < sentence.length) {
    const requestedEnd = Math.min(start + maxLength, sentence.length);
    const end = findSafeEnd(sentence, start, requestedEnd);
    const segment = sentence.slice(start, end).trim();

    if (segment) segments.push(segment);
    start = end;
  }

  return segments;
}

function getOverlapSuffix(text: string, maxLength: number): string {
  let start = Math.max(0, text.length - maxLength);

  while (start < text.length) {
    const splitsSurrogatePair =
      isLowSurrogate(text.charCodeAt(start)) && isHighSurrogate(text.charCodeAt(start - 1));
    const splitsPersianJoin = text.charAt(start) === ZERO_WIDTH_NON_JOINER ||
      text.charAt(start - 1) === ZERO_WIDTH_NON_JOINER;

    if (!splitsSurrogatePair && !splitsPersianJoin) break;
    start += 1;
  }

  return text.slice(start).trim();
}

export function chunkText(
  text: string,
  requestedMaxChunkSize: number,
  requestedOverlap: number
): string[] {
  const { maxChunkSize, overlap } = validateChunkingOptions(
    requestedMaxChunkSize,
    requestedOverlap
  );

  if (!text) return [];

  const textBytes = new TextEncoder().encode(text).byteLength;
  if (textBytes > MAX_INGESTION_TEXT_BYTES) {
    throw new RangeError(
      `Text exceeds the maximum supported ingestion size of ${MAX_INGESTION_TEXT_BYTES} bytes.`
    );
  }

  // Reserve room for both the overlap and the joining space in every subsequent chunk.
  const actualOverlap = overlap;
  const chunkCapacity = maxChunkSize - actualOverlap - (actualOverlap > 0 ? 1 : 0);
  const sentenceBoundaryRegex = /([.؟؛!\n\r]+)/g;
  const parts = text.split(sentenceBoundaryRegex);
  const chunks: string[] = [];
  let currentChunk = "";

  const pushChunk = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;

    chunks.push(normalized);
    if (chunks.length > MAX_CHUNK_COUNT) {
      throw new RangeError(
        `Document exceeds the maximum supported chunk count of ${MAX_CHUNK_COUNT}.`
      );
    }
  };

  for (let i = 0; i < parts.length; i += 2) {
    const sentence = (parts[i] || "") + (parts[i + 1] || "");
    if (!sentence.trim()) continue;

    if (sentence.length > chunkCapacity) {
      if (currentChunk) {
        pushChunk(currentChunk);
        currentChunk = "";
      }
      for (const segment of splitLongSentence(sentence, chunkCapacity)) {
        pushChunk(segment);
      }
      continue;
    }

    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (candidate.length <= chunkCapacity) {
      currentChunk = candidate;
    } else {
      if (currentChunk) pushChunk(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) pushChunk(currentChunk);

  if (actualOverlap === 0 || chunks.length < 2) return chunks;

  return chunks.map((chunk, index) => {
    if (index === 0) return chunk;

    const overlapText = getOverlapSuffix(chunks[index - 1], actualOverlap);
    const combined = overlapText ? `${overlapText} ${chunk}` : chunk;

    // This is an invariant guard: no chunk may exceed the public size contract.
    if (combined.length > maxChunkSize) {
      throw new Error("Chunking invariant violated: overlap exceeded maxChunkSize.");
    }

    return combined;
  });
}
