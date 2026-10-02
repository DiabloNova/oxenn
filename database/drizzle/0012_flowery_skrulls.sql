CREATE INDEX "idx_users_lower_email" ON "users" USING btree (lower("email"));
-- Backfill normalization migration for existing mixed-case emails
UPDATE "users" SET email = lower(trim(email));
