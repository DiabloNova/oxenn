import type { PoolClient } from "pg";

type WorkspaceLockClient = Pick<PoolClient, "query">;

/**
 * Acquire the account row lock shared by account deactivation and operations
 * that create workspace memberships or sessions.
 */
export async function lockActiveUser(
  client: WorkspaceLockClient,
  userId: string,
): Promise<boolean> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id
     FROM users
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [userId],
  );
  return rows.length === 1;
}

/**
 * Acquire the workspace serialization lock shared by membership changes,
 * invitation acceptance, workspace switching, and account deactivation.
 */
export async function lockActiveWorkspace(
  client: WorkspaceLockClient,
  workspaceId: string,
): Promise<boolean> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id
     FROM organizations
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [workspaceId],
  );
  return rows.length === 1;
}
