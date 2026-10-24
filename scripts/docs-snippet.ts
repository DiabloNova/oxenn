/**
 * Create a compact docs-search snippet without cutting a token in half.
 * The result may exceed maxLength only by the remainder of the token that
 * crosses the boundary, so identifiers such as migration numbers stay intact.
 */
export function createContentSnippet(content: string, maxLength = 500): string {
  const normalizedContent = content.replace(/\n/g, " ");

  if (normalizedContent.length <= maxLength) {
    return normalizedContent;
  }

  let end = maxLength;
  const previousCharacter = normalizedContent[end - 1];
  const nextCharacter = normalizedContent[end];

  // Extend only when the limit falls inside a token. If it falls between
  // tokens, keep the existing length limit and avoid pulling in a new word.
  if (
    previousCharacter &&
    nextCharacter &&
    !/\s/.test(previousCharacter) &&
    !/\s/.test(nextCharacter)
  ) {
    while (end < normalizedContent.length && !/\s/.test(normalizedContent[end])) {
      end += 1;
    }
  }

  return normalizedContent.slice(0, end);
}
