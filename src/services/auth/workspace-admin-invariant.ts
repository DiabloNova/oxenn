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


export type WorkspaceMembershipChange =
  | { kind: "remove" }
  | { kind: "role"; newRole: string };

/**
 * Check whether a member removal or role change preserves an active
 * workspace_admin. The caller must already hold the parent organizations
 * row FOR UPDATE lock; this function locks and re-reads the target membership
 * before counting the remaining active administrators.
 */
export type WorkspaceMembershipChangeDecision = "allowed" | "last_admin" | "target_not_found";

export async function canChangeWorkspaceMember(
  client: WorkspaceAdminClient,
  workspaceId: string,
  memberId: string,
  change: WorkspaceMembershipChange,
): Promise<WorkspaceMembershipChangeDecision> {
  const { rows: targetRows } = await client.query<{
    role: string;
    user_active: boolean;
  }>(
    `SELECT m.role, (u.deleted_at IS NULL) AS user_active
     FROM organization_members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = $1 AND m.user_id = $2
     FOR UPDATE OF m`,
    [workspaceId, memberId],
  );

  const target = targetRows[0];
  if (!target) return "target_not_found";

  const changeReducesAdminCount =
    target.role === "workspace_admin" &&
    target.user_active &&
    (change.kind === "remove" || change.newRole !== "workspace_admin");

  if (!changeReducesAdminCount) return "allowed";

  return (await hasAnotherActiveWorkspaceAdmin(client, workspaceId))
    ? "allowed"
    : "last_admin";
}
