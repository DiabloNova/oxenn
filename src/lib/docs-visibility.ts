export type DocumentationVisibility = "public" | "internal" | "draft";
const OPEN = /^---[ \t]*(?:\r?\n|$)/;
const CLOSE = /^---[ \t]*\r?$/m;
const KEY = /^[ \t]*(?:visibility|"visibility"|'visibility')[ \t]*:(.*)$/i;

export function parseDocumentationVisibility(content: string): DocumentationVisibility | undefined {
  const normalized = content.startsWith("\uFEFF") ? content.slice(1) : content;
  const opening = OPEN.exec(normalized);
  if (!opening) return undefined;
  const rest = normalized.slice(opening[0].length);
  const closing = CLOSE.exec(rest);
  if (!closing) throw new Error("Documentation front matter is not closed");
  const values = rest.slice(0, closing.index).split(/\r?\n/)
    .map((line) => KEY.exec(line))
    .filter((match): match is RegExpExecArray => match !== null);
  if (values.length === 0) return undefined;
  if (values.length > 1) throw new Error("Documentation visibility is declared more than once");
  const raw = values[0]?.[1]?.trim() ?? "";
  const withoutComment = raw.replace(/[ \t]+#.*$/, "").trim();
  const value = withoutComment.startsWith('"') && withoutComment.endsWith('"')
    ? withoutComment.slice(1, -1)
    : withoutComment.startsWith("'") && withoutComment.endsWith("'")
      ? withoutComment.slice(1, -1)
      : withoutComment;
  if (value === "public" || value === "internal" || value === "draft") return value;
  throw new Error("Unsupported documentation visibility value: " + (raw || "<empty>"));
}

export function isPublicDocumentation(content: string): boolean {
  try {
    const visibility = parseDocumentationVisibility(content);
    return visibility === undefined || visibility === "public";
  } catch {
    return false;
  }
}
