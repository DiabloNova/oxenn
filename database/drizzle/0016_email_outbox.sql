CREATE TABLE "email_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "kind" text NOT NULL,
  "token_hash" text NOT NULL,
  "payload_ciphertext" text NOT NULL,
  "payload_iv" text NOT NULL,
  "payload_auth_tag" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "available_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "locked_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "last_error_code" text,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  CONSTRAINT "email_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "email_outbox_kind_check" CHECK ("kind" IN ('verification', 'password_reset')),
  CONSTRAINT "email_outbox_status_check" CHECK ("status" IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  CONSTRAINT "email_outbox_attempts_check" CHECK ("attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_email_outbox_kind_token_hash" ON "email_outbox" USING btree ("kind", "token_hash");
--> statement-breakpoint
CREATE INDEX "idx_email_outbox_dispatch" ON "email_outbox" USING btree ("status", "available_at");
--> statement-breakpoint
CREATE INDEX "idx_email_outbox_stale_lock" ON "email_outbox" USING btree ("status", "locked_at");
--> statement-breakpoint
CREATE INDEX "idx_email_outbox_user_id" ON "email_outbox" USING btree ("user_id");
