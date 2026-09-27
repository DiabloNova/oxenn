# J-019 Review: Delta Migrations & Semantic Comparison (api_keys, monitoring, HNSW)

## 1. Migration Generation & Journal Diff

### Command
`pnpm db:generate`

### Output
```
> oxenn@0.1.0 db:generate /app
> drizzle-kit generate

No config path provided, using default 'drizzle.config.ts'
Reading config file '/app/drizzle.config.ts'
65 tables
admin_users 9 columns 2 indexes 0 fks
aeo_analyses 14 columns 2 indexes 1 fks
ai_engines 12 columns 0 indexes 0 fks
ai_observations 14 columns 3 indexes 3 fks
ai_provider_configs 8 columns 1 indexes 0 fks
ai_visibility_audits 17 columns 3 indexes 1 fks
audit_prompts 7 columns 2 indexes 2 fks
audit_records 14 columns 3 indexes 0 fks
brand_associations 9 columns 2 indexes 2 fks
brand_mentions 13 columns 2 indexes 3 fks
brands 13 columns 2 indexes 1 fks
citation_occurrences 11 columns 2 indexes 2 fks
citation_sources 11 columns 2 indexes 1 fks
citations 13 columns 3 indexes 2 fks
competitive_analyses 11 columns 0 indexes 0 fks
competitive_seo_findings 11 columns 3 indexes 2 fks
competitor_changes 9 columns 3 indexes 2 fks
competitors 13 columns 2 indexes 1 fks
crawl_cache 8 columns 1 indexes 0 fks
crawl_jobs 35 columns 5 indexes 0 fks
crawl_results 5 columns 2 indexes 1 fks
crawl_snapshots 8 columns 3 indexes 3 fks
credit_transactions 7 columns 1 indexes 0 fks
diagnostic_finding_relationships 6 columns 3 indexes 3 fks
diagnostic_findings 14 columns 3 indexes 1 fks
document_embeddings 6 columns 2 indexes 0 fks
entities 12 columns 2 indexes 1 fks
entity_relationships 12 columns 3 indexes 3 fks
faq_opportunities 8 columns 2 indexes 2 fks
feature_flags 8 columns 1 indexes 0 fks
historical_metrics 9 columns 2 indexes 1 fks
keywords 14 columns 2 indexes 1 fks
keywords_topics 4 columns 1 indexes 3 fks
kg_alignments 9 columns 2 indexes 2 fks
kg_entities 7 columns 2 indexes 1 fks
kg_relationships 8 columns 3 indexes 3 fks
monitoring_alerts 10 columns 3 indexes 3 fks
monitoring_configs 8 columns 2 indexes 2 fks
organization_invitations 9 columns 2 indexes 1 fks
organization_members 6 columns 2 indexes 2 fks
organizations 10 columns 1 indexes 0 fks
pages 23 columns 3 indexes 2 fks
pages_entities 5 columns 1 indexes 3 fks
pages_keywords 5 columns 1 indexes 3 fks
pages_topics 5 columns 1 indexes 3 fks
permissions 4 columns 1 indexes 1 fks
position_observations 11 columns 1 indexes 2 fks
premium_audits 10 columns 1 indexes 1 fks
prompt_definitions 20 columns 1 indexes 2 fks
prompt_executions 19 columns 2 indexes 2 fks
prompt_schedules 13 columns 1 indexes 2 fks
prompts 13 columns 2 indexes 2 fks
recommendation_observations 11 columns 2 indexes 2 fks
recommendations 16 columns 2 indexes 2 fks
roles 4 columns 1 indexes 0 fks
system_configurations 7 columns 1 indexes 0 fks
technical_audits 11 columns 0 indexes 0 fks
tenant_quotas 15 columns 1 indexes 0 fks
tenant_subscriptions 11 columns 1 indexes 0 fks
topics 12 columns 2 indexes 2 fks
topics_entities 4 columns 1 indexes 3 fks
users 6 columns 0 indexes 0 fks
visibility_scores 15 columns 2 indexes 3 fks
websites 14 columns 2 indexes 1 fks
api_keys 12 columns 2 indexes 1 fks

No schema changes, nothing to migrate 😴
```

