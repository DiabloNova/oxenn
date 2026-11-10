import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({
  getPlatformAdminPool: vi.fn(),
}));
const poolMock = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../../../../src/features/admin/security/platform-admin-database.server", () => databaseMock);

import {
  consumePlatformAdminAuthRateLimit,
  findActivePlatformAdminIdentity,
  findPlatformAdminSessionIdentity,
  hashPlatformAdminAuditSubject,
  hashPlatformAdminRateLimitKey,
  revokePlatformAdminSession,
} from "../../../../src/features/admin/security/platform-admin-store.server";

describe("Platform Admin persistence boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMock.getPlatformAdminPool.mockReturnValue(poolMock);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("stores only a one-way hash of rate-limit keys and enforces the configured threshold", async () => {
    poolMock.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ attemptCount: 10 }], rowCount: 1 });

    vi.stubEnv("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET", "a-test-transaction-secret-with-more-than-32-characters");
    const allowed = await consumePlatformAdminAuthRateLimit({
      keyHash: hashPlatformAdminRateLimitKey("login:203.0.113.10"),
      maxAttempts: 10,
      windowSeconds: 900,
    });

    expect(allowed).toBe(true);
    expect(poolMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("ON CONFLICT (key_hash) DO UPDATE"),
      [hashPlatformAdminRateLimitKey("login:203.0.113.10"), 900],
    );
    expect(poolMock.query.mock.calls[1]?.[1]).not.toContain("203.0.113.10");
  });

  it("keeps audit pseudonyms stable when the OIDC transaction secret rotates", () => {
    vi.stubEnv("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET", "transaction-secret-version-one-long-enough");
    vi.stubEnv("PLATFORM_ADMIN_AUDIT_SUBJECT_SECRET", "separate-audit-subject-secret-long-enough");
    vi.stubEnv("PLATFORM_ADMIN_AUDIT_SUBJECT_KEY_VERSION", "v1");
    const first = hashPlatformAdminAuditSubject("https://identity.example.test", "immutable-subject");

    vi.stubEnv("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET", "transaction-secret-version-two-long-enough");
    const afterTransactionSecretRotation = hashPlatformAdminAuditSubject(
      "https://identity.example.test",
      "immutable-subject",
    );

    expect(first).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(afterTransactionSecretRotation).toBe(first);
    expect(first).not.toBe(hashPlatformAdminAuditSubject("https://other.example.test", "immutable-subject"));
    expect(first).not.toContain("immutable-subject");
  });

  it("rejects attempts above the rate-limit threshold", async () => {
    vi.stubEnv("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET", "a-test-transaction-secret-with-more-than-32-characters");
    poolMock.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ attemptCount: 11 }], rowCount: 1 });

    await expect(
      consumePlatformAdminAuthRateLimit({
        keyHash: hashPlatformAdminRateLimitKey("callback:203.0.113.10"),
        maxAttempts: 10,
        windowSeconds: 900,
      }),
    ).resolves.toBe(false);
  });

  it("resolves an active OIDC identity without depending on a session row", async () => {
    poolMock.query.mockResolvedValueOnce({
      rows: [{
        identityId: "identity-id",
        accountId: "account-id",
        issuer: "https://identity.example.test",
        subject: "immutable-subject",
        grantedPermissions: ["tenant:read"],
      }],
      rowCount: 1,
    });

    const result = await findActivePlatformAdminIdentity(
      "https://identity.example.test",
      "immutable-subject",
    );

    expect(result?.identityId).toBe("identity-id");
    expect(result?.grantedPermissions).toEqual(["tenant:read"]);
    const query = String(poolMock.query.mock.calls[0]?.[0]);
    expect(query).toContain("FROM platform_admin_external_identities AS external_identity");
    expect(query).toContain("external_identity.issuer = $1");
    expect(query).toContain("external_identity.subject = $2");
    expect(query).not.toContain("admin_session");
    expect(query).not.toContain("platform_admin_sessions");
  });

  it("binds session lookups to the current issuer and audience", async () => {
    poolMock.query
      .mockResolvedValueOnce({
        rows: [{
          identityId: "identity-id",
          accountId: "account-id",
          audience: "platform-admin-client",
          issuer: "https://identity.example.test",
          subject: "immutable-subject",
          grantedPermissions: ["tenant:read"],
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await findPlatformAdminSessionIdentity(
      "a".repeat(64),
      "https://identity.example.test",
      "platform-admin-client",
    );

    expect(result?.audience).toBe("platform-admin-client");
    expect(poolMock.query.mock.calls[0]?.[0]).toContain("external_identity.issuer = $2");
    expect(poolMock.query.mock.calls[0]?.[0]).toContain("admin_session.audience = $3");
    expect(poolMock.query.mock.calls[0]?.[1]).toEqual([
      "a".repeat(64),
      "https://identity.example.test",
      "platform-admin-client",
    ]);
  });

  it("revokes sessions and writes a corresponding audit event atomically", async () => {
    poolMock.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await revokePlatformAdminSession("b".repeat(64));

    expect(poolMock.query).toHaveBeenCalledWith(
      expect.stringContaining("platform_admin.logout"),
      ["b".repeat(64)],
    );
  });
});
