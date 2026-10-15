ALTER TABLE "admin_users" ALTER COLUMN "role_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "role" text DEFAULT 'Read-Only Observer' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "sso_identities" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "created_by" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;