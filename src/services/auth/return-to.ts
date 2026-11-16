/**
 * Accept only same-origin relative destinations inside the active locale.
 * This deliberately rejects encoded path separators and traversal segments
 * before the value is passed to router navigation.
 */
export function getSafeLocaleReturnTo(
  candidate: string | null | undefined,
  locale: string,
): string | null {
  if (
    (locale !== "en" && locale !== "fa") ||
    typeof candidate !== "string" ||
    candidate.length === 0 ||
    candidate.length > 2048 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return null;
  }

  const rawPath = candidate.split(/[?#]/, 1)[0];
  if (/%(?:2f|5c)/i.test(rawPath)) return null;

  let decodedPath: string;
  let parsed: URL;
  try {
    decodedPath = decodeURIComponent(rawPath);
    parsed = new URL(candidate, "https://oxenn.invalid");
  } catch {
    return null;
  }

  if (
    parsed.origin !== "https://oxenn.invalid" ||
    decodedPath.includes("\\") ||
    decodedPath.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    return null;
  }

  const localeRoot = `/${locale}`;
  if (parsed.pathname !== localeRoot && !parsed.pathname.startsWith(`${localeRoot}/`)) {
    return null;
  }

  return candidate;
}
