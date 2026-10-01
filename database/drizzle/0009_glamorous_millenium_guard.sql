CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"workspace_id" uuid,
	"role_snapshot" text,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by" uuid,
	"user_agent" text,
	"ip" text,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workspace_id_organizations_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_replaced_by_sessions_id_fk" FOREIGN KEY ("replaced_by") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;