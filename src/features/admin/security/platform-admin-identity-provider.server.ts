import "server-only";

import { cookies } from "next/headers";
import type { Permission } from "../domain/types";
import {
  authenticatePlatformAdminSession,
  isPlatformAdminOidcConfigured,
  PLATFORM_ADMIN_SESSION_COOKIE,
} from "./platform-admin-oidc.server";

/**
 * Identity returned only after the OIDC client validates the authorization
 * response and the isolated Platform Admin store confirms an active account.
 */
export interface VerifiedPlatformAdminIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly audience: string;
  readonly isActive: boolean;
  readonly grantedPermissions: readonly Permission[];
}

/**
 * Contract for the trusted Platform Admin identity adapter. Production callers
 * cannot supply an implementation to the authorization API.
 */
export interface PlatformAdminIdentityProvider {
  authenticatePlatformAdmin(): Promise<VerifiedPlatformAdminIdentity | null>;
}

/**
 * Server-only composition root. It remains unavailable until the dedicated
 * Platform Admin database and complete OIDC client configuration are present.
 */
export function getTrustedPlatformAdminIdentityProvider(): PlatformAdminIdentityProvider | null {
  if (!isPlatformAdminOidcConfigured()) return null;

  return {
    async authenticatePlatformAdmin() {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(PLATFORM_ADMIN_SESSION_COOKIE)?.value;
      if (!sessionToken) return null;

      const issuer = process.env.PLATFORM_ADMIN_OIDC_ISSUER?.trim();
      const audience = process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID?.trim();
      if (!issuer || !audience) return null;
      const identity = await authenticatePlatformAdminSession(sessionToken, issuer, audience);
      if (!identity) return null;

      return {
        issuer: identity.issuer,
        subject: identity.subject,
        audience,
        isActive: true,
        grantedPermissions: identity.grantedPermissions as Permission[],
      };
    },
  };
}
