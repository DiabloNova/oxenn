import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { proxy } from "@/proxy";

const ORIGIN = "https://oxenn.example";

function runProxy(path: string) {
  return proxy(new NextRequest(new URL(path, ORIGIN)));
}

function expectNext(response: Response) {
  expect(response.headers.get("x-middleware-next")).toBe("1");
}

describe("locale routing proxy", () => {
  it("uses Persian as the supported default locale", () => {
    expect(DEFAULT_LOCALE).toBe("fa");
    expect(SUPPORTED_LOCALES).toEqual(["en", "fa"]);
  });

  it("accepts only the configured locale allowlist", () => {
    expect(isSupportedLocale("fa")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("xx")).toBe(false);
    expect(isSupportedLocale("en-US")).toBe(false);
    expect(isSupportedLocale("EN")).toBe(false);
    expect(isSupportedLocale("fil")).toBe(false);
  });

  it("redirects the root to the default locale", () => {
    const response = runProxy("/");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/fa`);
  });

  it("preserves the query when redirecting the root", () => {
    const response = runProxy("/?source=mail&campaign=launch");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/fa?source=mail&campaign=launch`
    );
  });

  it.each([
    ["/dashboard", "/fa/dashboard"],
    ["/dashboard/seo", "/fa/dashboard/seo"],
    ["/dashboard/seo?tab=links", "/fa/dashboard/seo?tab=links"],
    ["/about", "/fa/about"],
    ["/pricing?plan=enterprise", "/fa/pricing?plan=enterprise"],
  ])("redirects unprefixed route %s to %s", (input, expected) => {
    const response = runProxy(input);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}${expected}`);
  });

  it.each(["/fa", "/fa/dashboard", "/en/pricing", "/en/dashboard/seo?tab=links"])(
    "does not redirect already-localized route %s",
    (path) => expectNext(runProxy(path))
  );

  it.each(["/xx", "/xx/dashboard", "/en-US/pricing", "/fil/blog"])(
    "does not disguise unsupported locale-like prefix %s as the default locale",
    (path) => expectNext(runProxy(path))
  );

  it.each([
    "/api",
    "/api/inngest",
    "/api/v1/status",
    "/_next/static/chunk.js",
    "/_next/image?url=%2Flogo.png",
    "/_vercel/insights/view",
    "/favicon.ico",
    "/logo.svg",
    "/.well-known/security.txt",
  ])("bypasses infrastructure and static path %s", (path) => expectNext(runProxy(path)));

  it("does not create a redirect loop after prefixing an unlocalized route", () => {
    const firstResponse = runProxy("/dashboard/seo?tab=links");
    const target = firstResponse.headers.get("location");

    expect(target).toBe(`${ORIGIN}/fa/dashboard/seo?tab=links`);
    const targetUrl = new URL(target!);
    expectNext(runProxy(targetUrl.pathname + targetUrl.search));
  });
});
