import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const oidcMock = vi.hoisted(() => ({
  discovery: vi.fn(),
  enableNonRepudiationChecks: vi.fn(),
  ClientSecretBasic: vi.fn(() => ({ method: "client_secret_basic" })),
  randomState: vi.fn(() => "state-value"),
  randomNonce: vi.fn(() => "nonce-value"),
  randomPKCECodeVerifier: vi.fn(() => "code-verifier-value"),
  calculatePKCECodeChallenge: vi.fn(async () => "code-challenge-value"),
  buildAuthorizationUrl: vi.fn(() => new URL("https://identity.example.test/authorize")),
  authorizationCodeGrant: vi.fn(),
}));

const storeMock = vi.hoisted(() => ({
  consumePlatformAdminOidcTransaction: vi.fn(),
  createPlatformAdminOidcTransaction: vi.fn(),
  createPlatformAdminSession: vi.fn(),
  findActivePlatformAdminIdentity: vi.fn(),
  findPlatformAdminSessionIdentity: vi.fn(),
  hashPlatformAdminSecret: vi.fn((value: string) => `sha256:${value}`),
  hashPlatformAdminAuditSubject: vi.fn((issuer: string, subject: string) => `audit:${issuer}:${subject}`),
  recordPlatformAdminAuditEvent: vi.fn(),
  revokePlatformAdminSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("openid-client", () => oidcMock);
vi.mock("../../../../src/features/admin/security/platform-admin-store.server", () => storeMock);

import {
  authenticatePlatformAdminSession,
  completePlatformAdminOidcLogin,
  isPlatformAdminOidcConfigured,
  startPlatformAdminOidcLogin,
} from "../../../../src/features/admin/security/platform-admin-oidc.server";

const createIdToken = (alg = "RS256") =>
  `${Buffer.from(JSON.stringify({ alg, typ: "JWT" })).toString("base64url")}.${randomBytes(12).toString("base64url")}.${randomBytes(16).toString("base64url")}`;

const configuredMetadata = () => ({
  issuer: "https://identity.example.test",
  authorization_endpoint: "https://identity.example.test/authorize",
  token_endpoint: "https://identity.example.test/token",
  jwks_uri: "https://identity.example.test/jwks",
  token_endpoint_auth_methods_supported: ["client_secret_basic"],
  response_types_supported: ["code"],
  code_challenge_methods_supported: ["S256"],
  id_token_signing_alg_values_supported: ["RS256"],
});

const activeIdentity = {
  identityId: "identity-id",
  accountId: "account-id",
  issuer: "https://identity.example.test",
  subject: "immutable-subject",
  grantedPermissions: ["tenant:read"],
};

let clientId = 0;

function configureEnvironment(): void {
  clientId += 1;
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", "postgresql://workspace:secret@localhost:5432/oxenn");
  vi.stubEnv("PLATFORM_ADMIN_DATABASE_URL", "postgresql://platform:secret@localhost:5432/oxenn_platform_admin");
  vi.stubEnv("PLATFORM_ADMIN_OIDC_ISSUER", "https://identity.example.test");
  vi.stubEnv("PLATFORM_ADMIN_OIDC_CLIENT_ID", `platform-admin-client-${clientId}`);
  vi.stubEnv("PLATFORM_ADMIN_OIDC_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv(
    "PLATFORM_ADMIN_OIDC_REDIRECT_URI",
    "https://app.example.test/api/platform-admin/auth/callback",
  );
  vi.stubEnv("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET", "a-test-transaction-secret-with-more-than-32-characters");
  vi.stubEnv("PLATFORM_ADMIN_AUDIT_SUBJECT_SECRET", "a-separate-audit-subject-secret-with-more-than-32-characters");
  vi.stubEnv("PLATFORM_ADMIN_AUDIT_SUBJECT_KEY_VERSION", "v1");
}

describe("Platform Admin OIDC control plane", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.clearAllMocks();
    configureEnvironment();
    oidcMock.discovery.mockResolvedValue({ serverMetadata: () => configuredMetadata() });
    storeMock.createPlatformAdminOidcTransaction.mockResolvedValue(undefined);
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue(null);
    storeMock.findActivePlatformAdminIdentity.mockResolvedValue(activeIdentity);
    storeMock.createPlatformAdminSession.mockResolvedValue(undefined);
    storeMock.recordPlatformAdminAuditEvent.mockResolvedValue(undefined);
    oidcMock.authorizationCodeGrant.mockResolvedValue({
      id_token: createIdToken(),
      claims: () => ({
        iss: "https://identity.example.test",
        sub: "immutable-subject",
        aud: process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
        nonce: "nonce-value",
        amr: ["mfa"],
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
      }),
    });
  });

  it("requires a complete OIDC configuration and a dedicated database URL", () => {
    expect(isPlatformAdminOidcConfigured()).toBe(true);
    vi.stubEnv("PLATFORM_ADMIN_OIDC_CLIENT_SECRET", "");
    expect(isPlatformAdminOidcConfigured()).toBe(false);
  });

  it("enables cryptographic ID-token signature verification on the discovered configuration", async () => {
    const configuration = { serverMetadata: () => configuredMetadata() };
    oidcMock.discovery.mockResolvedValue(configuration);

    await startPlatformAdminOidcLogin();

    expect(oidcMock.enableNonRepudiationChecks).toHaveBeenCalledWith(configuration);
  });

  it("starts Authorization Code flow with state, nonce, PKCE S256 and a browser binding", async () => {
    const result = await startPlatformAdminOidcLogin();

    expect(result.authorizationUrl.href).toBe("https://identity.example.test/authorize");
    expect(result.browserBinding).toHaveLength(43);
    expect(oidcMock.buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        response_type: "code",
        state: "state-value",
        nonce: "nonce-value",
        code_challenge: "code-challenge-value",
        code_challenge_method: "S256",
      }),
    );

    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    expect(transaction.stateHash).toBe("sha256:state-value");
    expect(transaction.browserBindingHash).toBe(`sha256:${result.browserBinding}`);
    expect(transaction.codeVerifierCiphertext).not.toContain("code-verifier-value");
    expect(transaction.redirectUri).toBe(process.env.PLATFORM_ADMIN_OIDC_REDIRECT_URI);
  });

  it("consumes a browser-bound transaction, validates OIDC claims and creates a DB session", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: transaction.codeVerifierCiphertext,
      redirectUri: transaction.redirectUri,
    });

    const callback = new URL(
      "https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code",
    );
    const result = await completePlatformAdminOidcLogin(callback, login.browserBinding);

    expect(oidcMock.authorizationCodeGrant).toHaveBeenCalledWith(
      expect.anything(),
      callback,
      expect.objectContaining({
        expectedState: "state-value",
        expectedNonce: "nonce-value",
        pkceCodeVerifier: "code-verifier-value",
      }),
    );
    expect(storeMock.findActivePlatformAdminIdentity).toHaveBeenCalledWith(
      "https://identity.example.test",
      "immutable-subject",
    );
    expect(storeMock.hashPlatformAdminAuditSubject).toHaveBeenCalledWith(
      "https://identity.example.test",
      "immutable-subject",
    );
    expect(storeMock.createPlatformAdminSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account-id",
        identityId: "identity-id",
        audience: process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
        auditSubject: "audit:https://identity.example.test:immutable-subject",
        auditIssuer: "https://identity.example.test",
      }),
    );
    expect(result.sessionToken).toHaveLength(43);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects an ID token whose protected header does not explicitly use RS256", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: transaction.codeVerifierCiphertext,
      redirectUri: transaction.redirectUri,
    });
    oidcMock.authorizationCodeGrant.mockResolvedValue({
      id_token: createIdToken("ES256"),
      claims: () => ({
        iss: "https://identity.example.test",
        sub: "immutable-subject",
        aud: process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
        nonce: "nonce-value",
        amr: ["mfa"],
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
      }),
    });

    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code"),
        login.browserBinding,
      ),
    ).rejects.toThrow("must use RS256");
    expect(storeMock.findActivePlatformAdminIdentity).not.toHaveBeenCalled();
    expect(storeMock.createPlatformAdminSession).not.toHaveBeenCalled();
  });

  it("binds existing sessions to the currently configured issuer and audience", async () => {
    storeMock.findPlatformAdminSessionIdentity.mockResolvedValue({
      ...activeIdentity,
      audience: process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
    });

    const result = await authenticatePlatformAdminSession(
      "opaque-session-token",
      "https://identity.example.test",
      process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID!,
    );

    expect(storeMock.findPlatformAdminSessionIdentity).toHaveBeenCalledWith(
      "sha256:opaque-session-token",
      "https://identity.example.test",
      process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
    );
    expect(result?.subject).toBe("immutable-subject");
  });

  it("rejects a callback from a different origin before consuming the transaction", async () => {
    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://attacker.example.test/api/platform-admin/auth/callback?state=state-value&code=code"),
        "browser-binding",
      ),
    ).rejects.toThrow("does not match the configured redirect URI");
    expect(storeMock.consumePlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });

  it("rejects callbacks without the browser binding", async () => {
    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=code"),
        null,
      ),
    ).rejects.toThrow("missing its browser-bound state");
    expect(storeMock.consumePlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });

  it("rejects an ID token without the required MFA authentication method", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: transaction.codeVerifierCiphertext,
      redirectUri: transaction.redirectUri,
    });
    oidcMock.authorizationCodeGrant.mockResolvedValue({
      id_token: createIdToken(),
      claims: () => ({
        iss: "https://identity.example.test",
        sub: "immutable-subject",
        aud: process.env.PLATFORM_ADMIN_OIDC_CLIENT_ID,
        nonce: "nonce-value",
        amr: ["pwd"],
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
      }),
    });

    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code"),
        login.browserBinding,
      ),
    ).rejects.toThrow("does not satisfy the Platform Admin identity contract");
    expect(storeMock.createPlatformAdminSession).not.toHaveBeenCalled();
  });

  it("fails closed when the verified OIDC subject has no active explicit Platform Admin account", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: transaction.codeVerifierCiphertext,
      redirectUri: transaction.redirectUri,
    });
    storeMock.findActivePlatformAdminIdentity.mockResolvedValue(null);

    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code"),
        login.browserBinding,
      ),
    ).rejects.toMatchObject({
      name: "PlatformAdminOidcDeniedError",
      auditSubject: "audit:https://identity.example.test:immutable-subject",
      auditDetails: {
        reason: "identity_not_provisioned_or_inactive",
        issuer: "https://identity.example.test",
      },
    });
    expect(storeMock.createPlatformAdminSession).not.toHaveBeenCalled();
    expect(storeMock.recordPlatformAdminAuditEvent).not.toHaveBeenCalled();
  });

  it("rejects a tampered encrypted PKCE verifier before attempting token exchange", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    const parts = transaction.codeVerifierCiphertext.split(".");
    parts[1] = `${parts[1].startsWith("A") ? "B" : "A"}${parts[1].slice(1)}`;
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: parts.join("."),
      redirectUri: transaction.redirectUri,
    });

    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code"),
        login.browserBinding,
      ),
    ).rejects.toThrow();
    expect(oidcMock.authorizationCodeGrant).not.toHaveBeenCalled();
    expect(storeMock.createPlatformAdminSession).not.toHaveBeenCalled();
  });

  it("rejects an OIDC discovery document whose issuer differs from the configured issuer", async () => {
    oidcMock.discovery.mockResolvedValue({
      serverMetadata: () => ({ ...configuredMetadata(), issuer: "https://untrusted.example.test" }),
    });

    await expect(startPlatformAdminOidcLogin()).rejects.toThrow("does not match the configured issuer");
    expect(storeMock.createPlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });

  it("rejects an ID token audience mismatch before creating a session", async () => {
    const login = await startPlatformAdminOidcLogin();
    const transaction = storeMock.createPlatformAdminOidcTransaction.mock.calls[0]?.[0];
    storeMock.consumePlatformAdminOidcTransaction.mockResolvedValue({
      nonce: "nonce-value",
      codeVerifierCiphertext: transaction.codeVerifierCiphertext,
      redirectUri: transaction.redirectUri,
    });
    oidcMock.authorizationCodeGrant.mockResolvedValue({
      id_token: createIdToken(),
      claims: () => ({
        iss: "https://identity.example.test",
        sub: "immutable-subject",
        aud: "different-client",
        nonce: "nonce-value",
        amr: ["mfa"],
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
      }),
    });

    await expect(
      completePlatformAdminOidcLogin(
        new URL("https://app.example.test/api/platform-admin/auth/callback?state=state-value&code=authorization-code"),
        login.browserBinding,
      ),
    ).rejects.toThrow("does not satisfy the Platform Admin identity contract");
    expect(storeMock.createPlatformAdminSession).not.toHaveBeenCalled();
  });

  it("rejects providers that do not advertise RS256 ID-token signatures", async () => {
    oidcMock.discovery.mockResolvedValue({
      serverMetadata: () => ({ ...configuredMetadata(), id_token_signing_alg_values_supported: ["ES256"] }),
    });

    await expect(startPlatformAdminOidcLogin()).rejects.toThrow("does not advertise RS256 ID-token signatures");
    expect(storeMock.createPlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });

  it("rejects OIDC discovery endpoints that do not use HTTPS", async () => {
    oidcMock.discovery.mockResolvedValue({
      serverMetadata: () => ({ ...configuredMetadata(), jwks_uri: "http://identity.example.test/jwks" }),
    });

    await expect(startPlatformAdminOidcLogin()).rejects.toThrow("must use HTTPS outside local development");
    expect(storeMock.createPlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });

  it("rejects an OIDC provider that does not advertise PKCE S256", async () => {
    oidcMock.discovery.mockResolvedValue({
      serverMetadata: () => ({ ...configuredMetadata(), code_challenge_methods_supported: ["plain"] }),
    });

    await expect(startPlatformAdminOidcLogin()).rejects.toThrow("must advertise PKCE S256 support");
    expect(storeMock.createPlatformAdminOidcTransaction).not.toHaveBeenCalled();
  });
});
