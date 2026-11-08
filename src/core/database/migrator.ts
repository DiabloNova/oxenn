import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as path from "path";

export async function runMigrations(databaseUrl?: string) {
  const deploymentEnvironment = process.env.NODE_ENV === "production"
    ? "production"
    : (process.env.APP_ENVIRONMENT || "development");
  const isNonDevelopment = deploymentEnvironment !== "development";
  const migrationUrl = databaseUrl || process.env.MIGRATION_DATABASE_URL;
  if (isNonDevelopment && !migrationUrl) {
    throw new Error("MIGRATION_DATABASE_URL is required outside development; runtime credentials cannot be reused for migrations.");
  }
  const connectionString = migrationUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL environment variable is required to run migrations.");
  }

  if (isNonDevelopment) {
    const migrationRole = new URL(connectionString).username;
    const runtimeUrl = process.env.DATABASE_URL;
    const runtimeRole = runtimeUrl ? new URL(runtimeUrl).username : "";
    if (!migrationRole || decodeURIComponent(migrationRole).toLowerCase() === "postgres") {
      throw new Error("Migrations require a dedicated non-superuser PostgreSQL role.");
    }
    if (runtimeRole && decodeURIComponent(migrationRole).toLowerCase() === decodeURIComponent(runtimeRole).toLowerCase()) {
      throw new Error("MIGRATION_DATABASE_URL must use a separate role from DATABASE_URL.");
    }
  }

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  try {
    const roleCheck = await pool.query<{ rolsuper: boolean }>(
      "SELECT rolsuper FROM pg_roles WHERE rolname = current_user",
    );
    if (roleCheck.rows.length !== 1 || roleCheck.rows[0].rolsuper !== false) {
      throw new Error("Migration database role must exist and must not be a PostgreSQL superuser.");
    }

    const db = drizzle(pool);
    const migrationsFolder = path.resolve(process.cwd(), "database/drizzle");
    console.log(`[Migration Runner] Executing Drizzle migrations from: ${migrationsFolder}`);

    // Pre-migration step: Ensure pgvector extension exists
    try {
      console.log("[Migration Runner] Ensuring pgvector extension is created...");
      await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");
    } catch (extError: unknown) {
      const err = extError as { code?: string; message?: string };
      if (err.code === "42501" || (err.message && err.message.includes("permission denied"))) {
        console.error("\n[Migration Runner] FATAL: Insufficient privileges to create the 'vector' extension.");
        console.error("Please run the following script as a database superuser:");
        console.error("  psql -U postgres -d your_db -f database/bootstrap.sql\n");
        throw new Error("Insufficient privileges to create 'vector' extension.");
      } else {
        console.error("[Migration Runner] Failed to create vector extension:", err.message);
        throw extError;
      }
    }

    // Store Drizzle migration metadata table in the 'public' schema to avoid CREATE SCHEMA permission issues on restricted roles
    await migrate(db, {
      migrationsFolder,
      migrationsTable: "__drizzle_migrations",
      migrationsSchema: "public",
    });

    console.log("[Migration Runner] All migrations applied successfully.");
  } finally {
    await pool.end();
  }
}

// Allow direct CLI execution
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error("[Migration Runner] Migration failed:", err);
      process.exit(1);
    });
}
