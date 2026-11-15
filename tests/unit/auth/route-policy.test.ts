import { describe, expect, it } from "vitest";
import { shouldSkipHomepageSessionLookup } from "@/lib/auth/route-policy";

describe("homepage session lookup policy", () => {
  it.each(["/fa", "/fa/", "/en", "/en/"])(
    "skips the Workspace session lookup on the localized public homepage: %s",
    (pathname) => {
      expect(shouldSkipHomepageSessionLookup(pathname)).toBe(true);
    }
  );

  it.each([
    "/fa/register",
    "/fa/login",
    "/en/register",
    "/en/login",
    "/fa/dashboard",
    "/en/settings",
    "/fa/public-docs",
    null,
    undefined,
  ])("preserves session lookup on non-homepage routes: %s", (pathname) => {
    expect(shouldSkipHomepageSessionLookup(pathname)).toBe(false);
  });
});
