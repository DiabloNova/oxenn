import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getSafeLocalizedReturnTo, shouldSkipHomepageSessionLookup } from "@/lib/auth/route-policy";

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


describe("localized post-auth return destination", () => {
  const origin = "https://oxenn.ir";

  it("accepts a same-origin report detail path and preserves its query and fragment", () => {
    expect(getSafeLocalizedReturnTo("/fa/dashboard/audits/report-1?tab=metrics#score", "fa", origin))
      .toBe("/fa/dashboard/audits/report-1?tab=metrics#score");
  });

  it.each([
    "https://evil.example/phishing",
    "//evil.example/phishing",
    "/en/dashboard/audits/report-1",
    "/fa/../en/dashboard",
    "/fa\\evil.example",
    "/fa/login?returnTo=%2Ffa%2Flogin",
    "/fa/register",
    "/fa/verify-email",
    "/fa/forgot-password",
  ])("rejects an unsafe or auth-loop destination: %s", (returnTo) => {
    expect(getSafeLocalizedReturnTo(returnTo, "fa", origin)).toBeNull();
  });

  it("rejects missing destinations, unsupported locales, and invalid origins", () => {
    expect(getSafeLocalizedReturnTo(null, "fa", origin)).toBeNull();
    expect(getSafeLocalizedReturnTo("/fa/dashboard", "de", origin)).toBeNull();
    expect(getSafeLocalizedReturnTo("/fa/dashboard", "fa", "not an origin")).toBeNull();
  });
});
