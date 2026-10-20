# Database Reference Matrix

## Table: `admin_users`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/admin/infrastructure/mock-db.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `tests/features/admin/cqrs.test.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `email` | `text` | ✅ | ❌ | NULL |
| `full_name` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `role_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_admin_users_deleted_at` | `deleted_at` | `btree` | ❌ | `deleted_at IS NULL` |
| `idx_admin_users_email` | `email` | `btree` | ❌ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `admin_users_email_unique` | `email` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `admin_users_role_id_roles_id_fk` | `role_id` | `roles` | `id` | restrict |

---

## Table: `aeo_analyses`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `analysis_details` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `answerability_score` | `integer` | ✅ | ❌ | NULL |
| `citation_readiness_score` | `integer` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `entity_coverage_score` | `integer` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `overall_aeo_score` | `integer` | ✅ | ❌ | NULL |
| `question_coverage_score` | `integer` | ✅ | ❌ | NULL |
| `semantic_coverage_score` | `integer` | ✅ | ❌ | NULL |
| `structured_answer_quality_score` | `integer` | ✅ | ❌ | NULL |
| `target_keyword` | `text` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `url` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_aeo_analyses_tenant` | `tenant_id` | `btree` | ❌ | — |
| `idx_aeo_analyses_url` | `url` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `aeo_analyses_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `ai_engines`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `capabilities` | `text[]` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `name` | `text` | ✅ | ❌ | NULL |
| `provider` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `text` | ✅ | ❌ | NULL |
| `version_num` | `integer` | ✅ | ❌ | `1` |

---

## Table: `ai_observations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/domain/types/index.ts`, `src/services/diagnostic-engine/index.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/services/audit-engine/diagnostic-engine.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `engine_id` | `uuid` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `observed_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `parsed_sentiment` | `text` | ✅ | ❌ | NULL |
| `position_rank` | `integer` | ❌ | ❌ | NULL |
| `prompt_id` | `uuid` | ✅ | ❌ | NULL |
| `raw_response_text` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_ai_observations_engine` | `engine_id` | `btree` | ❌ | — |
| `idx_ai_observations_organization` | `organization_id` | `btree` | ❌ | — |
| `idx_ai_observations_prompt` | `prompt_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `ai_observations_engine_id_ai_engines_id_fk` | `engine_id` | `ai_engines` | `id` | cascade |
| `ai_observations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `ai_observations_prompt_id_prompts_id_fk` | `prompt_id` | `prompts` | `id` | cascade |

---

## Table: `ai_provider_configs`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/admin/infrastructure/persistence/postgres/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `api_key_masked` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `endpoint_url` | `text` | ✅ | ❌ | NULL |
| `failover_provider_id` | `uuid` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `provider_name` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_ai_provider_configs_active` | `is_active` | `btree` | ❌ | — |

---

## Table: `ai_visibility_audits`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `ai_search_share_score` | `integer` | ✅ | ❌ | NULL |
| `audited_engine_ids` | `text[]` | ✅ | ❌ | NULL |
| `audited_prompts_count` | `integer` | ✅ | ❌ | NULL |
| `brand_authority_score` | `integer` | ✅ | ❌ | NULL |
| `citation_reliability_score` | `integer` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `dimensions_json` | `jsonb` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `overall_score` | `integer` | ✅ | ❌ | NULL |
| `raw_observations_count` | `integer` | ✅ | ❌ | NULL |
| `recommendation_share_score` | `integer` | ✅ | ❌ | NULL |
| `sentiment_score` | `integer` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'completed'` |
| `target_brand_name` | `text` | ✅ | ❌ | NULL |
| `target_domain` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_ai_vis_audits_brand` | `target_brand_name` | `btree` | ❌ | — |
| `idx_ai_vis_audits_org` | `organization_id` | `btree` | ❌ | — |
| `idx_ai_vis_audits_status` | `status` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `ai_visibility_audits_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `api_keys`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `scripts/api/issue-key.ts`, `scripts/api/revoke-key.ts`, `src/core/database/privileged-paths.ts`, `src/features/public-api/repositories/api-key-repository.ts`, `tests/features/public-api/public-api.test.ts`, `tests/unit/core/tenant-context/system-mode-bypass.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `expires_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `hash` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `last_used_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `name` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prefix` | `text` | ✅ | ❌ | NULL |
| `revoked_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_api_keys_organization` | `organization_id` | `btree` | ❌ | — |
| `idx_api_keys_prefix` | `prefix` | `btree` | ❌ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `api_keys_prefix_unique` | `prefix` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `api_keys_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `audit_prompts`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `audit_id` | `uuid` | ✅ | ❌ | NULL |
| `category` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_text` | `text` | ✅ | ❌ | NULL |
| `weight` | `double precision` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_audit_prompts_audit` | `audit_id` | `btree` | ❌ | — |
| `idx_audit_prompts_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `audit_prompts_audit_id_ai_visibility_audits_id_fk` | `audit_id` | `ai_visibility_audits` | `id` | cascade |
| `audit_prompts_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `audit_records`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `scripts/auth/grant-super-admin.ts`, `src/app/actions/account.ts`, `src/core/database/tenant-context/index.ts`, `src/features/admin/infrastructure/mock-db.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `tests/features/admin/cqrs.test.ts`, `tests/isolation/suite.ts`, `tests/unit/app/actions/account.test.ts`, `tests/unit/core/tenant-context/privileged-paths.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `action` | `text` | ✅ | ❌ | NULL |
| `actor_email` | `text` | ✅ | ❌ | NULL |
| `actor_id` | `text` | ✅ | ❌ | NULL |
| `actor_role` | `text` | ✅ | ❌ | NULL |
| `error_details` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `ip_address` | `text` | ✅ | ❌ | NULL |
| `payload_after` | `text` | ❌ | ❌ | NULL |
| `payload_before` | `text` | ❌ | ❌ | NULL |
| `resource_id` | `text` | ✅ | ❌ | NULL |
| `resource_type` | `text` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | NULL |
| `timestamp` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `user_agent` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_audit_records_actor` | `actor_id` | `btree` | ❌ | — |
| `idx_audit_records_resource` | `resource_type, resource_id` | `btree` | ❌ | — |
| `idx_audit_records_timestamp` | `timestamp` | `btree` | ❌ | — |

---

## Table: `auth_rate_limits`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/auth.ts`, `tests/unit/app/actions/auth-deactivated.test.ts`, `tests/unit/auth/user-id-format.test.ts`, `tests/unit/authorization-lifecycle.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `attempts` | `integer` | ✅ | ❌ | `1` |
| `bucket_key` | `text` | ✅ | ❌ | NULL |
| `endpoint` | `text` | ✅ | ❌ | NULL |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `auth_rate_limits_endpoint_bucket_key_pk` | `endpoint, bucket_key` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_auth_rate_limits_expires` | `expires_at` | `btree` | ❌ | — |

---

