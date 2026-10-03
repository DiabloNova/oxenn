CREATE TABLE "auth_rate_limits" (
	"endpoint" text NOT NULL,
	"bucket_key" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_rate_limits_endpoint_bucket_key_pk" PRIMARY KEY("endpoint","bucket_key")
);
--> statement-breakpoint
CREATE INDEX "idx_auth_rate_limits_expires" ON "auth_rate_limits" USING btree ("expires_at");