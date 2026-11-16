"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import { generateUserId } from "@/services/auth/user-id";
import crypto from "crypto";
import { getEmailSender } from "@/services/email/adapters";
import { revokeAllForUser } from "@/services/auth/session";

import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";
import { getAccountEmailValidationError, getEmailValidationError, getPersonNameValidationError, getUsernameValidationError } from "@/services/auth/registration-validation";

import { PoolClient } from "pg";
import { headers } from "next/headers";
import { after } from "next/server";
import { isIP } from "node:net";

async function enforceRateLimit(client: PoolClient, endpoint: string, bucketKey: string, maxAttempts: number, windowMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + windowMs);

    // Fail-closed enforcement: if this throws, authentication is denied
    const { rows } = await client.query(`
        INSERT INTO auth_rate_limits (endpoint, bucket_key, attempts, expires_at)
        VALUES ($1, $2, 1, $3)
        ON CONFLICT (endpoint, bucket_key) DO UPDATE
        SET
            attempts = CASE
                WHEN auth_rate_limits.expires_at <= NOW() THEN 1
                ELSE auth_rate_limits.attempts + 1
            END,
            expires_at = CASE
                WHEN auth_rate_limits.expires_at <= NOW() THEN EXCLUDED.expires_at
                ELSE auth_rate_limits.expires_at
            END
        RETURNING attempts
    `, [endpoint, bucketKey, expiresAt.toISOString()]);

    const attempts = rows[0]?.attempts;
    if (typeof attempts !== "number") {
        // Fail closed: an unexpected empty result must deny authentication
        throw new Error("Rate limit check failed");
    }
    if (attempts > maxAttempts) {
        throw new Error("TooManyRequests");
    }
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINS = 15;
const REQUIRE_EMAIL_VERIFICATION = true;

function rateLimitSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32 && secret !== "change-this-to-a-secure-32-character-secret-in-production") return secret;
  if (process.env.NODE_ENV !== "production") return "oxenn-local-only-rate-limit-secret-32-characters";
  throw new Error("SESSION_SECRET must be configured before authentication rate limiting can run.");
}

function privateRateLimitKey(scope: string, value: string): string {
  return crypto.createHmac("sha256", rateLimitSecret()).update(`${scope}\0${value}`).digest("hex");
}

async function trustedClientIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    // Vercel overwrites x-vercel-forwarded-for at its trusted edge. Do not use
    // the left-most arbitrary x-forwarded-for value supplied by a client.
    const candidates = [requestHeaders.get("x-vercel-forwarded-for")];
    for (const candidate of candidates) {
      const address = candidate?.split(",")[0]?.trim();
      if (address && isIP(address)) return address;
    }
  } catch {
    if (process.env.NODE_ENV === "production") throw new Error("Trusted client IP is unavailable for authentication rate limiting.");
  }
  if (process.env.NODE_ENV === "production") throw new Error("Trusted client IP is unavailable for authentication rate limiting.");
  return "127.0.0.1";
}

function hashEmailVerificationCode(email: string, code: string): string {
  const configuredSecret = process.env.SESSION_SECRET;
  const secret = configuredSecret ||
    (process.env.NODE_ENV === "test" ? "oxenn-test-only-verification-secret-32-chars" : "");
  if (secret.length < 32 || secret === "change-this-to-a-secure-32-character-secret-in-production") {
    throw new Error("SESSION_SECRET must be a unique, non-placeholder secret of at least 32 characters before email verification can run.");
  }
  return crypto.createHmac("sha256", secret).update(email + ":" + code).digest("hex");
}


