-- Custom SQL migration file
ALTER TABLE "admin_users" DROP CONSTRAINT "admin_users_role_id_roles_id_fk";
ALTER TABLE "admin_users" DROP COLUMN "role_id";
ALTER TABLE "admin_users" ADD COLUMN "role" text DEFAULT 'Super Admin' NOT NULL;
ALTER TABLE "admin_users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "admin_users" ADD COLUMN "sso_identities" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "admin_users" ADD COLUMN "created_by" text DEFAULT 'system' NOT NULL;
ALTER TABLE "admin_users" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;

ALTER TABLE "feature_flags" ADD COLUMN "created_by" text DEFAULT 'system' NOT NULL;
ALTER TABLE "feature_flags" ADD COLUMN "updated_by" text DEFAULT 'system' NOT NULL;
ALTER TABLE "feature_flags" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
