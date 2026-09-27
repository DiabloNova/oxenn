import { TableDefinition } from "../types";

export const topicsTable: TableDefinition = {
  tableName: "topics",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique topic identifier"
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
      description: "Canonical topic/subject name"
    },
    {
      name: "description",
      type: "TEXT",
      nullable: true,
      description: "Detailed topic description text"
    },
    {
      name: "language",
      type: "TEXT",
      nullable: false,
      default: "'en'",
      description: "Locale classification code"
    },
    {
      name: "parent_topic_id",
      type: "UUID",
      nullable: true,
      references: {
        table: "topics",
        column: "id",
        onDelete: "SET NULL"
      },
      description: "Parent hierarchy topic relationship"
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
    "CREATE INDEX idx_topics_organization ON topics(organization_id);",
    "CREATE INDEX idx_topics_parent ON topics(parent_topic_id);",
    "CREATE UNIQUE INDEX idx_topics_name_org ON topics(organization_id, name) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_topics_organization ON topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_name_org ON topics(organization_id, name) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON topics;
CREATE POLICY select_tenant_isolation_policy ON topics
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON topics;
CREATE POLICY insert_tenant_isolation_policy ON topics
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON topics;
CREATE POLICY update_tenant_isolation_policy ON topics
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON topics;
CREATE POLICY delete_tenant_isolation_policy ON topics
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const topicsEntitiesTable: TableDefinition = {
  tableName: "topics_entities",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: { table: "organizations", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "topic_id",
      type: "UUID",
      nullable: false,
      references: { table: "topics", column: "id", onDelete: "CASCADE" }
    },
    {
      name: "entity_id",
      type: "UUID",
      nullable: false,
      references: { table: "entities", column: "id", onDelete: "CASCADE" }
    }
  ],
  sql: `
CREATE TABLE IF NOT EXISTS topics_entities (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, entity_id)
);

ALTER TABLE topics_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics_entities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON topics_entities;
CREATE POLICY select_tenant_isolation_policy ON topics_entities
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON topics_entities;
CREATE POLICY insert_tenant_isolation_policy ON topics_entities
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON topics_entities;
CREATE POLICY update_tenant_isolation_policy ON topics_entities
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON topics_entities;
CREATE POLICY delete_tenant_isolation_policy ON topics_entities
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