## Table: `brand_associations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `association_score` | `double precision` | ✅ | ❌ | `0` |
| `attribute_name` | `text` | ✅ | ❌ | NULL |
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `mention_count` | `integer` | ✅ | ❌ | `0` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `sample_excerpts` | `text[]` | ✅ | ❌ | `'{}'::text[]` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_brand_associations_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_brand_associations_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `brand_associations_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `brand_associations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `brand_mentions`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/audits/page.tsx`, `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/services/audit-engine/ai-visibility.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_recommended` | `boolean` | ✅ | ❌ | `false` |
| `mention_context` | `text` | ✅ | ❌ | NULL |
| `observation_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `sentiment_score` | `double precision` | ✅ | ❌ | `0` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_brand_mentions_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_brand_mentions_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `brand_mentions_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `brand_mentions_observation_id_ai_observations_id_fk` | `observation_id` | `ai_observations` | `id` | cascade |
| `brand_mentions_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `brands`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/about/page.tsx`, `src/app/[locale]/dashboard/aeo/audits/page.tsx`, `src/app/[locale]/dashboard/aeo/playground/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/pricing/page.tsx`, `src/app/actions/ai-visibility-audit.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/entity-service.ts`, `src/lib/audit-engine/extractor.ts`, `src/services/ai/ai-visibility-provider.ts`, `src/services/ai/graph-extraction.ts`, `tests/features/ai-intelligence/application.test.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/ai-intelligence/tenant-pipeline.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `aliases` | `text[]` | ✅ | ❌ | `'{}'::text[]` |
| `canonical_domain` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `industry` | `text` | ✅ | ❌ | NULL |
| `name` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `target_markets` | `text[]` | ✅ | ❌ | `'{}'::text[]` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_brands_domain` | `canonical_domain` | `btree` | ❌ | — |
| `idx_brands_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `brands_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `citation_occurrences`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `citation_position` | `integer` | ✅ | ❌ | `1` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `engine_id` | `text` | ✅ | ❌ | NULL |
| `excerpt_text` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_brand_mentioned` | `boolean` | ✅ | ❌ | `false` |
| `occurred_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_text` | `text` | ✅ | ❌ | NULL |
| `sentiment_score` | `double precision` | ✅ | ❌ | `0` |
| `source_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_citation_occurrences_source` | `source_id` | `btree` | ❌ | — |
| `idx_citation_occurrences_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `citation_occurrences_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `citation_occurrences_source_id_citation_sources_id_fk` | `source_id` | `citation_sources` | `id` | cascade |

---

## Table: `citation_sources`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/competitive-radar-service.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `authority_score` | `integer` | ✅ | ❌ | `50` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `domain` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_verified_domain` | `boolean` | ✅ | ❌ | `false` |
| `metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `publisher_category` | `text` | ✅ | ❌ | `'General'` |
| `publisher_name` | `text` | ❌ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `url` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_citation_sources_tenant` | `organization_id` | `btree` | ❌ | — |
| `idx_citation_sources_url_org` | `organization_id, url` | `btree` | ✅ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `citation_sources_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `citations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/about/page.tsx`, `src/app/[locale]/dashboard/aeo/audits/page.tsx`, `src/app/[locale]/dashboard/aeo/content/page.tsx`, `src/app/[locale]/dashboard/audits/[id]/page.tsx`, `src/app/[locale]/dashboard/intelligence/page.tsx`, `src/app/[locale]/features/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/solutions/geo/page.tsx`, `src/components/features/dashboard-home/DashboardKpiGrid.tsx`, `src/components/features/graph/LiveKnowledgeGraph.tsx`, `src/components/marketing/HeroSection.tsx`, `src/components/marketing/MetricsSection.tsx`, `src/components/marketing/ProcessSection.tsx`, `src/config/dashboardNavigation.ts`, `src/features/ai-intelligence/application/handlers/index.ts`, `src/features/ai-intelligence/domain/models/observation-aggregate.ts`, `src/features/ai-intelligence/domain/services/aeo-score-engine.ts`, `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`, `src/features/ai-intelligence/services/citation-service.ts`, `src/features/ai-intelligence/services/observation-service.ts`, `src/features/ai-intelligence/services/prompt-intelligence-service.ts`, `src/services/ai/ai-visibility-provider.ts`, `src/services/auditService.ts`, `src/services/dashboard-services/index.ts`, `src/services/diagnostic-engine/index.ts`, `src/services/intelligence/index.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/services/audit-engine/ai-visibility.test.ts`, `tests/services/audit-engine/competitive-ai.test.ts`, `tests/services/audit-engine/competitive-radar.test.ts`, `tests/services/audit-engine/intelligence-model.test.ts`, `tests/unit/services/dashboard-services.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `anchor_text` | `text` | ❌ | ❌ | NULL |
| `citation_order` | `integer` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `domain` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `observation_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `url` | `text` | ✅ | ❌ | NULL |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_citations_domain` | `domain` | `btree` | ❌ | — |
| `idx_citations_observation` | `observation_id` | `btree` | ❌ | — |
| `idx_citations_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `citations_observation_id_ai_observations_id_fk` | `observation_id` | `ai_observations` | `id` | cascade |
| `citations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `competitive_analyses`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/analysis/competitive/route.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `advantages` | `jsonb` | ✅ | ❌ | NULL |
| `comparison_data` | `jsonb` | ✅ | ❌ | NULL |
| `competitor_urls` | `text[]` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ❌ | ❌ | `NOW()` |
| `gaps` | `jsonb` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `market_position` | `text` | ✅ | ❌ | NULL |
| `opportunities` | `jsonb` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `overall_score` | `integer` | ✅ | ❌ | NULL |
| `user_url` | `text` | ✅ | ❌ | NULL |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `competitive_analyses_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `competitive_seo_findings`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `competitor_id` | `uuid` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `description` | `text` | ✅ | ❌ | NULL |
| `evidence` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `finding_type` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `impact_score` | `integer` | ✅ | ❌ | `0` |
| `recommendation` | `text` | ✅ | ❌ | NULL |
| `severity` | `text` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `title` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_comp_seo_findings_comp` | `competitor_id` | `btree` | ❌ | — |
| `idx_comp_seo_findings_tenant` | `tenant_id` | `btree` | ❌ | — |
| `idx_comp_seo_findings_type` | `finding_type` | `btree` | ❌ | — |

### Check Constraints

