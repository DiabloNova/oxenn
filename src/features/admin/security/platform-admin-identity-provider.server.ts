import "server-only";

import type { Permission } from "../domain/types";

/**
 * Identity returned only after a trusted server-side adapter verifies the
 * administrator's credential/session and resolves explicit Platform Admin
 * grants from an authoritative source.
 */
export interface VerifiedPlatformAdminIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly audience: string;
  readonly isActive: boolean;
  readonly grantedPermissions: readonly Permission[];
}

/**
 * Contract for the trusted Platform Admin identity adapter.
 *
 * This type is intentionally kept in the server-only provider module. Callers
 * must not supply an implementation to authorization functions.
 */
export interface PlatformAdminIdentityProvider {
  authenticatePlatformAdmin(): Promise<VerifiedPlatformAdminIdentity | null>;
}

/**
 * Trusted provider composition root.
 *
 * Stage 1 deliberately has no configured identity provider and therefore
 * returns null. Stage 2 may construct the real provider here after its
 * authentication and canonical persistence contracts are implemented.
 *
 * Do not add a setter or accept request/caller-controlled provider data here.
 */
export function getTrustedPlatformAdminIdentityProvider(): PlatformAdminIdentityProvider | null {
  return null;
}