### Migration Files & Statement Counts
- `database/drizzle/0003_warm_shadow_king.sql`: 43 statements (creates `crawl_snapshots`, `monitoring_alerts`, `monitoring_configs`, `api_keys`, FKs, indexes, policies)
- `database/drizzle/0004_abandoned_black_crow.sql`: 1 statement (creates HNSW index on `document_embeddings.embedding`)

### Journal Status
Journal contains 5 entries (idx 0 to idx 4). Running `pnpm db:generate` produces 0 journal diff because the generated migrations covering `api_keys`, monitoring trio, and HNSW vector index are already complete and present in `database/drizzle/`.

## 2. Line-by-Line Semantic Comparison (Generated SQL vs Legacy 0015/0016 DDL)

| Object Type | Target Name | Generated SQL (`0003_warm_shadow_king.sql` / `0004_abandoned_black_crow.sql`) | Legacy DDL (`0015_api_keys.sql` / `0016_website_monitoring.sql`) | Intentional Divergence / Notes |
| :--- | :--- | :--- | :--- | :--- |
| Table | `api_keys` | `CREATE TABLE "api_keys"` with 12 columns & UNIQUE prefix constraint | Identical structure and UNIQUE prefix constraint | **Match** |
| Column | `api_keys.id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL` | `uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL` | **Match** |
| Column | `api_keys.organization_id` | `uuid NOT NULL` | `uuid NOT NULL` | **Match** |
| Column | `api_keys.name` | `text NOT NULL` | `text NOT NULL` | **Match** |
| Column | `api_keys.prefix` | `text NOT NULL` | `text NOT NULL` | **Match** |
| Column | `api_keys.hash` | `text NOT NULL` | `text NOT NULL` | **Match** |
| Column | `api_keys.is_active` | `boolean DEFAULT true NOT NULL` | `boolean DEFAULT true NOT NULL` | **Match** |
| Column | `api_keys.expires_at` | `timestamp with time zone` | `timestamp with time zone` | **Match** |
| Column | `api_keys.last_used_at` | `timestamp with time zone` | `timestamp with time zone` | **Match** |
| Column | `api_keys.created_at` | `timestamp with time zone DEFAULT NOW() NOT NULL` | `timestamp with time zone DEFAULT NOW() NOT NULL` | **Match** |
| Column | `api_keys.updated_at` | `timestamp with time zone DEFAULT NOW() NOT NULL` | `timestamp with time zone DEFAULT NOW() NOT NULL` | **Match** |
| Column | `api_keys.created_by` | `text DEFAULT 'system' NOT NULL` | `text DEFAULT 'system' NOT NULL` | **Match** |
| Column | `api_keys.revoked_at` | `timestamp with time zone` | `timestamp with time zone` | **Match** |
| Foreign Key | `api_keys` -> `organizations` | `ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action` | `ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" ...` | **Match** |
| Index | `idx_api_keys_organization` | `CREATE INDEX "idx_api_keys_organization" ON "api_keys" USING btree ("organization_id")` | Identical | **Match** |
| Index | `idx_api_keys_prefix` | `CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("prefix")` | Identical | **Match** |
| RLS Policies | `api_keys` | `select_organization_id_isolation_policy`, `insert_organization_id_isolation_policy`, `update_organization_id_isolation_policy`, `delete_organization_id_isolation_policy` | Identical policy names in 0015 | **Match** |
| Table | `monitoring_configs` | `CREATE TABLE "monitoring_configs"` with 8 columns | `CREATE TABLE IF NOT EXISTS monitoring_configs` | **Match** |
| Foreign Keys | `monitoring_configs` | FKs to `organizations(id)` and `websites(id)` ON DELETE CASCADE | Inline `REFERENCES` | **Match** |
| RLS Policy | `monitoring_configs` | `*_organization_id_isolation_policy` | `select_tenant_isolation_policy` | Divergence: Policy naming standardized in Drizzle schema helper (`organization_id_isolation_policy`) vs legacy (`tenant_isolation_policy`). |
| RLS FORCE | `monitoring_configs` | `ENABLE ROW LEVEL SECURITY` | `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY` | Divergence: `FORCE ROW LEVEL SECURITY` absent in Drizzle generated SQL. FORCE RLS unification is deferred to J-020. |
| Table | `crawl_snapshots` | `CREATE TABLE "crawl_snapshots"` with 8 columns | Identical structure | **Match** |
| Foreign Keys | `crawl_snapshots` | FKs to `organizations(id)`, `monitoring_configs(id)`, `crawl_jobs(id)` ON DELETE CASCADE | Inline `REFERENCES` | **Match** |
| Index | `idx_crawl_snapshots_captured` | `CREATE INDEX "idx_crawl_snapshots_captured" ON "crawl_snapshots" USING btree ("captured_at")` | `CREATE INDEX idx_crawl_snapshots_captured ON crawl_snapshots(captured_at DESC)` | Divergence: Default index ordering (ASC) generated by Drizzle vs explicit DESC in legacy DDL. |
| RLS Policy | `crawl_snapshots` | `*_organization_id_isolation_policy` | `select_tenant_isolation_policy` | Divergence: Policy naming standardized in Drizzle schema helper vs legacy. |
| RLS FORCE | `crawl_snapshots` | `ENABLE ROW LEVEL SECURITY` | `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY` | Divergence: `FORCE ROW LEVEL SECURITY` absent in Drizzle generated SQL (J-020). |
| Table | `monitoring_alerts` | `CREATE TABLE "monitoring_alerts"` with 10 columns | Identical structure | **Match** |
| Foreign Keys | `monitoring_alerts` | FKs to `organizations(id)`, `monitoring_configs(id)`, `crawl_snapshots(id)` ON DELETE CASCADE | Inline `REFERENCES` | **Match** |
| Index | `idx_monitoring_alerts_dedup` | `CREATE UNIQUE INDEX "idx_monitoring_alerts_dedup" ON "monitoring_alerts" USING btree ("organization_id","dedup_key")` | Identical unique index | **Match** |
| RLS Policy | `monitoring_alerts` | `*_organization_id_isolation_policy` | `select_tenant_isolation_policy` | Divergence: Policy naming standardized in Drizzle schema helper vs legacy. |
| RLS FORCE | `monitoring_alerts` | `ENABLE ROW LEVEL SECURITY` | `ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY` | Divergence: `FORCE ROW LEVEL SECURITY` absent in Drizzle generated SQL (J-020). |
| Index | `document_embeddings` (HNSW) | `CREATE INDEX "idx_document_embeddings_embedding" ON "document_embeddings" USING hnsw ("embedding" vector_cosine_ops)` | N/A (Added in J-018 via Drizzle custom op) | **Additive Feature** |

