import { SUPPORTED_LOCALES } from "@/config/i18n";

/** Public homepages do not need Workspace session storage; every other route does. */
export function shouldSkipHomepageSessionLookup(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return SUPPORTED_LOCALES.some((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
}
