import { TableDefinition } from "../types";

export const competitiveSeoFindingsTable: TableDefinition = {
  tableName: "competitive_seo_findings",
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
      name: "competitor_id",
      type: "UUID",
      nullable: false,
      references: {
        table: "competitors",
        column: "id",
        onDelete: "CASCADE"
      },
      description: "Discovered competitor link reference"
    },
    {
      name: "finding_type",
      type: "TEXT",
      nullable: false,
      description: "Finding type category (technical_gap, content_gap, keyword_gap, topic_gap, structural_difference, ai_visibility_gap, citation_gap, prompt_gap, brand_mention_gap, ai_recommendation_gap, citation_overlap)"
    },
    {
      name: "comparison_scope",
      type: "TEXT",
      nullable: false,
      description: "SEO signal dimension being evaluated"
    },
    {
      name: "competitive_position",
      type: "TEXT",
      nullable: false,
      description: "Relative standing (advantage, disadvantage, neutral)"
    },
    {
      name: "tenant_value",
      type: "TEXT",
      nullable: true,
      description: "Value or coverage rating for target brand"
    },
    {
      name: "competitor_value",
      type: "TEXT",
      nullable: true,
      description: "Value or coverage rating for competitor"
    },
    {
      name: "difference",
      type: "DOUBLE PRECISION",
      nullable: true,
      description: "Calculated numeric difference metric"
    },
    {
      name: "difference_direction",
      type: "TEXT",
      nullable: false,
      description: "Calculated numeric delta direction (positive, negative, none)"
    },
    {
      name: "severity",
      type: "TEXT",
      nullable: false,
      description: "Severity level of find (low, medium, high, critical)"
    },
    {
      name: "evidence",
      type: "JSONB",
      nullable: false,
      default: "'{}'::jsonb",
      description: "Detailed supporting trace contexts"
    },
    {
      name: "source_reference",
      type: "TEXT",
      nullable: true,
      description: "URL or ID where raw source was extracted"
    },
    {
      name: "calculation_metadata",
      type: "JSONB",
      nullable: false,
      default: "'{}'::jsonb",
      description: "Intermediate engine parameters and scores"
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
      name: "version",
      type: "INTEGER",
      nullable: false,
      default: "1",
      description: "Optimistic locking version counter"
    }
  ],
  indexes: [
    "CREATE INDEX idx_comp_seo_findings_organization ON competitive_seo_findings(organization_id);",
    "CREATE INDEX idx_comp_seo_findings_competitor ON competitive_seo_findings(competitor_id);",
    "CREATE INDEX idx_comp_seo_findings_type_scope ON competitive_seo_findings(finding_type, comparison_scope);"
  ],
  sql: `
CREATE TABLE IF NOT EXISTS competitive_seo_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference',
    'ai_visibility_gap', 'citation_gap', 'prompt_gap', 'brand_mention_gap', 'ai_recommendation_gap', 'citation_overlap'
  )),
  comparison_scope TEXT NOT NULL,
  competitive_position TEXT NOT NULL CHECK (competitive_position IN ('advantage', 'disadvantage', 'neutral')),
  tenant_value TEXT,
  competitor_value TEXT,
  difference DOUBLE PRECISION,
  difference_direction TEXT NOT NULL CHECK (difference_direction IN ('positive', 'negative', 'none')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_reference TEXT,
  calculation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_organization ON competitive_seo_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_competitor ON competitive_seo_findings(competitor_id);
CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_type_scope ON competitive_seo_findings(finding_type, comparison_scope);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE competitive_seo_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_seo_findings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY select_tenant_isolation_policy ON competitive_seo_findings
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY insert_tenant_isolation_policy ON competitive_seo_findings
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY update_tenant_isolation_policy ON competitive_seo_findings
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY delete_tenant_isolation_policy ON competitive_seo_findings
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  `
};
