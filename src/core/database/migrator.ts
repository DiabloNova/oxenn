import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

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
    .catch((err) => {
      console.error("[Migration Runner] Migration failed:", err);
      process.exit(1);
    });
}
