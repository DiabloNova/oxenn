import { pgTable, uuid, text, timestamp, integer, uniqueIndex, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const defaultUuid = sql`gen_random_uuid()`;
const defaultNow = sql`NOW()`;

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().default(defaultUuid),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
  createdBy: text("created_by").notNull().default("system"),
  updatedBy: text("updated_by").notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
}, (table) => [
  uniqueIndex("idx_organizations_slug").on(table.slug).where(sql`deleted_at IS NULL`),
  pgPolicy("select_org_isolation_policy", {
    for: "select",
    using: sql`id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
  }),
  pgPolicy("insert_org_isolation_policy", {
    for: "insert",
    withCheck: sql`id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
  }),
  pgPolicy("update_org_isolation_policy", {
    for: "update",
    using: sql`id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`,
    withCheck: sql`id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
  }),
  pgPolicy("delete_org_isolation_policy", {
    for: "delete",
    using: sql`id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
  })
]);
