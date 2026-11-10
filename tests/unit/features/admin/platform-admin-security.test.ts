import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PlatformAdminAuthorizationError,
  PlatformAdminAuthorizationGuard,
  resolvePlatformAdminPrincipal,
  type PlatformAdminIdentityProvider,
  type VerifiedPlatformAdminIdentity,
} from "../../../../src/features/admin/security/platform-admin.server";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies access when no independent identity provider is configured", async () => {
    await expect(resolvePlatformAdminPrincipal()).resolves.toBeNull();
    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(),
    ).rejects.toMatchObject({
      name: "PlatformAdminAuthorizationError",
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
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

    await expect(
      resolvePlatformAdminPrincipal(workspaceOnlyProvider),
    ).resolves.toBeNull();
    await expect(
      PlatformAdminAuthorizationGuard.requirePermission(
        workspaceOnlyProvider,
        "tenant:write",
      ),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("rejects inactive principals even when they claim a privileged grant", async () => {
    const provider = providerFor(
      verifiedIdentity({ isActive: false, grantedPermissions: ["tenant:write"] }),
    );

    await expect(
      PlatformAdminAuthorizationGuard.requirePermission(provider, "tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it.each([
    ["missing issuer", { issuer: "" }],
    ["missing subject", { subject: "  " }],
    ["missing audience", { audience: "" }],
  ])("rejects an identity with %s", async (_case, overrides) => {
    const provider = providerFor(verifiedIdentity(overrides));

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(provider),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("fails closed when the trusted identity provider throws", async () => {
    const provider: PlatformAdminIdentityProvider = {
      authenticatePlatformAdmin: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    };

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(provider),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("allows only an explicit permission returned by the trusted provider", async () => {
    const provider = providerFor(
      verifiedIdentity({ grantedPermissions: ["tenant:read"] }),
    );

    const principal = await PlatformAdminAuthorizationGuard.requirePermission(
      provider,
      "tenant:read",
    );

    expect(principal.subject).toBe("platform-admin-123");
    expect(principal.grantedPermissions).toEqual(["tenant:read"]);
    expect(Object.isFrozen(principal)).toBe(true);
    expect(Object.isFrozen(principal.grantedPermissions)).toBe(true);
  });

  it("does not inherit permissions from a privileged role name", async () => {
    const provider = {
      authenticatePlatformAdmin: vi.fn().mockResolvedValue({
        ...verifiedIdentity({ grantedPermissions: [] }),
        role: "Super Admin",
      }),
    } as unknown as PlatformAdminIdentityProvider;

    await expect(
      PlatformAdminAuthorizationGuard.requirePermission(provider, "tenant:write"),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_FORBIDDEN",
    });
  });

  it("rejects unknown permission values rather than accepting wildcard-like grants", async () => {
    const provider = {
      authenticatePlatformAdmin: vi.fn().mockResolvedValue({
        ...verifiedIdentity(),
        grantedPermissions: ["*"],
      }),
    } as unknown as PlatformAdminIdentityProvider;

    await expect(
      PlatformAdminAuthorizationGuard.requireAuthenticatedPrincipal(provider),
    ).rejects.toMatchObject({
      code: "PLATFORM_ADMIN_UNAUTHENTICATED",
    });
  });

  it("does not expose a mutable permission list to downstream callers", async () => {
    const provider = providerFor(
      verifiedIdentity({ grantedPermissions: ["tenant:read", "tenant:read"] }),
    );
    const principal = await resolvePlatformAdminPrincipal(provider);

    expect(principal?.grantedPermissions).toEqual(["tenant:read"]);
    expect(() => {
      (principal?.grantedPermissions as string[]).push("tenant:write");
    }).toThrow();
  });
});
