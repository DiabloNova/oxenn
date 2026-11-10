import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  consumePlatformAdminAuthRateLimit,
  hashPlatformAdminRateLimitKey,
  recordPlatformAdminAuditEvent,
} from "@/features/admin/security/platform-admin-store.server";
import {
  completePlatformAdminOidcLogin,
  PlatformAdminOidcDeniedError,
  PLATFORM_ADMIN_OIDC_BINDING_COOKIE,
  PLATFORM_ADMIN_SESSION_COOKIE,
} from "@/features/admin/security/platform-admin-oidc.server";

export const runtime = "nodejs";

function clearBindingCookie(response: NextResponse): void {
  response.cookies.set(PLATFORM_ADMIN_OIDC_BINDING_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function trustedClientAddress(request: Request): string | null {
  const address = request.headers.get("x-real-ip")?.trim();
  if (address) return address;
  return process.env.NODE_ENV === "production" ? null : "local-development";
}

export async function GET(request: Request): Promise<NextResponse> {
  const clientAddress = trustedClientAddress(request);
  if (!clientAddress) {
    const response = NextResponse.json(
      { error: "Platform Admin authentication is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
    clearBindingCookie(response);
    return response;
  }

  try {
    const allowed = await consumePlatformAdminAuthRateLimit({
      keyHash: hashPlatformAdminRateLimitKey(`callback:${clientAddress}`),
      maxAttempts: 20,
      windowSeconds: 15 * 60,
    });
    if (!allowed) {
      const response = NextResponse.json(
        { error: "Too many Platform Admin callback attempts. Try again later." },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } },
      );
      clearBindingCookie(response);
      return response;
    }
  } catch {
    const response = NextResponse.json(
      { error: "Platform Admin authentication is unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
    clearBindingCookie(response);
    return response;
  }

  const cookieStore = await cookies();
  const browserBinding = cookieStore.get(PLATFORM_ADMIN_OIDC_BINDING_COOKIE)?.value ?? null;

  try {
    const { sessionToken, expiresAt } = await completePlatformAdminOidcLogin(
      new URL(request.url),
      browserBinding,
    );
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(PLATFORM_ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });
    clearBindingCookie(response);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const denial = error instanceof PlatformAdminOidcDeniedError ? error : null;
    try {
      await recordPlatformAdminAuditEvent({
        eventType: "platform_admin.login",
        outcome: "denied",
        subject: denial?.auditSubject ?? null,
        details: denial?.auditDetails ?? { reason: "oidc_callback_failed" },
      });
    } catch {
      // Authentication remains denied if the audit store is unavailable.
    }
    const response = NextResponse.json(
      { error: "Platform Admin authentication failed." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
    clearBindingCookie(response);
    return response;
  }
}
