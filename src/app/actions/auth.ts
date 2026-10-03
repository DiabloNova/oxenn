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

    const attempts = rows[0].attempts;
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
 * Registers user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export async function registerAction(name: string, email: string, password: string, workspaceName?: string): Promise<User | { errorCode: "USER_EXISTS" | "TooManyRequests", error?: string }> {
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

  // Trigger verification email asynchronously (do not block the registration response)
  if (!('errorCode' in result)) {
      requestVerification(email).catch(console.error);
  }

  // DO NOT CREATE SESSION ON REGISTER per requirements
  // await createSession(result);

  return result;
}

/**
 * Clears secure cookies and invalidates the session on logout.
 */

const REQUIRE_EMAIL_VERIFICATION = false;

export async function requestVerification(email: string): Promise<{ success: boolean, error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  // Try to find the user
  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: userRows } = await client.query("SELECT id FROM users WHERE lower(email) = $1 AND deleted_at IS NULL", [normalizedEmail]);
    const userRecord = userRows[0];

    if (!userRecord) {
      return { success: true }; // Enumeration safe although less critical here than reset
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Invalidate previous unconsumed verification tokens
    await client.query(`
      UPDATE email_verification_tokens
      SET consumed_at = NOW()
      WHERE user_id = $1 AND consumed_at IS NULL
    `, [userRecord.id]);

    await client.query(`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [userRecord.id, tokenHash, expiresAt.toISOString()]);

    return { success: true, rawToken, email };
  });

  if (result && result.rawToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const sender = getEmailSender();
      sender.send({
        to: result.email,
        templateId: "verification",
        params: {
          url: `${appUrl}/en/verify-email?token=${result.rawToken}`
        }
      }).catch((e) => console.error("Email send async error", e));
    } catch(e) {
      console.error("Email sender creation error", e);
    }
  }

  if (result && ('error' in result)) {
    return { success: false, error: (result as { error?: string }).error };
  }

  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<{ success: boolean }> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query('BEGIN');
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

      await client.query(`
        UPDATE users
        SET email_verified_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND email_verified_at IS NULL
      `, [userId]);

      await client.query('COMMIT');
      return { success: true };
    } catch (e) {
      await client.query('ROLLBACK');
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const sender = getEmailSender();
      sender.send({
        to: result.email,
        templateId: "password_reset",
        params: {
          url: `${appUrl}/en/forgot-password?token=${result.rawToken}`
        }
      }).catch((e) => console.error("Email send async error", e));
    } catch(e) {
      console.error("Email sender creation error", e);
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
