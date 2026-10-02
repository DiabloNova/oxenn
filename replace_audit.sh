cat << 'INNER_EOF' > /tmp/audit.diff
<<<<<<< SEARCH
    const auditId = randomUUID();
    await client.query(
      "INSERT INTO audit_records (id, action, actor_id, target_id, target_type, status, details, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [auditId, "grant_super_admin", "system", userId, "user", "success", JSON.stringify({ workspaceId }), workspaceId]
    );
=======
    const auditId = randomUUID();
    await client.query(
      "INSERT INTO audit_records (id, action, actor_id, actor_email, actor_role, resource_type, resource_id, ip_address, user_agent, status, payload_after) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [auditId, "grant_super_admin", "system", "system@local", "system", "organization_members", userId, "127.0.0.1", "cli", "success", JSON.stringify({ workspaceId, role: "super_admin" })]
    );
>>>>>>> REPLACE
INNER_EOF
