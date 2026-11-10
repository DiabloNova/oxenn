import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import path from "node:path";
import { assertDedicatedPlatformAdminDatabaseUrl } from "../../src/features/admin/security/platform-admin-database-guard";
import { withPlatformAdminMigrationLock } from "./migration-lock";

async function main(): Promise<void> {
  const runtimeUrl = process.env.PLATFORM_ADMIN_DATABASE_URL;
  const migrationUrl = process.env.PLATFORM_ADMIN_MIGRATION_DATABASE_URL;
  if (!runtimeUrl || !migrationUrl) {
    throw new Error(
      "PLATFORM_ADMIN_DATABASE_URL and PLATFORM_ADMIN_MIGRATION_DATABASE_URL are required; no Workspace database fallback is permitted.",
    );
  }
  assertDedicatedPlatformAdminDatabaseUrl(runtimeUrl);
  assertDedicatedPlatformAdminDatabaseUrl(migrationUrl);

  const client = new Client({
    connectionString: migrationUrl,
    connectionTimeoutMillis: 5_000,
    application_name: "oxenn-platform-admin-migrator",
  });

  try {
    await client.connect();
    await withPlatformAdminMigrationLock(
      client,
      async () => {
        const database = drizzle(client);
        const migrationsFolder = path.resolve(process.cwd(), "database/platform-admin/drizzle");
        await migrate(database, {
          migrationsFolder,
          migrationsTable: "__platform_admin_drizzle_migrations",
          migrationsSchema: "public",
        });
      },
      (error) => {
        process.stderr.write(
          `Warning: Platform Admin migrations finished, but advisory-lock cleanup failed; the connection will be closed. ${error instanceof Error ? error.message : "unknown cleanup error"}\n`,
        );
      },
    );
    process.stdout.write("Platform Admin Drizzle migrations applied successfully.\n");
  } finally {
    try {
      await client.end();
    } catch (error) {
      process.stderr.write(
        `Warning: Platform Admin migration connection cleanup failed. ${error instanceof Error ? error.message : "unknown cleanup error"}\n`,
      );
    }
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Platform Admin migration failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
});
