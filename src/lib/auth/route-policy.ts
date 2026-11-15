/**
 * Public marketing routes are intentionally independent of Workspace session storage.
 * Keep this check narrow: localized auth and workspace routes must still validate sessions.
 */
export function shouldSkipHomepageSessionLookup(pathname: string | null | undefined): boolean {
  return pathname === "/fa" || pathname === "/fa/" || pathname === "/en" || pathname === "/en/";
}
