import { TableDefinition } from "../types";

export const keywordsTable: TableDefinition = {
  tableName: "keywords",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique keyword identifier"
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
      name: "name",
      type: "TEXT",
      nullable: false,
      description: "Normalized lowercased search term"
    },
    {
      name: "display_name",
      type: "TEXT",
      nullable: false,
      description: "Verbatim query search term"
    },
    {
      name: "language",
      type: "TEXT",
      nullable: false,
      default: "'en'",
      description: "Locale classification"
    },
    {
      name: "intent",
      type: "TEXT",
      nullable: true,
      description: "Searcher buying/journey intent classification"
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
    "CREATE INDEX idx_keywords_organization ON keywords(organization_id);",
    "CREATE UNIQUE INDEX idx_keywords_name_org ON keywords(organization_id, name) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  intent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_keywords_organization ON keywords(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_name_org ON keywords(organization_id, name) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON keywords;
CREATE POLICY select_tenant_isolation_policy ON keywords
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON keywords;
CREATE POLICY insert_tenant_isolation_policy ON keywords
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON keywords;
CREATE POLICY update_tenant_isolation_policy ON keywords
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON keywords;
CREATE POLICY delete_tenant_isolation_policy ON keywords
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const keywordsTopicsTable: TableDefinition = {
  tableName: "keywords_topics",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "keyword_id",
      type: "UUID",
      nullable: false,
      references: { table: "keywords", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "topic_id",
      type: "UUID",
      nullable: false,
      references: { table: "topics", column: "id", onDelete: "CASCADE" }
    }
  ],
  sql: `
CREATE TABLE IF NOT EXISTS keywords_topics (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (keyword_id, topic_id)
);

ALTER TABLE keywords_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords_topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON keywords_topics;
CREATE POLICY select_tenant_isolation_policy ON keywords_topics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON keywords_topics;
CREATE POLICY insert_tenant_isolation_policy ON keywords_topics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON keywords_topics;
CREATE POLICY update_tenant_isolation_policy ON keywords_topics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON keywords_topics;
CREATE POLICY delete_tenant_isolation_policy ON keywords_topics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
