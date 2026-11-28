-- Stage 2: enforce tenant ownership for both KG relationship endpoints.
-- The separate read-only KG auditor reports global diagnostics; these composite foreign keys are authoritative.
-- No existing relationship is rewritten or deleted.
-- The validated composite foreign keys below are the authoritative fail-closed integrity check.

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
