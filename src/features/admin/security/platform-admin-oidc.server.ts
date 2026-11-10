import "server-only";

import * as oidc from "openid-client";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { assertDedicatedPlatformAdminDatabaseUrl } from "./platform-admin-database-guard";
import {
  consumePlatformAdminOidcTransaction,
  createPlatformAdminOidcTransaction,
  createPlatformAdminSession,
  findActivePlatformAdminIdentity,
  findPlatformAdminSessionIdentity,
  hashPlatformAdminSecret,
  recordPlatformAdminAuditEvent,
  revokePlatformAdminSession,
} from "./platform-admin-store.server";

export const PLATFORM_ADMIN_SESSION_COOKIE = "__Host-platform_admin_session";
export const PLATFORM_ADMIN_OIDC_BINDING_COOKIE = "__Host-platform_admin_oidc";
const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

interface PlatformAdminOidcSettings {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  transactionSecret: string;
  signingAlgorithm: "RS256" | "ES256";
  acceptedMfaAmrValues: string[];
  requiredAcrValues: string[];
}

let cachedConfiguration: {
  cacheKey: string;
  value: Promise<oidc.Configuration>;
} | null = null;

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parseTrustedHttpsUrl(value: string, name: string): URL {
  const url = new URL(value);
  const localDevelopmentHost =
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1");

  if (url.protocol !== "https:" && !(localDevelopmentHost && url.protocol === "http:")) {
    throw new Error(`${name} must use HTTPS outside local development.`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must not contain credentials, a query, or a fragment.`);
  }
  return url;
}

function getSettings(): PlatformAdminOidcSettings {
  const issuer = requiredEnvironmentValue("PLATFORM_ADMIN_OIDC_ISSUER");
  const clientId = requiredEnvironmentValue("PLATFORM_ADMIN_OIDC_CLIENT_ID");
  const clientSecret = requiredEnvironmentValue("PLATFORM_ADMIN_OIDC_CLIENT_SECRET");
  const redirectUri = requiredEnvironmentValue("PLATFORM_ADMIN_OIDC_REDIRECT_URI");
  const transactionSecret = requiredEnvironmentValue("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET");
  const signingAlgorithm = process.env.PLATFORM_ADMIN_OIDC_ID_TOKEN_SIGNING_ALG?.trim() || "RS256";
  if (signingAlgorithm !== "RS256" && signingAlgorithm !== "ES256") {
    throw new Error("PLATFORM_ADMIN_OIDC_ID_TOKEN_SIGNING_ALG must be RS256 or ES256.");
  }
  const acceptedMfaAmrValues = (
    process.env.PLATFORM_ADMIN_OIDC_MFA_AMR_VALUES ?? "mfa"
  ).split(",").map((value) => value.trim()).filter(Boolean);
  const requiredAcrValues = (process.env.PLATFORM_ADMIN_OIDC_REQUIRED_ACR_VALUES ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (acceptedMfaAmrValues.length === 0) {
    throw new Error("At least one Platform Admin MFA AMR value must be configured.");
  }

  parseTrustedHttpsUrl(issuer, "PLATFORM_ADMIN_OIDC_ISSUER");
  parseTrustedHttpsUrl(redirectUri, "PLATFORM_ADMIN_OIDC_REDIRECT_URI");
  if (transactionSecret.length < 32) {
    throw new Error("PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET must contain at least 32 characters.");
  }

  return {
    issuer,
    clientId,
    clientSecret,
    redirectUri,
    transactionSecret,
    signingAlgorithm,
    acceptedMfaAmrValues,
    requiredAcrValues,
  };
}

export function isPlatformAdminOidcConfigured(): boolean {
  try {
    getSettings();
    assertDedicatedPlatformAdminDatabaseUrl(
      requiredEnvironmentValue("PLATFORM_ADMIN_DATABASE_URL"),
    );
    return true;
  } catch {
    return false;
  }
}

async function getOidcConfiguration(
  settings: PlatformAdminOidcSettings,
): Promise<oidc.Configuration> {
  const cacheKey = createHash("sha256")
    .update(`${settings.issuer}\0${settings.clientId}\0${settings.clientSecret}\0${settings.redirectUri}\0${settings.signingAlgorithm}`)
    .digest("hex");

  if (cachedConfiguration?.cacheKey === cacheKey) {
    return cachedConfiguration.value;
  }

  const value = oidc.discovery(
    new URL(settings.issuer),
    settings.clientId,
    {
      redirect_uris: [settings.redirectUri],
      token_endpoint_auth_method: "client_secret_basic",
      id_token_signed_response_alg: settings.signingAlgorithm,
    },
    oidc.ClientSecretBasic(settings.clientSecret),
  ).then((configuration) => {
    const metadata = configuration.serverMetadata();
    if (metadata.issuer !== settings.issuer) {
      throw new Error("The discovered OIDC issuer does not match the configured issuer.");
    }
    for (const [name, endpoint] of [
      ["authorization_endpoint", metadata.authorization_endpoint],
      ["token_endpoint", metadata.token_endpoint],
      ["jwks_uri", metadata.jwks_uri],
    ] as const) {
      if (!endpoint) throw new Error(`The OIDC provider discovery document is missing ${name}.`);
      parseTrustedHttpsUrl(endpoint, `OIDC ${name}`);
    }
    if (!metadata.response_types_supported?.includes("code")) {
      throw new Error("The OIDC provider does not advertise the authorization code response type.");
    }
    if (!metadata.code_challenge_methods_supported?.includes("S256")) {
      throw new Error("The OIDC provider must advertise PKCE S256 support.");
    }
    if (!metadata.id_token_signing_alg_values_supported?.includes(settings.signingAlgorithm)) {
      throw new Error("The OIDC provider does not advertise the configured ID token signing algorithm.");
    }
    if (
      metadata.token_endpoint_auth_methods_supported &&
      !metadata.token_endpoint_auth_methods_supported.includes("client_secret_basic")
    ) {
      throw new Error("The OIDC provider does not advertise client_secret_basic token endpoint authentication.");
    }
    return configuration;
  });

  cachedConfiguration = { cacheKey, value };
  try {
    return await value;
  } catch (error) {
    if (cachedConfiguration?.cacheKey === cacheKey) cachedConfiguration = null;
    throw error;
  }
}

function encryptCodeVerifier(value: string, secret: string): string {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

function decryptCodeVerifier(value: string, secret: string): string {
  const [ivPart, tagPart, ciphertextPart, extra] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart || extra) {
    throw new Error("The stored OIDC transaction is invalid.");
  }

  const key = createHash("sha256").update(secret).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function sessionTtlSeconds(): number {
  const configured = process.env.PLATFORM_ADMIN_SESSION_TTL_SECONDS;
  if (!configured) return DEFAULT_SESSION_TTL_SECONDS;
  const value = Number(configured);
  if (!Number.isInteger(value) || value < 300 || value > 86_400) {
    throw new Error("PLATFORM_ADMIN_SESSION_TTL_SECONDS must be an integer between 300 and 86400.");
  }
  return value;
}

export async function startPlatformAdminOidcLogin(): Promise<{
  authorizationUrl: URL;
  browserBinding: string;
}> {
  const settings = getSettings();
  const configuration = await getOidcConfiguration(settings);
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const browserBinding = randomBytes(32).toString("base64url");

  await createPlatformAdminOidcTransaction({
    stateHash: hashPlatformAdminSecret(state),
    nonce,
    codeVerifierCiphertext: encryptCodeVerifier(codeVerifier, settings.transactionSecret),
    browserBindingHash: hashPlatformAdminSecret(browserBinding),
    redirectUri: settings.redirectUri,
    expiresAt: new Date(Date.now() + OIDC_TRANSACTION_TTL_MS),
  });

  const authorizationUrl = oidc.buildAuthorizationUrl(configuration, {
    response_type: "code",
    redirect_uri: settings.redirectUri,
    scope: "openid profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login",
    ...(settings.requiredAcrValues.length > 0
      ? { acr_values: settings.requiredAcrValues.join(" ") }
      : {}),
  });

  return { authorizationUrl, browserBinding };
}

export async function completePlatformAdminOidcLogin(
  callbackUrl: URL,
  browserBinding: string | null,
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const settings = getSettings();
  const expectedRedirect = new URL(settings.redirectUri);
  if (
    callbackUrl.origin !== expectedRedirect.origin ||
    callbackUrl.pathname !== expectedRedirect.pathname
  ) {
    throw new Error("The OIDC callback URL does not match the configured redirect URI.");
  }

  const state = callbackUrl.searchParams.get("state");
  if (!state || !browserBinding) {
    throw new Error("The OIDC callback is missing its browser-bound state.");
  }

  const transaction = await consumePlatformAdminOidcTransaction(
    hashPlatformAdminSecret(state),
    hashPlatformAdminSecret(browserBinding),
  );
  if (!transaction || transaction.redirectUri !== settings.redirectUri) {
    throw new Error("The OIDC transaction is invalid, expired, or already consumed.");
  }
  if (callbackUrl.searchParams.has("error")) {
    throw new Error("The OIDC provider rejected the authentication request.");
  }
  if (!callbackUrl.searchParams.get("code")) {
    throw new Error("The OIDC callback did not contain an authorization code.");
  }

  const configuration = await getOidcConfiguration(settings);
  const tokens = await oidc.authorizationCodeGrant(configuration, callbackUrl, {
    expectedState: state,
    expectedNonce: transaction.nonce,
    pkceCodeVerifier: decryptCodeVerifier(
      transaction.codeVerifierCiphertext,
      settings.transactionSecret,
    ),
  });
  const claims = tokens.claims();
  if (!claims) throw new Error("The OIDC token response did not contain validated ID token claims.");
  const audiences =
    typeof claims.aud === "string"
      ? [claims.aud]
      : Array.isArray(claims.aud)
        ? claims.aud
        : [];
  const amrValues = Array.isArray(claims.amr) ? claims.amr : [];
  const acrValue = typeof claims.acr === "string" ? claims.acr : "";
  const mfaVerified =
    settings.acceptedMfaAmrValues.some((value) => amrValues.includes(value)) &&
    (settings.requiredAcrValues.length === 0 || settings.requiredAcrValues.includes(acrValue));

  if (
    !mfaVerified ||
    claims.iss !== settings.issuer ||
    typeof claims.sub !== "string" ||
    !claims.sub.trim() ||
    !audiences.includes(settings.clientId) ||
    (audiences.length > 1 && claims.azp !== settings.clientId) ||
    claims.nonce !== transaction.nonce ||
    typeof claims.exp !== "number" ||
    claims.exp <= Math.floor(Date.now() / 1000) ||
    typeof claims.iat !== "number" ||
    claims.iat > Math.floor(Date.now() / 1000) + 60
  ) {
    throw new Error("The validated OIDC ID token does not satisfy the Platform Admin identity contract.");
  }

  const identity = await findActivePlatformAdminIdentity(settings.issuer, claims.sub);
  if (!identity) {
    await recordPlatformAdminAuditEvent({
      eventType: "platform_admin.login",
      outcome: "denied",
      subject: claims.sub,
      details: { reason: "identity_not_provisioned_or_inactive", issuer: settings.issuer },
    });
    throw new Error("The verified external identity is not provisioned as an active Platform Admin.");
  }

  const sessionToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionTtlSeconds() * 1000);
  await createPlatformAdminSession({
    accountId: identity.accountId,
    identityId: identity.identityId,
    audience: settings.clientId,
    tokenHash: hashPlatformAdminSecret(sessionToken),
    expiresAt,
  });

  return { sessionToken, expiresAt };
}

export async function authenticatePlatformAdminSession(
  sessionToken: string,
  expectedIssuer: string,
  expectedAudience: string,
): Promise<{
  issuer: string;
  subject: string;
  grantedPermissions: string[];
} | null> {
  const identity = await findPlatformAdminSessionIdentity(
    hashPlatformAdminSecret(sessionToken),
    expectedIssuer,
    expectedAudience,
  );
  if (!identity) return null;

  return {
    issuer: identity.issuer,
    subject: identity.subject,
    grantedPermissions: identity.grantedPermissions,
  };
}

export async function logoutPlatformAdminSession(sessionToken: string): Promise<void> {
  await revokePlatformAdminSession(hashPlatformAdminSecret(sessionToken));
}
