export type MentionKind = "brand" | "competitor" | "ambiguous" | "text";

export interface MentionSegment {
  text: string;
  kind: MentionKind;
}

interface MentionEntity {
  name: string;
  kind: "brand" | "competitor";
}

interface MatchingView {
  text: string;
  originalStartByIndex: number[];
  originalEndByIndex: number[];
}

const normalizeMentionText = (value: string): string =>
  value
    .normalize("NFC")
    // Canonicalize common Arabic-script variants used in Persian names.
    .replace(/\u064A/g, "ی")
    .replace(/\u0643/g, "ک");

/**
 * Builds a normalized matching string while tracking each normalized UTF-16
 * index back to the original grapheme range. Rendering always slices the
 * untouched source string, so normalization can never rewrite model output.
 */
const getGraphemeLikeSegments = (source: string): Array<{ segment: string; index: number }> => {
  if (typeof Intl.Segmenter === "function") {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(source),
      (part) => ({ segment: part.segment, index: part.index }),
    );
  }

  // Fallback for supported browsers without Intl.Segmenter. Keep combining
  // marks attached to the preceding code point so source offsets stay intact.
  const parts: Array<{ segment: string; index: number }> = [];
  let offset = 0;
  for (const character of source) {
    if (/\p{M}/u.test(character) && parts.length > 0) {
      parts[parts.length - 1].segment += character;
    } else {
      parts.push({ segment: character, index: offset });
    }
    offset += character.length;
  }
  return parts;
};

const createMatchingView = (source: string): MatchingView => {
  let text = "";
  const originalStartByIndex: number[] = [];
  const originalEndByIndex: number[] = [];

  for (const part of getGraphemeLikeSegments(source)) {
    const normalized = normalizeMentionText(part.segment);
    text += normalized;
    for (let index = 0; index < normalized.length; index += 1) {
      originalStartByIndex.push(part.index);
      originalEndByIndex.push(part.index + part.segment.length);
    }
  }

  return { text, originalStartByIndex, originalEndByIndex };
};

const regexMetaCharacters = new Set([
  ".",
  "*",
  "+",
  "?",
  "^",
  "$",
  "{",
  "}",
  "(",
  ")",
  "|",
  "[",
  "]",
  "\\",
]);

const escapeRegExp = (value: string): string =>
  [...value]
    .map((character) => (regexMetaCharacters.has(character) ? "\\" + character : character))
    .join("");

const isWordCharacter = (character: string | undefined): boolean =>
  character !== undefined && /[\\p{L}\\p{M}\\p{N}_\\u200c]/u.test(character);

/**
 * Splits the original response into safely classifiable mention segments.
 * Normalization is used only in a separate matching view; every returned
 * segment is sliced from the original source and concatenates back to it.
 */
export function matchMentionSegments(
  text: string,
  brandName: string,
  competitors: string[],
): MentionSegment[] {
  const matchingView = createMatchingView(text);
  const entities: MentionEntity[] = [
    { name: normalizeMentionText(brandName.trim()), kind: "brand" as const },
    ...competitors.map((name) => ({
      name: normalizeMentionText(name.trim()),
      kind: "competitor" as const,
    })),
  ].filter((entity) => entity.name.length > 0);

  if (entities.length === 0) return [{ text, kind: "text" }];

  const names = [...new Set(entities.map((entity) => entity.name))].sort(
    (a, b) => b.length - a.length,
  );
  const alternatives = names.map(escapeRegExp).join("|");
  // Avoid lookbehind for older supported Safari versions. Check boundaries
  // manually, including combining marks, after each longest-first match.
  const matcher = new RegExp(alternatives, "giu");

  interface Candidate {
    start: number;
    end: number;
    kind: MentionKind;
  }
  const candidates: Candidate[] = [];
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(matchingView.text)) !== null) {
    const previousCharacter = Array.from(matchingView.text.slice(0, match.index)).pop();
    const nextCharacter = Array.from(
      matchingView.text.slice(match.index + match[0].length),
    )[0];
    if (isWordCharacter(previousCharacter) || isWordCharacter(nextCharacter)) continue;

    const originalStart = matchingView.originalStartByIndex[match.index];
    const lastMatchedIndex = match.index + match[0].length - 1;
    const originalEnd = matchingView.originalEndByIndex[lastMatchedIndex];
    if (originalStart === undefined || originalEnd === undefined) continue;

    const matchedEntities = entities.filter((entity) =>
      new RegExp("^" + escapeRegExp(entity.name) + "$", "iu").test(match![0]),
    );
    const hasBrand = matchedEntities.some((entity) => entity.kind === "brand");
    const hasCompetitor = matchedEntities.some((entity) => entity.kind === "competitor");
    const kind: MentionKind =
      hasBrand && hasCompetitor
        ? "ambiguous"
        : hasBrand
          ? "brand"
          : hasCompetitor
            ? "competitor"
            : "text";

    candidates.push({ start: originalStart, end: originalEnd, kind });
  }

  // Normalization can map multiple regex hits to the same source grapheme.
  // Merge overlapping source ranges before slicing so source text is never duplicated.
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Candidate[] = [];
  for (const candidate of candidates) {
    const previous = merged[merged.length - 1];
    if (!previous || candidate.start >= previous.end) {
      merged.push({ ...candidate });
      continue;
    }

    previous.end = Math.max(previous.end, candidate.end);
    if (previous.kind !== candidate.kind) previous.kind = "ambiguous";
  }

  const segments: MentionSegment[] = [];
  let cursor = 0;
  for (const candidate of merged) {
    if (candidate.start > cursor) {
      segments.push({ text: text.slice(cursor, candidate.start), kind: "text" });
    }
    if (candidate.end > cursor) {
      segments.push({ text: text.slice(Math.max(cursor, candidate.start), candidate.end), kind: candidate.kind });
      cursor = candidate.end;
    }
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: "text" });
  }

  return segments.length ? segments : [{ text, kind: "text" }];
}
