import { TableDefinition } from "../types";

export const diagnosticFindingsTable: TableDefinition = {
  tableName: "diagnostic_findings",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique finding identifier"
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
      description: "Website context identifier"
    },
    {
      name: "category",
      type: "TEXT",
      nullable: false,
      description: "Diagnostic domain category (technical, content, seo, aeo, entity, citation, competitive)"
    },
    {
      name: "code",
      type: "TEXT",
      nullable: false,
      description: "Machine-readable diagnostic finding code"
    },
    {
      name: "title",
      type: "TEXT",
      nullable: false,
      description: "Short finding summary"
    },
    {
      name: "explanation",
      type: "TEXT",
      nullable: false,
      description: "Detailed explanatory rationale"
    },
    {
      name: "severity",
      type: "TEXT",
      nullable: false,
      description: "Severity level of impact if real (low, medium, high, critical)"
    },
    {
      name: "confidence",
      type: "TEXT",
      nullable: false,
      description: "Statistical strength of evidence supporting the diagnosis (low, medium, high)"
    },
    {
      name: "status",
      type: "TEXT",
      nullable: false,
      default: "'active'",
      description: "Resolution status of finding (active, resolved, ignored)"
    },
    {
      name: "affected_resource",
      type: "TEXT",
      nullable: false,
      description: "URL path, sitemap path, or brand domain affected"
    },
    {
      name: "evidence",
      type: "JSONB",
      nullable: false,
      default: "'{}'::jsonb",
      description: "Structured diagnostic evidence JSON properties"
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
    "CREATE INDEX idx_diagnostic_findings_organization ON diagnostic_findings(organization_id);",
    "CREATE INDEX idx_diagnostic_findings_website ON diagnostic_findings(website_id);",
    "CREATE INDEX idx_diagnostic_findings_category ON diagnostic_findings(category);",
    "CREATE UNIQUE INDEX idx_diagnostic_findings_dedup ON diagnostic_findings(organization_id, website_id, code, affected_resource) WHERE deleted_at IS NULL;"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS diagnostic_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  affected_resource TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_organization ON diagnostic_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_website ON diagnostic_findings(website_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_category ON diagnostic_findings(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_findings_dedup ON diagnostic_findings(organization_id, website_id, code, affected_resource) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE diagnostic_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_findings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY select_tenant_isolation_policy ON diagnostic_findings
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY insert_tenant_isolation_policy ON diagnostic_findings
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY update_tenant_isolation_policy ON diagnostic_findings
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY delete_tenant_isolation_policy ON diagnostic_findings
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const diagnosticFindingRelationshipsTable: TableDefinition = {
  tableName: "diagnostic_finding_relationships",
  columns: [
    {
      name: "organization_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "organizations",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Organization (tenant) partition key"
    },
    {
      name: "source_finding_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "diagnostic_findings",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Symptom or causing finding identifier"
    },
    {
      name: "target_finding_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "diagnostic_findings",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Affected or root cause finding identifier"
    },
    {
      name: "relationship_type",
      type: "TEXT",
      nullable: false,
      description: "Directional predicate mapping (caused_by, contributes_to, depends_on, duplicate_of, related_to, affects, supported_by)"
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
    "CREATE INDEX idx_finding_relationships_organization ON diagnostic_finding_relationships(organization_id);",
    "CREATE INDEX idx_finding_relationships_source ON diagnostic_finding_relationships(source_finding_id);",
    "CREATE INDEX idx_finding_relationships_target ON diagnostic_finding_relationships(target_finding_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS diagnostic_finding_relationships (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_finding_id UUID NOT NULL REFERENCES diagnostic_findings(id) ON DELETE CASCADE,
  target_finding_id UUID NOT NULL REFERENCES diagnostic_findings(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (source_finding_id, target_finding_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_finding_relationships_organization ON diagnostic_finding_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_finding_relationships_source ON diagnostic_finding_relationships(source_finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_relationships_target ON diagnostic_finding_relationships(target_finding_id);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE diagnostic_finding_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_finding_relationships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY select_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY insert_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY update_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY delete_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
