"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";

/**
 * Authenticates user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export async function loginAction(email: string): Promise<User> {
  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    const { rows: userRows } = await client.query("SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL", [email]);
    const userRecord = userRows[0];

    if (!userRecord) {
        throw new Error("Invalid credentials or user not found.");
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

  await createSession(result);
  return result;
}

/**
 * Registers user, resolves identity/workspace strictly on the server, and establishes a secure signed session.
 */
export async function registerAction(name: string, email: string): Promise<User> {
  const result = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
        throw new Error("Failed to get DB client in system context");
    }

    // Check if user exists
    const { rows: existingUser } = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.length > 0) {
        throw new Error("User already exists.");
    }

    const userId = `usr-${randomUUID().slice(0,8)}`;

    // Create User
    await client.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [userId, name, email]);

    // Create Organization (Workspace)
    const orgId = randomUUID();
    const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0,4)}`;
    const orgName = `${name}'s Workspace`;

    await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, orgName, orgSlug]);

    // Create Membership
    await client.query("INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)", [orgId, userId, "workspace_admin"]);

    return {
        id: userId,
        name,
        email,
        role: "workspace_admin" as UserRole,
        workspaceId: orgId,
    };
  });

  await createSession(result);
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
