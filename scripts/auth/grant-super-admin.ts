import { randomUUID } from "crypto";
import { TenantContextManager } from "../../src/core/database/tenant-context";

/**
 * Grant the operator-only super_admin role without orphaning an active
 * workspace. The organization row is the serialization point shared with
 * workspace membership changes and account deactivation.
 */
export async function grantSuperAdmin(userId: string, workspaceId: string): Promise<string> {
  if (!userId || !workspaceId) {
    throw new Error("Both userId and workspaceId are required.");
  }

  return TenantContextManager.runWithSystemContext(null, "sys-admin-run", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");

    const { rows: workspaceRows } = await client.query(
      `SELECT id
       FROM organizations
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [workspaceId]
    );
    if (workspaceRows.length === 0) {
      throw new Error("Workspace is inactive or does not exist.");
    }

    const { rows: membershipRows } = await client.query(
      `SELECT m.id, m.role
       FROM organization_members m
       INNER JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
       WHERE m.user_id = $1 AND m.organization_id = $2
       FOR UPDATE OF m`,
      [userId, workspaceId]
    );
    const membership = membershipRows[0];
    if (!membership) {
      throw new Error("User is not an active member of the workspace.");
    }

    if (membership.role === "workspace_admin") {
      const { rows: adminRows } = await client.query(
        `SELECT COUNT(*)::int AS admin_count
         FROM organization_members m
         INNER JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
         WHERE m.organization_id = $1 AND m.role = 'workspace_admin'`,
        [workspaceId]
      );
      if (Number(adminRows[0]?.admin_count ?? 0) <= 1) {
        throw new Error("Cannot grant super_admin to the final active workspace administrator.");
      }
    }

    const { rows: updatedRows, rowCount } = await client.query(
      `UPDATE organization_members
       SET role = 'super_admin', updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [membership.id]
    );
    if (rowCount !== 1 || !updatedRows[0]) {
      throw new Error("The workspace membership changed while granting super_admin.");
    }

    const auditId = randomUUID();
    await client.query(
      "INSERT INTO audit_records (id, action, actor_id, actor_email, actor_role, resource_type, resource_id, ip_address, user_agent, status, payload_after) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [auditId, "grant_super_admin", "system", "system@local", "system", "organization_members", updatedRows[0].id, "127.0.0.1", "cli", "success", JSON.stringify({ workspaceId, role: "super_admin" })]
    );

    return updatedRows[0].id as string;
  });
}

async function main() {
  const args = process.argv.slice(2);
  let userId = "";
  let workspaceId = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--user-id" && args[i + 1]) {
      userId = args[i + 1];
      i++;
    } else if (args[i] === "--workspace-id" && args[i + 1]) {
      workspaceId = args[i + 1];
      i++;
    }
  }

  if (!userId || !workspaceId) {
    console.error("Usage: tsx scripts/auth/grant-super-admin.ts --user-id <user-id> --workspace-id <workspace-id>");
    process.exit(1);
  }

  try {
    const membershipId = await grantSuperAdmin(userId, workspaceId);
    console.log(`Successfully granted super_admin to user ${userId} for workspace ${workspaceId} (membership ${membershipId}).`);
  } catch (err) {
    console.error("Failed to grant super_admin:", err);
    process.exit(1);
  }
}

// Avoid executing the CLI when the exported operation is imported by unit tests.
const invokedScript = process.argv[1]?.replace(/\\\\/g, "/") ?? "";
if (invokedScript.endsWith("/scripts/auth/grant-super-admin.ts") || invokedScript.endsWith("/scripts/auth/grant-super-admin.js") ||
    invokedScript === "scripts/auth/grant-super-admin.ts" || invokedScript === "scripts/auth/grant-super-admin.js") {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
