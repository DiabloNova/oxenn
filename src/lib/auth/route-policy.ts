import { SUPPORTED_LOCALES } from "@/config/i18n";

/** Public homepages do not need Workspace session storage; every other route does. */
export function shouldSkipHomepageSessionLookup(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return SUPPORTED_LOCALES.some((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
}


/**
 * Returns a safe, same-origin destination for a localized post-auth redirect.
 * Only absolute-path references in the current locale are accepted; protocol-
 * relative URLs, backslash variants, cross-locale paths, and auth-loop targets
 * fall back to the caller's default destination.
 */
export function getSafeLocalizedReturnTo(
  returnTo: string | null | undefined,
  locale: string,
  origin: string,
): string | null {
  if (!returnTo || !SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) return null;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(returnTo)) return null;

  try {
    const expectedOrigin = new URL(origin).origin;
    const destination = new URL(returnTo, expectedOrigin);
    if (destination.origin !== expectedOrigin) return null;

    const localeRoot = `/${locale}`;
    if (destination.pathname !== localeRoot && !destination.pathname.startsWith(`${localeRoot}/`)) return null;

    const authRoutes = ["login", "register", "verify-email", "forgot-password"]
      .map((route) => `${localeRoot}/${route}`);
    if (authRoutes.some((path) => destination.pathname === path || destination.pathname.startsWith(`${path}/`))) {
      return null;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
