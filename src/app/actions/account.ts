"use server";

import { requireSession, revokeAllForUser } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { hashPassword, verifyPassword } from "@/services/auth/passwords";
import { drizzle } from "drizzle-orm/node-postgres";
import { organizationMembers } from "../../../database/schema";
import { eq, and } from "drizzle-orm";

/**
 * Deactivates the user account securely.
 * Re-confirms password, revokes sessions, modifies memberships,
 * updates users.deleted_at, and writes audit records via established contexts.
 */
export async function deactivateAccountAction(password: string): Promise<{ success: boolean; errorCode?: string }> {
  const session = await requireSession();
  if (!session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 1. Password Verification using sys-login (which allows reading user_credentials)
  const passwordError = await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: credRows } = await client.query(
      "SELECT * FROM user_credentials WHERE user_id = $1",
      [userId]
    );

    const credRecord = credRows[0];
    if (!credRecord) {
      await hashPassword(password); // mitigate timing attack
      return "INVALID_PASSWORD";
    }

    if (credRecord.locked_until && new Date(credRecord.locked_until) > new Date()) {
      return "ACCOUNT_LOCKED";
    }

    const MAX_FAILED_ATTEMPTS = 5; // standard from auth
    const isPasswordValid = await verifyPassword(password, credRecord.password_hash, credRecord.params);
    if (!isPasswordValid) {
      await client.query(
        `UPDATE user_credentials SET
           failed_attempts = CASE WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1 ELSE failed_attempts + 1 END,
           locked_until = CASE
             WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN NULL
             WHEN failed_attempts + 1 >= $2 THEN NOW() + interval '15 minutes'
             ELSE locked_until END,
           updated_at = NOW()
         WHERE user_id = $1`,
        [userId, MAX_FAILED_ATTEMPTS]
      );
      return "INVALID_PASSWORD";
    }

    await client.query(
      "UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE user_id = $1",
      [userId]
    );

    return null;
  });

  if (passwordError) {
    return { success: false, errorCode: passwordError };
  }

  // 2. Mark users.deleted_at first, before mutating memberships
  // We use sys-login context since it is allowed to touch users and is the canonical context used during auth mutations.
  await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query(
      "UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
      [userId]
    );
  });

  // 3. Discover user's current workspace memberships
  const memberships = await TenantContextManager.runWithSystemContext(userId, "sys-list-workspaces", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows } = await client.query(`
      SELECT m.organization_id, m.role, o.name as org_name
      FROM organization_members m
      JOIN organizations o ON m.organization_id = o.id
      WHERE m.user_id = $1 AND o.deleted_at IS NULL
    `, [userId]);
    return rows;
  });

  // 4. For each organization, inspect other administrators and apply consequences
  for (const membership of memberships) {
    const orgId = membership.organization_id;

    // We must run in tenant context to mutate tenant-scoped tables safely
    await TenantContextManager.runWithTenantContext(orgId, userId, "ctx-remove-member", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in tenant context");
      const db = drizzle(client);

      // Check for other valid administrators by using FOR UPDATE OF m within the tenant context's built-in transaction
      // Note: Because we already updated deleted_at = NOW() for the current user, they won't be counted here!
      const { rows: adminRows } = await client.query(`
        SELECT count(*) AS admin_count FROM (
          SELECT m.user_id
          FROM organization_members m
          JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
          WHERE m.organization_id = $1 AND m.role = 'workspace_admin'
          FOR UPDATE OF m
        ) locked
      `, [orgId]);

      const activeAdminsCount = parseInt(adminRows[0].admin_count, 10);

      const isSoleAdmin = membership.role === 'workspace_admin' && activeAdminsCount === 0;

      if (isSoleAdmin) {
        // Unresolved product decision: sole administrator account deactivation handling.
        // Leaving the organization and membership untouched as per repository instructions.
        console.warn(`[J-034] User ${userId} is the sole administrator of organization ${orgId}. Preserving existing membership state as an unresolved product/architecture decision.`);
      } else {
        // Safe to remove the user's membership as another admin exists (or user is not an admin)
        await db.delete(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, orgId),
              eq(organizationMembers.userId, userId)
            )
          );
      }
    });
  }

  // 5. Revoke sessions
  await revokeAllForUser(userId);

  // 6. Explicitly record the account-deactivation audit event using sys-login context since no bespoke tag exists
  await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    await client.query(
      `INSERT INTO audit_records (
          id, actor_id, actor_email, actor_role, action, resource_type, resource_id, status, error_details, ip_address, user_agent
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )`,
      [
        userId,
        session.user!.email,
        session.user!.role,
        "account-deactivation",
        "user_account",
        userId,
        "success",
        null,
        "0.0.0.0",
        "system-context"
      ]
    );
  });

  return { success: true };
}