### Destructive Statement Check
- **DROP TABLE / DROP COLUMN**: 0
- **ALTER TYPE / DROP TYPE**: 0
- **DROP INDEX / DROP POLICY**: 0
- **Result**: ALL migration statements in `0003_warm_shadow_king.sql` and `0004_abandoned_black_crow.sql` are purely **ADDITIVE**.

## 3. Snapshot and Journal Chaining Verification

- **Journal Entries Count**: 5
- **Journal File**: `database/drizzle/meta/_journal.json`

| Index | Tag | SQL Filename | Snapshot File | Snapshot ID | Snapshot PrevID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | `0000_reflective_loa` | `0000_reflective_loa.sql` | `0000_snapshot.json` | `f66870ee-8f22-4825-a81c-f6bed9f67a21` | `00000000-0000-0000-0000-000000000000` |
| 1 | `0001_illegal_grey_gargoyle` | `0001_illegal_grey_gargoyle.sql` | `0001_snapshot.json` | `83137380-747e-4f1f-acde-5324ce35db59` | `f66870ee-8f22-4825-a81c-f6bed9f67a21` |
| 2 | `0002_soft_jimmy_woo` | `0002_soft_jimmy_woo.sql` | `0002_snapshot.json` | `e6d89dfd-7442-447b-a2bc-a3ed8a520f99` | `83137380-747e-4f1f-acde-5324ce35db59` |
| 3 | `0003_warm_shadow_king` | `0003_warm_shadow_king.sql` | `0003_snapshot.json` | `dc0c2bec-b267-4ce8-b37d-b730c69d1ff9` | `e6d89dfd-7442-447b-a2bc-a3ed8a520f99` |
| 4 | `0004_abandoned_black_crow` | `0004_abandoned_black_crow.sql` | `0004_snapshot.json` | `93663401-9b6d-4485-a1cd-7c58140e02ea` | `dc0c2bec-b267-4ce8-b37d-b730c69d1ff9` |

