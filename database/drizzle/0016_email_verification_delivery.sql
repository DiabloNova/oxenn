ALTER TABLE "email_verification_tokens"
  ADD COLUMN "email_snapshot" text,
  ADD COLUMN "delivery_status" text DEFAULT 'pending' NOT NULL,
  ADD COLUMN "sent_at" timestamp with time zone,
  ADD COLUMN "last_delivery_error" text;
--> statement-breakpoint
ALTER TABLE "email_verification_tokens"
  ADD CONSTRAINT "email_verification_tokens_delivery_status_check"
  CHECK ("delivery_status" IN ('pending', 'sent', 'failed'));
