const FRONT_MATTER_OPENING_PATTERN = /^---[ \t]*(?:\r?\n|$)/;
const FRONT_MATTER_CLOSING_PATTERN = /^---[ \t]*\r?$/m;
const INTERNAL_VISIBILITY_PATTERN =
  /^[ \t]*(?:visibility|"visibility"|'visibility')[ \t]*:\s*(?:"internal"|'internal'|internal)[ \t]*(?:#.*)?$/im;

export function isPublicDocumentation(content: string): boolean {
  const normalizedContent = content.startsWith("\uFEFF") ? content.slice(1) : content;
  const openingDelimiter = FRONT_MATTER_OPENING_PATTERN.exec(normalizedContent);

  if (!openingDelimiter) {
    return true;
  }

  const afterOpeningDelimiter = normalizedContent.slice(openingDelimiter[0].length);
  const closingDelimiter = FRONT_MATTER_CLOSING_PATTERN.exec(afterOpeningDelimiter);
  const frontMatter = closingDelimiter
    ? afterOpeningDelimiter.slice(0, closingDelimiter.index)
    : afterOpeningDelimiter;

  // An unclosed front-matter block is treated as private when it declares internal visibility.
  return !INTERNAL_VISIBILITY_PATTERN.test(frontMatter);
}
