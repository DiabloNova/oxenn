import { TableDefinition } from "../types";

export const pagesTable: TableDefinition = {
  tableName: "pages",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique page identifier"
    },
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "organizations",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Tenant owner partition key"
    },
    {
      name: "website_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "websites",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Website container ownership"
    },
    {
      name: "url",
      type: "TEXT",
      nullable: false,
      description: "Canonical original URL of the resource"
    },
    {
      name: "normalized_url",
      type: "TEXT",
      nullable: false,
      description: "Normalized standardized URL"
    },
    {
      name: "path",
      type: "TEXT",
      nullable: false,
      description: "Relative URL path"
    },
    {
      name: "status_code",
      type: "INTEGER",
      nullable: true,
      description: "Last HTTP response status code"
    },
    {
      name: "indexability",
      type: "TEXT",
      nullable: false,
      description: "Indexability outcome status"
    },
    {
      name: "title",
      type: "TEXT",
      nullable: true,
      description: "Page SEO title"
    },
    {
      name: "description",
      type: "TEXT",
      nullable: true,
      description: "Page SEO meta description"
    },
    {
      name: "created_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()",
      description: "Timestamp when the record was created"
    },
    {
      name: "updated_at",
      type: "TIMESTAMP",
      nullable: false,
      default: "NOW()",
      description: "Timestamp when the record was last updated"
    },
    {
      name: "created_by",
      type: "TEXT",
      nullable: false,
      default: "'system'",
      description: "User or service that created the record"
    },
    {
      name: "updated_by",
      type: "TEXT",
      nullable: false,
      default: "'system'",
      description: "User or service that last updated the record"
    },
    {
      name: "deleted_at",
      type: "TIMESTAMP",
      nullable: true,
      description: "Timestamp when soft-deletion occurred"
    },
    {
      name: "version",
      type: "INTEGER",
      nullable: false,
      default: "1",
      description: "Optimistic locking version counter"
    }
  ],
  indexes: [
    "CREATE INDEX idx_pages_organization ON pages(organization_id);",
    "CREATE INDEX idx_pages_website ON pages(website_id);",
    "CREATE UNIQUE INDEX idx_pages_url_website ON pages(website_id, normalized_url) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  indexability TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pages_organization ON pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pages_website ON pages(website_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_url_website ON pages(website_id, normalized_url) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages;
CREATE POLICY select_tenant_isolation_policy ON pages
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages;
CREATE POLICY insert_tenant_isolation_policy ON pages
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages;
CREATE POLICY update_tenant_isolation_policy ON pages
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages;
CREATE POLICY delete_tenant_isolation_policy ON pages
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
export const pagesKeywordsTable: TableDefinition = {
  tableName: "pages_keywords",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "page_id",
      type: "UUID",
      nullable: false,
      references: { table: "pages", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "keyword_id",
      type: "UUID",
      nullable: false,
      references: { table: "keywords", column: "id", onDelete: "CASCADE" }
    }
  ],
  sql: `
CREATE TABLE IF NOT EXISTS pages_keywords (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, keyword_id)
);

ALTER TABLE pages_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_keywords FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_keywords;
CREATE POLICY select_tenant_isolation_policy ON pages_keywords
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_keywords;
CREATE POLICY insert_tenant_isolation_policy ON pages_keywords
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_keywords;
CREATE POLICY update_tenant_isolation_policy ON pages_keywords
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_keywords;
CREATE POLICY delete_tenant_isolation_policy ON pages_keywords
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const pagesTopicsTable: TableDefinition = {
  tableName: "pages_topics",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "page_id",
      type: "UUID",
      nullable: false,
      references: { table: "pages", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "topic_id",
      type: "UUID",
      nullable: false,
      references: { table: "topics", column: "id", onDelete: "CASCADE" }
    }
  ],
  sql: `
CREATE TABLE IF NOT EXISTS pages_topics (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, topic_id)
);

ALTER TABLE pages_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_topics;
CREATE POLICY select_tenant_isolation_policy ON pages_topics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_topics;
CREATE POLICY insert_tenant_isolation_policy ON pages_topics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_topics;
CREATE POLICY update_tenant_isolation_policy ON pages_topics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_topics;
CREATE POLICY delete_tenant_isolation_policy ON pages_topics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const pagesEntitiesTable: TableDefinition = {
  tableName: "pages_entities",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "page_id",
      type: "UUID",
      nullable: false,
      references: { table: "pages", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "entity_id",
      type: "UUID",
      nullable: false,
      references: { table: "entities", column: "id", onDelete: "CASCADE" }
    }
  ],
  sql: `
CREATE TABLE IF NOT EXISTS pages_entities (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, entity_id)
);

ALTER TABLE pages_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_entities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_entities;
CREATE POLICY select_tenant_isolation_policy ON pages_entities
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_entities;
CREATE POLICY insert_tenant_isolation_policy ON pages_entities
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_entities;
CREATE POLICY update_tenant_isolation_policy ON pages_entities
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_entities;
CREATE POLICY delete_tenant_isolation_policy ON pages_entities
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