| Name | Expression |
|---|---|
| `competitive_seo_findings_finding_type_check` | `finding_type IN (     'technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference',     'ai_visibility_gap', 'citation_gap', 'prompt_gap', 'brand_mention_gap', 'ai_recommendation_gap', 'citation_overlap'   )` |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `competitive_seo_findings_competitor_id_competitors_id_fk` | `competitor_id` | `competitors` | `id` | set null |
| `competitive_seo_findings_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `competitor_changes`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `change_type` | `text` | ✅ | ❌ | NULL |
| `competitor_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `details` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `detected_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `severity` | `text` | ✅ | ❌ | NULL |
| `summary` | `text` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_competitor_changes_comp` | `competitor_id` | `btree` | ❌ | — |
| `idx_competitor_changes_tenant` | `tenant_id` | `btree` | ❌ | — |
| `idx_competitor_changes_type` | `change_type` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `competitor_changes_competitor_id_competitors_id_fk` | `competitor_id` | `competitors` | `id` | cascade |
| `competitor_changes_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `competitors`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/playground/page.tsx`, `src/app/[locale]/dashboard/brand/citations/page.tsx`, `src/app/[locale]/dashboard/competitive/page.tsx`, `src/app/[locale]/dashboard/competitors/radar/page.tsx`, `src/app/[locale]/dashboard/intelligence/page.tsx`, `src/app/[locale]/features/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/solutions/page.tsx`, `src/app/[locale]/solutions/protection/page.tsx`, `src/app/[locale]/solutions/radar/page.tsx`, `src/app/actions/citation-intelligence.ts`, `src/app/actions/prompt-intelligence.ts`, `src/app/api/v1/analysis/competitive/route.ts`, `src/app/api/v1/analytics/llm/route.ts`, `src/app/api/v1/audit/premium/route.ts`, `src/components/features/analysis/CompetitiveAnalysisPanel.tsx`, `src/components/features/analytics/LlmAnalyticsPanel.tsx`, `src/components/features/analytics/mention-matcher.ts`, `src/components/features/dashboard-home/DashboardKpiGrid.tsx`, `src/components/marketing/FeaturesSection.tsx`, `src/config/dashboardNavigation.ts`, `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`, `src/features/ai-intelligence/services/brand-intelligence-service.ts`, `src/features/ai-intelligence/services/citation-intelligence-service.ts`, `src/features/ai-intelligence/services/competitive-seo-service.ts`, `src/features/ai-intelligence/services/competitor-discovery-service.ts`, `src/features/ai-intelligence/services/keyword-intelligence-service.ts`, `src/features/ai-intelligence/services/prompt-intelligence-service.ts`, `src/services/ai/ai-visibility-provider.ts`, `src/services/ai/graph-extraction.ts`, `src/services/dashboard-services/index.ts`, `src/services/diagnostic-engine/index.ts`, `tests/features/analysis/competitive.test.ts`, `tests/services/audit-engine/diagnostic-engine.test.ts`, `tests/ui/features/analytics/LlmAnalyticsPanel.test.tsx`, `tests/unit/core/tenant-context/tenant-tables.test.ts`, `tests/unit/services/dashboard-shell.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `domain` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_direct` | `boolean` | ✅ | ❌ | `true` |
| `metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `name` | `text` | ✅ | ❌ | NULL |
| `normalized_url` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_competitors_domain_org` | `organization_id, domain` | `btree` | ✅ | `deleted_at IS NULL` |
| `idx_competitors_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `competitors_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `crawl_cache`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/acquisition/infrastructure/persistence/postgres/crawl-cache-repository.ts`, `tests/features/acquisition/integration/run-all.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `cache_key` | `text` | ✅ | ❌ | NULL |
| `cache_scope` | `text` | ✅ | ❌ | `'tenant'` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `normalized_result` | `jsonb` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_crawl_cache_key` | `tenant_id, cache_scope, cache_key` | `btree` | ✅ | — |

### Check Constraints

| Name | Expression |
|---|---|
| `crawl_cache_scope_check` | `cache_scope = 'tenant'` |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `crawl_cache_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `crawl_jobs`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/acquisition/infrastructure/persistence/postgres/crawl-job-repository.ts`, `tests/features/acquisition/integration/run-all.ts`, `tests/isolation/suite.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `attempts` | `integer` | ✅ | ❌ | `0` |
| `bytes_processed` | `bigint` | ❌ | ❌ | NULL |
| `cache_key` | `text` | ✅ | ❌ | NULL |
| `cache_outcome` | `text` | ❌ | ❌ | NULL |
| `cancellation_reason` | `text` | ❌ | ❌ | NULL |
| `cancellation_requested_by` | `text` | ❌ | ❌ | NULL |
| `cancelled_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `claimed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `completed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `correlation_id` | `text` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `dedup_key` | `text` | ✅ | ❌ | NULL |
| `duration_ms` | `integer` | ❌ | ❌ | NULL |
| `error` | `jsonb` | ❌ | ❌ | NULL |
| `heartbeat_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `lease_expires_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `max_attempts` | `integer` | ✅ | ❌ | NULL |
| `normalized_url` | `text` | ✅ | ❌ | NULL |
| `page_count` | `integer` | ❌ | ❌ | NULL |
| `policy` | `jsonb` | ✅ | ❌ | NULL |
| `priority` | `integer` | ✅ | ❌ | `0` |
| `provider_id` | `text` | ❌ | ❌ | NULL |
| `provider_job_id` | `text` | ❌ | ❌ | NULL |
| `request_id` | `text` | ❌ | ❌ | NULL |
| `requested_url` | `text` | ✅ | ❌ | NULL |
| `result_ref` | `uuid` | ❌ | ❌ | NULL |
| `scheduled_for` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `started_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'PENDING'` |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `trace_id` | `text` | ❌ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `version` | `integer` | ✅ | ❌ | `1` |
| `worker_id` | `text` | ❌ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_crawl_jobs_active_dedup` | `tenant_id, dedup_key` | `btree` | ✅ | `status IN ('PENDING', 'QUEUED', 'RUNNING')` |
| `idx_crawl_jobs_provider_job_id` | `provider_job_id` | `btree` | ❌ | — |
| `idx_crawl_jobs_status_scheduled` | `status, scheduled_for` | `btree` | ❌ | `status = 'QUEUED'` |
| `idx_crawl_jobs_tenant_created` | `tenant_id, created_at` | `btree` | ❌ | — |
| `idx_crawl_jobs_tenant_status` | `tenant_id, status` | `btree` | ❌ | — |

### Check Constraints

| Name | Expression |
|---|---|
| `crawl_jobs_attempts_check` | `attempts >= 0` |
| `crawl_jobs_cache_outcome_check` | `cache_outcome IS NULL OR cache_outcome IN ('HIT', 'MISS', 'STALE', 'BYPASS')` |
| `crawl_jobs_max_attempts_check` | `max_attempts > 0` |
| `crawl_jobs_status_check` | `status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED')` |
| `crawl_jobs_version_check` | `version > 0` |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `crawl_jobs_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `crawl_results`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/audit/premium/route.ts`, `src/features/acquisition/infrastructure/persistence/postgres/crawl-result-repository.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `job_id` | `uuid` | ✅ | ❌ | NULL |
| `result` | `jsonb` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `crawl_results_job_unique` | `job_id` | `btree` | ✅ | — |
| `crawl_results_tenant_job_unique` | `tenant_id, job_id` | `btree` | ✅ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `crawl_results_job_id_crawl_jobs_id_fk` | `job_id` | `crawl_jobs` | `id` | cascade |
| `crawl_results_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `crawl_snapshots`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/monitoring/repositories/crawl-snapshot-repository.ts`, `tests/unit/services/monitoring/tenant-isolation.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `captured_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `content_hash` | `text` | ❌ | ❌ | NULL |
| `crawl_job_id` | `uuid` | ✅ | ❌ | NULL |
| `extracted_content` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `monitoring_config_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `snapshot_metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_crawl_snapshots_captured` | `captured_at` | `btree` | ❌ | — |
| `idx_crawl_snapshots_config` | `monitoring_config_id` | `btree` | ❌ | — |
| `idx_crawl_snapshots_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `crawl_snapshots_crawl_job_id_crawl_jobs_id_fk` | `crawl_job_id` | `crawl_jobs` | `id` | cascade |
| `crawl_snapshots_monitoring_config_id_monitoring_configs_id_fk` | `monitoring_config_id` | `monitoring_configs` | `id` | cascade |
| `crawl_snapshots_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `credit_transactions`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/billing/services/subscription-service.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `amount` | `integer` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `description` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `reference_id` | `text` | ❌ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `transaction_type` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_credit_transactions_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `credit_transactions_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `diagnostic_finding_relationships`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `child_finding_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `parent_finding_id` | `uuid` | ✅ | ❌ | NULL |
| `relationship_type` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_diagnostic_rel_child` | `child_finding_id` | `btree` | ❌ | — |
| `idx_diagnostic_rel_org` | `organization_id` | `btree` | ❌ | — |
| `idx_diagnostic_rel_parent` | `parent_finding_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `diagnostic_finding_relationships_child_finding_id_diagnostic_findings_id_fk` | `child_finding_id` | `diagnostic_findings` | `id` | cascade |
| `diagnostic_finding_relationships_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `diagnostic_finding_relationships_parent_finding_id_diagnostic_findings_id_fk` | `parent_finding_id` | `diagnostic_findings` | `id` | cascade |

---

## Table: `diagnostic_findings`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `confidence` | `double precision` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `description` | `text` | ✅ | ❌ | NULL |
| `domain` | `text` | ✅ | ❌ | NULL |
| `evidence` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `finding_type` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `impact_score` | `integer` | ✅ | ❌ | `0` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `recommendation` | `text` | ✅ | ❌ | NULL |
| `severity` | `text` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'open'` |
| `title` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_diagnostic_findings_domain` | `domain` | `btree` | ❌ | — |
| `idx_diagnostic_findings_org` | `organization_id` | `btree` | ❌ | — |
| `idx_diagnostic_findings_status` | `status` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `diagnostic_findings_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `document_embeddings`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/audit/aeo-insight/route.ts`, `src/services/knowledge-graph/vector-store.ts`, `tests/features/ai-intelligence/run-all.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/audit/aeo-insight.test.ts`, `tests/isolation/suite.ts`, `tests/services/crawler/web-crawler.test.ts`, `tests/services/ingestion/document-ingestion.test.ts`, `tests/services/rag/query-service.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `content_chunk` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `embedding` | `vector(768)` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_document_embeddings_embedding` | `embedding` | `hnsw` | ❌ | — |
| `idx_document_embeddings_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `document_embeddings_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `email_verification_tokens`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/auth.ts`, `src/core/database/privileged-paths.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `consumed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `token_hash` | `text` | ✅ | ❌ | NULL |
| `user_id` | `text` | ✅ | ❌ | NULL |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `email_verification_tokens_token_hash_unique` | `token_hash` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `email_verification_tokens_user_id_users_id_fk` | `user_id` | `users` | `id` | cascade |

