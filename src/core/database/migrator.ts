import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as path from "path";

export async function runMigrations(databaseUrl?: string) {
  const connectionString = databaseUrl || process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL environment variable is required to run migrations.");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  try {
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
