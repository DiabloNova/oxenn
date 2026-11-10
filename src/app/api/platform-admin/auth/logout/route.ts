import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  logoutPlatformAdminSession,
  PLATFORM_ADMIN_OIDC_BINDING_COOKIE,
  PLATFORM_ADMIN_SESSION_COOKIE,
} from "@/features/admin/security/platform-admin-oidc.server";

export const runtime = "nodejs";

function clearAuthenticationCookies(response: NextResponse): void {
  for (const name of [PLATFORM_ADMIN_SESSION_COOKIE, PLATFORM_ADMIN_OIDC_BINDING_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: true,
      sameSite: name === PLATFORM_ADMIN_OIDC_BINDING_COOKIE ? "lax" : "strict",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestOrigin = new URL(request.url).origin;
  const suppliedOrigin = request.headers.get("origin");
  if (suppliedOrigin && suppliedOrigin !== requestOrigin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PLATFORM_ADMIN_SESSION_COOKIE)?.value;
  try {
    if (sessionToken) await logoutPlatformAdminSession(sessionToken);
  } catch {
    const response = NextResponse.json(
      { error: "Platform Admin session revocation is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
    clearAuthenticationCookies(response);
    return response;
  }

  const response = NextResponse.json({ loggedOut: true }, {
    headers: { "Cache-Control": "no-store" },
  });
  clearAuthenticationCookies(response);
  return response;
}