---

## Table: `entities`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `scripts/test-domain.ts`, `src/app/[locale]/dashboard/aeo/content/page.tsx`, `src/app/[locale]/dashboard/audits/[id]/page.tsx`, `src/app/[locale]/dashboard/entities/graph/page.tsx`, `src/app/[locale]/dashboard/graph/page.tsx`, `src/app/[locale]/features/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/api/v1/audit/aeo-insight/route.ts`, `src/app/api/v1/knowledge-graph/query/route.ts`, `src/components/DashboardShell.tsx`, `src/components/features/analytics/TopEntitiesList.tsx`, `src/components/features/analytics/mention-matcher.ts`, `src/components/features/audit/FreeAuditPanel.tsx`, `src/components/features/graph/KnowledgeGraphExplorer.tsx`, `src/components/marketing/FeaturesSection.tsx`, `src/components/marketing/LandingFooter.tsx`, `src/components/marketing/ProcessSection.tsx`, `src/config/dashboardNavigation.ts`, `src/features/admin/application/handlers.ts`, `src/features/admin/index.ts`, `src/features/ai-intelligence/application/handlers/index.ts`, `src/features/ai-intelligence/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/aeo-content-intelligence-service.ts`, `src/features/ai-intelligence/services/entity-service.ts`, `src/lib/audit-engine/builder.ts`, `src/lib/audit-engine/extractor.ts`, `src/lib/audit-engine/normalizer.ts`, `src/lib/audit-engine/recommendations.ts`, `src/lib/audit-engine/scorer.ts`, `src/services/ai/ai-visibility-provider.ts`, `src/services/ai/graph-extraction.ts`, `src/services/auditService.ts`, `src/services/dashboard-services/index.ts`, `src/services/diagnostic-engine/index.ts`, `src/services/knowledge-graph/graph-store.ts`, `src/types/audit.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/services/ingestion/document-ingestion.test.ts`, `tests/services/knowledge-graph/graph-store.test.ts`, `tests/services/knowledge-graph/knowledge-graph-foundation.test.ts`, `tests/ui/features/analytics/mention-matcher.test.ts`, `tests/unit/features/admin/domain.test.ts`, `tests/unit/features/ai-intelligence/domain.test.ts`, `tests/unit/services/ai/graph-extraction.test.ts`, `tests/unit/services/audit-engine/engine.test.ts`, `tests/unit/services/dashboard-shell.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `description` | `text` | ❌ | ❌ | NULL |
| `entity_type` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `name` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `properties` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_entities_organization` | `organization_id` | `btree` | ❌ | — |
| `idx_entities_type` | `entity_type` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `entities_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `entity_relationships`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/features/ai-intelligence/security.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `relationship_type` | `text` | ✅ | ❌ | NULL |
| `source_entity_id` | `uuid` | ✅ | ❌ | NULL |
| `target_entity_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |
| `weight` | `double precision` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_entity_relationships_org` | `organization_id` | `btree` | ❌ | — |
| `idx_entity_relationships_source` | `source_entity_id` | `btree` | ❌ | — |
| `idx_entity_relationships_target` | `target_entity_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `entity_relationships_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `entity_relationships_source_entity_id_entities_id_fk` | `source_entity_id` | `entities` | `id` | cascade |
| `entity_relationships_target_entity_id_entities_id_fk` | `target_entity_id` | `entities` | `id` | cascade |

---

## Table: `faq_opportunities`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/content/page.tsx`, `src/app/actions/aeo-content-intelligence.ts`, `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `aeo_analysis_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `opportunity_score` | `integer` | ✅ | ❌ | `50` |
| `question_text` | `text` | ✅ | ❌ | NULL |
| `suggested_answer` | `text` | ❌ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `user_intent` | `text` | ✅ | ❌ | `'Informational'` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_faq_opps_analysis` | `aeo_analysis_id` | `btree` | ❌ | — |
| `idx_faq_opps_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `faq_opportunities_aeo_analysis_id_aeo_analyses_id_fk` | `aeo_analysis_id` | `aeo_analyses` | `id` | cascade |
| `faq_opportunities_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `feature_flags`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/admin/infrastructure/mock-db.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `tests/features/admin/cqrs.test.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `description` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_enabled_globally` | `boolean` | ✅ | ❌ | `false` |
| `key` | `text` | ✅ | ❌ | NULL |
| `name` | `text` | ✅ | ❌ | NULL |
| `tenant_overrides` | `text` | ✅ | ❌ | `'{}'` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_feature_flags_key` | `key` | `btree` | ❌ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `feature_flags_key_unique` | `key` | ❌ |

---

