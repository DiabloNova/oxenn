-- Stage 3: align Entity persistence with the canonical Organization-owned model.
-- This migration is additive except for replacing EntityRelationship's single-column
-- endpoint FKs with composite tenant-safe FKs. No existing rows are rewritten.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM entity_relationships rel
    JOIN entities source_entity ON source_entity.id = rel.source_entity_id
    WHERE source_entity.organization_id <> rel.organization_id
  ) THEN
    RAISE EXCEPTION '0017 preflight failed: an EntityRelationship source belongs to another Organization.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM entity_relationships rel
    JOIN entities target_entity ON target_entity.id = rel.target_entity_id
    WHERE target_entity.organization_id <> rel.organization_id
  ) THEN
    RAISE EXCEPTION '0017 preflight failed: an EntityRelationship target belongs to another Organization.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM entity_relationships
    WHERE deleted_at IS NULL
    GROUP BY organization_id, source_entity_id, target_entity_id, relationship_type
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION '0017 preflight failed: duplicate active EntityRelationships prevent creation of the active unique index.';
  END IF;
END
$$;
--> statement-breakpoint

ALTER TABLE "brands" ALTER COLUMN "industry" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "properties" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_brands_id_organization_id_fk" ON "brands" USING btree ("id", "organization_id");
--> statement-breakpoint

ALTER TABLE "entity_relationships" ADD COLUMN "properties" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_entity_relationships_source_org";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_entity_relationships_target_org";
--> statement-breakpoint
CREATE INDEX "idx_entity_relationships_source_org" ON "entity_relationships" USING btree ("source_entity_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_entity_relationships_target_org" ON "entity_relationships" USING btree ("target_entity_id", "organization_id");
--> statement-breakpoint
ALTER TABLE "entity_relationships" DROP CONSTRAINT IF EXISTS "entity_relationships_source_entity_id_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "entity_relationships" DROP CONSTRAINT IF EXISTS "entity_relationships_target_entity_id_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_source_entity_id_org_id_fkey"
  FOREIGN KEY ("source_entity_id", "organization_id")
  REFERENCES "public"."entities" ("id", "organization_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_target_entity_id_org_id_fkey"
  FOREIGN KEY ("target_entity_id", "organization_id")
  REFERENCES "public"."entities" ("id", "organization_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_entity_relationships_active_unique"
  ON "entity_relationships" USING btree ("organization_id", "source_entity_id", "target_entity_id", "relationship_type")
  WHERE deleted_at IS NULL;
--> statement-breakpoint

CREATE TABLE "brand_entity_associations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "brand_id" uuid NOT NULL,
  "entity_id" uuid NOT NULL,
  "relationship_type" text NOT NULL,
  "weight" double precision DEFAULT 1 NOT NULL,
  "properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "created_by" text DEFAULT 'system' NOT NULL,
  "updated_by" text DEFAULT 'system' NOT NULL,
  "deleted_at" timestamp with time zone,
  "version" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "brand_entity_associations_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
--> statement-breakpoint
CREATE INDEX "idx_brand_entity_associations_org" ON "brand_entity_associations" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_brand_entity_associations_brand_org" ON "brand_entity_associations" USING btree ("brand_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_brand_entity_associations_entity_org" ON "brand_entity_associations" USING btree ("entity_id", "organization_id");
--> statement-breakpoint
ALTER TABLE "brand_entity_associations" ADD CONSTRAINT "brand_entity_associations_brand_id_org_id_fkey"
  FOREIGN KEY ("brand_id", "organization_id")
  REFERENCES "public"."brands" ("id", "organization_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "brand_entity_associations" ADD CONSTRAINT "brand_entity_associations_entity_id_org_id_fkey"
  FOREIGN KEY ("entity_id", "organization_id")
  REFERENCES "public"."entities" ("id", "organization_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_brand_entity_associations_active_unique"
  ON "brand_entity_associations" USING btree ("organization_id", "brand_id", "entity_id", "relationship_type")
  WHERE deleted_at IS NULL;
--> statement-breakpoint

ALTER TABLE "brand_entity_associations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "brand_entity_associations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "select_organization_id_isolation_policy" ON "brand_entity_associations"
  AS PERMISSIVE FOR SELECT TO public
  USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "insert_organization_id_isolation_policy" ON "brand_entity_associations"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "update_organization_id_isolation_policy" ON "brand_entity_associations"
  AS PERMISSIVE FOR UPDATE TO public
  USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
--> statement-breakpoint
CREATE POLICY "delete_organization_id_isolation_policy" ON "brand_entity_associations"
  AS PERMISSIVE FOR DELETE TO public
  USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
