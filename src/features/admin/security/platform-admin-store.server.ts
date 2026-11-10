import "server-only";

import { createHash, createHmac } from "node:crypto";
import { getPlatformAdminPool } from "./platform-admin-database.server";

export interface StoredPlatformAdminIdentity {
  identityId: string;
  accountId: string;
  issuer: string;
  subject: string;
  grantedPermissions: string[];
}

export interface StoredPlatformAdminSessionIdentity extends StoredPlatformAdminIdentity {
  audience: string;
}

export interface StoredOidcTransaction {
  nonce: string;
  codeVerifierCiphertext: string;
  redirectUri: string;
}

export async function createPlatformAdminOidcTransaction(input: {
  stateHash: string;
  nonce: string;
  codeVerifierCiphertext: string;
  browserBindingHash: string;
  redirectUri: string;
  expiresAt: Date;
}): Promise<void> {
  const pool = getPlatformAdminPool();
  await pool.query("DELETE FROM platform_admin_oidc_transactions WHERE expires_at <= now()");
  await pool.query(
    `INSERT INTO platform_admin_oidc_transactions
      (state_hash, nonce, code_verifier_ciphertext, browser_binding_hash, redirect_uri, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.stateHash,
      input.nonce,
      input.codeVerifierCiphertext,
      input.browserBindingHash,
      input.redirectUri,
      input.expiresAt,
    ],
  );
}

export async function consumePlatformAdminOidcTransaction(
  stateHash: string,
  browserBindingHash: string,
): Promise<StoredOidcTransaction | null> {
  const result = await getPlatformAdminPool().query<StoredOidcTransaction>(
    `DELETE FROM platform_admin_oidc_transactions
     WHERE state_hash = $1
       AND browser_binding_hash = $2
       AND expires_at > now()
     RETURNING nonce, code_verifier_ciphertext AS "codeVerifierCiphertext",
               redirect_uri AS "redirectUri"`,
    [stateHash, browserBindingHash],
  );

  return result.rows[0] ?? null;
}

export async function findActivePlatformAdminIdentity(
  issuer: string,
  subject: string,
): Promise<StoredPlatformAdminIdentity | null> {
  const result = await getPlatformAdminPool().query<StoredPlatformAdminIdentity>(
    `SELECT external_identity.id AS "identityId",
            admin_account.id AS "accountId",
            external_identity.issuer,
            external_identity.subject,
            COALESCE(
              array_agg(DISTINCT grant_row.permission_key)
                FILTER (WHERE grant_row.permission_key IS NOT NULL),
              ARRAY[]::text[]
            ) AS "grantedPermissions"
     FROM platform_admin_external_identities AS external_identity
     INNER JOIN platform_admin_accounts AS admin_account
       ON admin_account.id = external_identity.account_id
     LEFT JOIN platform_admin_permission_grants AS grant_row
       ON grant_row.account_id = admin_account.id
      AND grant_row.revoked_at IS NULL
     WHERE external_identity.issuer = $1
       AND external_identity.subject = $2
       AND admin_account.status = 'active'
       AND admin_account.disabled_at IS NULL
     GROUP BY external_identity.id, admin_account.id, external_identity.issuer, external_identity.subject`,
    [issuer, subject],
  );

  return result.rows[0] ?? null;
}

export async function createPlatformAdminSession(input: {
  accountId: string;
  identityId: string;
  audience: string;
  tokenHash: string;
  expiresAt: Date;
  auditSubject: string;
  auditIssuer: string;
}): Promise<void> {
  const pool = getPlatformAdminPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO platform_admin_sessions
        (account_id, external_identity_id, audience, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.accountId, input.identityId, input.audience, input.tokenHash, input.expiresAt],
    );
    await client.query(
      `UPDATE platform_admin_external_identities
       SET last_authenticated_at = now()
       WHERE id = $1`,
      [input.identityId],
    );
    await client.query(
      `INSERT INTO platform_admin_audit_events
        (actor_account_id, event_type, outcome, subject, details)
       VALUES ($1, 'platform_admin.login', 'success', $2, $3::jsonb)`,
      [input.accountId, input.auditSubject, JSON.stringify({ issuer: input.auditIssuer })],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findPlatformAdminSessionIdentity(
  tokenHash: string,
  expectedIssuer: string,
  expectedAudience: string,
): Promise<StoredPlatformAdminSessionIdentity | null> {
  const result = await getPlatformAdminPool().query<StoredPlatformAdminSessionIdentity>(
    `SELECT external_identity.id AS "identityId",
            admin_account.id AS "accountId",
            admin_session.audience,
            external_identity.issuer,
            external_identity.subject,
            COALESCE(
              array_agg(DISTINCT grant_row.permission_key)
                FILTER (WHERE grant_row.permission_key IS NOT NULL),
              ARRAY[]::text[]
            ) AS "grantedPermissions"
     FROM platform_admin_sessions AS admin_session
     INNER JOIN platform_admin_accounts AS admin_account
       ON admin_account.id = admin_session.account_id
     INNER JOIN platform_admin_external_identities AS external_identity
       ON external_identity.id = admin_session.external_identity_id
      AND external_identity.account_id = admin_account.id
     LEFT JOIN platform_admin_permission_grants AS grant_row
       ON grant_row.account_id = admin_account.id
      AND grant_row.revoked_at IS NULL
     WHERE admin_session.token_hash = $1
       AND admin_session.revoked_at IS NULL
       AND admin_session.expires_at > now()
       AND external_identity.issuer = $2
       AND admin_session.audience = $3
       AND admin_account.status = 'active'
       AND admin_account.disabled_at IS NULL
     GROUP BY external_identity.id, admin_account.id, admin_session.audience,
              external_identity.issuer, external_identity.subject`,
    [tokenHash, expectedIssuer, expectedAudience],
  );

  if (!result.rows[0]) return null;

  await getPlatformAdminPool().query(
    `UPDATE platform_admin_sessions SET last_seen_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL
       AND last_seen_at < now() - interval '5 minutes'`,
    [tokenHash],
  );

  return result.rows[0];
}

export async function revokePlatformAdminSession(tokenHash: string): Promise<void> {
  await getPlatformAdminPool().query(
    `WITH revoked AS (
       UPDATE platform_admin_sessions
       SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL
       RETURNING account_id
     )
     INSERT INTO platform_admin_audit_events
       (actor_account_id, event_type, outcome, details)
     SELECT account_id, 'platform_admin.logout', 'success', '{}'::jsonb
     FROM revoked`,
    [tokenHash],
  );
}

export async function consumePlatformAdminAuthRateLimit(input: {
  keyHash: string;
  maxAttempts: number;
  windowSeconds: number;
}): Promise<boolean> {
  const pool = getPlatformAdminPool();
  await pool.query(
    "DELETE FROM platform_admin_auth_rate_limits WHERE expires_at <= now()",
  );
  const result = await pool.query<{ attemptCount: number }>(
    `INSERT INTO platform_admin_auth_rate_limits
      (key_hash, window_started_at, attempt_count, expires_at)
     VALUES ($1, now(), 1, now() + make_interval(secs => $2))
     ON CONFLICT (key_hash) DO UPDATE SET
       window_started_at = CASE
         WHEN platform_admin_auth_rate_limits.window_started_at <= now() - make_interval(secs => $2)
           THEN now()
         ELSE platform_admin_auth_rate_limits.window_started_at
       END,
       attempt_count = CASE
         WHEN platform_admin_auth_rate_limits.window_started_at <= now() - make_interval(secs => $2)
           THEN 1
         ELSE platform_admin_auth_rate_limits.attempt_count + 1
       END,
       expires_at = now() + make_interval(secs => $2)
     RETURNING attempt_count AS "attemptCount"`,
    [input.keyHash, input.windowSeconds],
  );

  return (result.rows[0]?.attemptCount ?? input.maxAttempts + 1) <= input.maxAttempts;
}

export async function recordPlatformAdminAuditEvent(input: {
  actorAccountId?: string | null;
  eventType: string;
  outcome: "success" | "denied" | "error";
  subject?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await getPlatformAdminPool().query(
    `INSERT INTO platform_admin_audit_events
      (actor_account_id, event_type, outcome, subject, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      input.actorAccountId ?? null,
      input.eventType,
      input.outcome,
      input.subject ?? null,
      JSON.stringify(input.details ?? {}),
    ],
  );
}

export function hashPlatformAdminSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}


function hashPlatformAdminHmac(purpose: string, value: string): string {
  const secret = process.env.PLATFORM_ADMIN_OIDC_TRANSACTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("A strong Platform Admin transaction secret is required for rate-limit hashes.");
  }
  return createHmac("sha256", secret).update(`${purpose}:${value}`).digest("hex");
}

export function hashPlatformAdminRateLimitKey(value: string): string {
  return hashPlatformAdminHmac("rate-limit", value);
}

export function hashPlatformAdminAuditSubject(issuer: string, subject: string): string {
  const secret = process.env.PLATFORM_ADMIN_AUDIT_SUBJECT_SECRET;
  const keyVersion = process.env.PLATFORM_ADMIN_AUDIT_SUBJECT_KEY_VERSION?.trim();
  if (!secret || secret.length < 32 || !keyVersion || !/^v[1-9][0-9]*$/.test(keyVersion)) {
    throw new Error("A separate versioned Platform Admin audit-subject secret is required.");
  }
  const digest = createHmac("sha256", secret)
    .update(`audit-subject:${issuer}\0${subject}`)
    .digest("hex");
  return `${keyVersion}:${digest}`;
}