## Table: `historical_metrics`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `src/services/diagnostic-engine/index.ts`, `tests/services/audit-engine/diagnostic-engine.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `dimensions` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `entity_id` | `uuid` | ✅ | ❌ | NULL |
| `entity_type` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `metric_name` | `text` | ✅ | ❌ | NULL |
| `metric_value` | `double precision` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `recorded_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_historical_metrics_lookup` | `organization_id, entity_type, entity_id, metric_name` | `btree` | ❌ | — |
| `idx_historical_metrics_time` | `recorded_at` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `historical_metrics_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `keywords`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `scripts/database/verify-rls-migrations.ts`, `src/app/[locale]/features/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/api/v1/analysis/competitive/route.ts`, `src/app/api/v1/content/studio/route.ts`, `src/app/api/v1/optimization/technical/route.ts`, `src/components/features/content/ContentStudio.tsx`, `src/components/features/dashboard-home/RecommendedActionsPanel.tsx`, `src/components/features/dashboard-services/ServiceMarketplaceClient.tsx`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/aeo-content-intelligence-service.ts`, `src/features/ai-intelligence/services/competitive-seo-service.ts`, `src/features/ai-intelligence/services/keyword-intelligence-service.ts`, `src/lib/audit-engine/extractor.ts`, `src/services/technical-seo-analyzer.ts`, `tests/services/audit-engine/keyword-intelligence.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `cpc` | `double precision` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `intent` | `text` | ❌ | ❌ | NULL |
| `language` | `text` | ✅ | ❌ | `'en'` |
| `normalized_term` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `search_volume` | `integer` | ❌ | ❌ | NULL |
| `term` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_keywords_organization` | `organization_id` | `btree` | ❌ | — |
| `idx_keywords_term_org` | `organization_id, normalized_term` | `btree` | ✅ | `deleted_at IS NULL` |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `keywords_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `keywords_topics`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `keyword_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `topic_id` | `uuid` | ✅ | ❌ | NULL |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `keywords_topics_keyword_id_topic_id_pk` | `keyword_id, topic_id` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_keywords_topics_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `keywords_topics_keyword_id_keywords_id_fk` | `keyword_id` | `keywords` | `id` | cascade |
| `keywords_topics_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `keywords_topics_topic_id_topics_id_fk` | `topic_id` | `topics` | `id` | cascade |

---

## Table: `kg_alignments`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/content/page.tsx`, `src/app/actions/aeo-content-intelligence.ts`, `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `aeo_analysis_id` | `uuid` | ✅ | ❌ | NULL |
| `alignment_status` | `text` | ✅ | ❌ | `'unmapped'` |
| `confidence` | `double precision` | ✅ | ❌ | `0` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `entity_name` | `text` | ✅ | ❌ | NULL |
| `entity_type` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `wikidata_id` | `text` | ❌ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_kg_alignments_analysis` | `aeo_analysis_id` | `btree` | ❌ | — |
| `idx_kg_alignments_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `kg_alignments_aeo_analysis_id_aeo_analyses_id_fk` | `aeo_analysis_id` | `aeo_analyses` | `id` | cascade |
| `kg_alignments_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `kg_entities`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/audit/aeo-insight/route.ts`, `src/services/knowledge-graph/graph-store.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/audit/aeo-insight.test.ts`, `tests/services/ingestion/document-ingestion.test.ts`, `tests/services/knowledge-graph/graph-store.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `name` | `text` | ✅ | ❌ | NULL |
| `properties` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `type` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_kg_entities_name` | `name` | `btree` | ❌ | — |
| `idx_kg_entities_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `kg_entities_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `kg_relationships`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/audit/aeo-insight/route.ts`, `src/services/knowledge-graph/graph-store.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/audit/aeo-insight.test.ts`, `tests/services/ingestion/document-ingestion.test.ts`, `tests/services/knowledge-graph/graph-store.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `properties` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `relationship_type` | `text` | ✅ | ❌ | NULL |
| `source_entity_id` | `uuid` | ✅ | ❌ | NULL |
| `target_entity_id` | `uuid` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_kg_relationships_source` | `source_entity_id` | `btree` | ❌ | — |
| `idx_kg_relationships_target` | `target_entity_id` | `btree` | ❌ | — |
| `idx_kg_relationships_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `kg_relationships_source_entity_id_kg_entities_id_fk` | `source_entity_id` | `kg_entities` | `id` | cascade |
| `kg_relationships_target_entity_id_kg_entities_id_fk` | `target_entity_id` | `kg_entities` | `id` | cascade |
| `kg_relationships_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `monitoring_alerts`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/monitoring/repositories/monitoring-alert-repository.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`, `tests/unit/services/monitoring/tenant-isolation.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `alert_type` | `text` | ✅ | ❌ | NULL |
| `crawl_snapshot_id` | `uuid` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `dedup_key` | `text` | ✅ | ❌ | NULL |
| `event_metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `message` | `text` | ✅ | ❌ | NULL |
| `monitoring_config_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `severity` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_monitoring_alerts_config` | `monitoring_config_id` | `btree` | ❌ | — |
| `idx_monitoring_alerts_dedup` | `organization_id, dedup_key` | `btree` | ✅ | — |
| `idx_monitoring_alerts_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `monitoring_alerts_crawl_snapshot_id_crawl_snapshots_id_fk` | `crawl_snapshot_id` | `crawl_snapshots` | `id` | cascade |
| `monitoring_alerts_monitoring_config_id_monitoring_configs_id_fk` | `monitoring_config_id` | `monitoring_configs` | `id` | cascade |
| `monitoring_alerts_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `monitoring_configs`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/monitoring/repositories/monitoring-config-repository.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`, `tests/unit/services/monitoring/tenant-isolation.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `crawl_policy` | `jsonb` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `enabled` | `boolean` | ✅ | ❌ | `true` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `target_url` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `website_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_monitoring_configs_org` | `organization_id` | `btree` | ❌ | — |
| `idx_monitoring_configs_website` | `website_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `monitoring_configs_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `monitoring_configs_website_id_websites_id_fk` | `website_id` | `websites` | `id` | cascade |

---

## Table: `organization_invitations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/workspace.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `email` | `text` | ✅ | ❌ | NULL |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `role` | `text` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'pending'` |
| `token_hash` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_org_invitations_email` | `email` | `btree` | ❌ | — |
| `idx_org_invitations_token` | `token_hash` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `organization_invitations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `organization_members`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `scripts/auth/grant-super-admin.ts`, `src/app/actions/account.ts`, `src/app/actions/auth.ts`, `src/app/actions/workspace.ts`, `src/services/auth/authorization.ts`, `src/services/auth/session.ts`, `tests/isolation/suite.ts`, `tests/unit/app/actions/account.test.ts`, `tests/unit/authorization-lifecycle.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`, `tests/unit/services/auth/session.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `role` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `user_id` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_org_members_user_id` | `user_id` | `btree` | ❌ | — |
| `idx_org_members_user_org` | `organization_id, user_id` | `btree` | ✅ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `organization_members_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `organization_members_user_id_users_id_fk` | `user_id` | `users` | `id` | cascade |

---

