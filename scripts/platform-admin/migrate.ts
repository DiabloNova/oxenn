import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";
import { assertDedicatedPlatformAdminDatabaseUrl } from "../../src/features/admin/security/platform-admin-database-guard";

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

  const pool = new Pool({
    connectionString: migrationUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
    application_name: "oxenn-platform-admin-migrator",
  });

  try {
    const database = drizzle(pool);
    const migrationsFolder = path.resolve(process.cwd(), "database/platform-admin/drizzle");
    await migrate(database, {
      migrationsFolder,
      migrationsTable: "__platform_admin_drizzle_migrations",
      migrationsSchema: "public",
    });
    process.stdout.write("Platform Admin Drizzle migrations applied successfully.\n");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Platform Admin migration failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
});
