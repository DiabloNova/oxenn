# Replay Schema Diff: Drizzle Migration Chain vs. `database/schema/index.ts`

## Summary
This document records the empirical table-level schema diff produced by replaying the Drizzle migration chain (`database/drizzle/0000_reflective_loa.sql` through `0002_soft_jimmy_woo.sql`) via `pnpm db:migrate` against a clean PostgreSQL 16 database (`DB-A`).

---

## Table Counts
- **Tables exported by `database/schema/index.ts`:** 64 tables
- **Tables present in database after `pnpm db:migrate`:** 61 tables (excluding internal `__drizzle_migrations` table)
- **Net Missing Tables:** 3 tables

---

## Table Lists Comparison

### 1. Tables Exported by `database/schema/index.ts` (64)
1. `admin_users`
2. `aeo_analyses`
3. `ai_engines`
4. `ai_observations`
5. `ai_provider_configs`
6. `ai_visibility_audits`
7. `audit_prompts`
8. `audit_records`
9. `brand_associations`
10. `brand_mentions`
11. `brands`
12. `citation_occurrences`
13. `citation_sources`
14. `citations`
15. `competitive_analyses`
16. `competitive_seo_findings`
17. `competitor_changes`
18. `competitors`
19. `crawl_cache`
20. `crawl_jobs`
21. `crawl_results`
22. `crawl_snapshots`
23. `credit_transactions`
24. `diagnostic_finding_relationships`
25. `diagnostic_findings`
26. `document_embeddings`
27. `entities`
28. `entity_relationships`
29. `faq_opportunities`
30. `feature_flags`
31. `historical_metrics`
32. `keywords`
33. `keywords_topics`
34. `kg_alignments`
35. `kg_entities`
36. `kg_relationships`
37. `monitoring_alerts`
38. `monitoring_configs`
39. `organization_invitations`
40. `organization_members`
41. `organizations`
42. `pages`
43. `pages_entities`
44. `pages_keywords`
45. `pages_topics`
46. `permissions`
47. `position_observations`
48. `premium_audits`
49. `prompt_definitions`
50. `prompt_executions`
51. `prompt_schedules`
52. `prompts`
53. `recommendation_observations`
54. `recommendations`
55. `roles`
56. `system_configurations`
57. `technical_audits`
58. `tenant_quotas`
59. `tenant_subscriptions`
60. `topics`
61. `topics_entities`
62. `users`
63. `visibility_scores`
64. `websites`

### 2. Tables Created by Drizzle Migration Replay (`pnpm db:migrate`) (61)
1. `admin_users`
2. `aeo_analyses`
3. `ai_engines`
4. `ai_observations`
5. `ai_provider_configs`
6. `ai_visibility_audits`
7. `audit_prompts`
8. `audit_records`
9. `brand_associations`
10. `brand_mentions`
11. `brands`
12. `citation_occurrences`
13. `citation_sources`
14. `citations`
15. `competitive_analyses`
16. `competitive_seo_findings`
17. `competitor_changes`
18. `competitors`
19. `crawl_cache`
20. `crawl_jobs`
21. `crawl_results`
22. `credit_transactions`
23. `diagnostic_finding_relationships`
24. `diagnostic_findings`
25. `document_embeddings`
26. `entities`
27. `entity_relationships`
28. `faq_opportunities`
29. `feature_flags`
30. `historical_metrics`
31. `keywords`
32. `keywords_topics`
33. `kg_alignments`
34. `kg_entities`
35. `kg_relationships`
36. `organization_invitations`
37. `organization_members`
38. `organizations`
39. `pages`
40. `pages_entities`
41. `pages_keywords`
42. `pages_topics`
43. `permissions`
44. `position_observations`
45. `premium_audits`
46. `prompt_definitions`
47. `prompt_executions`
48. `prompt_schedules`
49. `prompts`
50. `recommendation_observations`
51. `recommendations`
52. `roles`
53. `system_configurations`
54. `technical_audits`
55. `tenant_quotas`
56. `tenant_subscriptions`
57. `topics`
58. `topics_entities`
59. `users`
60. `visibility_scores`
61. `websites`

---

## Missing Tables (Exported in `database/schema/index.ts` MINUS Database Replay State)
The exact missing tables are:
1. `monitoring_configs`
2. `crawl_snapshots`
3. `monitoring_alerts`

---

## Specific Findings on Suspicion (b)

### 1. `api_keys` Table
- **Exported in `database/schema/index.ts`?** **No.** (0 definitions exist in the active schema file).
- **Created by `pnpm db:migrate`?** **No.**
- **Location in repo:** Exists ONLY in handwritten SQL migration `database/migrations/0015_api_keys.sql`.

### 2. Website Monitoring Trio (`monitoring_configs`, `crawl_snapshots`, `monitoring_alerts`)
- **Exported in `database/schema/index.ts`?** **Yes.** Defined at the end of `database/schema/index.ts` (lines 867–919).
- **Created by `pnpm db:migrate`?** **No.** None of these 3 tables exist in the Drizzle migration journal files `0000_reflective_loa.sql`, `0001_illegal_grey_gargoyle.sql`, or `0002_soft_jimmy_woo.sql`.
- **Location in repo:** Defined in TS schema `database/schema/index.ts` and in handwritten SQL migration `database/migrations/0016_website_monitoring.sql`, but missing from the Drizzle migration journal chain.
