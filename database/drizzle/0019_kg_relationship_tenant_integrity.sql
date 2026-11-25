-- Stage 2: enforce tenant ownership for both KG relationship endpoints.
-- Preflight is read-only and intentionally fails closed; no existing relationship is rewritten or deleted.

DO $$
DECLARE
  source_mismatch_count bigint;
  source_sample_ids text;
  target_mismatch_count bigint;
  target_sample_ids text;
BEGIN
  SELECT COUNT(*) INTO source_mismatch_count
  FROM kg_relationships AS relationship
  LEFT JOIN kg_entities AS source_entity
    ON source_entity.id = relationship.source_entity_id
  WHERE source_entity.id IS NULL
     OR source_entity.tenant_id <> relationship.tenant_id;

  IF source_mismatch_count > 0 THEN
    SELECT string_agg(sample.id::text, ', ' ORDER BY sample.id) INTO source_sample_ids
    FROM (
      SELECT relationship.id
      FROM kg_relationships AS relationship
      LEFT JOIN kg_entities AS source_entity
        ON source_entity.id = relationship.source_entity_id
      WHERE source_entity.id IS NULL
         OR source_entity.tenant_id <> relationship.tenant_id
      ORDER BY relationship.id
      LIMIT 10
    ) AS sample;
    RAISE EXCEPTION '0019 preflight failed: % kg_relationships row(s) have a missing or cross-tenant source endpoint. Sample relationship IDs: %',
      source_mismatch_count, COALESCE(source_sample_ids, 'unavailable');
  END IF;

  SELECT COUNT(*) INTO target_mismatch_count
  FROM kg_relationships AS relationship
  LEFT JOIN kg_entities AS target_entity
    ON target_entity.id = relationship.target_entity_id
  WHERE target_entity.id IS NULL
     OR target_entity.tenant_id <> relationship.tenant_id;

  IF target_mismatch_count > 0 THEN
    SELECT string_agg(sample.id::text, ', ' ORDER BY sample.id) INTO target_sample_ids
    FROM (
      SELECT relationship.id
      FROM kg_relationships AS relationship
      LEFT JOIN kg_entities AS target_entity
        ON target_entity.id = relationship.target_entity_id
      WHERE target_entity.id IS NULL
         OR target_entity.tenant_id <> relationship.tenant_id
      ORDER BY relationship.id
      LIMIT 10
    ) AS sample;
    RAISE EXCEPTION '0019 preflight failed: % kg_relationships row(s) have a missing or cross-tenant target endpoint. Sample relationship IDs: %',
      target_mismatch_count, COALESCE(target_sample_ids, 'unavailable');
  END IF;
END
$$;
--> statement-breakpoint

ALTER TABLE "kg_relationships"
  DROP CONSTRAINT IF EXISTS "kg_relationships_source_entity_id_kg_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "kg_relationships"
  DROP CONSTRAINT IF EXISTS "kg_relationships_target_entity_id_kg_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_source_entity_id_tenant_id_fkey"
  FOREIGN KEY ("source_entity_id", "tenant_id")
  REFERENCES "public"."kg_entities" ("id", "tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "kg_relationships" ADD CONSTRAINT "kg_relationships_target_entity_id_tenant_id_fkey"
  FOREIGN KEY ("target_entity_id", "tenant_id")
  REFERENCES "public"."kg_entities" ("id", "tenant_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX "idx_kg_relationships_source_tenant"
  ON "kg_relationships" USING btree ("source_entity_id", "tenant_id");
--> statement-breakpoint
CREATE INDEX "idx_kg_relationships_target_tenant"
  ON "kg_relationships" USING btree ("target_entity_id", "tenant_id");
