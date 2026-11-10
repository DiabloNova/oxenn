const PLATFORM_ADMIN_MIGRATION_LOCK_NAME = "oxenn-platform-admin-drizzle-migrations";

export interface PlatformAdminMigrationLockClient {
  query(queryText: string, values?: unknown[]): Promise<unknown>;
}

export async function withPlatformAdminMigrationLock<T>(
  client: PlatformAdminMigrationLockClient,
  runMigrations: () => Promise<T>,
): Promise<T> {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [PLATFORM_ADMIN_MIGRATION_LOCK_NAME]);

  let migrationFailed = false;
  try {
    return await runMigrations();
  } catch (error) {
    migrationFailed = true;
    throw error;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [PLATFORM_ADMIN_MIGRATION_LOCK_NAME]);
    } catch (unlockError) {
      if (!migrationFailed) throw unlockError;
    }
  }
}
