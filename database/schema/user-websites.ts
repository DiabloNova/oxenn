import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { users } from "./users";

/** User-level website and selling-channel directory shared by dashboard tools. */
export const userWebsites = pgTable("user_websites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  platformType: text("platform_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_user_websites_user_id").on(table.userId),
  uniqueIndex("idx_user_websites_user_url").on(table.userId, table.url),
  check("user_websites_platform_type_check", sql`${table.platformType} IN ('official_website', 'ecommerce_store', 'social_network', 'marketplace', 'other')`),
]);
