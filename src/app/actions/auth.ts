"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession, revokeAllForUser } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { getEmailSender } from "@/services/email/adapters";
import { buildEmailActionUrl } from "@/services/email/links";

import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";

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

        // Return an error object so the failed-attempt update is committed.
        return { error: "Invalid credentials or user not found." };
    }

    // Reset failures on success
    await client.query(
        "UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE user_id = $1",
        [userRecord.id]
    );

    // Clear rate-limit bucket for a correct password, including an unverified account.
    await client.query(
        "DELETE FROM auth_rate_limits WHERE endpoint = 'login' AND bucket_key = $1",
        [`login:${normalizedEmail}`]
    );

    // Verify only after the password is correct so the login endpoint does not
    // reveal whether an address has an account before credentials are proven.
    if (!userRecord.email_verified_at) {
        return { error: "Email must be verified before logging in." };
    }

    const { rows: memberRows } = await client.query(`
        SELECT m.organization_id as "workspaceId", m.role, o.name as "workspaceName"
        FROM organization_members m
        JOIN organizations o ON m.organization_id = o.id
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
 * Creates the account and workspace; email verification is required before a session can be established.
 */
export async function registerAction(name: string, email: string, password: string, workspaceName?: string): Promise<(User & { verificationEmailSent: boolean }) | { errorCode: "USER_EXISTS" | "TooManyRequests", error?: string }> {
  if (!password || !validatePasswordRequirements(password)) {
     throw new Error("Password must be between 10 and 255 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const rlError = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
      const c = TenantContextManager.getDbClient();
      if (!c) throw new Error("Failed to get DB client in system context");
      try {
          await enforceRateLimit(c, 'register', `register:${normalizedEmail}`, 5, 60 * 60 * 1000);
          return null;
      } catch (err: unknown) {
          if (err instanceof Error && err.message === "TooManyRequests") return "TooManyRequests";
          throw err;
      }
  });
  if (rlError === "TooManyRequests") {
      return { error: "TooManyRequests", errorCode: "TooManyRequests" as const };
  }

  const result = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    // Check if user exists
    const { rows: existingUser } = await client.query("SELECT id FROM users WHERE lower(email) = $1", [normalizedEmail]);
    if (existingUser.length > 0) {
        return { errorCode: "USER_EXISTS" as const };
    }

    const userId = `usr-${randomUUID()}`;

    // Hash password
    const hashResult = await hashPassword(password);

    const orgId = randomUUID();

    // The surrounding sys-register context already owns the transaction. Keep
    // user, credentials, workspace, and membership creation inside that boundary.
    await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [userId, name, normalizedEmail]);

    await client.query(
        "INSERT INTO user_credentials (id, user_id, password_hash, algorithm, params) VALUES ($1, $2, $3, $4, $5)",
        [randomUUID(), userId, hashResult.hash, hashResult.algorithm, JSON.stringify(hashResult.params)]
    );

    const effectiveWorkspaceName = workspaceName || `${name}'s Workspace`;
    const orgSlug = `${effectiveWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0,4)}`;

    await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, effectiveWorkspaceName, orgSlug]);
    await client.query("INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)", [orgId, userId, "workspace_admin"]);

    return {
        id: userId,
        name,
        email,
        role: "workspace_admin" as UserRole,
        workspaceId: orgId,
    };
  }) as User | { errorCode: "USER_EXISTS" };

  // The account is created independently of mail delivery. Do not issue a
  // session here; report delivery accurately so the UI can offer a resend.
  if (!('errorCode' in result)) {
      const verificationEmailSent = await issueVerification(normalizedEmail).catch(() => {
        console.error("[Auth] Registration verification request could not be processed.");
        return false;
      });
      return { ...result, verificationEmailSent };
  }

  return result;
}

/**
 * Clears secure cookies and invalidates the session on logout.
 */

