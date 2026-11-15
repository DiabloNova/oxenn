CREATE TABLE "user_profiles" (
  "user_id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_profiles_lower_username" ON "user_profiles" USING btree (lower("username"));
