import { TableDefinition } from "../types";

export const aiVisibilityAuditsTable: TableDefinition = {
  tableName: "ai_visibility_audits",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique identifier for the AI visibility audit"
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
      description: "Organization (tenant) partition key"
    },
    {
      name: "brand_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "brands",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Linked brand audited"
    },
    {
      name: "status",
      type: "TEXT",
      nullable: false,
      default: "'PENDING'",
      description: "Lifecycle status of the audit"
    },
    {
      name: "overall_score",
      type: "INTEGER",
      nullable: true,
      description: "Overall composite AI visibility score (0 to 100)"
    },
    {
      name: "metrics",
      type: "JSONB",
      nullable: false,
      description: "Individual category metrics score breakdown"
    },
    {
      name: "prompts_coverage",
      type: "JSONB",
      nullable: false,
      description: "Aggregated prompt execution stats"
    },
    {
      name: "evidence_summary",
      type: "JSONB",
      nullable: false,
      description: "List of extracted citations, mentions, and evidence highlights"
    },
    {
      name: "scoring_version",
      type: "TEXT",
      nullable: false,
      default: "'1.0.0'",
      description: "Version of scoring weights logic used"
    },
    {
      name: "analyzer_version",
      type: "TEXT",
      nullable: false,
      default: "'1.0.0'",
      description: "Version of parsing/extracting analyzer engine used"
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
      description: "Soft deletion timestamp"
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
    "CREATE INDEX idx_ai_visibility_audits_organization ON ai_visibility_audits(organization_id);",
    "CREATE INDEX idx_ai_visibility_audits_brand ON ai_visibility_audits(brand_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS ai_visibility_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'ANALYZING', 'COMPLETED', 'FAILED')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompts_coverage JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_version TEXT NOT NULL DEFAULT '1.0.0',
  analyzer_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_organization ON ai_visibility_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_brand ON ai_visibility_audits(brand_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_status ON ai_visibility_audits(status);

ALTER TABLE ai_visibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_audits FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY select_tenant_isolation_policy ON ai_visibility_audits
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY insert_tenant_isolation_policy ON ai_visibility_audits
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY update_tenant_isolation_policy ON ai_visibility_audits
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY delete_tenant_isolation_policy ON ai_visibility_audits
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};

export const auditPromptsTable: TableDefinition = {
  tableName: "audit_prompts",
  columns: [
    {
      name: "id",
      type: "UUID",
      nullable: false,
      primaryKey: true,
      description: "Unique query tracking key for the audit prompt"
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
      description: "Organization (tenant) partition key"
    },
    {
      name: "audit_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "ai_visibility_audits",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Linked AI visibility audit"
    },
    {
      name: "prompt_text",
      type: "TEXT",
      nullable: false,
      description: "Prompt text"
    },
    {
      name: "category",
      type: "TEXT",
      nullable: false,
      description: "Category of the prompt"
    },
    {
      name: "target_entity",
      type: "TEXT",
      nullable: false,
      description: "Target entity name"
    },
    {
      name: "locale",
      type: "TEXT",
      nullable: false,
      description: "Locale of prompt (fa, en)"
    },
    {
      name: "status",
      type: "TEXT",
      nullable: false,
      default: "'PENDING'",
      description: "Status of prompt execution"
    },
    {
      name: "error_message",
      type: "TEXT",
      nullable: true,
      description: "Failure error message if any"
    },
    {
      name: "latency_ms",
      type: "INTEGER",
      nullable: true,
      description: "Prompt execution latency in ms"
    },
    {
      name: "executed_at",
      type: "TIMESTAMP",
      nullable: true,
      description: "When prompt was executed"
    },
    {
      name: "response_text",
      type: "TEXT",
      nullable: true,
      description: "Captured raw LLM response text"
    },
    {
      name: "analysis",
      type: "JSONB",
      nullable: false,
      description: "Parsed visibility, mentions, citations, entity, and scoring analysis JSON"
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
      description: "Soft deletion timestamp"
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
    "CREATE INDEX idx_audit_prompts_organization ON audit_prompts(organization_id);",
    "CREATE INDEX idx_audit_prompts_audit ON audit_prompts(audit_id);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS audit_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES ai_visibility_audits(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  latency_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE,
  response_text TEXT,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_audit_prompts_organization ON audit_prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_prompts_audit ON audit_prompts(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_prompts_status ON audit_prompts(status);

ALTER TABLE audit_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_prompts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON audit_prompts;
CREATE POLICY select_tenant_isolation_policy ON audit_prompts
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON audit_prompts;
CREATE POLICY insert_tenant_isolation_policy ON audit_prompts
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON audit_prompts;
CREATE POLICY update_tenant_isolation_policy ON audit_prompts
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON audit_prompts;
CREATE POLICY delete_tenant_isolation_policy ON audit_prompts
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
