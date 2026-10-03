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
export async function deactivateAccountAction(password: string) {
  const session = await requireSession();
  if (!session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
    // 1. Password Verification using sys-login (which allows reading user_credentials)
  await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: credRows } = await client.query(
      "SELECT * FROM user_credentials WHERE user_id = $1",
      [userId]
    );

    const credRecord = credRows[0];
    if (!credRecord) {
      await hashPassword(password); // mitigate timing attack
      throw new Error("Invalid password");
    }

    const isPasswordValid = await verifyPassword(password, credRecord.password_hash, credRecord.params);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }
  });

  // 2. Discover user's current workspace memberships
  // 3. Mark user as deactivated
  // sys-auth-check is an existing context allowed to read/write the "users" table.
  // Wait, wait, is there a context that is better? We will use sys-login as it already is used for mutating passwords and users (like confirmPasswordReset).
  // I will use sys-login to run the whole sequence if possible? No, we will fetch orgs.
  // Let's get the list of orgs first.
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

  // For each organization, inspect other administrators and apply consequences
  for (const membership of memberships) {
    const orgId = membership.organization_id;

    // We must run in tenant context to mutate tenant-scoped tables safely
    await TenantContextManager.runWithTenantContext(orgId, userId, "ctx-remove-member", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in tenant context");
      const db = drizzle(client);

      // Check for other valid administrators
      const { rows: adminRows } = await client.query(`
        SELECT count(*) as admin_count
        FROM organization_members
        WHERE organization_id = $1 AND role = 'workspace_admin'
      `, [orgId]);

      const totalAdmins = parseInt(adminRows[0].admin_count, 10);

      const isSoleAdmin = membership.role === 'workspace_admin' && totalAdmins === 1;

      await client.query("BEGIN");
      try {
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
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
  }

  // 4. Mark users.deleted_at
  // We use sys-login context since it is allowed to touch users and is the canonical context used during auth mutations.
  await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    await client.query(
      "UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
      [userId]
    );
  });

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
