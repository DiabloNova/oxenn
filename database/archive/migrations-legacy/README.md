# Historical Archive: System B Handwritten SQL Migrations

> **DO NOT EXECUTE — HISTORICAL RECORD ONLY**
>
> The SQL files in this directory are preserved strictly for historical reference and provenance auditing.
> They are **superseded** by the canonical Drizzle ORM migration chain located in `database/drizzle/`.
> Do not execute, modify, or add files to this directory.

---

## Provenance & History

- **Period of Activity**: July 30, 2024 – August 23, 2024 (Handwritten SQL Era).
- **Architecture System**: "System B" (Handwritten raw SQL migrations).
- **Reason for Archival**: System B lacked an automated, deterministic runner in production and suffered from structural numbering collisions and incomplete schema coverage. The canonical Drizzle ORM chain ("System A" in `database/drizzle/`) now fully covers the canonical schema defined in `database/schema/index.ts`. All unique DDL constructs (pgvector/HNSW indexes, custom functions, RLS policies, table structures) have been absorbed into the Drizzle chain and Drizzle schema definitions.

---

## Numbering & Structural Anomaly Notes

1. **Numbering Collisions**:
   - `0001_optimus_vector_kg.sql` collided with Drizzle migration numbering conventions during early iterations.
2. **`0015_api_keys.sql` Rename Anomaly**:
   - `0015_api_keys.sql` was originally generated using Drizzle syntax (`--> statement-breakpoint`), whereas files `0001` through `0014` and `0016` used raw handwritten PostgreSQL DDL.
3. **Missing Base Tables in Handwritten Era**:
   - As documented in `verification/phase-0/system-b-inventory.md`, System B contained foreign key references to `organizations`, `brands`, `prompts`, `ai_engines`, `roles`, `permissions`, `admin_users`, and `tenant_quotas`, but never actually created these base tables, rendering System B unexecutable on empty databases.

---

## Legacy File Absorption Mapping

All 16 legacy migration files and their DDL constructs have been fully mapped and absorbed into the canonical codebase:

| Legacy File (`database/archive/migrations-legacy/`) | Created Objects & Features | Canonical Location in Repo |
| :--- | :--- | :--- |
| `0001_optimus_vector_kg.sql` | `document_embeddings`, `kg_entities`, `kg_relationships`, vector extension, HNSW index | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` + `0004_abandoned_black_crow.sql` (HNSW) |
| `0002_technical_audits.sql` | `technical_audits` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0003_competitive_analyses.sql` | `competitive_analyses` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0004_crawl_acquisition.sql` | `crawl_jobs`, `crawl_results`, `crawl_cache`, job queue functions | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0005_unified_intelligence_model.sql` | `websites`, `pages`, `keywords`, `topics`, `competitors`, `historical_metrics`, junction tables | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0006_diagnostic_engine_model.sql` | `diagnostic_findings`, `diagnostic_finding_relationships` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0007_ai_visibility_audit.sql` | `ai_visibility_audits`, `audit_prompts` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0008_prompt_intelligence.sql` | `prompt_definitions`, `prompt_schedules`, `prompt_executions`, `position_observations` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0009_citation_intelligence.sql` | `citation_sources`, `citation_occurrences` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0010_brand_intelligence.sql` | `brand_associations`, `recommendation_observations` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0011_aeo_content_intelligence.sql` | `aeo_analyses`, `faq_opportunities`, `kg_alignments` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0012_competitor_discovery.sql` | `competitor_changes` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0013_competitive_seo_intelligence.sql` | `competitive_seo_findings` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0014_competitive_ai_intelligence.sql` | CHECK constraint update on `competitive_seo_findings` | `database/schema/index.ts` + `database/drizzle/0000_reflective_loa.sql` |
| `0015_api_keys.sql` | `api_keys` | `database/schema/api-keys.ts` + `database/drizzle/0003_warm_shadow_king.sql` |
| `0016_website_monitoring.sql` | `monitoring_configs`, `crawl_snapshots`, `monitoring_alerts` | `database/schema/index.ts` + `database/drizzle/0003_warm_shadow_king.sql` |
| *(Universal RLS Enforcement)* | `ALTER TABLE ... FORCE ROW LEVEL SECURITY` | `database/drizzle/0005_force_rls.sql` |
