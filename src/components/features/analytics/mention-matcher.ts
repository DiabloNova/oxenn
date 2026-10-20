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
const createMatchingView = (source: string): MatchingView => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let text = "";
  const originalStartByIndex: number[] = [];
  const originalEndByIndex: number[] = [];

  for (const part of segmenter.segment(source)) {
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

const wordEdge = "[\\p{L}\\p{N}_\\u200c]";

/**
 * Splits the original response into safely classifiable mention segments.
 * Normalization is used only in a separate matching view; every returned
 * segment is sliced from the original source and concatenates back to it.
 */
export function matchMentionSegments(
  text: string,
  brandName: string,
  competitors: string[],
  brandAliases: string[] = [],
): MentionSegment[] {
  const matchingView = createMatchingView(text);
  const entities: MentionEntity[] = [
    { name: normalizeMentionText(brandName.trim()), kind: "brand" },
    ...brandAliases.map((name) => ({ name: normalizeMentionText(name.trim()), kind: "brand" as const })),
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
  // Unicode property escapes avoid ASCII-only \\b behavior for Persian and mixed scripts.
  const matcher = new RegExp(
    "(?<!" + wordEdge + ")(?:" + alternatives + ")(?!" + wordEdge + ")",
    "giu",
  );

  const segments: MentionSegment[] = [];
  let originalCursor = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(matchingView.text)) !== null) {
    const originalStart = matchingView.originalStartByIndex[match.index];
    const lastMatchedIndex = match.index + match[0].length - 1;
    const originalEnd = matchingView.originalEndByIndex[lastMatchedIndex];

    if (originalStart > originalCursor) {
      segments.push({ text: text.slice(originalCursor, originalStart), kind: "text" });
    }

    const matchedName = match[0];
    const matchedEntities = entities.filter((entity) =>
      new RegExp("^" + escapeRegExp(entity.name) + "$", "iu").test(matchedName),
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

    segments.push({ text: text.slice(originalStart, originalEnd), kind });
    originalCursor = originalEnd;
  }

  if (originalCursor < text.length) {
    segments.push({ text: text.slice(originalCursor), kind: "text" });
  }

  return segments.length ? segments : [{ text, kind: "text" }];
}
