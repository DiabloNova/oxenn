import { defineConfig } from "drizzle-kit";
import { assertDbPushGuardAttestation } from "./scripts/database/db-push-attestation";
import { resolveConfiguredDbPushTarget } from "./scripts/database/db-push-guard";

// This config cannot be invoked directly: the single db:push wrapper must first
// complete asynchronous catalog attestation and issue a short-lived token bound
// to the exact reviewed target ID and connection URL.
const { target, connectionString } = resolveConfiguredDbPushTarget();
assertDbPushGuardAttestation(target.id, connectionString);

export default defineConfig({
  schema: "./database/schema/index.ts",
  out: "./database/drizzle",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  schemaFilter: ["public"],
  extensionsFilters: [],
  strict: true,
});
