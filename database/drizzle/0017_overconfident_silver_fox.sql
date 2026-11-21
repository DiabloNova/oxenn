CREATE TABLE "user_legal_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"brand_name" text,
	"legal_type" text NOT NULL,
	"registration_country_code" text NOT NULL,
	"national_id" text,
	"industry" text NOT NULL,
	"custom_industry" text,
	"headquarters_country_code" text NOT NULL,
	"headquarters_province" text NOT NULL,
	"headquarters_city" text NOT NULL,
	"representative_position" text NOT NULL,
	"representative_relationship" text NOT NULL,
	"representative_phone_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_legal_profiles_registration_country_check" CHECK ("user_legal_profiles"."registration_country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "user_legal_profiles_headquarters_country_check" CHECK ("user_legal_profiles"."headquarters_country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "user_legal_profiles_representative_phone_check" CHECK ("user_legal_profiles"."representative_phone_number" IS NULL OR "user_legal_profiles"."representative_phone_number" ~ '^\+[1-9][0-9]{7,14}$')
);
--> statement-breakpoint
CREATE TABLE "user_websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"platform_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_websites_platform_type_check" CHECK ("user_websites"."platform_type" IN ('official_website', 'ecommerce_store', 'social_network', 'marketplace', 'other'))
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "identity_type" text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "age_range" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_job_title" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_industry" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "sms_notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_legal_profiles" ADD CONSTRAINT "user_legal_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_websites" ADD CONSTRAINT "user_websites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_websites_user_id" ON "user_websites" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_websites_user_url" ON "user_websites" USING btree ("user_id","url");--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_identity_type_check" CHECK ("user_profiles"."identity_type" IN ('individual', 'legal_entity'));--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_gender_check" CHECK ("user_profiles"."gender" IS NULL OR "user_profiles"."gender" IN ('male', 'female'));--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_age_range_check" CHECK ("user_profiles"."age_range" IS NULL OR "user_profiles"."age_range" IN ('under_18', '18_24', '25_34', '35_44', '45_54', '55_64', '65_plus'));--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_phone_e164_check" CHECK ("user_profiles"."phone_number" IS NULL OR "user_profiles"."phone_number" ~ '^\+[1-9][0-9]{7,14}$');--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_sms_verified_phone_check" CHECK ("user_profiles"."sms_notifications_enabled" = false OR ("user_profiles"."phone_number" IS NOT NULL AND "user_profiles"."phone_verified_at" IS NOT NULL));