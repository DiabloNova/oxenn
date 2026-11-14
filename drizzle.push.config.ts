import { defineConfig } from "drizzle-kit";
import { assertDbPushGuardAttestation } from "./scripts/database/db-push-attestation";
import { resolveConfiguredDbPushTarget } from "./scripts/database/db-push-guard";

// This config fails closed on accidental direct invocation by requiring a
// short-lived marker created by db:push after catalog checks. This is defense
// in depth, not an authenticated proof: a same-user process can fabricate the
// marker. Production credentials must remain unavailable to developer processes.
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
