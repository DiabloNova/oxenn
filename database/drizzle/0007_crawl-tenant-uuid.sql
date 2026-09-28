DROP POLICY IF EXISTS "crawl_tenant_policy" ON "crawl_jobs";
--> statement-breakpoint
DROP POLICY IF EXISTS "crawl_tenant_policy" ON "crawl_results";
--> statement-breakpoint
DROP POLICY IF EXISTS "crawl_tenant_policy" ON "crawl_cache";
--> statement-breakpoint
ALTER TABLE "crawl_jobs" ALTER COLUMN "tenant_id" SET DATA TYPE uuid USING "tenant_id"::uuid;
ALTER TABLE "crawl_results" ALTER COLUMN "tenant_id" SET DATA TYPE uuid USING "tenant_id"::uuid;
ALTER TABLE "crawl_cache" ALTER COLUMN "tenant_id" SET DATA TYPE uuid USING "tenant_id"::uuid;

DO $$ BEGIN
 ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_results" ADD CONSTRAINT "crawl_results_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_cache" ADD CONSTRAINT "crawl_cache_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "crawl_jobs" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "crawl_jobs" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "crawl_jobs" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "crawl_jobs" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "crawl_results" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "crawl_results" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "crawl_results" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "crawl_results" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "select_tenant_id_isolation_policy" ON "crawl_cache" AS PERMISSIVE FOR SELECT TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "insert_tenant_id_isolation_policy" ON "crawl_cache" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "update_tenant_id_isolation_policy" ON "crawl_cache" AS PERMISSIVE FOR UPDATE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "delete_tenant_id_isolation_policy" ON "crawl_cache" AS PERMISSIVE FOR DELETE TO public USING ("tenant_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
