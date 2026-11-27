-- Stage 1: add canonical-resolution schema for the controlled tenant-scoped Backfill.
-- Canonical entities remain authoritative; only a unique same-tenant normalized name/type match may resolve.

ALTER TABLE "kg_entities"
  ADD COLUMN "canonical_entity_id" uuid,
  ADD COLUMN "resolution_status" text DEFAULT 'unresolved' NOT NULL,
  ADD COLUMN "resolution_method" text,
  ADD COLUMN "resolved_at" timestamp with time zone,
  ADD COLUMN "source_chunk_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_kg_entities_id_tenant_id_fk"
  ON "kg_entities" USING btree ("id", "tenant_id");
--> statement-breakpoint
CREATE INDEX "idx_kg_entities_canonical_entity"
  ON "kg_entities" USING btree ("tenant_id", "canonical_entity_id");
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_canonical_entity_id_tenant_id_fkey"
  FOREIGN KEY ("canonical_entity_id", "tenant_id")
  REFERENCES "public"."entities" ("id", "organization_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_resolution_status_check"
  CHECK ("resolution_status" IN ('matched', 'unresolved', 'ambiguous'));
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_resolution_consistency_check"
  CHECK (("resolution_status" = 'matched') = ("canonical_entity_id" IS NOT NULL));
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_matched_method_check"
  CHECK ("resolution_status" <> 'matched' OR "resolution_method" IS NOT NULL);
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_source_chunk_ids_array_check"
  CHECK (jsonb_typeof("source_chunk_ids") = 'array');
--> statement-breakpoint

-- Data resolution is intentionally performed by the separate RLS-safe, tenant-scoped Backfill command
-- after migrations 0018 and 0019 have been validated.
