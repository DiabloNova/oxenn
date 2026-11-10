import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { assertDedicatedPlatformAdminDatabaseUrl } from "../../src/features/admin/security/platform-admin-database-guard";

async function main(): Promise<void> {
  const connectionString = process.env.PLATFORM_ADMIN_MIGRATION_DATABASE_URL;
  if (!connectionString) {
    throw new Error("PLATFORM_ADMIN_MIGRATION_DATABASE_URL is required; no Workspace database fallback is permitted.");
  }
  assertDedicatedPlatformAdminDatabaseUrl(
    connectionString,
    "PLATFORM_ADMIN_MIGRATION_DATABASE_URL",
  );

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    application_name: "oxenn-platform-admin-migrator",
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('oxenn-platform-admin-migrations'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS platform_admin_schema_migrations (
          id text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const migrationId = "0001_platform_admin_control_plane";
      const applied = await client.query(
        "SELECT 1 FROM platform_admin_schema_migrations WHERE id = $1",
        [migrationId],
      );

      if (applied.rowCount === 0) {
        const migrationPath = path.resolve(
          process.cwd(),
          "database/platform-admin/migrations/0001_platform_admin_control_plane.sql",
        );
        const migrationSql = await readFile(migrationPath, "utf8");
        await client.query(migrationSql);
        await client.query(
          "INSERT INTO platform_admin_schema_migrations (id) VALUES ($1)",
          [migrationId],
        );
      }

      await client.query("COMMIT");
      process.stdout.write(
        `Platform Admin migration ${migrationId}: ${applied.rowCount === 0 ? "applied" : "already applied"}.\n`,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
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
