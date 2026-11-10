import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const providerModuleMock = vi.hoisted(() => ({
  getTrustedPlatformAdminIdentityProvider: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock(
  "../../../../src/features/admin/security/platform-admin-identity-provider.server",
  () => providerModuleMock,
);

import {
  PlatformAdminAuthorizationGuard,
  resolvePlatformAdminPrincipal,
  type PlatformAdminPrincipal,
} from "../../../../src/features/admin/security/platform-admin.server";
import type {
  PlatformAdminIdentityProvider,
  VerifiedPlatformAdminIdentity,
} from "../../../../src/features/admin/security/platform-admin-identity-provider.server";

const useTrustedProvider = (provider: PlatformAdminIdentityProvider | null) => {
  providerModuleMock.getTrustedPlatformAdminIdentityProvider.mockReturnValue(provider);
};

const verifiedIdentity = (
  overrides: Partial<VerifiedPlatformAdminIdentity> = {},
): VerifiedPlatformAdminIdentity => ({
  issuer: "https://identity.example.test",
  subject: "platform-admin-123",
  audience: "oxenn-platform-admin",
  isActive: true,
  grantedPermissions: ["tenant:read"],
  ...overrides,
});

const providerFor = (
  identity: VerifiedPlatformAdminIdentity | null,
): PlatformAdminIdentityProvider => ({
  authenticatePlatformAdmin: vi.fn().mockResolvedValue(identity),
});

describe("Platform Admin server-side authorization boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.clearAllMocks();
    for (const name of [
      "PLATFORM_ADMIN_DATABASE_URL",
      "PLATFORM_ADMIN_OIDC_ISSUER",
      "PLATFORM_ADMIN_OIDC_CLIENT_ID",
      "PLATFORM_ADMIN_OIDC_CLIENT_SECRET",
      "PLATFORM_ADMIN_OIDC_REDIRECT_URI",
      "PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET",
    ]) {
      vi.stubEnv(name, "");
    }
    useTrustedProvider(null);
  });

  it("keeps the Stage 1 trusted provider composition root unconfigured", async () => {
    const actualProviderModule = await vi.importActual<
      typeof import("../../../../src/features/admin/security/platform-admin-identity-provider.server")
    >("../../../../src/features/admin/security/platform-admin-identity-provider.server");

    expect(actualProviderModule.getTrustedPlatformAdminIdentityProvider()).toBeNull();
  });

  it("denies access when no trusted identity provider is configured", async () => {
    await expect(resolvePlatformAdminPrincipal()).resolves.toBeNull();
    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(),
    ).rejects.toMatchObject({
      name: "PlatformAdminAuthorizationError",
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("does not allow callers to inject a provider into resolver or guard methods", async () => {
    const attackerProvider = providerFor(
      verifiedIdentity({ grantedPermissions: ["tenant:write"] }),
    );
    const resolverWithExtraArguments = resolvePlatformAdminPrincipal as unknown as (
      ...args: unknown[]
    ) => Promise<PlatformAdminPrincipal | null>;
    const guardWithExtraArguments =
      PlatformAdminAuthorizationGuard.requirePermission.bind(
        PlatformAdminAuthorizationGuard,
      ) as (...args: unknown[]) => Promise<PlatformAdminPrincipal>;

    await expect(resolverWithExtraArguments(attackerProvider)).resolves.toBeNull();
    await expect(
      guardWithExtraArguments(attackerProvider, "tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
    expect(attackerProvider.authenticatePlatformAdmin).not.toHaveBeenCalled();
  });

  it("does not treat a Workspace or caller-supplied role as Platform Admin identity", async () => {
    const workspaceOnlyProvider = {
      authenticatePlatformAdmin: vi.fn().mockResolvedValue({
        actorId: "workspace-user",
        actorRole: "Super Admin",
        role: "Super Admin",
        permissions: ["tenant:write"],
      }),
    } as unknown as PlatformAdminIdentityProvider;
    useTrustedProvider(workspaceOnlyProvider);

    await expect(resolvePlatformAdminPrincipal()).resolves.toBeNull();
    await expect(
      PlatformAdminAuthorizationGuard.requirePermission("tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("rejects inactive principals even when they claim a privileged grant", async () => {
    useTrustedProvider(
      providerFor(
        verifiedIdentity({ isActive: false, grantedPermissions: ["tenant:write"] }),
      ),
    );

    await expect(
      PlatformAdminAuthorizationGuard.requirePermission("tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it.each([
    ["missing issuer", { issuer: "" }],
    ["missing subject", { subject: "  " }],
    ["missing audience", { audience: "" }],
  ])("rejects an identity with %s", async (_case, overrides) => {
    useTrustedProvider(providerFor(verifiedIdentity(overrides)));

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("fails closed when the trusted identity provider throws", async () => {
    useTrustedProvider({
      authenticatePlatformAdmin: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    });

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("allows only an explicit permission returned by the trusted provider", async () => {
    useTrustedProvider(
      providerFor(verifiedIdentity({ grantedPermissions: ["tenant:read"] })),
    );

    const principal = await PlatformAdminAuthorizationGuard.requirePermission("tenant:read");

    expect(principal.subject).toBe("platform-admin-123");
    expect(principal.grantedPermissions).toEqual(["tenant:read"]);
    expect(Object.isFrozen(principal)).toBe(true);
    expect(Object.isFrozen(principal.grantedPermissions)).toBe(true);
  });

  it("does not inherit permissions from a privileged role name", async () => {
    useTrustedProvider(
      providerFor({
        ...verifiedIdentity({ grantedPermissions: [] }),
        role: "Super Admin",
      } as unknown as VerifiedPlatformAdminIdentity),
    );

    await expect(
      PlatformAdminAuthorizationGuard.requirePermission("tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_FORBIDDEN",
    });
  });

  it("rejects unknown permission values rather than accepting wildcard-like grants", async () => {
    useTrustedProvider(
      providerFor({
        ...verifiedIdentity(),
        grantedPermissions: ["*"],
      } as unknown as VerifiedPlatformAdminIdentity),
    );

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("does not expose a mutable permission list to downstream callers", async () => {
    useTrustedProvider(
      providerFor(
        verifiedIdentity({ grantedPermissions: ["tenant:read", "tenant:read"] }),
      ),
    );
    const principal = await resolvePlatformAdminPrincipal();

    expect(principal?.grantedPermissions).toEqual(["tenant:read"]);
    expect(() => {
      (principal?.grantedPermissions as string[]).push("tenant:write");
    }).toThrow();
  });
});
