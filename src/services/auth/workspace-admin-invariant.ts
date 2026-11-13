import type { PoolClient } from "pg";

type WorkspaceAdminClient = Pick<PoolClient, "query">;

/**
 * Return whether removing or demoting one active workspace_admin can proceed.
 *
 * Callers must first hold the parent organizations row FOR UPDATE lock and
 * lock/re-read the target membership. The shared organization lock serializes
 * this count with every supported operation that can reduce the admin count.
 */
export async function hasAnotherActiveWorkspaceAdmin(
  client: WorkspaceAdminClient,
  workspaceId: string,
): Promise<boolean> {
  const { rows } = await client.query<{ admin_count: number | string }>(
    `SELECT COUNT(*)::int AS admin_count
     FROM organization_members m
     INNER JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
     WHERE m.organization_id = $1 AND m.role = 'workspace_admin'`,
    [workspaceId],
  );

  return Number(rows[0]?.admin_count ?? 0) > 1;
}
