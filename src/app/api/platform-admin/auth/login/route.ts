import { NextResponse } from "next/server";
import {
  PLATFORM_ADMIN_OIDC_BINDING_COOKIE,
  startPlatformAdminOidcLogin,
} from "@/features/admin/security/platform-admin-oidc.server";
import {
  consumePlatformAdminAuthRateLimit,
  hashPlatformAdminRateLimitKey,
} from "@/features/admin/security/platform-admin-store.server";

export const runtime = "nodejs";

function trustedClientAddress(request: Request): string | null {
  const address = request.headers.get("x-real-ip")?.trim();
  if (address) return address;
  return process.env.NODE_ENV === "production" ? null : "local-development";
}

export async function GET(request: Request): Promise<NextResponse> {
  const clientAddress = trustedClientAddress(request);
  if (!clientAddress) {
    return NextResponse.json(
      { error: "Platform Admin authentication is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const allowed = await consumePlatformAdminAuthRateLimit({
      keyHash: hashPlatformAdminRateLimitKey(`login:${clientAddress}`),
      maxAttempts: 10,
      windowSeconds: 15 * 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many Platform Admin login attempts. Try again later." },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } },
      );
    }

    const { authorizationUrl, browserBinding } = await startPlatformAdminOidcLogin();
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(PLATFORM_ADMIN_OIDC_BINDING_COOKIE, browserBinding, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Platform Admin authentication is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
