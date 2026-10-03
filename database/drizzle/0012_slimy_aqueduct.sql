DO $$ BEGIN
  IF EXISTS (SELECT lower(trim(email)) FROM users GROUP BY 1 HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Case-insensitive duplicate emails exist in users; resolve before migrating';
  END IF;
END $$;--> statement-breakpoint
UPDATE "users" SET email = lower(trim(email)) WHERE email <> lower(trim(email));--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_lower_email" ON "users" USING btree (lower("email"));