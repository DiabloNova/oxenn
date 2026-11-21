import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

const defaultNow = sql`NOW()`;

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  identityType: text("identity_type").notNull().default("individual"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  ageRange: text("age_range"),
  jobTitle: text("job_title"),
  customJobTitle: text("custom_job_title"),
  industry: text("industry"),
  customIndustry: text("custom_industry"),
  phoneNumber: text("phone_number"),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(defaultNow),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(defaultNow),
}, (table) => [
  uniqueIndex("idx_user_profiles_lower_username").on(sql`lower(${table.username})`),
  check("user_profiles_identity_type_check", sql`${table.identityType} IN ('individual', 'legal_entity')`),
  check("user_profiles_gender_check", sql`${table.gender} IS NULL OR ${table.gender} IN ('male', 'female')`),
  check("user_profiles_age_range_check", sql`${table.ageRange} IS NULL OR ${table.ageRange} IN ('under_18', '18_24', '25_34', '35_44', '45_54', '55_64', '65_plus')`),
  check("user_profiles_phone_e164_check", sql`${table.phoneNumber} IS NULL OR ${table.phoneNumber} ~ '^\\+[1-9][0-9]{7,14}$'`),
  check("user_profiles_sms_verified_phone_check", sql`${table.smsNotificationsEnabled} = false OR (${table.phoneNumber} IS NOT NULL AND ${table.phoneVerifiedAt} IS NOT NULL)`),
]);
