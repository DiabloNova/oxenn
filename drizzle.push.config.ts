import { defineConfig } from "drizzle-kit";
import { resolveConfiguredDbPushTarget } from "./scripts/database/db-push-guard";

// Importing this configuration fails unless the target ID and URL match an
// explicitly reviewed disposable Workspace database. The package-script guard
// performs the asynchronous catalog attestation before this CLI is launched.
const { connectionString } = resolveConfiguredDbPushTarget();

export default defineConfig({
  schema: "./database/schema/index.ts",
  out: "./database/drizzle",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  schemaFilter: ["public"],
  extensionsFilters: [],
  strict: true,
});
