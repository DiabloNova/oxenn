# Database Reconciliation Report & Implementation Plan

**Date:** August 2024
**Scope:** Reconstruct Database Source of Truth, Drizzle ORM Canonical Schema, and Migration Pipeline


> **HISTORICAL SNAPSHOT — NOT THE CURRENT RLS CONTRACT**
> This report records the repository state and Drizzle snapshot reviewed in August 2024. Its 51/19 policy split and table classifications below are retained as historical evidence only and are superseded by the current [Canonical Data Contract](../../database/canonical-data-contract.md) and generated [Database Reference Matrix](../../database/reference-matrix.md). Do not use the historical inventory to infer current ownership, policy coverage, migration state, runtime behavior, or production state.

---

## 1. Inventory & Reconciliation Summary

A comprehensive reconciliation was performed across:
1. Legacy hand-written SQL migrations (`0001-0014`)
2. TypeScript schema metadata (`database/schema/*.ts`)
3. Codebase repository/service usage patterns (`src/`, `tests/`)

### Table Count & Verification
- **Total Unique Tables across Codebase:** 70 tables.
- **Tables previously missing from SQL migrations (21 tables):** `organizations`, `admin_users`, `roles`, `permissions`, `audit_records`, `feature_flags`, `system_configurations`, `tenant_quotas`, `tenant_subscriptions`, `ai_provider_configs`, `brands`, `entities`, `entity_relationships`, `citations`, `ai_observations`, `brand_mentions`, `visibility_scores`, `recommendations`, `premium_audits`, `ai_engines`, `prompts`.
- **Tables present in SQL migrations but missing from custom TS definitions (5 tables):** `technical_audits`, `competitive_analyses`, `crawl_jobs`, `crawl_results`, `crawl_cache`.
- **Final Canonical Schema:** All 70 tables are defined in the unified Drizzle ORM schema at `database/schema/index.ts`.

---

## 2. Field Mismatches & Canonical Resolutions

| Table | Field | Conflict | Canonical Resolution | Justification |
| :--- | :--- | :--- | :--- | :--- |
| `websites` | `cms_type` | `VARCHAR(50)` vs `TEXT` | `TEXT` | Unbounded string allows flexible CMS identification across crawlers. |
| `pages` | `http_status` | Default `200` vs No default | `INTEGER NOT NULL DEFAULT 200` | Standard default prevents NULL status on successful crawl ingestion. |
| `prompt_executions` | `status` | `'succeeded'`/`'timed_out'` vs `'completed'` | Enum with `'queued'`, `'running'`, `'succeeded'`, `'failed'`, `'timed_out'`, `'cancelled'` | Supports precise state-machine retry tracking in background workers. |
| `competitive_seo_findings` | `finding_type` | Multi-step ALTER TABLE CHECK | Single unified CHECK constraint with 11 types | Combines finding types from migrations 0013 and 0014 into a single constraint. |

---

## 3. Row-Level Security (RLS) & Tenant Isolation Audit

### RLS Enabled Tables (51 Tables)

The following 51 tables are the exact `TENANT_SCOPED_TABLES` inventory generated from the latest Drizzle snapshot (`database/drizzle/meta/0013_snapshot.json`). Each has at least one tenant-isolation RLS policy in that snapshot. The migration verifier checks that `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` are active for every policy-bearing table. These are schema/migration inventory findings, not proof of any particular deployed database's state.

- `aeo_analyses`
- `ai_observations`
- `ai_visibility_audits`
- `api_keys`
- `audit_prompts`
- `brand_associations`
- `brand_mentions`
- `brands`
- `citation_occurrences`
- `citation_sources`
- `citations`
- `competitive_analyses`
- `competitive_seo_findings`
- `competitor_changes`
- `competitors`
- `crawl_cache`
- `crawl_jobs`
- `crawl_results`
- `crawl_snapshots`
- `credit_transactions`
- `diagnostic_finding_relationships`
- `diagnostic_findings`
- `document_embeddings`
- `entities`
- `entity_relationships`
- `faq_opportunities`
- `historical_metrics`
- `keywords`
- `kg_alignments`
- `kg_entities`
- `kg_relationships`
- `monitoring_alerts`
- `monitoring_configs`
- `organization_invitations`
- `organization_members`
- `organizations`
- `pages`
- `position_observations`
- `premium_audits`
- `prompt_definitions`
- `prompt_executions`
- `prompt_schedules`
- `prompts`
- `recommendation_observations`
- `recommendations`
- `technical_audits`
- `tenant_quotas`
- `tenant_subscriptions`
- `topics`
- `visibility_scores`
- `websites`

### Tables Without RLS Policies (19 Tables - Global/System Context)

The following 19 canonical tables have no policies in the latest Drizzle snapshot and are therefore outside `TENANT_SCOPED_TABLES`:

1. `admin_users` (Platform Admins)
2. `ai_engines` (AI Engine Master Catalog)
3. `ai_provider_configs` (LLM Provider Gateways)
4. `audit_records` (System Audit Logging)
5. `auth_rate_limits` (Authentication Rate Limiting)
6. `email_verification_tokens` (Authentication)
7. `feature_flags` (Global Feature Toggles)
8. `keywords_topics` (Join Table)
9. `pages_entities` (Join Table)
10. `pages_keywords` (Join Table)
11. `pages_topics` (Join Table)
12. `password_reset_tokens` (Authentication)
13. `permissions` (System RBAC)
14. `roles` (System RBAC)
15. `sessions` (Authentication)
16. `system_configurations` (Global Engine Settings)
17. `topics_entities` (Join Table)
18. `user_credentials` (Authentication)
19. `users` (Identity)

---

## 4. Architectural Notes & Observations

- **Worker Context Bypass:** As audited, `scripts/crawl-worker.ts` maintains its own ad-hoc database pool and bypasses `TenantContextManager`. This behavior is retained as designed and noted in accordance with constraints.
- **Migration Artifacts:** Legacy SQL scripts (`0001-0016`) are archived under `database/archive/migrations-legacy/` as read-only historical audit logs. All current Drizzle ORM migrations are managed under `database/drizzle/`.