## Table: `organizations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/account.ts`, `src/app/actions/auth.ts`, `src/app/actions/workspace.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/services/auth/authorization.ts`, `src/services/auth/session.ts`, `tests/features/acquisition/integration/run-all.ts`, `tests/features/admin/tenant-isolation-behavior.test.ts`, `tests/features/ai-intelligence/run-all.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/public-api/public-api.test.ts`, `tests/isolation/suite.ts`, `tests/unit/authorization-lifecycle.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `name` | `text` | ✅ | ❌ | NULL |
| `plan` | `text` | ✅ | ❌ | `'free'` |
| `slug` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_organizations_slug` | `slug` | `btree` | ✅ | `deleted_at IS NULL` |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `organizations_slug_unique` | `slug` | ❌ |

---

## Table: `pages`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/content/page.tsx`, `src/app/[locale]/dashboard/audits/[id]/page.tsx`, `src/app/[locale]/dashboard/intelligence/layout.tsx`, `src/app/[locale]/dashboard/seo/technical/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/actions/aeo-content-intelligence.ts`, `src/app/actions/site-architecture.ts`, `src/app/actions/technical-seo.ts`, `src/app/api/v1/audit/premium/route.ts`, `src/components/features/analysis/CompetitiveAnalysisPanel.tsx`, `src/components/features/audit/PremiumAuditPanel.tsx`, `src/components/features/dashboard-home/CriticalIssuesPanel.tsx`, `src/components/features/dashboard-home/RecentActivityPanel.tsx`, `src/components/features/optimization/TechnicalOptimizationPanel.tsx`, `src/components/marketing/LandingFooter.tsx`, `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/competitive-seo-service.ts`, `src/features/ai-intelligence/services/keyword-intelligence-service.ts`, `src/features/ai-intelligence/services/site-architecture-analyzer-service.ts`, `src/services/auditService.ts`, `tests/features/audit/premium-audit.test.ts`, `tests/services/audit-engine/competitive-seo.test.ts`, `tests/services/audit-engine/site-architecture.test.ts`, `tests/services/crawler/web-crawler.test.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`, `tests/unit/services/observability/observability.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `canonical_url` | `text` | ❌ | ❌ | NULL |
| `content_hash` | `text` | ❌ | ❌ | NULL |
| `content_type` | `text` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `http_status` | `integer` | ✅ | ❌ | `200` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `inlink_count` | `integer` | ✅ | ❌ | `0` |
| `last_crawled_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `meta_description` | `text` | ❌ | ❌ | NULL |
| `normalized_url` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `outlink_count` | `integer` | ✅ | ❌ | `0` |
| `path` | `text` | ✅ | ❌ | NULL |
| `robots_directives` | `text[]` | ✅ | ❌ | `'{}'::text[]` |
| `title` | `text` | ❌ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `url` | `text` | ✅ | ❌ | NULL |
| `version` | `integer` | ✅ | ❌ | `1` |
| `website_id` | `uuid` | ✅ | ❌ | NULL |
| `word_count` | `integer` | ✅ | ❌ | `0` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_pages_organization` | `organization_id` | `btree` | ❌ | — |
| `idx_pages_url_org` | `organization_id, normalized_url` | `btree` | ✅ | `deleted_at IS NULL` |
| `idx_pages_website` | `website_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `pages_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `pages_website_id_websites_id_fk` | `website_id` | `websites` | `id` | cascade |

---

## Table: `pages_entities`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `entity_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `page_id` | `uuid` | ✅ | ❌ | NULL |
| `salience` | `double precision` | ✅ | ❌ | `1` |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `pages_entities_page_id_entity_id_pk` | `page_id, entity_id` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_pages_entities_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `pages_entities_entity_id_entities_id_fk` | `entity_id` | `entities` | `id` | cascade |
| `pages_entities_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `pages_entities_page_id_pages_id_fk` | `page_id` | `pages` | `id` | cascade |

---

## Table: `pages_keywords`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `is_primary` | `boolean` | ✅ | ❌ | `false` |
| `keyword_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `page_id` | `uuid` | ✅ | ❌ | NULL |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `pages_keywords_page_id_keyword_id_pk` | `page_id, keyword_id` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_pages_keywords_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `pages_keywords_keyword_id_keywords_id_fk` | `keyword_id` | `keywords` | `id` | cascade |
| `pages_keywords_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `pages_keywords_page_id_pages_id_fk` | `page_id` | `pages` | `id` | cascade |

---

## Table: `pages_topics`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `page_id` | `uuid` | ✅ | ❌ | NULL |
| `score` | `double precision` | ✅ | ❌ | `1` |
| `topic_id` | `uuid` | ✅ | ❌ | NULL |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `pages_topics_page_id_topic_id_pk` | `page_id, topic_id` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_pages_topics_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `pages_topics_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `pages_topics_page_id_pages_id_fk` | `page_id` | `pages` | `id` | cascade |
| `pages_topics_topic_id_topics_id_fk` | `topic_id` | `topics` | `id` | cascade |

---

## Table: `password_reset_tokens`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/auth.ts`, `src/core/database/privileged-paths.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `consumed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `token_hash` | `text` | ✅ | ❌ | NULL |
| `user_id` | `text` | ✅ | ❌ | NULL |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `password_reset_tokens_token_hash_unique` | `token_hash` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `password_reset_tokens_user_id_users_id_fk` | `user_id` | `users` | `id` | cascade |

---

## Table: `permissions`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/admin/api/v1/admin/index.ts`, `src/features/admin/application/commands.ts`, `src/features/admin/application/dto.ts`, `src/features/admin/application/handlers.ts`, `src/features/admin/application/mappers.ts`, `src/features/admin/domain/entities.ts`, `src/features/admin/domain/events/index.ts`, `src/features/admin/domain/types.ts`, `src/features/admin/infrastructure/mock-db.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `src/features/admin/security/index.ts`, `src/features/ai-intelligence/security/index.ts`, `src/services/auth/authorization.ts`, `tests/features/admin/cqrs.test.ts`, `tests/features/admin/infrastructure/postgres-integration.test.ts`, `tests/features/admin/security.test.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/isolation/suite.ts`, `tests/unit/features/admin/domain.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `permission_key` | `text` | ✅ | ❌ | NULL |
| `role_id` | `uuid` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_permissions_role_id` | `role_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `permissions_role_id_roles_id_fk` | `role_id` | `roles` | `id` | cascade |

---

## Table: `position_observations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `analyzer_version` | `text` | ✅ | ❌ | `'1.0.0'` |
| `confidence` | `double precision` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `evidence_excerpt` | `text` | ✅ | ❌ | NULL |
| `evidence_structure` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `numeric_position` | `integer` | ❌ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `presence` | `text` | ✅ | ❌ | NULL |
| `source_execution_id` | `uuid` | ✅ | ❌ | NULL |
| `subject_entity_id` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_position_obs_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `position_observations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `position_observations_source_execution_id_prompt_executions_id_fk` | `source_execution_id` | `prompt_executions` | `id` | cascade |

---

## Table: `premium_audits`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/audit/engine/route.ts`, `src/app/api/v1/audit/premium/route.ts`, `src/services/dashboard-home/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `grade` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `issues` | `jsonb` | ✅ | ❌ | NULL |
| `metrics` | `jsonb` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `pages_analyzed` | `integer` | ✅ | ❌ | NULL |
| `recommendations` | `jsonb` | ✅ | ❌ | NULL |
| `score` | `integer` | ✅ | ❌ | NULL |
| `url` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_premium_audits_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `premium_audits_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `prompt_definitions`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `category` | `text` | ✅ | ❌ | NULL |
| `competitors` | `text[]` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `intent` | `text` | ✅ | ❌ | NULL |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `locale` | `text` | ✅ | ❌ | NULL |
| `name` | `text` | ✅ | ❌ | NULL |
| `notes` | `text` | ❌ | ❌ | NULL |
| `opt_version` | `integer` | ✅ | ❌ | `1` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_template` | `text` | ✅ | ❌ | NULL |
| `tags` | `text[]` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `variables` | `jsonb` | ✅ | ❌ | NULL |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_prompt_definitions_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `prompt_definitions_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `prompt_definitions_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `prompt_executions`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `attempts` | `integer` | ✅ | ❌ | `0` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `error_message` | `text` | ❌ | ❌ | NULL |
| `executed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `latency_ms` | `integer` | ❌ | ❌ | NULL |
| `max_attempts` | `integer` | ✅ | ❌ | `3` |
| `model` | `text` | ✅ | ❌ | NULL |
| `model_version` | `text` | ❌ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_version` | `integer` | ✅ | ❌ | NULL |
| `provider` | `text` | ✅ | ❌ | NULL |
| `resolved_prompt_text` | `text` | ✅ | ❌ | NULL |
| `response_text` | `text` | ❌ | ❌ | NULL |
| `scheduled_for` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'queued'` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `variables_values` | `jsonb` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_prompt_executions_status` | `status` | `btree` | ❌ | — |
| `idx_prompt_executions_tenant` | `organization_id` | `btree` | ❌ | — |

### Check Constraints

| Name | Expression |
|---|---|
| `prompt_executions_status_check` | `status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled')` |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `prompt_executions_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `prompt_executions_prompt_id_prompt_definitions_id_fk` | `prompt_id` | `prompt_definitions` | `id` | cascade |

