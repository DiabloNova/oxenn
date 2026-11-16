import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { shouldSkipHomepageSessionLookup } from "@/lib/auth/route-policy";

describe("homepage session lookup policy", () => {
  it.each(SUPPORTED_LOCALES.flatMap((locale) => [`/${locale}`, `/${locale}/`]))(
    "skips the Workspace session lookup on the localized public homepage: %s",
    (pathname) => {
      expect(shouldSkipHomepageSessionLookup(pathname)).toBe(true);
    }
  );

  it.each([
    "/fa/register", "/fa/login", "/en/register", "/en/login",
    "/fa/dashboard", "/en/settings", "/fa/public-docs", "/de", null, undefined,
  ])("preserves session lookup on non-homepage routes: %s", (pathname) => {
    expect(shouldSkipHomepageSessionLookup(pathname)).toBe(false);
  });
});
