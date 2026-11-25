-- Stage 1: distinguish extracted KG observations from canonical domain Entities.
-- Canonical entities remain authoritative; this migration only records exact, unique matches.

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
  ON "kg_entities" USING btree ("canonical_entity_id", "tenant_id");
--> statement-breakpoint
ALTER TABLE "kg_entities" ADD CONSTRAINT "kg_entities_canonical_entity_id_tenant_id_fkey"
  FOREIGN KEY ("canonical_entity_id", "tenant_id")
  REFERENCES "public"."entities" ("id", "organization_id") ON DELETE CASCADE ON UPDATE NO ACTION;
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

-- Backfill only when exactly one active canonical Entity matches normalized name + exact type
-- within the same Organization. Zero matches remain unresolved; multiple matches remain ambiguous.
WITH exact_matches AS (
  SELECT kg.id,
         COUNT(entity.id) AS match_count,
         MIN(entity.id::text)::uuid AS canonical_entity_id
  FROM kg_entities AS kg
  LEFT JOIN entities AS entity
    ON entity.organization_id = kg.tenant_id
   AND LOWER(BTRIM(entity.name)) = LOWER(BTRIM(kg.name))
   AND entity.entity_type = kg.type
   AND entity.deleted_at IS NULL
  GROUP BY kg.id
)
UPDATE kg_entities AS kg
SET canonical_entity_id = CASE WHEN matches.match_count = 1 THEN matches.canonical_entity_id ELSE NULL END,
    resolution_status = CASE
      WHEN matches.match_count = 1 THEN 'matched'
      WHEN matches.match_count > 1 THEN 'ambiguous'
      ELSE 'unresolved'
    END,
    resolution_method = CASE WHEN matches.match_count = 1 THEN 'exact_name_type' ELSE NULL END,
    resolved_at = CASE WHEN matches.match_count = 1 THEN NOW() ELSE NULL END
FROM exact_matches AS matches
WHERE kg.id = matches.id;
