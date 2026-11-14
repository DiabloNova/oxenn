import { defineConfig } from "drizzle-kit";

/**
 * Schema-only configuration for migration generation and chain validation.
 * Mutating push operations use drizzle.push.config.ts and the db:push guard.
 */
export default defineConfig({
  schema: "./database/schema/index.ts",
  out: "./database/drizzle",
  dialect: "postgresql",
});
