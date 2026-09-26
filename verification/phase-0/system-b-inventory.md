# System-B Database Inventory (0001_optimus_vector_kg.sql ... 0016_website_monitoring.sql)

## Executive Summary & Metrics Report
- **Total Handwritten Migration Files (System-B)**: 16
- **Total Tables Created**: 40
- **Total Extension Statements**: 2
- **Total Policies Created**: 147
- **Total RLS Statements**: 77 (ENABLE / FORCE RLS)
- **Total Indexes**: 90
- **Total Functions/Triggers**: 3 PL/pgSQL functions (`claim_crawl_jobs`, `recover_expired_crawl_jobs`, `complete_crawl_job_if_lease_owner`), 0 triggers

---
## Base Tables Creation Status Check
Question: Does ANY file in System-B (`database/migrations/`) create `organizations`, `brands`, `prompts`, `ai_engines`, `roles`, `permissions`, `admin_users`, `tenant_quotas`?

**Answer**: **None found** for all 8 tables.
- `organizations`: **not found**
- `brands`: **not found**
- `prompts`: **not found**
- `ai_engines`: **not found**
- `roles`: **not found**
- `permissions`: **not found**
- `admin_users`: **not found**
- `tenant_quotas`: **not found**

*Note*: While these tables are referenced as Foreign Key targets or in RLS policies (e.g. `organizations`, `brands`), none of the 16 System-B files contain `CREATE TABLE` statements for them.

---
## Style & Structural Anomalies
1. **`0015_api_keys.sql` Drizzle-Generated Style**:
   - Uses `--> statement-breakpoint` markers.
   - Uses double-quoted identifier names (e.g., `"api_keys"`, `"organization_id"`).
   - Uses explicit foreign key constraint naming (`api_keys_organization_id_organizations_id_fk`) and `AS PERMISSIVE ... TO public` policy syntax.
   - Uses `ENABLE ROW LEVEL SECURITY` without `FORCE ROW LEVEL SECURITY`.
   - Policy naming style uses column-centric names (`select_organization_id_isolation_policy`) rather than table-centric (`select_tenant_isolation_policy`).
2. **Missing RLS / Indexes in Early Migrations**:
   - `0002_technical_audits.sql` creates table `technical_audits` but contains **0 indexes, 0 RLS enable/force statements, and 0 security policies**.
3. **Constraint Modification Only File (`0014_competitive_ai_intelligence.sql`)**:
   - Contains 0 CREATE TABLE, 0 INDEX, 0 RLS statements. It only alters existing CHECK constraint `competitive_seo_findings_finding_type_check` on table `competitive_seo_findings`.
4. **Schema Scope / RLS Enforcement Anomalies**:
   - System-B consistently uses `ALTER TABLE <tbl> FORCE ROW LEVEL SECURITY;` across 15/16 files (except `0002` which lacks RLS entirely and `0015` which only uses `ENABLE`). Drizzle-generated chain (System-A) **never** uses `FORCE ROW LEVEL SECURITY`.

---
## Unique-to-System-B DDL Statements (Not in Generated Drizzle Chain 0000-0002)
Below is the explicit list of DDL constructs and objects unique to System-B that `database/drizzle/0000-0002` does NOT reproduce:

