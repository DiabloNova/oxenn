-- DB-001: Enforce tenant consistency for every junction-table reference.
-- This preflight is deliberately read-only. Do not auto-reassign or delete mismatched rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "pages_keywords" junction
    JOIN "pages" parent ON parent."id" = junction."page_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_keywords.page_id references a page owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "pages_keywords" junction
    JOIN "keywords" parent ON parent."id" = junction."keyword_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_keywords.keyword_id references a keyword owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "pages_topics" junction
    JOIN "pages" parent ON parent."id" = junction."page_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_topics.page_id references a page owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "pages_topics" junction
    JOIN "topics" parent ON parent."id" = junction."topic_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_topics.topic_id references a topic owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "pages_entities" junction
    JOIN "pages" parent ON parent."id" = junction."page_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_entities.page_id references a page owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "pages_entities" junction
    JOIN "entities" parent ON parent."id" = junction."entity_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: pages_entities.entity_id references an entity owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "keywords_topics" junction
    JOIN "keywords" parent ON parent."id" = junction."keyword_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: keywords_topics.keyword_id references a keyword owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "keywords_topics" junction
    JOIN "topics" parent ON parent."id" = junction."topic_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: keywords_topics.topic_id references a topic owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "topics_entities" junction
    JOIN "topics" parent ON parent."id" = junction."topic_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: topics_entities.topic_id references a topic owned by another organization.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "topics_entities" junction
    JOIN "entities" parent ON parent."id" = junction."entity_id"
    WHERE parent."organization_id" <> junction."organization_id"
  ) THEN
    RAISE EXCEPTION 'DB-001 preflight failed: topics_entities.entity_id references an entity owned by another organization.';
  END IF;
END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pages_id_organization_id_fk" ON "pages" USING btree ("id", "organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_keywords_id_organization_id_fk" ON "keywords" USING btree ("id", "organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_topics_id_organization_id_fk" ON "topics" USING btree ("id", "organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_entities_id_organization_id_fk" ON "entities" USING btree ("id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_keywords_page_id_org_id_fk" ON "pages_keywords" USING btree ("page_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_keywords_keyword_id_org_id_fk" ON "pages_keywords" USING btree ("keyword_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_topics_page_id_org_id_fk" ON "pages_topics" USING btree ("page_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_topics_topic_id_org_id_fk" ON "pages_topics" USING btree ("topic_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_entities_page_id_org_id_fk" ON "pages_entities" USING btree ("page_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_pages_entities_entity_id_org_id_fk" ON "pages_entities" USING btree ("entity_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_keywords_topics_keyword_id_org_id_fk" ON "keywords_topics" USING btree ("keyword_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_keywords_topics_topic_id_org_id_fk" ON "keywords_topics" USING btree ("topic_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_topics_entities_topic_id_org_id_fk" ON "topics_entities" USING btree ("topic_id", "organization_id");
--> statement-breakpoint
CREATE INDEX "idx_topics_entities_entity_id_org_id_fk" ON "topics_entities" USING btree ("entity_id", "organization_id");
--> statement-breakpoint
ALTER TABLE "pages_keywords" ADD CONSTRAINT "pages_keywords_page_id_org_id_fkey" FOREIGN KEY ("page_id", "organization_id") REFERENCES "public"."pages" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_keywords" ADD CONSTRAINT "pages_keywords_keyword_id_org_id_fkey" FOREIGN KEY ("keyword_id", "organization_id") REFERENCES "public"."keywords" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_topics" ADD CONSTRAINT "pages_topics_page_id_org_id_fkey" FOREIGN KEY ("page_id", "organization_id") REFERENCES "public"."pages" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_topics" ADD CONSTRAINT "pages_topics_topic_id_org_id_fkey" FOREIGN KEY ("topic_id", "organization_id") REFERENCES "public"."topics" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_entities" ADD CONSTRAINT "pages_entities_page_id_org_id_fkey" FOREIGN KEY ("page_id", "organization_id") REFERENCES "public"."pages" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_entities" ADD CONSTRAINT "pages_entities_entity_id_org_id_fkey" FOREIGN KEY ("entity_id", "organization_id") REFERENCES "public"."entities" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "keywords_topics" ADD CONSTRAINT "keywords_topics_keyword_id_org_id_fkey" FOREIGN KEY ("keyword_id", "organization_id") REFERENCES "public"."keywords" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "keywords_topics" ADD CONSTRAINT "keywords_topics_topic_id_org_id_fkey" FOREIGN KEY ("topic_id", "organization_id") REFERENCES "public"."topics" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "topics_entities" ADD CONSTRAINT "topics_entities_topic_id_org_id_fkey" FOREIGN KEY ("topic_id", "organization_id") REFERENCES "public"."topics" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "topics_entities" ADD CONSTRAINT "topics_entities_entity_id_org_id_fkey" FOREIGN KEY ("entity_id", "organization_id") REFERENCES "public"."entities" ("id", "organization_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pages_keywords" DROP CONSTRAINT "pages_keywords_page_id_pages_id_fk";
--> statement-breakpoint
ALTER TABLE "pages_keywords" DROP CONSTRAINT "pages_keywords_keyword_id_keywords_id_fk";
--> statement-breakpoint
ALTER TABLE "pages_topics" DROP CONSTRAINT "pages_topics_page_id_pages_id_fk";
--> statement-breakpoint
ALTER TABLE "pages_topics" DROP CONSTRAINT "pages_topics_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "pages_entities" DROP CONSTRAINT "pages_entities_page_id_pages_id_fk";
--> statement-breakpoint
ALTER TABLE "pages_entities" DROP CONSTRAINT "pages_entities_entity_id_entities_id_fk";
--> statement-breakpoint
ALTER TABLE "keywords_topics" DROP CONSTRAINT "keywords_topics_keyword_id_keywords_id_fk";
--> statement-breakpoint
ALTER TABLE "keywords_topics" DROP CONSTRAINT "keywords_topics_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "topics_entities" DROP CONSTRAINT "topics_entities_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "topics_entities" DROP CONSTRAINT "topics_entities_entity_id_entities_id_fk";
