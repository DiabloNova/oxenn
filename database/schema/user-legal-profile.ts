import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

/** Legal-entity details entered by a user; separate from the person's account identity. */
export const userLegalProfiles = pgTable("user_legal_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  brandName: text("brand_name"),
  legalType: text("legal_type").notNull(),
  registrationCountryCode: text("registration_country_code").notNull(),
  nationalId: text("national_id"),
  industry: text("industry").notNull(),
  customIndustry: text("custom_industry"),
  headquartersCountryCode: text("headquarters_country_code").notNull(),
  headquartersProvince: text("headquarters_province").notNull(),
  headquartersCity: text("headquarters_city").notNull(),
  representativePosition: text("representative_position").notNull(),
  representativeRelationship: text("representative_relationship").notNull(),
  representativePhoneNumber: text("representative_phone_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("user_legal_profiles_registration_country_check", sql`${table.registrationCountryCode} ~ '^[A-Z]{2}$'`),
  check("user_legal_profiles_headquarters_country_check", sql`${table.headquartersCountryCode} ~ '^[A-Z]{2}$'`),
  check("user_legal_profiles_representative_phone_check", sql`${table.representativePhoneNumber} IS NULL OR ${table.representativePhoneNumber} ~ '^\\+[1-9][0-9]{7,14}$'`),
]);
