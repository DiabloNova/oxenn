import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/config/i18n";

const INFRASTRUCTURE_PREFIXES = ["/api", "/_next", "/_vercel"] as const;

function shouldBypass(pathname: string): boolean {
  if (
    INFRASTRUCTURE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  // Do not rewrite file requests (including .well-known/security.txt).
  return pathname.split("/").some((segment) => segment.includes("."));
}

/**
 * Adds the default locale to application routes that do not have a locale.
 * Only the configured locale allowlist is treated as a locale prefix. All other
 * application paths are normalized under the default locale, avoiding accidental
 * 404s for ordinary slugs such as "/app" or "/faq".
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }


  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname =
    pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Exclude API/Next/Vercel internals and file-like paths from the matcher.
  // shouldBypass is retained as a defensive check for direct calls.
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)"],
};