/**
 * Authenticates user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export type LoginActionResult =
  | { success: true; user: User }
  | { success: false; errorCode: "EMAIL_NOT_VERIFIED" };

export async function loginAction(email: string, password: string): Promise<LoginActionResult> {
  if (typeof email !== "string" || getAccountEmailValidationError(email)) {
    throw new Error("Invalid email address.");
  }
  if (typeof password !== "string" || !password) {
    throw new Error("Password is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const ipKey = privateRateLimitKey("ip", await trustedClientIp());
  const accountIpKey = privateRateLimitKey("login-account-ip", `${normalizedEmail}\0${ipKey}`);

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "login-ip", `ip:${ipKey}`, 100, 15 * 60 * 1000);
      await enforceRateLimit(client, "login", `account-ip:${accountIpKey}`, 10, 15 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });

  if (rlError === "TooManyRequests") {
      throw new Error("TooManyRequests");
  }

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    const { rows: userRows } = await client.query("SELECT * FROM users WHERE lower(email) = $1 AND deleted_at IS NULL", [normalizedEmail]);
    const userRecord = userRows[0];

    // Dummy hash for missing user to mitigate timing attacks
    if (!userRecord) {
        await hashPassword(password);
        throw new Error("Invalid credentials or user not found.");
    }


    const { rows: credRows } = await client.query("SELECT * FROM user_credentials WHERE user_id = $1 FOR UPDATE", [userRecord.id]);

    const credRecord = credRows[0];

    // Dummy hash for missing credential
    if (!credRecord) {
        await hashPassword(password);
        throw new Error("Invalid credentials or user not found.");
    }

    // Check lockout
    if (credRecord.locked_until && new Date(credRecord.locked_until) > new Date()) {
        throw new Error("Account is temporarily locked. Please try again later.");
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, credRecord.password_hash, credRecord.params);

    if (!isPasswordValid) {
        // Increment failures atomically in the database
        await client.query(`
            UPDATE user_credentials
            SET
                failed_attempts = CASE
                    WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1
                    ELSE failed_attempts + 1
                END,
                locked_until = CASE
                    WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN NULL
                    WHEN failed_attempts + 1 >= $1 THEN NOW() + interval '${LOCKOUT_DURATION_MINS} minutes'
                    ELSE locked_until
                END,
                updated_at = NOW()
            WHERE user_id = $2
        `, [LOCKOUT_THRESHOLD, userRecord.id]);

        // Return error object instead of throwing inside system context to prevent rollback of failed attempts update
                // Return error object instead of throwing inside system context to prevent rollback of failed attempts update
        return { error: "Invalid credentials or user not found." };
    }

    // Reset failures on success
    await client.query(
        "UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE user_id = $1",
        [userRecord.id]
    );

    // Clear only this account+IP bucket after a valid password; raw PII is never stored.
    await client.query(
      "DELETE FROM auth_rate_limits WHERE endpoint = 'login' AND bucket_key = $1",
      [`account-ip:${accountIpKey}`],
    );

    // Require verification only after password proof. Existing accounts can
    // use the verification recovery flow without exposing account existence.
    if (REQUIRE_EMAIL_VERIFICATION && !userRecord.email_verified_at) {
      return { error: "EMAIL_NOT_VERIFIED" };
    }

    const { rows: memberRows } = await client.query(`
        SELECT m.organization_id as "workspaceId", m.role, o.name as "workspaceName", p.username
        FROM organization_members m
        JOIN organizations o ON m.organization_id = o.id
        LEFT JOIN user_profiles p ON p.user_id = m.user_id
        WHERE m.user_id = $1 AND o.deleted_at IS NULL
        LIMIT 1
    `, [userRecord.id]);

    const memberRecord = memberRows[0];
    if (!memberRecord) {
        throw new Error("User does not belong to any active workspace.");
    }

    return {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        username: memberRecord.username ?? null,
        role: memberRecord.role as UserRole,
        workspaceId: memberRecord.workspaceId,
    };
  });

  if (result && "error" in result) {
    if (result.error === "EMAIL_NOT_VERIFIED") {
      return { success: false, errorCode: "EMAIL_NOT_VERIFIED" };
    }
    throw new Error(result.error as string);
  }

  await createSession(result as User);
  return { success: true, user: result as User };
}

/**
 * A newly registered account remains inactive until its email code is verified.
 * The user and workspace are provisioned atomically by the outer system-context transaction.
 */

