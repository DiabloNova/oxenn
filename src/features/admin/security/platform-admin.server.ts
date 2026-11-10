import "server-only";

import type { Permission } from "../domain/types";

const PLATFORM_ADMIN_PERMISSIONS: readonly Permission[] = [
  "tenant:create",
  "tenant:write",
  "tenant:read",
  "tenant:suspend",
  "tenant:activate",
  "tenant:archive",
  "admin:write",
  "admin:read",
  "config:write",
  "config:read",
  "ai:manage",
  "ai:read",
  "audit:read",
  "billing:write",
  "billing:read",
  "prompt:manage",
  "crawler:manage",
  "system:monitor",
];

const knownPermissions = new Set<string>(PLATFORM_ADMIN_PERMISSIONS);
const platformAdminPrincipalBrand: unique symbol = Symbol("PlatformAdminPrincipal");

/**
 * A trusted server-side adapter must return this shape only after verifying the
 * credential/session and resolving the principal's active status and explicit
 * Platform Admin grants from an authoritative source.
 *
 * The adapter is responsible for cryptographic/session verification, issuer
 * and audience validation, expiry/revocation checks, and grant resolution.
 * Request fields such as actorRole, actorId, or permissions are never inputs.
 */
export interface VerifiedPlatformAdminIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly audience: string;
  readonly isActive: boolean;
  readonly grantedPermissions: readonly Permission[];
}

/**
 * Implementations must be trusted server-side identity adapters. Do not build
 * this adapter from request-body fields, Workspace sessions, or Workspace roles.
 */
export interface PlatformAdminIdentityProvider {
  authenticatePlatformAdmin(): Promise<VerifiedPlatformAdminIdentity | null>;
}

export type PlatformAdminPrincipal = Readonly<{
  issuer: string;
  subject: string;
  audience: string;
  grantedPermissions: readonly Permission[];
  [platformAdminPrincipalBrand]: true;
}>;

export type PlatformAdminAuthorizationErrorCode =
  | "PLATFORM_ADMIN_UNAUTHENTICATED"
  | "PLATFORM_ADMIN_FORBIDDEN";

export class PlatformAdminAuthorizationError extends Error {
  public readonly code: PlatformAdminAuthorizationErrorCode;

  public constructor(code: PlatformAdminAuthorizationErrorCode) {
    super(
      code === "PLATFORM_ADMIN_UNAUTHENTICATED"
        ? "A verified active Platform Admin identity is required."
        : "The Platform Admin principal lacks the required explicit permission.",
    );
    this.name = "PlatformAdminAuthorizationError";
    this.code = code;
  }
}

/**
 * Resolves an opaque Platform Admin principal from a trusted server adapter.
 * Missing adapters, invalid/inactive identities, and provider failures deny access.
 */
export async function resolvePlatformAdminPrincipal(
  provider?: PlatformAdminIdentityProvider | null,
): Promise<PlatformAdminPrincipal | null> {
  if (!provider) return null;

  try {
    const identity = await provider.authenticatePlatformAdmin();
    if (!identity || typeof identity !== "object") return null;

    const candidate = identity as unknown as Record<string, unknown>;
    const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(candidate, key);

    if (
      !hasOwn("issuer") ||
      !hasOwn("subject") ||
      !hasOwn("audience") ||
      !hasOwn("isActive") ||
      !hasOwn("grantedPermissions")
    ) {
      return null;
    }

    const { issuer, subject, audience, isActive, grantedPermissions } = candidate;
    const isNonEmptyString = (value: unknown): value is string =>
      typeof value === "string" && value.trim().length > 0;

    if (
      !isNonEmptyString(issuer) ||
      !isNonEmptyString(subject) ||
      !isNonEmptyString(audience) ||
      isActive !== true ||
      !Array.isArray(grantedPermissions) ||
      !grantedPermissions.every(
        (permission): permission is Permission =>
          typeof permission === "string" && knownPermissions.has(permission),
      )
    ) {
      return null;
    }

    const principal: PlatformAdminPrincipal = {
      issuer: issuer.trim(),
      subject: subject.trim(),
      audience: audience.trim(),
      grantedPermissions: Object.freeze([...new Set(grantedPermissions)]),
      [platformAdminPrincipalBrand]: true,
    };

    return Object.freeze(principal);
  } catch {
    // Identity-provider errors must never turn into an authorization success.
    return null;
  }
}

export class PlatformAdminAuthorizationGuard {
  public static async requireAuthenticatedPrincipal(
    provider?: PlatformAdminIdentityProvider | null,
  ): Promise<PlatformAdminPrincipal> {
    const principal = await resolvePlatformAdminPrincipal(provider);
    if (!principal) {
      throw new PlatformAdminAuthorizationError("PLATFORM_ADMIN_UNAUTHENTICATED");
    }
    return principal;
  }

  /**
   * Checks exact permission grants only. No role hierarchy or wildcard inheritance.
   */
  public static async requirePermission(
    provider: PlatformAdminIdentityProvider | null | undefined,
    requiredPermission: Permission,
  ): Promise<PlatformAdminPrincipal> {
    const principal = await this.requireAuthenticatedPrincipal(provider);
    if (!principal.grantedPermissions.includes(requiredPermission)) {
      throw new PlatformAdminAuthorizationError("PLATFORM_ADMIN_FORBIDDEN");
    }
    return principal;
  }
}
