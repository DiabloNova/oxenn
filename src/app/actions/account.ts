"use server";

import { requireSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { hashPassword, verifyPassword } from "@/services/auth/passwords";

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

  // 2. Close any workspace that would otherwise lose its final active
  // workspace_admin, and remove this user's memberships elsewhere. All of
  // these changes, account deactivation, session revocation, and the audit
  // event share one system transaction so a failure rolls the operation back.
  const deactivationError = await TenantContextManager.runWithSystemContext(userId, "sys-login", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) throw new Error("Failed to get DB client in system context");

      const { rows: activeUserRows } = await client.query(
        `SELECT id
         FROM users
         WHERE id = $1 AND deleted_at IS NULL
         FOR UPDATE`,
        [userId]
      );

      if (activeUserRows.length === 0) return "ACCOUNT_ALREADY_DEACTIVATED";

      const { rows: memberships } = await client.query(
        `SELECT m.organization_id, m.role
         FROM organization_members m
         INNER JOIN organizations o ON o.id = m.organization_id AND o.deleted_at IS NULL
         WHERE m.user_id = $1
         ORDER BY m.organization_id ASC`,
        [userId]
      );

      // Stable lock order prevents two multi-workspace deactivations from
      // deadlocking when they share more than one organization.
      for (const membership of memberships) {
        const orgId = membership.organization_id as string;

        // The system path is explicitly scoped to one tenant for each set of
        // RLS-protected workspace queries. The setting is transaction-local.
        await client.query(
          "SELECT set_config('app.current_tenant_id', $1, true)",
          [orgId]
        );

        const { rows: organizationRows } = await client.query(
          `SELECT id
           FROM organizations
           WHERE id = $1 AND deleted_at IS NULL
           FOR UPDATE`,
          [orgId]
        );
        if (organizationRows.length === 0) continue;

        const { rows: currentMembershipRows } = await client.query(
          `SELECT m.role
           FROM organization_members m
           INNER JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
           WHERE m.organization_id = $1 AND m.user_id = $2
           FOR UPDATE OF m`,
          [orgId, userId]
        );
        const currentRole = currentMembershipRows[0]?.role;
        if (!currentRole) continue;

        const { rows: adminRows } = await client.query(
          `SELECT COUNT(*)::int AS admin_count
           FROM organization_members m
           INNER JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
           WHERE m.organization_id = $1 AND m.role = 'workspace_admin'`,
          [orgId]
        );
        const activeAdminsCount = Number(adminRows[0]?.admin_count ?? 0);

        const workspaceMustClose =
          activeAdminsCount === 0 ||
          (currentRole === "workspace_admin" && activeAdminsCount === 1);

        if (workspaceMustClose) {
          // Preserve workspace data and memberships for audit/recovery, but
          // mark the workspace inactive and revoke every session scoped to it.
          await client.query(
            `UPDATE organizations
             SET deleted_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`,
            [orgId]
          );
          await client.query(
            `UPDATE sessions
             SET revoked_at = NOW()
             WHERE workspace_id = $1 AND revoked_at IS NULL`,
            [orgId]
          );
        } else {
          // Another active workspace_admin remains, so this account can be
          // detached without violating the workspace administrator invariant.
          await client.query(
            `DELETE FROM organization_members
             WHERE organization_id = $1 AND user_id = $2`,
            [orgId, userId]
          );
          await client.query(
            `UPDATE sessions
             SET revoked_at = NOW()
             WHERE user_id = $1 AND workspace_id = $2 AND revoked_at IS NULL`,
            [userId, orgId]
          );
        }
      }

      // Do not let the last tenant setting leak into subsequent system work.
      await client.query("SELECT set_config('app.current_tenant_id', '', true)");

      const { rowCount: deactivatedRows } = await client.query(
        `UPDATE users
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL`,
        [userId]
      );
      if (deactivatedRows !== 1) {
        throw new Error("Account deactivation lost its locked user row; rolling back.");
      }

      await client.query(
        `UPDATE sessions
         SET revoked_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );

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

      return null;
    });

  if (deactivationError) {
    return { success: false, errorCode: deactivationError };
  }

  return { success: true };
}
