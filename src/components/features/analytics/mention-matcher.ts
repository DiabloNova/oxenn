export type MentionKind = "brand" | "competitor" | "ambiguous" | "text";

export interface MentionSegment {
  text: string;
  kind: MentionKind;
}

interface MentionEntity {
  name: string;
  kind: "brand" | "competitor";
}

const normalizeMentionText = (value: string): string =>
  value
    .normalize("NFC")
    // Canonicalize common Arabic-script variants used in Persian names.
    .replace(/\u064A/g, "ی")
    .replace(/\u0643/g, "ک");

const escapeRegExp = (value: string): string =>
  value
    .split("")
    .map((character) => (/[.*+?^$()|[\]\\{}]/.test(character) ? "\\" + character : character))
    .join("");

const wordEdge = "[\\p{L}\\p{N}_\\u200c]";

/**
 * Splits text into safely classifiable mention segments.
 *
 * Matching and classification use the same Unicode-aware, case-insensitive
 * regex semantics. If a matched spelling can refer to both the brand and a
 * competitor, it is marked ambiguous rather than assigned a misleading color.
 */
export function matchMentionSegments(
  text: string,
  brandName: string,
  competitors: string[],
): MentionSegment[] {
  const normalizedText = normalizeMentionText(text);
  const entities: MentionEntity[] = [
    { name: normalizeMentionText(brandName.trim()), kind: "brand" },
    ...competitors.map((name) => ({
      name: normalizeMentionText(name.trim()),
      kind: "competitor" as const,
    })),
  ].filter((entity) => entity.name.length > 0);

  if (entities.length === 0) return [{ text: normalizedText, kind: "text" }];

  const names = [...new Set(entities.map((entity) => entity.name))].sort(
    (a, b) => b.length - a.length,
  );
  const alternatives = names.map(escapeRegExp).join("|");
  // Unicode property escapes avoid ASCII-only \b behavior for Persian and mixed scripts.
  const matcher = new RegExp(
    "(?<!" + wordEdge + ")(?:" + alternatives + ")(?!" + wordEdge + ")",
    "giu",
  );

  const segments: MentionSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(normalizedText)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: normalizedText.slice(cursor, match.index), kind: "text" });
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

    segments.push({ text: matchedName, kind });
    cursor = matcher.lastIndex;
  }

  if (cursor < normalizedText.length) {
    segments.push({ text: normalizedText.slice(cursor), kind: "text" });
  }

  return segments.length ? segments : [{ text: normalizedText, kind: "text" }];
}
