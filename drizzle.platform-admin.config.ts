import { defineConfig } from "drizzle-kit";
import { assertDedicatedPlatformAdminDatabaseUrl } from "./src/features/admin/security/platform-admin-database-guard";

const runtimeUrl = process.env.PLATFORM_ADMIN_DATABASE_URL;
const migrationUrl = process.env.PLATFORM_ADMIN_MIGRATION_DATABASE_URL;

if (!runtimeUrl || !migrationUrl) {
  throw new Error(
    "PLATFORM_ADMIN_DATABASE_URL and PLATFORM_ADMIN_MIGRATION_DATABASE_URL are required; no Workspace database fallback is permitted.",
  );
}

assertDedicatedPlatformAdminDatabaseUrl(runtimeUrl);
assertDedicatedPlatformAdminDatabaseUrl(migrationUrl);

export default defineConfig({
  schema: "./database/platform-admin/schema/index.ts",
  out: "./database/platform-admin/drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrationUrl },
});