async function issueVerification(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailBucket = `verify:${crypto.createHash("sha256").update(normalizedEmail).digest("hex")}`;

  const rateLimitResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "email-verification", emailBucket, 5, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });

  if (rateLimitResult === "TooManyRequests") {
    return false;
  }

  const tokenResult = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    // Lock the account so concurrent resend requests cannot leave multiple
    // usable verification links for the same email address.
    const { rows: userRows } = await client.query(
      "SELECT id, email, email_verified_at FROM users WHERE lower(email) = $1 AND deleted_at IS NULL FOR UPDATE",
      [normalizedEmail]
    );
    const userRecord = userRows[0];

    if (!userRecord) {
      return { success: false as const };
    }
    if (userRecord.email_verified_at) {
      return { success: true as const };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { rows: insertedRows } = await client.query(`
      INSERT INTO email_verification_tokens (
        user_id, token_hash, expires_at, email_snapshot, delivery_status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `, [userRecord.id, tokenHash, expiresAt.toISOString(), userRecord.email.toLowerCase()]);

    const tokenId = insertedRows[0]?.id;
    if (!tokenId) throw new Error("Verification token could not be stored.");

    return {
      success: true as const,
      tokenId,
      userId: userRecord.id,
      rawToken,
      recipient: userRecord.email,
    };
  });

  if (!("rawToken" in tokenResult) || typeof tokenResult.rawToken !== "string") {
    // Unknown accounts are not treated as a successful new registration delivery.
    return tokenResult.success;
  }

  try {
    const url = buildEmailActionUrl("/en/verify-email", tokenResult.rawToken);
    await getEmailSender().send({
      to: tokenResult.recipient,
      templateId: "verification",
      params: { url },
    });

    const markedSent = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");
      const { rows: currentUsers } = await client.query(`
        SELECT id, email, email_verified_at
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
        FOR UPDATE
      `, [tokenResult.userId]);
      const currentUser = currentUsers[0];
      if (
        !currentUser ||
        currentUser.email_verified_at ||
        currentUser.email.toLowerCase() !== tokenResult.recipient.toLowerCase()
      ) {
        return false;
      }

      const { rows } = await client.query(`
        UPDATE email_verification_tokens
        SET delivery_status = 'sent', sent_at = NOW(), last_delivery_error = NULL
        WHERE id = $1
          AND user_id = $2
          AND consumed_at IS NULL
          AND expires_at > NOW()
          AND delivery_status = 'pending'
          AND lower(email_snapshot) = lower($3)
          AND NOT EXISTS (
            SELECT 1
            FROM email_verification_tokens newer
            WHERE newer.user_id = $2
              AND newer.id <> $1
              AND newer.consumed_at IS NULL
              AND newer.created_at > email_verification_tokens.created_at
          )
        RETURNING id
      `, [tokenResult.tokenId, tokenResult.userId, currentUser.email]);
      if (rows.length !== 1) {
        return false;
      }

      // Supersede previously delivered/pending tokens only after the replacement
      // is confirmed eligible for sent status. A failed or expired resend therefore
      // leaves the last known-delivered link usable. The user-row lock serializes senders.
      await client.query(`
        UPDATE email_verification_tokens
        SET consumed_at = NOW(), delivery_status = 'failed', last_delivery_error = 'TOKEN_SUPERSEDED'
        WHERE user_id = $1 AND id <> $2 AND consumed_at IS NULL
      `, [tokenResult.userId, tokenResult.tokenId]);
      return true;
    });

    if (!markedSent) {
      throw new Error("Verification token was superseded before delivery could be recorded.");
    }

    return true;
  } catch {
    try {
      await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
        const client = TenantContextManager.getDbClient();
        if (!client) throw new Error("Failed to get DB client in system context");
        await client.query(`
          UPDATE email_verification_tokens
          SET consumed_at = NOW(), delivery_status = 'failed', last_delivery_error = 'DELIVERY_FAILED'
          WHERE id = $1 AND consumed_at IS NULL
        `, [tokenResult.tokenId]);
      });
    } catch {
      console.error("[Auth] Unable to persist verification-email delivery failure state.");
    }
    // Never log an SMTP exception: providers may include addresses or secret-bearing diagnostics.
    console.error("[Auth] Verification email delivery failed.");
    return false;
  }
}

/**
 * Public resend endpoint deliberately returns the same result for known, unknown,
 * verified, rate-limited, and temporarily undeliverable email addresses.
 */
export async function requestVerification(email: string): Promise<{ success: boolean }> {
  try {
    await issueVerification(email);
  } catch {
    console.error("[Auth] Verification request could not be processed.");
  }
  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<{ success: boolean }> {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Invalid or expired token");
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    // runWithSystemContext owns the PostgreSQL transaction. Keep token consumption,
    // account verification, and legacy-session revocation in that same transaction.
    // A token is usable only after successful delivery and only for the exact
    // current account email snapshot. Legacy tokens without a snapshot fail closed.
    const { rows: tokenRows } = await client.query(`
      SELECT t.id, t.user_id AS "userId"
      FROM email_verification_tokens t
      INNER JOIN users u ON u.id = t.user_id AND u.deleted_at IS NULL
      WHERE t.token_hash = $1
        AND t.consumed_at IS NULL
        AND t.expires_at > NOW()
        AND t.delivery_status = 'sent'
        AND t.email_snapshot IS NOT NULL
        AND lower(t.email_snapshot) = lower(u.email)
        AND u.email_verified_at IS NULL
      FOR UPDATE OF t, u
    `, [tokenHash]);

    if (tokenRows.length !== 1) {
      throw new Error("Invalid or expired token");
    }

    const { rows: consumedRows } = await client.query(`
      UPDATE email_verification_tokens
      SET consumed_at = NOW()
      WHERE id = $1 AND consumed_at IS NULL AND expires_at > NOW()
      RETURNING id
    `, [tokenRows[0].id]);
    if (consumedRows.length !== 1) {
      throw new Error("Invalid or expired token");
    }

    const { rows: verifiedRows } = await client.query(`
      UPDATE users
      SET email_verified_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND email_verified_at IS NULL AND deleted_at IS NULL
      RETURNING id
    `, [tokenRows[0].userId]);
    if (verifiedRows.length !== 1) {
      throw new Error("Unable to verify the account email.");
    }

    // Revoke any legacy/pre-enforcement sessions. The user signs in again
    // after proving control of the email address.
    await client.query(
      "UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [tokenRows[0].userId]
    );

    return { success: true };
  });

  return result;
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
    try {
      const sender = getEmailSender();
      await sender.send({
        to: result.email,
        templateId: "password_reset",
        params: {
          url: buildEmailActionUrl("/en/forgot-password", result.rawToken)
        }
      });
    } catch {
      console.error("[Auth] Password reset email delivery failed.");
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

    await client.query('BEGIN');
    try {
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

      await client.query('COMMIT');
      return userId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
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
