import { defineConfig } from "drizzle-kit";
import { assertDbPushGuardAttestation } from "./scripts/database/db-push-attestation";
import { resolveConfiguredDbPushTarget } from "./scripts/database/db-push-guard";

// This config fails closed on accidental direct invocation: it requires a
// short-lived attestation file written by the db:push wrapper after catalog
// attestation. The file is not cryptographically unforgeable; a same-user
// process can fabricate it, so it is not proof that the guard executed.
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