**Verification**:
- `prevId` chaining is strictly linear and contiguous.
- Entry index mapping in `_journal.json` perfectly matches `XXXX_snapshot.json` files.
- Tags in `_journal.json` strictly match `.sql` migration files.

## 4. Schema Equality Transcript & Replay Proof

### Replay Environment Note
In this execution environment, Docker overlayfs container mounts are prohibited by host sandbox permissions (consistent with J-018 environment limitations). Replay verification was executed via static schema AST analysis comparing exported table symbols in `database/schema/index.ts` against Drizzle migration SQL files `0000` through `0004`.

### Table-Set Equality Transcript
```
Exported schema table count: 65
Migration SQL table count: 65
Missing in migrations: []
Extra in migrations: []
Table sets EQUAL: true
```

### Confirmed Table List (65 / 65)
1. `admin_users`
2. `aeo_analyses`
3. `ai_engines`
4. `ai_observations`
5. `ai_provider_configs`
6. `ai_visibility_audits`
7. `api_keys`
8. `audit_prompts`
9. `audit_records`
10. `brand_associations`
11. `brand_mentions`
12. `brands`
13. `citation_occurrences`
14. `citation_sources`
15. `citations`
16. `competitive_analyses`
17. `competitive_seo_findings`
18. `competitor_changes`
19. `competitors`
20. `crawl_cache`
21. `crawl_jobs`
22. `crawl_results`
23. `crawl_snapshots`
24. `credit_transactions`
25. `diagnostic_finding_relationships`
26. `diagnostic_findings`
27. `document_embeddings`
28. `entities`
29. `entity_relationships`
30. `faq_opportunities`
31. `feature_flags`
32. `historical_metrics`
33. `keywords`
34. `keywords_topics`
35. `kg_alignments`
36. `kg_entities`
37. `kg_relationships`
38. `monitoring_alerts`
39. `monitoring_configs`
40. `organization_invitations`
41. `organization_members`
42. `organizations`
43. `pages`
44. `pages_entities`
45. `pages_keywords`
46. `pages_topics`
47. `permissions`
48. `position_observations`
49. `premium_audits`
50. `prompt_definitions`
51. `prompt_executions`
52. `prompt_schedules`
53. `prompts`
54. `recommendation_observations`
55. `recommendations`
56. `roles`
57. `system_configurations`
58. `technical_audits`
59. `tenant_quotas`
60. `tenant_subscriptions`
61. `topics`
62. `topics_entities`
63. `users`
64. `visibility_scores`
65. `websites`

## 5. Verification Commands Passed

- `pnpm typecheck` — **PASS**
- `pnpm lint` — **PASS** (0 errors)
- `pnpm build` — **PASS**
