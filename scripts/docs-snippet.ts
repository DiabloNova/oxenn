/**
 * Create a compact docs-search snippet while preserving an identifier that
 * crosses the boundary. Natural-language words remain bounded at maxLength;
 * technical identifiers (numbers, underscore names, paths, or dotted names)
 * may extend only to the end of the token.
 */
export function createContentSnippet(content: string, maxLength = 500): string {
  const normalizedContent = content.replace(/\n/g, " ");

  if (normalizedContent.length <= maxLength) {
    return normalizedContent;
  }

  let end = maxLength;
  const previousCharacter = normalizedContent[end - 1];
  const nextCharacter = normalizedContent[end];

  if (
    previousCharacter &&
    nextCharacter &&
    !/\s/.test(previousCharacter) &&
    !/\s/.test(nextCharacter)
  ) {
    const tokenStart = normalizedContent.slice(0, end).search(/\S+$/);
    const tokenPrefix = normalizedContent.slice(tokenStart, end);
    const identifierFragment =
      /[\d_/@:]/.test(tokenPrefix) ||
      (tokenPrefix.includes(".") && /[A-Za-z0-9]/.test(nextCharacter));

    if (identifierFragment) {
      while (end < normalizedContent.length && !/\s/.test(normalizedContent[end])) {
        end += 1;
      }
    }
  }

  return normalizedContent.slice(0, end);
}
