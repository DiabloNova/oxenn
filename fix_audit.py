import re

with open('src/app/actions/account.ts', 'r') as f:
    content = f.read()

audit_block = """
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
"""

content = content.replace("  return { success: true };", audit_block)

with open('src/app/actions/account.ts', 'w') as f:
    f.write(content)