export type RegisterActionResult =
  | { success: true; verificationEmailSent: boolean }
  | { errorCode: "USERNAME_EXISTS" | "TooManyRequests" | "INVALID_REGISTRATION" };

export async function registerAction(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  username: string,
  locale: "fa" | "en",
): Promise<RegisterActionResult> {
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string" ||
    (locale !== "fa" && locale !== "en")
  ) return { errorCode: "INVALID_REGISTRATION" };

  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  const normalizedUsername = username.trim();
  const emailError = getEmailValidationError(email);
  const passwordError = !password || !validatePasswordRequirements(password);
  if (
    emailError || passwordError ||
    getPersonNameValidationError(normalizedFirstName, locale) ||
    getPersonNameValidationError(normalizedLastName, locale) ||
    getUsernameValidationError(normalizedUsername)
  ) {
    return { errorCode: "INVALID_REGISTRATION" };
  }
  const normalizedEmail = email.trim().toLowerCase();
  const fullName = `${normalizedFirstName} ${normalizedLastName}`;

  const registerIpKey = privateRateLimitKey("ip", await trustedClientIp());
  const registerAccountIpKey = privateRateLimitKey("register-account-ip", `${normalizedEmail}\0${registerIpKey}`);
  const rateLimitResult = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "register-ip", `ip:${registerIpKey}`, 20, 60 * 60 * 1000);
      await enforceRateLimit(client, "register", `account-ip:${registerAccountIpKey}`, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (rateLimitResult === "TooManyRequests") return { errorCode: "TooManyRequests" };

  let createdUser: User | { alreadyRegistered: true } | { errorCode: "USERNAME_EXISTS" };
  try {
    createdUser = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");

      const { rows: existingEmail } = await client.query(
        "SELECT id FROM users WHERE lower(email) = $1 LIMIT 1",
        [normalizedEmail],
      );
      // Existing emails receive the same public success response as new registrations.
      // Do not query or report username availability for an existing email.
      if (existingEmail.length > 0) return { alreadyRegistered: true as const };

      const { rows: existingUsername } = await client.query(
        "SELECT user_id FROM user_profiles WHERE lower(username) = lower($1) LIMIT 1",
        [normalizedUsername],
      );
      if (existingUsername.length > 0) return { errorCode: "USERNAME_EXISTS" as const };

      const userId = generateUserId();
      const orgId = randomUUID();
      const passwordHash = await hashPassword(password);
      const workspaceName = `${normalizedUsername}'s Workspace`;
      const workspaceSlug = `ws-${orgId.slice(0, 8)}`;

      // TenantContextManager owns BEGIN/COMMIT/ROLLBACK. Do not open a nested transaction here.
      await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [userId, fullName, normalizedEmail]);
      await client.query("INSERT INTO user_profiles (user_id, username) VALUES ($1, $2)", [userId, normalizedUsername]);
      await client.query(
        "INSERT INTO user_credentials (id, user_id, password_hash, algorithm, params) VALUES ($1, $2, $3, $4, $5)",
        [randomUUID(), userId, passwordHash.hash, passwordHash.algorithm, JSON.stringify(passwordHash.params)],
      );
      await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, workspaceName, workspaceSlug]);
      await client.query(
        "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)",
        [orgId, userId, "workspace_admin"],
      );

      return { id: userId, name: fullName, email: normalizedEmail, username: normalizedUsername, role: "workspace_admin" as UserRole, workspaceId: orgId };
    });
  } catch (error: unknown) {
    const databaseError = error as { code?: string; constraint?: string };
    if (databaseError?.code === "23505") {
      if (databaseError.constraint?.toLowerCase().includes("username")) return { errorCode: "USERNAME_EXISTS" };
      if (databaseError.constraint?.toLowerCase().includes("email")) {
        createdUser = { alreadyRegistered: true };
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Duplicate-email outcomes (including concurrent unique-index conflicts) are indistinguishable
  // from successful registration. No account or verification state is disclosed to the caller.
  if ("alreadyRegistered" in createdUser) return { success: true, verificationEmailSent: true };
  if ("errorCode" in createdUser) return { errorCode: createdUser.errorCode };

  let verificationEmailSent = false;
  try {
    verificationEmailSent = await sendVerificationCode(normalizedEmail, locale);
  } catch (error) {
    console.error("Initial verification request failed.", error instanceof Error ? error.message : "Unknown verification error");
  }
  return { success: true, verificationEmailSent };
}

/**
 * Sends a short-lived, single-use numeric email code. The database stores only its keyed HMAC digest.
 */
async function sendVerificationCode(email: string, locale: "fa" | "en", clientIp?: string): Promise<boolean> {
  if (typeof email !== "string" || getAccountEmailValidationError(email)) return false;
  if (locale !== "fa" && locale !== "en") return false;
  const normalizedEmail = email.trim().toLowerCase();
  const ipKey = privateRateLimitKey("ip", clientIp ?? await trustedClientIp());
  const emailKey = privateRateLimitKey("verification-email", normalizedEmail);

  const rateLimitResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "verification-send-ip", `ip:${ipKey}`, 20, 15 * 60 * 1000);
      await enforceRateLimit(client, "verification-send-minute", `email:${emailKey}`, 1, 60 * 1000);
      await enforceRateLimit(client, "verification-send-hour", `email:${emailKey}`, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (rateLimitResult === "TooManyRequests") return false;

  const tokenResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const { rows } = await client.query(
      "SELECT id, email_verified_at FROM users WHERE lower(email) = $1 AND deleted_at IS NULL",
      [normalizedEmail],
    );
    const user = rows[0];
    if (!user || user.email_verified_at) return null; // Enumeration-safe; do not resend for verified accounts.

    const rawCode = crypto.randomInt(0, 100_000_000).toString().padStart(8, "0");
    const tokenHash = hashEmailVerificationCode(normalizedEmail, rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await client.query(
      "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE user_id = $1 AND consumed_at IS NULL",
      [user.id],
    );
    await client.query(
      "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt.toISOString()],
    );
    return { userId: user.id as string, rawCode, tokenHash };
  });
  if (!tokenResult) return false;

  try {
    const sender = getEmailSender();
    await sender.send({ to: normalizedEmail, templateId: "verification", params: { code: tokenResult.rawCode, locale } });
    return true;
  } catch (error) {
    console.error("Verification email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
    try {
      await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
        const client = TenantContextManager.getDbClient();
        if (!client) throw new Error("Failed to get DB client in system context");
        await client.query("UPDATE email_verification_tokens SET consumed_at = NOW() WHERE user_id = $1 AND token_hash = $2 AND consumed_at IS NULL", [tokenResult.userId, tokenResult.tokenHash]);
      });
    } catch (cleanupError) {
      console.error("Failed to invalidate an undelivered verification token.", cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error");
    }
    return false;
  }
}

/**
 * Public resend endpoint deliberately returns the same result for known,
 * unknown, throttled and delivery-failed addresses.
 */
export async function requestVerification(email: string, locale: "fa" | "en" = "en"): Promise<{ success: boolean; errorCode?: string }> {
  if (typeof email !== "string" || getAccountEmailValidationError(email)) return { success: false, errorCode: "INVALID_EMAIL" };
  if (locale !== "fa" && locale !== "en") return { success: false, errorCode: "INVALID_LOCALE" };

  // Capture the trusted request IP before scheduling. The public response is
  // identical and does not wait on account lookup, quotas or provider delivery.
  const clientIp = await trustedClientIp();
  after(async () => {
    try {
      await sendVerificationCode(email, locale, clientIp);
    } catch (error) {
      console.error("Verification resend failed.", error instanceof Error ? error.message : "Unknown verification error");
    }
  });

  return { success: true };
}

/**
 * Consumes the one-time code, marks the email verified, then establishes a DB-backed session.
 */
async function completeEmailVerification(client: PoolClient, userId: string): Promise<User | null> {
  const { rows: userRows } = await client.query(
    "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id, name, email",
    [userId],
  );
  const user = userRows[0];
  if (!user) return null;

  const { rows: membershipRows } = await client.query(`
    SELECT m.organization_id AS "workspaceId", m.role, p.username
    FROM organization_members m
    JOIN organizations o ON o.id = m.organization_id AND o.deleted_at IS NULL
    LEFT JOIN user_profiles p ON p.user_id = m.user_id
    WHERE m.user_id = $1
    ORDER BY m.created_at ASC
    LIMIT 1
  `, [userId]);
  const membership = membershipRows[0];
  if (!membership) throw new Error("Verified account has no active workspace membership.");

  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    username: (membership.username ?? null) as string | null,
    role: membership.role as UserRole,
    workspaceId: membership.workspaceId as string,
  } satisfies User;
}

