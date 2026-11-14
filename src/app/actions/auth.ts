"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { getEmailSender } from "@/services/email/adapters";
import { revokeAllForUser } from "@/services/auth/session";

import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";

import { PoolClient } from "pg";
import { headers } from "next/headers";
import { after } from "next/server";

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
export async function loginAction(email: string, password: string): Promise<User | { errorCode: "EMAIL_NOT_VERIFIED" }> {
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

        // Return error object instead of throwing inside system context to prevent rollback of failed attempts update
                // Return error object instead of throwing inside system context to prevent rollback of failed attempts update
        return { error: "Invalid credentials or user not found." };
    }

    // Reset failures on success
    await client.query(
        "UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE user_id = $1",
        [userRecord.id]
    );

    // Clear rate-limit bucket for a valid password, even if email verification is still pending.
    await client.query(
        "DELETE FROM auth_rate_limits WHERE endpoint = 'login' AND bucket_key = $1",
        [`login:${normalizedEmail}`]
    );

    // A correct password does not grant access until ownership of the email address is proven.
    if (!userRecord.email_verified_at) {
        return {
            error: "Email must be verified before logging in.",
            errorCode: "EMAIL_NOT_VERIFIED" as const,
        };
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

  if (result && "error" in result) {
      if ("errorCode" in result && result.errorCode === "EMAIL_NOT_VERIFIED") {
          return { errorCode: "EMAIL_NOT_VERIFIED" };
      }
      throw new Error(result.error as string);
  }

  await createSession(result as User);
  return result as User;
}

