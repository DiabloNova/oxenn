const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const INTERNAL_VISIBILITY_PATTERN = /^\s*visibility\s*:\s*["']?internal["']?\s*(?:#.*)?$/im;

export function isPublicDocumentation(content: string): boolean {
  const frontMatter = FRONT_MATTER_PATTERN.exec(content);

  return !frontMatter || !INTERNAL_VISIBILITY_PATTERN.test(frontMatter[1]);
}