### 1. Unique Extensions
- `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (in `0004_crawl_acquisition.sql`) — *System-A only creates `vector` extension*.

### 2. Unique Functions
- `CREATE OR REPLACE FUNCTION claim_crawl_jobs(...)` (in `0004_crawl_acquisition.sql`)
- `CREATE OR REPLACE FUNCTION recover_expired_crawl_jobs()` (in `0004_crawl_acquisition.sql`)
- `CREATE OR REPLACE FUNCTION complete_crawl_job_if_lease_owner(...)` (in `0004_crawl_acquisition.sql`)

### 3. Unique Index Types & Index Definitions
- **HNSW Vector Index**: `CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding ON document_embeddings USING hnsw (embedding vector_cosine_ops);` (in `0001_optimus_vector_kg.sql`) — *System-A creates btree index on embedding column instead*.
- **Partial & Conditional Unique Indexes** (e.g. `WHERE deleted_at IS NULL`):
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_url_website ON pages(website_id, normalized_url) WHERE deleted_at IS NULL;`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_name_org ON keywords(organization_id, name) WHERE deleted_at IS NULL;`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_findings_dedup ON diagnostic_findings(organization_id, website_id, code, affected_resource) WHERE deleted_at IS NULL;`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_runs_unique ON prompt_executions(prompt_id, prompt_version, scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;`

### 4. Row Level Security Enforcement (`FORCE ROW LEVEL SECURITY`)
- All `ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;` statements across System-B tables (77 total FORCE RLS calls in System-B vs 0 in System-A).

### 5. Policy Naming Variants and Specific Custom Policies
- System-B policy names on several domain tables use generic names (`select_tenant_isolation_policy`, `insert_tenant_isolation_policy`, `update_tenant_isolation_policy`, `delete_tenant_isolation_policy`) or custom crawl policy names (`crawl_jobs_tenant_policy`, `crawl_results_tenant_policy`, `crawl_cache_tenant_policy`).
- System-A generates column-named policies such as `select_organization_id_isolation_policy` or `select_tenant_id_isolation_policy`.

### 6. Unique Tables Present ONLY in System-B
- `api_keys` (created in `0015_api_keys.sql`)
- `monitoring_configs` (created in `0016_website_monitoring.sql`)
- `crawl_snapshots` (created in `0016_website_monitoring.sql`)
- `monitoring_alerts` (created in `0016_website_monitoring.sql`)

---
## Per-File Inventory (16/16 Files)

### 0001_optimus_vector_kg.sql
**CREATE EXTENSION Statements:**
- `CREATE EXTENSION IF NOT EXISTS vector`

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `document_embeddings`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  content_chunk TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```
- **Table `kg_entities`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```
- **Table `kg_relationships`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```

**Foreign Key Targets Not Created in File:**
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE document_embeddings FORCE ROW LEVEL SECURITY`
- `ALTER TABLE kg_entities ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE kg_entities FORCE ROW LEVEL SECURITY`
- `ALTER TABLE kg_relationships ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE kg_relationships FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_document_embeddings_tenant ON document_embeddings(tenant_id)`
- `CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding ON document_embeddings USING hnsw (embedding vector_cosine_ops)` **(HNSW Vector Index)**
- `CREATE INDEX IF NOT EXISTS idx_kg_entities_tenant ON kg_entities(tenant_id)`
- `CREATE INDEX IF NOT EXISTS idx_kg_entities_name ON kg_entities(name)`
- `CREATE INDEX IF NOT EXISTS idx_kg_relationships_tenant ON kg_relationships(tenant_id)`
- `CREATE INDEX IF NOT EXISTS idx_kg_relationships_source ON kg_relationships(source_entity_id)`
- `CREATE INDEX IF NOT EXISTS idx_kg_relationships_target ON kg_relationships(target_entity_id)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON document_embeddings`
- `CREATE POLICY insert_tenant_isolation_policy ON document_embeddings`
- `CREATE POLICY update_tenant_isolation_policy ON document_embeddings`
- `CREATE POLICY delete_tenant_isolation_policy ON document_embeddings`
- `CREATE POLICY select_tenant_isolation_policy ON kg_entities`
- `CREATE POLICY insert_tenant_isolation_policy ON kg_entities`
- `CREATE POLICY update_tenant_isolation_policy ON kg_entities`
- `CREATE POLICY delete_tenant_isolation_policy ON kg_entities`
- `CREATE POLICY select_tenant_isolation_policy ON kg_relationships`
- `CREATE POLICY insert_tenant_isolation_policy ON kg_relationships`
- `CREATE POLICY update_tenant_isolation_policy ON kg_relationships`
- `CREATE POLICY delete_tenant_isolation_policy ON kg_relationships`

### 0002_technical_audits.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `technical_audits`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  url TEXT NOT NULL,
  technical_score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  pages_analyzed INTEGER NOT NULL,
  categories JSONB NOT NULL,
  critical_issues JSONB NOT NULL,
  quick_wins JSONB NOT NULL,
  performance_metrics JSONB NOT NULL,
  ... (1 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- None

**ROW LEVEL SECURITY Statements:**
- None

**Indexes:**
- None

**Policies:**
- None

### 0003_competitive_analyses.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `competitive_analyses`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_url TEXT NOT NULL,
  competitor_urls TEXT[] NOT NULL,
  overall_score INTEGER NOT NULL,
  market_position TEXT NOT NULL,
  comparison_data JSONB NOT NULL,
  advantages JSONB NOT NULL,
  gaps JSONB NOT NULL,
  opportunities JSONB NOT NULL,
  ... (1 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- None

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE competitive_analyses FORCE ROW LEVEL SECURITY`

**Indexes:**
- None

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON competitive_analyses`
- `CREATE POLICY insert_tenant_isolation_policy ON competitive_analyses`
- `CREATE POLICY update_tenant_isolation_policy ON competitive_analyses`
- `CREATE POLICY delete_tenant_isolation_policy ON competitive_analyses`

### 0004_crawl_acquisition.sql
**CREATE EXTENSION Statements:**
- `CREATE EXTENSION IF NOT EXISTS pgcrypto`

**Functions & Triggers:**
- Function: `claim_crawl_jobs`
- Function: `recover_expired_crawl_jobs`
- Function: `complete_crawl_job_if_lease_owner`

**Tables Created & Abridged Columns:**
- **Table `crawl_jobs`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  requested_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  policy JSONB NOT NULL,
  dedup_key TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED')),
  ... (26 additional column/constraint definitions)
  ```
- **Table `crawl_results`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT crawl_results_job_unique UNIQUE (job_id),
  CONSTRAINT crawl_results_tenant_job_unique UNIQUE (tenant_id, job_id)
  ```
- **Table `crawl_cache`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  cache_scope TEXT NOT NULL DEFAULT 'tenant'
  CONSTRAINT crawl_cache_scope_check CHECK (cache_scope = 'tenant'),
  cache_key TEXT NOT NULL,
  normalized_result JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  ```

**Foreign Key Targets Not Created in File:**
- None

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_jobs FORCE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_results FORCE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_cache ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_cache FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_crawl_jobs_tenant_status`
- `CREATE INDEX idx_crawl_jobs_status_scheduled`
- `CREATE INDEX IF NOT EXISTS idx_crawl_jobs_provider_job_id`
- `CREATE INDEX IF NOT EXISTS idx_crawl_jobs_tenant_created`
- `CREATE UNIQUE INDEX idx_crawl_jobs_active_dedup`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_cache_key`

**Policies:**
- `CREATE POLICY crawl_jobs_tenant_policy ON crawl_jobs`
- `CREATE POLICY crawl_results_tenant_policy ON crawl_results`
- `CREATE POLICY crawl_cache_tenant_policy ON crawl_cache`

### 0005_unified_intelligence_model.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `websites`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  ... (3 additional column/constraint definitions)
  ```
- **Table `pages`**:
  ```sql
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
  ... (6 additional column/constraint definitions)
  ```
- **Table `keywords`**:
  ```sql
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
  ... (2 additional column/constraint definitions)
  ```
- **Table `topics`**:
  ```sql
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
  ... (2 additional column/constraint definitions)
  ```
- **Table `competitors`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  ... (1 additional column/constraint definitions)
  ```
- **Table `historical_metrics`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  ... (1 additional column/constraint definitions)
  ```
- **Table `pages_keywords`**:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, keyword_id)
  ```
- **Table `pages_topics`**:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, topic_id)
  ```
- **Table `pages_entities`**:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, entity_id)
  ```