/**
 * Registers user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
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

    await client.query('BEGIN');
    try {
        // Create User
        await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [userId, name, normalizedEmail]);

        // Create Credentials
        await client.query(
            "INSERT INTO user_credentials (id, user_id, password_hash, algorithm, params) VALUES ($1, $2, $3, $4, $5)",
            [randomUUID(), userId, hashResult.hash, hashResult.algorithm, JSON.stringify(hashResult.params)]
        );

        // Create Organization (Workspace)
        const effectiveWorkspaceName = workspaceName || `${name}'s Workspace`;
        const orgSlug = `${effectiveWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0,4)}`;

        await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, effectiveWorkspaceName, orgSlug]);

        // Create Membership
        await client.query("INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)", [orgId, userId, "workspace_admin"]);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }

    return {
        id: userId,
        name,
        email,
        role: "workspace_admin" as UserRole,
        workspaceId: orgId,
    };
  });

  // Registration never creates a session. Await delivery so the UI can
  // distinguish account creation from an email that could not be sent.
  if ("errorCode" in result && result.errorCode === "USER_EXISTS") {
    return { errorCode: "USER_EXISTS" };
  }

  // Account creation is already committed. A follow-up verification failure must
  // not make registration appear to fail and encourage a duplicate-account retry.
  const verification = await requestVerification(normalizedEmail).catch(() => ({ success: false }));
  return { ...(result as User), verificationEmailSent: verification.success };
}

export async function requestVerification(email: string): Promise<{ success: boolean, error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Limit each requester before looking up the supplied address. Unknown addresses
  // must never consume another person's per-address delivery allowance.
  const requestHeaders = await headers();
  const requesterIp = requestHeaders.get("x-real-ip")?.trim();
  if (!requesterIp) {
    throw new Error("Unable to determine verification requester");
  }
  const requesterSecret = process.env.SESSION_SECRET;
  if (!requesterSecret) {
    throw new Error("SESSION_SECRET must be configured for verification rate limiting");
  }
  const requesterBucket = `verification-requester:${crypto.createHmac("sha256", requesterSecret).update(requesterIp).digest("hex")}`;
  const requesterLimit = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    try {
      await enforceRateLimit(client, "email-verification-requester", requesterBucket, 10, 60 * 60 * 1000);
      return null;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") return "TooManyRequests";
      throw error;
    }
  });
  if (requesterLimit === "TooManyRequests") {
    return { success: false, error: "TooManyRequests" };
  }

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: userRows } = await client.query(
      "SELECT id, email, email_verified_at FROM users WHERE lower(email) = $1 AND deleted_at IS NULL",
      [normalizedEmail]
    );
    const userRecord = userRows[0];

    if (!userRecord || userRecord.email_verified_at) {
      return { success: true, rawToken: undefined, email: undefined };
    }

    // Apply the delivery quota only after confirming that the address belongs to
    // an unverified account. The requester quota above protects this lookup path.
    try {
      await enforceRateLimit(client, "email-verification", `verification:${normalizedEmail}`, 5, 60 * 60 * 1000);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "TooManyRequests") {
        // Keep the response indistinguishable from an unknown or already-verified address.
        return { success: true, rawToken: undefined, email: undefined };
      }
      throw error;
    }

    // Bind the opaque token to the address that receives it, without a schema migration.
    const emailFingerprint = crypto.createHash("sha256").update(String(userRecord.email).toLowerCase()).digest("hex");
    const rawToken = `${crypto.randomBytes(32).toString("hex")}.${emailFingerprint}`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await client.query(`
      UPDATE email_verification_tokens
      SET consumed_at = NOW()
      WHERE user_id = $1 AND consumed_at IS NULL
    `, [userRecord.id]);

    await client.query(`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [userRecord.id, tokenHash, expiresAt.toISOString()]);

    return { success: true, rawToken, email: String(userRecord.email) };
  });

  if (result?.rawToken && result.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const sender = getEmailSender();
      await sender.send({
        to: result.email,
        templateId: "verification",
        params: {
          url: `${appUrl}/en/verify-email?token=${encodeURIComponent(result.rawToken)}`
        }
      });
      return { success: true };
    } catch {
      console.error("Verification email delivery failed.");
      return { success: false, error: "Verification email could not be sent. Please try again later." };
    }
  }

  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<{ success: boolean }> {
  // New tokens carry a SHA-256 fingerprint of the email address they were sent to.
  // Legacy tokens without this binding are intentionally rejected.
  if (!/^[a-f0-9]{64}\.[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Invalid or expired token");
  }
  const emailFingerprint = token.split(".")[1].toLowerCase();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query("BEGIN");
    try {
      const { rows } = await client.query(`
        UPDATE email_verification_tokens
        SET consumed_at = NOW()
        WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
        RETURNING user_id
      `, [tokenHash]);

      if (rows.length === 0) {
        throw new Error("Invalid or expired token");
      }

      const userId = rows[0].user_id;
      const { rows: userRows } = await client.query(`
        SELECT lower(email) AS email, email_verified_at AS "emailVerifiedAt"
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
        FOR UPDATE
      `, [userId]);

      if (userRows.length === 0) {
        throw new Error("Invalid or expired token");
      }

      const currentFingerprint = crypto.createHash("sha256").update(String(userRows[0].email)).digest("hex");
      const matchesCurrentEmail = crypto.timingSafeEqual(
        Buffer.from(currentFingerprint, "hex"),
        Buffer.from(emailFingerprint, "hex")
      );

      if (!matchesCurrentEmail) {
        // Consume stale links so a later email change cannot make an old link valid again.
        await client.query("COMMIT");
        return { success: false };
      }

      if (!userRows[0].emailVerifiedAt) {
        const { rows: updatedUsers } = await client.query(`
          UPDATE users
          SET email_verified_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND email_verified_at IS NULL
          RETURNING id
        `, [userId]);

        if (updatedUsers.length === 0) {
          throw new Error("Unable to verify email address");
        }
      }

      await client.query(`
        UPDATE email_verification_tokens
        SET consumed_at = NOW()
        WHERE user_id = $1 AND consumed_at IS NULL
      `, [userId]);
      await client.query(`
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE user_id = $1 AND revoked_at IS NULL
      `, [userId]);

      await client.query("COMMIT");
      return { success: true };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
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
    const recipient = result.email;
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/en/forgot-password?token=${encodeURIComponent(result.rawToken)}`;

    // Keep provider setup and network delivery outside the response path so registered
    // and unknown addresses do not expose account existence through provider latency.
    after(async () => {
      let sender;
      try {
        sender = getEmailSender();
      } catch (error) {
        console.error("Password reset email sender initialization error", error);
        return;
      }

      try {
        await sender.send({
          to: recipient,
          templateId: "password_reset",
          params: { url: resetUrl },
        });
      } catch (error) {
        console.error("Password reset email delivery error", error);
      }
    });
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