export async function verifyEmailAction(email: string, code: string): Promise<{ success: boolean; sessionCreated: boolean }> {
  if (
    typeof email !== "string" ||
    getAccountEmailValidationError(email) ||
    typeof code !== "string" ||
    !/^\d{8}$/.test(code)
  ) return { success: false, sessionCreated: false };
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = hashEmailVerificationCode(normalizedEmail, code);
  const ipKey = privateRateLimitKey("ip", await trustedClientIp());
  const accountIpKey = privateRateLimitKey("verification-account-ip", `${normalizedEmail}\0${ipKey}`);

  const verificationResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      // An attacker cannot exhaust a victim's code-attempt quota from another IP.
      await enforceRateLimit(client, "verification-attempt-ip", `ip:${ipKey}`, 30, 15 * 60 * 1000);
      await enforceRateLimit(client, "verification-attempt", `account-ip:${accountIpKey}`, 8, 15 * 60 * 1000);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return null;
      throw error;
    }

    const { rows: consumedTokens } = await client.query(`
      UPDATE email_verification_tokens
      SET consumed_at = NOW()
      WHERE user_id = (SELECT id FROM users WHERE lower(email) = $1 AND deleted_at IS NULL)
        AND token_hash = $2 AND consumed_at IS NULL AND expires_at > NOW()
      RETURNING user_id
    `, [normalizedEmail, tokenHash]);
    if (consumedTokens.length === 0) return null;

    const userId = consumedTokens[0].user_id as string;
    return completeEmailVerification(client, userId);
  });

  if (!verificationResult) return { success: false, sessionCreated: false };
  try {
    await createSession(verificationResult);
    return { success: true, sessionCreated: true };
  } catch (error) {
    console.error("Email was verified, but session creation failed.", error instanceof Error ? error.message : "Unknown session error");
    return { success: true, sessionCreated: false };
  }
}