- **Table `keywords_topics`**:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (keyword_id, topic_id)
  ```
- **Table `topics_entities`**:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, entity_id)
  ```

**Foreign Key Targets Not Created in File:**
- `entities`
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE websites ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE websites FORCE ROW LEVEL SECURITY`
- `ALTER TABLE pages ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE pages FORCE ROW LEVEL SECURITY`
- `ALTER TABLE keywords ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE keywords FORCE ROW LEVEL SECURITY`
- `ALTER TABLE topics ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE topics FORCE ROW LEVEL SECURITY`
- `ALTER TABLE competitors ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE competitors FORCE ROW LEVEL SECURITY`
- `ALTER TABLE historical_metrics ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE historical_metrics FORCE ROW LEVEL SECURITY`
- `ALTER TABLE pages_keywords ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE pages_keywords FORCE ROW LEVEL SECURITY`
- `ALTER TABLE pages_topics ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE pages_topics FORCE ROW LEVEL SECURITY`
- `ALTER TABLE pages_entities ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE pages_entities FORCE ROW LEVEL SECURITY`
- `ALTER TABLE keywords_topics ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE keywords_topics FORCE ROW LEVEL SECURITY`
- `ALTER TABLE topics_entities ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE topics_entities FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_websites_organization ON websites(organization_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_domain_org ON websites(organization_id, domain) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_pages_organization ON pages(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_pages_website ON pages(website_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_url_website ON pages(website_id, normalized_url) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_keywords_organization ON keywords(organization_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_name_org ON keywords(organization_id, name) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_topics_organization ON topics(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_name_org ON topics(organization_id, name) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_competitors_organization ON competitors(organization_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_domain_org ON competitors(organization_id, domain) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_historical_metrics_organization ON historical_metrics(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_historical_metrics_target ON historical_metrics(target_type, target_id)`
- `CREATE INDEX IF NOT EXISTS idx_historical_metrics_name_time ON historical_metrics(metric_name, timestamp DESC)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON websites`
- `CREATE POLICY insert_tenant_isolation_policy ON websites`
- `CREATE POLICY update_tenant_isolation_policy ON websites`
- `CREATE POLICY delete_tenant_isolation_policy ON websites`
- `CREATE POLICY select_tenant_isolation_policy ON pages`
- `CREATE POLICY insert_tenant_isolation_policy ON pages`
- `CREATE POLICY update_tenant_isolation_policy ON pages`
- `CREATE POLICY delete_tenant_isolation_policy ON pages`
- `CREATE POLICY select_tenant_isolation_policy ON keywords`
- `CREATE POLICY insert_tenant_isolation_policy ON keywords`
- `CREATE POLICY update_tenant_isolation_policy ON keywords`
- `CREATE POLICY delete_tenant_isolation_policy ON keywords`
- `CREATE POLICY select_tenant_isolation_policy ON topics`
- `CREATE POLICY insert_tenant_isolation_policy ON topics`
- `CREATE POLICY update_tenant_isolation_policy ON topics`
- `CREATE POLICY delete_tenant_isolation_policy ON topics`
- `CREATE POLICY select_tenant_isolation_policy ON competitors`
- `CREATE POLICY insert_tenant_isolation_policy ON competitors`
- `CREATE POLICY update_tenant_isolation_policy ON competitors`
- `CREATE POLICY delete_tenant_isolation_policy ON competitors`
- `CREATE POLICY select_tenant_isolation_policy ON historical_metrics`
- `CREATE POLICY insert_tenant_isolation_policy ON historical_metrics`
- `CREATE POLICY update_tenant_isolation_policy ON historical_metrics`
- `CREATE POLICY delete_tenant_isolation_policy ON historical_metrics`
- `CREATE POLICY select_tenant_isolation_policy ON pages_keywords`
- `CREATE POLICY insert_tenant_isolation_policy ON pages_keywords`
- `CREATE POLICY update_tenant_isolation_policy ON pages_keywords`
- `CREATE POLICY delete_tenant_isolation_policy ON pages_keywords`
- `CREATE POLICY select_tenant_isolation_policy ON pages_topics`
- `CREATE POLICY insert_tenant_isolation_policy ON pages_topics`
- `CREATE POLICY update_tenant_isolation_policy ON pages_topics`
- `CREATE POLICY delete_tenant_isolation_policy ON pages_topics`
- `CREATE POLICY select_tenant_isolation_policy ON pages_entities`
- `CREATE POLICY insert_tenant_isolation_policy ON pages_entities`
- `CREATE POLICY update_tenant_isolation_policy ON pages_entities`
- `CREATE POLICY delete_tenant_isolation_policy ON pages_entities`
- `CREATE POLICY select_tenant_isolation_policy ON keywords_topics`
- `CREATE POLICY insert_tenant_isolation_policy ON keywords_topics`
- `CREATE POLICY update_tenant_isolation_policy ON keywords_topics`
- `CREATE POLICY delete_tenant_isolation_policy ON keywords_topics`
- `CREATE POLICY select_tenant_isolation_policy ON topics_entities`
- `CREATE POLICY insert_tenant_isolation_policy ON topics_entities`
- `CREATE POLICY update_tenant_isolation_policy ON topics_entities`
- `CREATE POLICY delete_tenant_isolation_policy ON topics_entities`

### 0006_diagnostic_engine_model.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `diagnostic_findings`**:
  ```sql
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
  ... (8 additional column/constraint definitions)
  ```
- **Table `diagnostic_finding_relationships`**:
  ```sql
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
  ... (1 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `organizations`
- `websites`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE diagnostic_findings ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE diagnostic_findings FORCE ROW LEVEL SECURITY`
- `ALTER TABLE diagnostic_finding_relationships ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE diagnostic_finding_relationships FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_organization ON diagnostic_findings(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_website ON diagnostic_findings(website_id)`
- `CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_category ON diagnostic_findings(category)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_findings_dedup ON diagnostic_findings(organization_id, website_id, code, affected_resource) WHERE deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_finding_relationships_organization ON diagnostic_finding_relationships(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_finding_relationships_source ON diagnostic_finding_relationships(source_finding_id)`
- `CREATE INDEX IF NOT EXISTS idx_finding_relationships_target ON diagnostic_finding_relationships(target_finding_id)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON diagnostic_findings`
- `CREATE POLICY insert_tenant_isolation_policy ON diagnostic_findings`
- `CREATE POLICY update_tenant_isolation_policy ON diagnostic_findings`
- `CREATE POLICY delete_tenant_isolation_policy ON diagnostic_findings`
- `CREATE POLICY select_tenant_isolation_policy ON diagnostic_finding_relationships`
- `CREATE POLICY insert_tenant_isolation_policy ON diagnostic_finding_relationships`
- `CREATE POLICY update_tenant_isolation_policy ON diagnostic_finding_relationships`
- `CREATE POLICY delete_tenant_isolation_policy ON diagnostic_finding_relationships`

### 0007_ai_visibility_audit.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `ai_visibility_audits`**:
  ```sql
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
  ... (6 additional column/constraint definitions)
  ```
- **Table `audit_prompts`**:
  ```sql
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
  ... (9 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `brands`
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE ai_visibility_audits ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE ai_visibility_audits FORCE ROW LEVEL SECURITY`
- `ALTER TABLE audit_prompts ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE audit_prompts FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_organization ON ai_visibility_audits(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_brand ON ai_visibility_audits(brand_id)`
- `CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_status ON ai_visibility_audits(status)`
- `CREATE INDEX IF NOT EXISTS idx_audit_prompts_organization ON audit_prompts(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_audit_prompts_audit ON audit_prompts(audit_id)`
- `CREATE INDEX IF NOT EXISTS idx_audit_prompts_status ON audit_prompts(status)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON ai_visibility_audits`
- `CREATE POLICY insert_tenant_isolation_policy ON ai_visibility_audits`
- `CREATE POLICY update_tenant_isolation_policy ON ai_visibility_audits`
- `CREATE POLICY delete_tenant_isolation_policy ON ai_visibility_audits`
- `CREATE POLICY select_tenant_isolation_policy ON audit_prompts`
- `CREATE POLICY insert_tenant_isolation_policy ON audit_prompts`
- `CREATE POLICY update_tenant_isolation_policy ON audit_prompts`
- `CREATE POLICY delete_tenant_isolation_policy ON audit_prompts`

### 0008_prompt_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `prompt_definitions`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  category TEXT NOT NULL,
  intent TEXT NOT NULL,
  locale TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  ... (10 additional column/constraint definitions)
  ```
- **Table `prompt_schedules`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_definitions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cron_expression TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  next_execution_at TIMESTAMP WITH TIME ZONE,
  last_execution_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'IDLE',
  failure_reason TEXT,
  ... (7 additional column/constraint definitions)
  ```
- **Table `prompt_executions`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_definitions(id) ON DELETE CASCADE,
  prompt_version INTEGER NOT NULL,
  resolved_prompt_text TEXT NOT NULL,
  variables_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  model_version TEXT,
  ... (13 additional column/constraint definitions)
  ```
- **Table `position_observations`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_execution_id UUID NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  subject_entity_id TEXT NOT NULL,
  presence TEXT NOT NULL CHECK (presence IN ('not_present', 'mentioned', 'recommended', 'ranked', 'unknown')),
  numeric_position INTEGER,
  evidence_excerpt TEXT NOT NULL,
  evidence_structure TEXT NOT NULL CHECK (evidence_structure IN ('numbered_list', 'bullet_list', 'table', 'prose', 'unknown')),
  confidence DOUBLE PRECISION NOT NULL,
  analyzer_version TEXT NOT NULL DEFAULT '1.0.0',
  ... (1 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `brands`
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE prompt_definitions FORCE ROW LEVEL SECURITY`
- `ALTER TABLE prompt_schedules ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE prompt_schedules FORCE ROW LEVEL SECURITY`
- `ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE prompt_executions FORCE ROW LEVEL SECURITY`
- `ALTER TABLE position_observations ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE position_observations FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_prompt_definitions_organization ON prompt_definitions(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_definitions_brand ON prompt_definitions(brand_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_definitions_category ON prompt_definitions(category)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_schedules_organization ON prompt_schedules(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_schedules_prompt ON prompt_schedules(prompt_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_executions_organization ON prompt_executions(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_executions_prompt ON prompt_executions(prompt_id)`
- `CREATE INDEX IF NOT EXISTS idx_prompt_executions_status ON prompt_executions(status)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_runs_unique ON prompt_executions(prompt_id, prompt_version, scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL`
- `CREATE INDEX IF NOT EXISTS idx_position_obs_organization ON position_observations(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_position_obs_execution ON position_observations(source_execution_id)`
- `CREATE INDEX IF NOT EXISTS idx_position_obs_subject ON position_observations(subject_entity_id)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON prompt_definitions`
- `CREATE POLICY insert_tenant_isolation_policy ON prompt_definitions`
- `CREATE POLICY update_tenant_isolation_policy ON prompt_definitions`
- `CREATE POLICY delete_tenant_isolation_policy ON prompt_definitions`
- `CREATE POLICY select_tenant_isolation_policy ON prompt_schedules`
- `CREATE POLICY insert_tenant_isolation_policy ON prompt_schedules`
- `CREATE POLICY update_tenant_isolation_policy ON prompt_schedules`
- `CREATE POLICY delete_tenant_isolation_policy ON prompt_schedules`
- `CREATE POLICY select_tenant_isolation_policy ON prompt_executions`
- `CREATE POLICY insert_tenant_isolation_policy ON prompt_executions`
- `CREATE POLICY update_tenant_isolation_policy ON prompt_executions`
- `CREATE POLICY delete_tenant_isolation_policy ON prompt_executions`
- `CREATE POLICY select_tenant_isolation_policy ON position_observations`
- `CREATE POLICY insert_tenant_isolation_policy ON position_observations`
- `CREATE POLICY update_tenant_isolation_policy ON position_observations`
- `CREATE POLICY delete_tenant_isolation_policy ON position_observations`

### 0009_citation_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `citation_sources`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  canonical_url TEXT,
  classification TEXT NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  authority_score INTEGER NOT NULL CHECK (authority_score >= 0 AND authority_score <= 100),
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  ... (2 additional column/constraint definitions)
  ```
- **Table `citation_occurrences`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES citation_sources(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES ai_visibility_audits(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES prompt_executions(id) ON DELETE CASCADE,
  prompt_id UUID,
  observation_id UUID REFERENCES ai_observations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  ... (3 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `ai_observations`
- `ai_visibility_audits`
- `organizations`
- `prompt_executions`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE citation_sources FORCE ROW LEVEL SECURITY`
- `ALTER TABLE citation_occurrences ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE citation_occurrences FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_citation_sources_organization ON citation_sources(organization_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_citation_sources_domain_org ON citation_sources(organization_id, domain)`
- `CREATE INDEX IF NOT EXISTS idx_citation_occurrences_organization ON citation_occurrences(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_citation_occurrences_source ON citation_occurrences(source_id)`
- `CREATE INDEX IF NOT EXISTS idx_citation_occurrences_audit ON citation_occurrences(audit_id)`
- `CREATE INDEX IF NOT EXISTS idx_citation_occurrences_execution ON citation_occurrences(execution_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_citation_occ_uniqueness ON citation_occurrences(organization_id, source_id, observation_id, url)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON citation_sources`
- `CREATE POLICY insert_tenant_isolation_policy ON citation_sources`
- `CREATE POLICY update_tenant_isolation_policy ON citation_sources`
- `CREATE POLICY delete_tenant_isolation_policy ON citation_sources`
- `CREATE POLICY select_tenant_isolation_policy ON citation_occurrences`
- `CREATE POLICY insert_tenant_isolation_policy ON citation_occurrences`
- `CREATE POLICY update_tenant_isolation_policy ON citation_occurrences`
- `CREATE POLICY delete_tenant_isolation_policy ON citation_occurrences`

### 0010_brand_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `brand_associations`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  supporting_context TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  ... (2 additional column/constraint definitions)
  ```
- **Table `recommendation_observations`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES prompt_executions(id) ON DELETE CASCADE,
  prompt_id UUID,
  observation_id UUID NOT NULL REFERENCES ai_observations(id) ON DELETE CASCADE,
  recommendation_status TEXT NOT NULL CHECK (recommendation_status IN ('mention', 'consideration', 'recommendation', 'strong_recommendation', 'negative_recommendation')),
  position INTEGER,
  evidence_excerpt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```

**Foreign Key Targets Not Created in File:**
- `ai_observations`
- `brands`
- `organizations`
- `prompt_executions`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE brand_associations ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE brand_associations FORCE ROW LEVEL SECURITY`
- `ALTER TABLE recommendation_observations ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE recommendation_observations FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_brand_associations_organization ON brand_associations(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_brand_associations_brand ON brand_associations(brand_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_associations_uniqueness ON brand_associations(organization_id, brand_id, entity_name, relationship_type)`
- `CREATE INDEX IF NOT EXISTS idx_rec_observations_organization ON recommendation_observations(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_rec_observations_brand ON recommendation_observations(brand_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_observations_uniqueness ON recommendation_observations(organization_id, brand_id, observation_id)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON brand_associations`
- `CREATE POLICY insert_tenant_isolation_policy ON brand_associations`
- `CREATE POLICY update_tenant_isolation_policy ON brand_associations`
- `CREATE POLICY delete_tenant_isolation_policy ON brand_associations`
- `CREATE POLICY select_tenant_isolation_policy ON recommendation_observations`
- `CREATE POLICY insert_tenant_isolation_policy ON recommendation_observations`
- `CREATE POLICY update_tenant_isolation_policy ON recommendation_observations`
- `CREATE POLICY delete_tenant_isolation_policy ON recommendation_observations`

### 0011_aeo_content_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `aeo_analyses`**:
  ```sql
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  overall_score DOUBLE PRECISION NOT NULL,
  answerability JSONB NOT NULL,
  entity_coverage JSONB NOT NULL,
  semantic_coverage JSONB NOT NULL,
  question_coverage JSONB NOT NULL,
  citation_readiness JSONB NOT NULL,
  structured_answer_quality JSONB NOT NULL,
  ... (6 additional column/constraint definitions)
  ```
- **Table `faq_opportunities`**:
  ```sql
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  source_type TEXT NOT NULL,
  evidence_source_id UUID,
  priority TEXT NOT NULL,
  impact_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```
- **Table `kg_alignments`**:
  ```sql
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  alignment_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  property_name TEXT,
  expected_value TEXT,
  actual_value TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```

**Foreign Key Targets Not Created in File:**
- `organizations`
- `pages`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE aeo_analyses ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE aeo_analyses FORCE ROW LEVEL SECURITY`
- `ALTER TABLE faq_opportunities ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE faq_opportunities FORCE ROW LEVEL SECURITY`
- `ALTER TABLE kg_alignments ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE kg_alignments FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_aeo_analyses_organization ON aeo_analyses(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_aeo_analyses_page ON aeo_analyses(page_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_aeo_analyses_page_unique ON aeo_analyses(page_id, analyzer_version, scoring_version)`
- `CREATE INDEX IF NOT EXISTS idx_faq_opportunities_organization ON faq_opportunities(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_faq_opportunities_page ON faq_opportunities(page_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_faq_opportunities_page_question ON faq_opportunities(page_id, question)`
- `CREATE INDEX IF NOT EXISTS idx_kg_alignments_organization ON kg_alignments(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_kg_alignments_page ON kg_alignments(page_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_alignments_unique ON kg_alignments(page_id, alignment_type, entity_name, COALESCE(property_name, ''))`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON aeo_analyses`
- `CREATE POLICY insert_tenant_isolation_policy ON aeo_analyses`
- `CREATE POLICY update_tenant_isolation_policy ON aeo_analyses`
- `CREATE POLICY delete_tenant_isolation_policy ON aeo_analyses`
- `CREATE POLICY select_tenant_isolation_policy ON faq_opportunities`
- `CREATE POLICY insert_tenant_isolation_policy ON faq_opportunities`
- `CREATE POLICY update_tenant_isolation_policy ON faq_opportunities`
- `CREATE POLICY delete_tenant_isolation_policy ON faq_opportunities`
- `CREATE POLICY select_tenant_isolation_policy ON kg_alignments`
- `CREATE POLICY insert_tenant_isolation_policy ON kg_alignments`
- `CREATE POLICY update_tenant_isolation_policy ON kg_alignments`
- `CREATE POLICY delete_tenant_isolation_policy ON kg_alignments`

### 0012_competitor_discovery.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `competitor_changes`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL,
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```

**Foreign Key Targets Not Created in File:**
- `competitors`
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE competitor_changes ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE competitor_changes FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_competitor_changes_organization ON competitor_changes(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_competitor_changes_competitor ON competitor_changes(competitor_id)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON competitor_changes`
- `CREATE POLICY insert_tenant_isolation_policy ON competitor_changes`
- `CREATE POLICY update_tenant_isolation_policy ON competitor_changes`
- `CREATE POLICY delete_tenant_isolation_policy ON competitor_changes`

### 0013_competitive_seo_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `competitive_seo_findings`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference')),
  comparison_scope TEXT NOT NULL,
  competitive_position TEXT NOT NULL CHECK (competitive_position IN ('advantage', 'disadvantage', 'neutral')),
  tenant_value TEXT,
  competitor_value TEXT,
  difference DOUBLE PRECISION,
  difference_direction TEXT NOT NULL CHECK (difference_direction IN ('positive', 'negative', 'none')),
  ... (7 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `competitors`
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE competitive_seo_findings ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE competitive_seo_findings FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_organization ON competitive_seo_findings(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_competitor ON competitive_seo_findings(competitor_id)`
- `CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_type_scope ON competitive_seo_findings(finding_type, comparison_scope)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON competitive_seo_findings`
- `CREATE POLICY insert_tenant_isolation_policy ON competitive_seo_findings`
- `CREATE POLICY update_tenant_isolation_policy ON competitive_seo_findings`
- `CREATE POLICY delete_tenant_isolation_policy ON competitive_seo_findings`

### 0014_competitive_ai_intelligence.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- None

**Foreign Key Targets Not Created in File:**
- None

**ROW LEVEL SECURITY Statements:**
- None

**Indexes:**
- None

**Policies:**
- None

### 0015_api_keys.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `api_keys`**:
  ```sql
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "prefix" text NOT NULL,
  "hash" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "expires_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  ... (3 additional column/constraint definitions)
  ```

**Foreign Key Targets Not Created in File:**
- `organizations`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX "idx_api_keys_organization" ON "api_keys" USING btree ("organization_id")`
- `CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("prefix")`

**Policies:**
- `CREATE POLICY "select_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR SELECT TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`
- `CREATE POLICY "insert_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`
- `CREATE POLICY "update_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR UPDATE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`
- `CREATE POLICY "delete_organization_id_isolation_policy" ON "api_keys" AS PERMISSIVE FOR DELETE TO public USING ("organization_id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`

### 0016_website_monitoring.sql
**CREATE EXTENSION Statements:**
- None

**Functions & Triggers:**
- None

**Tables Created & Abridged Columns:**
- **Table `monitoring_configs`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  crawl_policy JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  ```
- **Table `crawl_snapshots`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitoring_config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  crawl_job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  content_hash TEXT,
  extracted_content TEXT,
  snapshot_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  ```
- **Table `monitoring_alerts`**:
  ```sql
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitoring_config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  crawl_snapshot_id UUID REFERENCES crawl_snapshots(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dedup_key TEXT NOT NULL
  ```

**Foreign Key Targets Not Created in File:**
- `crawl_jobs`
- `organizations`
- `websites`

**ROW LEVEL SECURITY Statements:**
- `ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE monitoring_configs FORCE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_snapshots ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE crawl_snapshots FORCE ROW LEVEL SECURITY`
- `ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY`
- `ALTER TABLE monitoring_alerts FORCE ROW LEVEL SECURITY`

**Indexes:**
- `CREATE INDEX IF NOT EXISTS idx_monitoring_configs_org ON monitoring_configs(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_monitoring_configs_website ON monitoring_configs(website_id)`
- `CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_org ON crawl_snapshots(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_config ON crawl_snapshots(monitoring_config_id)`
- `CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_captured ON crawl_snapshots(captured_at DESC)`
- `CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_org ON monitoring_alerts(organization_id)`
- `CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_config ON monitoring_alerts(monitoring_config_id)`
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_monitoring_alerts_dedup ON monitoring_alerts(organization_id, dedup_key)`

**Policies:**
- `CREATE POLICY select_tenant_isolation_policy ON monitoring_configs`
- `CREATE POLICY insert_tenant_isolation_policy ON monitoring_configs`
- `CREATE POLICY update_tenant_isolation_policy ON monitoring_configs`
- `CREATE POLICY delete_tenant_isolation_policy ON monitoring_configs`
- `CREATE POLICY select_tenant_isolation_policy ON crawl_snapshots`
- `CREATE POLICY insert_tenant_isolation_policy ON crawl_snapshots`
- `CREATE POLICY update_tenant_isolation_policy ON crawl_snapshots`
- `CREATE POLICY delete_tenant_isolation_policy ON crawl_snapshots`
- `CREATE POLICY select_tenant_isolation_policy ON monitoring_alerts`
- `CREATE POLICY insert_tenant_isolation_policy ON monitoring_alerts`
- `CREATE POLICY update_tenant_isolation_policy ON monitoring_alerts`
- `CREATE POLICY delete_tenant_isolation_policy ON monitoring_alerts`
