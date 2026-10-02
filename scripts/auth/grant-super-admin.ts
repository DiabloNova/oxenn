import { PostgresClient } from "../../src/features/admin/infrastructure/persistence/postgres";
import { randomUUID } from "crypto";

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

  const pgClient = PostgresClient.getInstance();
  const client = await pgClient.connectSystemClient("sys-admin-run");

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "UPDATE organization_members SET role = 'super_admin' WHERE user_id = $1 AND organization_id = $2 RETURNING id",
      [userId, workspaceId]
    );

    if (rows.length === 0) {
      console.error(`User ${userId} is not a member of workspace ${workspaceId}.`);
      await client.query("ROLLBACK");
      process.exit(1);
    }

    const auditId = randomUUID();
    await client.query(
      "INSERT INTO audit_records (id, action, actor_id, actor_email, actor_role, resource_type, resource_id, ip_address, user_agent, status, payload_after) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [auditId, "grant_super_admin", "system", "system@local", "system", "organization_members", userId, "127.0.0.1", "cli", "success", JSON.stringify({ workspaceId, role: "super_admin" })]
    );

    await client.query("COMMIT");
    console.log(`Successfully granted super_admin to user ${userId} for workspace ${workspaceId}.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to grant super_admin:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