---

## Table: `prompt_schedules`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `cron_expression` | `text` | ✅ | ❌ | NULL |
| `enabled` | `boolean` | ✅ | ❌ | `true` |
| `failure_reason` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `last_execution_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `next_execution_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `prompt_id` | `uuid` | ✅ | ❌ | NULL |
| `schedule_version` | `integer` | ✅ | ❌ | `1` |
| `status` | `text` | ✅ | ❌ | `'IDLE'` |
| `timezone` | `text` | ✅ | ❌ | `'UTC'` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_prompt_schedules_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `prompt_schedules_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `prompt_schedules_prompt_id_prompt_definitions_id_fk` | `prompt_id` | `prompt_definitions` | `id` | cascade |

---

## Table: `prompts`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/aeo/audits/page.tsx`, `src/app/[locale]/dashboard/aeo/playground/page.tsx`, `src/app/[locale]/industries/page.tsx`, `src/app/[locale]/page.tsx`, `src/app/actions/ai-visibility-audit.ts`, `src/app/actions/prompt-intelligence.ts`, `src/features/ai-intelligence/domain/types/index.ts`, `src/features/ai-intelligence/pipeline/index.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`, `src/features/ai-intelligence/services/brand-intelligence-service.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/unit/services/observability/observability.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `buying_intent` | `text` | ✅ | ❌ | NULL |
| `category` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_active` | `boolean` | ✅ | ❌ | `true` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `query_text` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_prompts_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_prompts_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `prompts_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `prompts_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `recommendation_observations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `category` | `text` | ✅ | ❌ | NULL |
| `confidence_score` | `double precision` | ✅ | ❌ | `0` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `engine_id` | `text` | ✅ | ❌ | NULL |
| `frequency` | `integer` | ✅ | ❌ | `1` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `metadata` | `jsonb` | ✅ | ❌ | `'{}'::jsonb` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `recommended_action` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_recommendation_obs_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_recommendation_obs_tenant` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `recommendation_observations_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `recommendation_observations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `recommendations`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `scripts/test-domain.ts`, `src/app/[locale]/dashboard/audits/[id]/page.tsx`, `src/app/[locale]/dashboard/intelligence/page.tsx`, `src/app/[locale]/dashboard/seo/technical/page.tsx`, `src/app/[locale]/features/page.tsx`, `src/app/[locale]/industries/page.tsx`, `src/app/[locale]/solutions/aeo/page.tsx`, `src/app/actions/technical-seo.ts`, `src/app/api/v1/analytics/llm/route.ts`, `src/app/api/v1/audit/aeo-insight/route.ts`, `src/app/api/v1/audit/engine/route.ts`, `src/app/api/v1/audit/premium/route.ts`, `src/components/features/analysis/CompetitiveAnalysisPanel.tsx`, `src/components/features/audit/AeoAuditPanel.tsx`, `src/components/features/audit/FreeAuditPanel.tsx`, `src/components/features/audit/PremiumAuditPanel.tsx`, `src/components/features/dashboard-home/RecommendedActionsPanel.tsx`, `src/components/marketing/ProcessSection.tsx`, `src/components/visualization/contracts.ts`, `src/features/admin/infrastructure/mock-db.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/brand-intelligence-service.ts`, `src/features/ai-intelligence/services/competitive-ai-service.ts`, `src/features/ai-intelligence/services/observation-service.ts`, `src/features/ai-intelligence/services/prompt-intelligence-service.ts`, `src/features/ai-intelligence/services/site-architecture-analyzer-service.ts`, `src/lib/audit-engine/builder.ts`, `src/lib/audit-engine/recommendations.ts`, `src/services/auditService.ts`, `src/services/dashboard-home/index.ts`, `src/services/dashboard-services/index.ts`, `src/services/technical-seo-analyzer.ts`, `src/types/audit.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/analysis/competitive.test.ts`, `tests/services/audit-engine/competitive-ai.test.ts`, `tests/services/dashboard-home.test.ts`, `tests/unit/services/audit-engine/engine.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `action_plan` | `jsonb` | ✅ | ❌ | NULL |
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `category` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `description` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `impact_score` | `integer` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `priority` | `text` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'open'` |
| `title` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_recommendations_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_recommendations_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `recommendations_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `recommendations_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `roles`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/core/database/migrator.ts`, `src/core/database/privileged-paths.ts`, `src/services/auth/authorization.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `hierarchy_rank` | `integer` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `name` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_roles_name` | `name` | `btree` | ❌ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `roles_name_unique` | `name` | ❌ |

---

## Table: `sessions`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/dashboard/intelligence/page.tsx`, `src/app/actions/account.ts`, `src/app/actions/workspace.ts`, `src/services/auth/session.ts`, `tests/unit/services/auth/session.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `expires_at` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `ip` | `text` | ❌ | ❌ | NULL |
| `replaced_by` | `uuid` | ❌ | ❌ | NULL |
| `revoked_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `role_snapshot` | `text` | ❌ | ❌ | NULL |
| `token_hash` | `text` | ✅ | ❌ | NULL |
| `user_agent` | `text` | ❌ | ❌ | NULL |
| `user_id` | `text` | ✅ | ❌ | NULL |
| `workspace_id` | `uuid` | ❌ | ❌ | NULL |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `sessions_token_hash_unique` | `token_hash` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `sessions_replaced_by_sessions_id_fk` | `replaced_by` | `sessions` | `id` | no action |
| `sessions_user_id_users_id_fk` | `user_id` | `users` | `id` | cascade |
| `sessions_workspace_id_organizations_id_fk` | `workspace_id` | `organizations` | `id` | no action |

---

## Table: `system_configurations`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `tests/isolation/suite.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `category` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `is_encrypted` | `boolean` | ✅ | ❌ | `false` |
| `key` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `value` | `text` | ✅ | ❌ | NULL |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_system_configurations_key` | `key` | `btree` | ❌ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `system_configurations_key_unique` | `key` | ❌ |

---

## Table: `technical_audits`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/api/v1/optimization/technical/route.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `categories` | `jsonb` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ❌ | ❌ | `NOW()` |
| `critical_issues` | `jsonb` | ✅ | ❌ | NULL |
| `grade` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `pages_analyzed` | `integer` | ✅ | ❌ | NULL |
| `performance_metrics` | `jsonb` | ✅ | ❌ | NULL |
| `quick_wins` | `jsonb` | ✅ | ❌ | NULL |
| `technical_score` | `integer` | ✅ | ❌ | NULL |
| `url` | `text` | ✅ | ❌ | NULL |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `technical_audits_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `tenant_quotas`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/billing/services/subscription-service.ts`, `src/features/public-api/services/api-quota-service.ts`, `tests/features/ai-intelligence/security.test.ts`, `tests/features/public-api/public-api.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `credits_balance` | `integer` | ✅ | ❌ | `0` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `max_brands` | `integer` | ✅ | ❌ | NULL |
| `max_crawl_jobs_per_day` | `integer` | ✅ | ❌ | NULL |
| `max_observations_per_month` | `integer` | ✅ | ❌ | NULL |
| `max_prompts` | `integer` | ✅ | ❌ | NULL |
| `max_users` | `integer` | ✅ | ❌ | NULL |
| `monthly_cost_limit_usd` | `integer` | ✅ | ❌ | NULL |
| `monthly_token_limit` | `integer` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `used_crawl_jobs_today` | `integer` | ✅ | ❌ | `0` |
| `used_observations_this_month` | `integer` | ✅ | ❌ | `0` |
| `used_tokens_this_month` | `integer` | ✅ | ❌ | `0` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_tenant_quotas_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `tenant_quotas_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `tenant_subscriptions`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/billing/services/subscription-service.ts`, `tests/features/ai-intelligence/security.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `billing_cycle` | `text` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `currency` | `text` | ✅ | ❌ | `'USD'` |
| `end_date` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `plan` | `text` | ✅ | ❌ | NULL |
| `price_amount` | `integer` | ✅ | ❌ | NULL |
| `start_date` | `timestamp with time zone` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | NULL |
| `tenant_id` | `uuid` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_tenant_subscriptions_tenant` | `tenant_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `tenant_subscriptions_tenant_id_organizations_id_fk` | `tenant_id` | `organizations` | `id` | cascade |

---

## Table: `topics`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/features/page.tsx`, `src/features/ai-intelligence/repositories/index.ts`, `src/features/ai-intelligence/services/competitive-seo-service.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `description` | `text` | ❌ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `language` | `text` | ✅ | ❌ | `'en'` |
| `name` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `parent_topic_id` | `uuid` | ❌ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_topics_name_org` | `organization_id, name` | `btree` | ✅ | `deleted_at IS NULL` |
| `idx_topics_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `topics_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `topics_parent_topic_id_topics_id_fk` | `parent_topic_id` | `topics` | `id` | set null |

