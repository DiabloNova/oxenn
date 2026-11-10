const PLATFORM_ADMIN_MIGRATION_LOCK_NAME = "oxenn-platform-admin-drizzle-migrations";

export interface PlatformAdminMigrationLockClient {
  query(queryText: string, values?: unknown[]): Promise<unknown>;
}

export async function withPlatformAdminMigrationLock<T>(
  client: PlatformAdminMigrationLockClient,
  runMigrations: () => Promise<T>,
  onUnlockError: (error: unknown) => void = () => undefined,
): Promise<T> {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [PLATFORM_ADMIN_MIGRATION_LOCK_NAME]);

  try {
    return await runMigrations();
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [PLATFORM_ADMIN_MIGRATION_LOCK_NAME]);
    } catch (unlockError) {
      try {
        onUnlockError(unlockError);
      } catch {
        // Cleanup reporting must not replace the migration result.
      }
    }
  }
}
