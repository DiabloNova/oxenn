"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINS = 15;

/**
 * Authenticates user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export async function loginAction(email: string, password: string): Promise<User> {
  if (!password) {
     throw new Error("Password is required");
  }

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    const { rows: userRows } = await client.query("SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", [email]);
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
        return { error: "Invalid credentials or user not found." };
    }

    // Reset failures on success
    await client.query(
        "UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE user_id = $1",
        [userRecord.id]
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
export async function registerAction(name: string, email: string, password: string, workspaceName?: string): Promise<User | { errorCode: "USER_EXISTS" }> {
  if (!password || !validatePasswordRequirements(password)) {
     throw new Error("Password must be between 10 and 255 characters");
  }

  const result = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    // Check if user exists
    const { rows: existingUser } = await client.query("SELECT id FROM users WHERE email = $1", [email]);
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
        await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [userId, name, email]);

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

  // DO NOT CREATE SESSION ON REGISTER per requirements
  // await createSession(result);

  return result;
}

/**
 * Clears secure cookies and invalidates the session on logout.
 */
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