/**
 * Accepts pre-code verification links issued by the previous registration flow.
 * Legacy links contain a random 32-byte hex token whose SHA-256 digest is stored
 * in email_verification_tokens. New registrations use the HMAC-backed 8-digit
 * code path above; this compatibility action can only consume old-format links.
 */
export async function verifyLegacyEmailAction(token: string): Promise<{ success: boolean; sessionCreated: boolean }> {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return { success: false, sessionCreated: false };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const verificationResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: consumedTokens } = await client.query(`
      UPDATE email_verification_tokens
      SET consumed_at = NOW()
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > NOW()
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = email_verification_tokens.user_id
            AND users.deleted_at IS NULL
        )
      RETURNING user_id
    `, [tokenHash]);
    if (consumedTokens.length === 0) return null;

    const userId = consumedTokens[0].user_id as string;
    return completeEmailVerification(client, userId);
  });

  if (!verificationResult) return { success: false, sessionCreated: false };
  try {
    await createSession(verificationResult);
    return { success: true, sessionCreated: true };
  } catch (error) {
    console.error("Legacy email was verified, but session creation failed.", error instanceof Error ? error.message : "Unknown session error");
    return { success: true, sessionCreated: false };
  }
}

function getApplicationOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelHost = process.env.VERCEL_ENV === "preview"
    ? process.env.VERCEL_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const fallbackOrigin = process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "";
  const candidate = configuredOrigin || (vercelHost ? `https://${vercelHost}` : fallbackOrigin);

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("A valid HTTPS application URL must be configured before sending account email.");
  }
  if (
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") ||
    (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") ||
    parsed.username || parsed.password
  ) {
    throw new Error("The account email application URL must use HTTPS and contain no credentials.");
  }
  return parsed.origin;
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean, error?: string }> {
  if (typeof email !== "string" || getAccountEmailValidationError(email)) return { success: false, error: "INVALID_EMAIL" };
  const normalizedEmail = email.trim().toLowerCase();
  // Resolve the callback URL before minting a token, so missing configuration cannot leave an unreachable live token.
  const applicationOrigin = getApplicationOrigin();
  const ipKey = privateRateLimitKey("ip", await trustedClientIp());
  const accountIpKey = privateRateLimitKey("password-reset-account-ip", `${normalizedEmail}\0${ipKey}`);

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "password-reset-ip", `ip:${ipKey}`, 20, 60 * 60 * 1000);
      await enforceRateLimit(client, "password-reset", `account-ip:${accountIpKey}`, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (rlError === "TooManyRequests") return { success: true };

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: userRows } = await client.query("SELECT id FROM users WHERE lower(email) = $1 AND deleted_at IS NULL", [normalizedEmail]);
    const userRecord = userRows[0];

    if (!userRecord) {
      return { success: true }; // Enumeration safe
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Invalidate previous unconsumed password reset tokens
    await client.query(`
      UPDATE password_reset_tokens
      SET consumed_at = NOW()
      WHERE user_id = $1 AND consumed_at IS NULL
    `, [userRecord.id]);

    await client.query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [userRecord.id, tokenHash, expiresAt.toISOString()]);

    return { success: true, rawToken, email };
  });

  if (result && result.rawToken) {
    after(async () => {
      try {
        const sender = getEmailSender();
        await sender.send({
          to: result.email,
          templateId: "password_reset",
          params: { url: `${applicationOrigin}/en/forgot-password?token=${result.rawToken}`, locale: "en" },
        });
      } catch (error) {
        console.error("Password-reset email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
        try {
          await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
            const client = TenantContextManager.getDbClient();
            if (!client) throw new Error("Failed to get DB client in system context");
            await client.query(
              "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE token_hash = $1 AND consumed_at IS NULL",
              [crypto.createHash("sha256").update(result.rawToken).digest("hex")],
            );
          });
        } catch (cleanupError) {
          console.error("Failed to invalidate an undelivered password-reset token.", cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error");
        }
      }
    });
  }

  // Unknown account, rate limit and provider failure all have the same public result.
  return { success: true };
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean }> {
  if (typeof token !== "string" || token.length < 32 || token.length > 256) throw new Error("Invalid or expired token");
  if (typeof newPassword !== "string" || !validatePasswordRequirements(newPassword)) {
    throw new Error("Password does not meet the security requirements.");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const hashResult = await hashPassword(newPassword);

  const userId = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows } = await client.query(`
        UPDATE password_reset_tokens
        SET consumed_at = NOW()
        WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
        RETURNING user_id
      `, [tokenHash]);

    if (rows.length === 0) {
      throw new Error("Invalid or expired token");
    }

    const userId = rows[0].user_id;

    await client.query(`
        UPDATE user_credentials
        SET password_hash = $1, algorithm = $2, params = $3, updated_at = NOW(), failed_attempts = 0, locked_until = NULL
        WHERE user_id = $4
      `, [hashResult.hash, hashResult.algorithm, JSON.stringify(hashResult.params), userId]);

    return userId;
  });

  await revokeAllForUser(userId);
  return { success: true };
}

export async function logoutAction() {
  await invalidateSession();
}

/**
 * Securely verifies and returns the current server-validated session state for client synchronization.
 */
export async function getServerSessionAction(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    return { user: null, expiresAt: null, status: "unauthenticated" };
  }
  return session;
}