---

## Table: `topics_entities`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `tests/isolation/suite.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `entity_id` | `uuid` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `topic_id` | `uuid` | ✅ | ❌ | NULL |

### Composite Primary Keys

| Name | Columns |
|---|---|
| `topics_entities_topic_id_entity_id_pk` | `topic_id, entity_id` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_topics_entities_org` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `topics_entities_entity_id_entities_id_fk` | `entity_id` | `entities` | `id` | cascade |
| `topics_entities_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |
| `topics_entities_topic_id_topics_id_fk` | `topic_id` | `topics` | `id` | cascade |

---

## Table: `user_credentials`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/actions/account.ts`, `src/app/actions/auth.ts`, `tests/unit/app/actions/account.test.ts`, `tests/unit/app/actions/auth.test.ts`, `tests/unit/authorization-lifecycle.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `algorithm` | `text` | ✅ | ❌ | `'scrypt'` |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `failed_attempts` | `integer` | ✅ | ❌ | `0` |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `locked_until` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `params` | `jsonb` | ✅ | ❌ | NULL |
| `password_hash` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `user_id` | `text` | ✅ | ❌ | NULL |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `user_credentials_user_id_unique` | `user_id` | ❌ |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `user_credentials_user_id_users_id_fk` | `user_id` | `users` | `id` | cascade |

---

## Table: `users`

- **Scope:** Global
- **RLS Policies Defined:** ❌
- **Status:** `WIRED`
- **Consumers:** `src/app/[locale]/pricing/page.tsx`, `src/app/[locale]/solutions/protection/page.tsx`, `src/app/[locale]/solutions/radar/page.tsx`, `src/app/actions/account.ts`, `src/app/actions/auth.ts`, `src/app/actions/workspace.ts`, `src/components/marketing/HeroAccessCard.tsx`, `src/components/visualization/VisualizationContainer.tsx`, `src/core/database/privileged-paths.ts`, `src/features/admin/api/v1/admin/index.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `src/features/admin/security/index.ts`, `src/features/ai-intelligence/services/site-architecture-analyzer-service.ts`, `src/services/auth/session.ts`, `tests/features/admin/cqrs.test.ts`, `tests/features/admin/security.test.ts`, `tests/isolation/suite.ts`, `tests/unit/app/actions/account.test.ts`, `tests/unit/app/actions/auth-deactivated.test.ts`, `tests/unit/app/actions/auth.test.ts`, `tests/unit/auth/user-id-format.test.ts`, `tests/unit/authorization-lifecycle.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `email` | `text` | ✅ | ❌ | NULL |
| `email_verified_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `id` | `text` | ✅ | ✅ | NULL |
| `name` | `text` | ✅ | ❌ | NULL |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_users_lower_email` | `lower("email")` | `btree` | ✅ | — |

### Unique Constraints

| Name | Columns | Nulls Not Distinct |
|---|---|---|
| `users_email_unique` | `email` | ❌ |

---

## Table: `visibility_scores`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `src/services/diagnostic-engine/index.ts`, `tests/features/ai-intelligence/security.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `avg_position` | `double precision` | ❌ | ❌ | NULL |
| `brand_id` | `uuid` | ✅ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `engine_id` | `uuid` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `net_sentiment` | `double precision` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `overall_score` | `integer` | ✅ | ❌ | NULL |
| `presence_rate` | `double precision` | ✅ | ❌ | NULL |
| `recorded_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_visibility_scores_brand` | `brand_id` | `btree` | ❌ | — |
| `idx_visibility_scores_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `visibility_scores_brand_id_brands_id_fk` | `brand_id` | `brands` | `id` | cascade |
| `visibility_scores_engine_id_ai_engines_id_fk` | `engine_id` | `ai_engines` | `id` | cascade |
| `visibility_scores_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---

## Table: `websites`

- **Scope:** Tenant-Scoped
- **RLS Policies Defined:** ✅
- **Status:** `WIRED`
- **Consumers:** `src/features/ai-intelligence/repositories/index.ts`, `src/services/crawler/link-discovery.ts`, `tests/features/admin/tenant-isolation-behavior.test.ts`, `tests/services/audit-engine/competitive-seo.test.ts`, `tests/unit/core/tenant-context/is-query-tenant-scoped.test.ts`, `tests/unit/core/tenant-context/system-mode-bypass.test.ts`, `tests/unit/core/tenant-context/tenant-tables.test.ts`

### Columns

| Name | Type | Not Null | Primary Key | Default |
|---|---|---|---|---|
| `cms_type` | `text` | ❌ | ❌ | NULL |
| `created_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `created_by` | `text` | ✅ | ❌ | `'system'` |
| `deleted_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `domain` | `text` | ✅ | ❌ | NULL |
| `id` | `uuid` | ✅ | ✅ | `gen_random_uuid()` |
| `last_analyzed_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `last_crawled_at` | `timestamp with time zone` | ❌ | ❌ | NULL |
| `normalized_url` | `text` | ✅ | ❌ | NULL |
| `organization_id` | `uuid` | ✅ | ❌ | NULL |
| `status` | `text` | ✅ | ❌ | `'active'` |
| `updated_at` | `timestamp with time zone` | ✅ | ❌ | `NOW()` |
| `updated_by` | `text` | ✅ | ❌ | `'system'` |
| `version` | `integer` | ✅ | ❌ | `1` |

### Indexes

| Name | Columns | Method | Unique | Predicate |
|---|---|---|---|---|
| `idx_websites_domain_org` | `organization_id, domain` | `btree` | ✅ | `deleted_at IS NULL` |
| `idx_websites_organization` | `organization_id` | `btree` | ❌ | — |

### Foreign Keys

| Name | Columns | Foreign Table | Foreign Columns | On Delete |
|---|---|---|---|---|
| `websites_organization_id_organizations_id_fk` | `organization_id` | `organizations` | `id` | cascade |

---


## Summary
- Total Tables: 70
- WIRED Tables: 70
- ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: 0
