"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { getEmailSender } from "@/services/email/adapters";
import { revokeAllForUser } from "@/services/auth/session";

import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";
import { getEmailValidationError, getPersonNameValidationError, getUsernameValidationError } from "@/services/auth/registration-validation";

import { PoolClient } from "pg";

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

/**
 * Authenticates user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export async function loginAction(email: string, password: string): Promise<User> {
  if (!password) {
     throw new Error("Password is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const c = TenantContextManager.getDbClient();
      if (!c) throw new Error("Failed to get DB client in system context");
      try {
          await enforceRateLimit(c, 'login', `login:${normalizedEmail}`, 10, 15 * 60 * 1000);
          return null;
      } catch (err: unknown) {
          if (err instanceof Error && err.message === "TooManyRequests") return "TooManyRequests";
          throw err;
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


    if (REQUIRE_EMAIL_VERIFICATION && !userRecord.email_verified_at) {
        throw new Error("Email must be verified before logging in.");
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

    // Clear rate-limit bucket for successful login
    await client.query(
        "DELETE FROM auth_rate_limits WHERE endpoint = 'login' AND bucket_key = $1",
        [`login:${email.toLowerCase().trim()}`]
    );

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

  if (result && 'error' in result) {
      throw new Error(result.error as string);
  }

  await createSession(result as User);
  return result as User;
}

/**
 * A newly registered account remains inactive until its email code is verified.
 * The user and workspace are provisioned atomically by the outer system-context transaction.
 */
const REQUIRE_EMAIL_VERIFICATION = true;

export type RegisterActionResult =
  | { success: true; verificationEmailSent: boolean }
  | { errorCode: "USER_EXISTS" | "USERNAME_EXISTS" | "TooManyRequests" | "INVALID_REGISTRATION" };

export async function registerAction(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  username: string,
  locale: "fa" | "en",
): Promise<RegisterActionResult> {
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

  const rateLimitResult = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "register", `register:${normalizedEmail}`, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (rateLimitResult === "TooManyRequests") return { errorCode: "TooManyRequests" };

  let createdUser: User | { errorCode: "USER_EXISTS" | "USERNAME_EXISTS" };
  try {
    createdUser = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");

      const { rows: existingRows } = await client.query(
        `SELECT u.id, p.username
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE lower(u.email) = $1 OR lower(p.username) = lower($2)
         LIMIT 1`,
        [normalizedEmail, normalizedUsername],
      );
      if (existingRows.length > 0) {
        return {
          errorCode: existingRows[0].username && existingRows[0].username.toLowerCase() === normalizedUsername.toLowerCase()
            ? "USERNAME_EXISTS" as const
            : "USER_EXISTS" as const,
        };
      }

      const userId = `usr-${randomUUID()}`;
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
      return { errorCode: databaseError.constraint?.includes("username") ? "USERNAME_EXISTS" : "USER_EXISTS" };
    }
    throw error;
  }

  // Duplicate detection is returned from inside the transaction without creating partial records.
  if ("errorCode" in createdUser) return { errorCode: createdUser.errorCode };

  const verification = await requestVerification(normalizedEmail, locale);
  // Account/workspace creation has succeeded. A delivery failure is surfaced in the UI
  // and the user can safely request a new code from the verification screen.
  return { success: true, verificationEmailSent: verification.success };
}

/**
 * Sends a short-lived, single-use numeric email code. The database stores only its SHA-256 hash.
 */
export async function requestVerification(email: string, locale: "fa" | "en" = "en"): Promise<{ success: boolean; errorCode?: string }> {
  if (getEmailValidationError(email)) return { success: false, errorCode: "INVALID_EMAIL" };
  const normalizedEmail = email.trim().toLowerCase();

  const rateLimitResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "verification-send-minute", `verification:${normalizedEmail}`, 1, 60 * 1000);
      await enforceRateLimit(client, "verification-send-hour", `verification:${normalizedEmail}`, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (rateLimitResult === "TooManyRequests") return { success: false, errorCode: "TooManyRequests" };

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
    const tokenHash = crypto.createHash("sha256").update(`${normalizedEmail}:${rawCode}`).digest("hex");
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
  if (!tokenResult) return { success: true };

  try {
    const sender = getEmailSender();
    await sender.send({ to: normalizedEmail, templateId: "verification", params: { code: tokenResult.rawCode, locale } });
    return { success: true };
  } catch (error) {
    console.error("Verification email delivery failed.", error instanceof Error ? error.message : "Unknown email error");
    // A code that was never delivered must not remain valid.
    await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");
      await client.query(
        "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE user_id = $1 AND token_hash = $2 AND consumed_at IS NULL",
        [tokenResult.userId, tokenResult.tokenHash],
      );
    });
    return { success: false, errorCode: "EMAIL_DELIVERY_FAILED" };
  }
}

/**
 * Consumes the one-time code, marks the email verified, then establishes a DB-backed session.
 */
export async function verifyEmailAction(email: string, code: string): Promise<{ success: boolean; sessionCreated: boolean }> {
  if (getEmailValidationError(email) || !/^\d{8}$/.test(code)) return { success: false, sessionCreated: false };
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = crypto.createHash("sha256").update(`${normalizedEmail}:${code}`).digest("hex");

  const verificationResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "verification-attempt", `verification:${normalizedEmail}`, 8, 15 * 60 * 1000);
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
    const { rows: userRows } = await client.query(
      "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = $1 RETURNING id, name, email",
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
    if (!membership) return null;

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      username: (membership.username ?? null) as string | null,
      role: membership.role as UserRole,
      workspaceId: membership.workspaceId as string,
    } satisfies User;
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

export async function requestPasswordReset(email: string): Promise<{ success: boolean, error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const c = TenantContextManager.getDbClient();
      if (!c) throw new Error("Failed to get DB client in system context");
      try {
          await enforceRateLimit(c, 'password-reset', `reset:${normalizedEmail}`, 5, 60 * 60 * 1000);
          return null;
      } catch (err: unknown) {
          if (err instanceof Error && err.message === "TooManyRequests") return "TooManyRequests";
          throw err;
      }
  });
  if (rlError === "TooManyRequests") {
      return { success: false, error: "TooManyRequests" };
  }

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const sender = getEmailSender();
      await sender.send({
        to: result.email,
        templateId: "password_reset",
        params: { url: `${appUrl}/en/forgot-password?token=${result.rawToken}`, locale: "en" }
      });
    } catch(e) {
      console.error("Password-reset email delivery failed.", e instanceof Error ? e.message : "Unknown email error");
      return { success: false, error: "EMAIL_DELIVERY_FAILED" };
    }
  }

  if (result && ('error' in result)) {
    return { success: false, error: (result as { error?: string }).error };
  }

  return { success: true };
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean }> {
  if (!newPassword || !validatePasswordRequirements(newPassword)) {
     throw new Error("Password must be between 10 and 255 characters");
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
