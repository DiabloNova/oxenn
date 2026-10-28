import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/config/i18n";

const INFRASTRUCTURE_PREFIXES = ["/api", "/_next", "/_vercel"] as const;

// Locale-looking but unsupported prefixes must reach [locale]/layout.tsx,
// where they are rejected with notFound(), rather than being reinterpreted as
// an unprefixed page and silently redirected to Persian.
const LOCALE_LIKE_SEGMENT = /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i;

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
 * Existing supported locale prefixes are preserved, while unsupported
 * locale-looking prefixes are left for the locale layout to reject.
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

  if (firstSegment && LOCALE_LIKE_SEGMENT.test(firstSegment)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Keep APIs, Next internals, Vercel internals, and file-like paths out of
  // the proxy; shouldBypass is retained as a defensive check for direct calls.
  matcher: ["/((?!_next/static|_next/image|_vercel|.*\\..*).*)"],
};
