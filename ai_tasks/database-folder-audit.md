# Database Folder Audit

- Repository: `DiabloNova/oxenn`
- Branch: `docs/product-roadmap-baseline-2026-11`
- Audit date: 2026-11-06
- Scope: Complete tracked `database/` tree at the audit branch revision
- Method: Static inspection of every tracked file under `database/`, Drizzle migration/snapshot consistency checks, and schema/RLS inventory. No database connection or SQL execution was performed.

## 1. Scope and inventory

The recursive Git tree was complete (`truncated: false`) and contained **77 files in 9 directories** under `database/`.

| Area | Inventory |
|---|---|
| `database/bootstrap.sql` | 1 bootstrap SQL file |
| `database/archive/migrations-legacy/` | 16 historical SQL migrations and 1 archive README |
| `database/drizzle/` | 14 active Drizzle SQL migrations, numbered `0000` through `0013` |
| `database/drizzle/meta/` | 13 Drizzle snapshots and `_journal.json` |
| `database/schema/` | 17 top-level TypeScript files: the central Drizzle schema, organization/API-key definitions, and older `TableDefinition` modules |
| `database/schema/_legacy/` | 11 legacy schema modules, `admin/index.ts`, and a legacy README |
| `database/seed/` | Empty `index.ts` (0 bytes) |

The 14 active migration files are:

`0000_reflective_loa.sql`, `0001_illegal_grey_gargoyle.sql`, `0002_soft_jimmy_woo.sql`, `0003_warm_shadow_king.sql`, `0004_abandoned_black_crow.sql`, `0005_force_rls.sql`, `0006_stormy_morlocks.sql`, `0007_goofy_vanisher.sql`, `0008_boring_ares.sql`, `0009_glamorous_millenium_guard.sql`, `0010_hard_vin_gonzales.sql`, `0011_concerned_black_panther.sql`, `0012_slimy_aqueduct.sql`, and `0013_remove_api_keys_prefix_index.sql`.

The historical archive contains `0001_optimus_vector_kg.sql` through `0016_website_monitoring.sql`. Its README explicitly marks those files **DO NOT EXECUTE — HISTORICAL RECORD ONLY** and identifies the Drizzle chain as canonical.

## 2. Schema and migration structure

### Canonical schema

- `database/schema/index.ts` contains 68 `pgTable` declarations.
- `database/schema/organization-table.ts` separately defines `organizations`.
- `database/schema/api-keys.ts` separately defines `api_keys` and is re-exported by the central schema.
- Together, these declarations represent 70 tables. The latest snapshot, `database/drizzle/meta/0013_snapshot.json`, also contains 70 table definitions. Table-name comparison found no missing or extra table names between the central schema plus the two separately defined tables and that snapshot. This check is about table inventory, not a claim that every column, default, index, constraint, or policy is semantically identical.

### Migration journal and snapshots

The journal contains 14 ordered entries for migrations `0000`–`0013`. There are 13 snapshots because migration `0005_force_rls.sql` is a custom SQL-only migration. The snapshot `prevId` chain remains continuous from snapshot `0004` to `0006`; the missing `0005_snapshot.json` is therefore **not** treated as a defect.

Migration `0012_slimy_aqueduct.sql` includes a preflight check that aborts when case-insensitive duplicate user emails exist before normalizing email values and adding the lower-case unique index. This is a useful safeguard and is not reported as an unguarded migration.

## 3. Findings

### DB-001 — Five tenant-owned junction tables are missing RLS policies

**Severity: P1 — security-boundary defect; runtime exploitability requires confirmation of the active database role.**  
**Confidence: High for the database-schema defect.**

The following tables each contain a non-null `organization_id` foreign key, but have no tenant policy in the canonical Drizzle schema, no policy objects in the latest snapshot, and are absent from migration `0005_force_rls.sql`:

- `pages_keywords`
- `pages_topics`
- `pages_entities`
- `keywords_topics`
- `topics_entities`

Evidence:

- [Central schema, lines 513–564](../database/schema/index.ts): the five table definitions include `organization_id`, but their table callbacks define only primary keys and indexes; unlike the other tenant tables, none adds `...tenantPolicy("organization_id")`.
- [RLS migration](../database/drizzle/0005_force_rls.sql): the comment says it enables and forces RLS for all tenant-scoped tables, but none of the five tables appears in its 51-table list.
- [Latest snapshot](../database/drizzle/meta/0013_snapshot.json): each of the five tables has an empty policy map.
- The older quarantined definitions did include RLS for these tables: see [legacy page definitions](../database/schema/_legacy/page.ts) and [legacy topic definitions](../database/schema/_legacy/topic.ts). Their protection appears to have been lost during schema consolidation.

Impact: these tables store relationships between tenant-owned pages, keywords, topics, and entities. Without database RLS, the database itself does not enforce tenant filtering on their rows. The bootstrap script grants `app_runtime` default SELECT/INSERT/UPDATE/DELETE privileges on tables created by `app_owner`; if the deployed application connects with that runtime role, the missing policies leave these junction rows outside the intended database-enforced tenant boundary. Application-level filtering may reduce exposure, but it is not a substitute for the documented database isolation boundary.

Required follow-up (not performed in this audit): verify the actual runtime DB role and query paths, then prepare a migration that enables and forces RLS and defines SELECT/INSERT/UPDATE/DELETE tenant policies for all five tables. Add isolation tests that prove cross-tenant reads and writes are denied.

### DB-002 — Text-to-UUID tenant migration has no in-migration data preflight

**Severity: P2 — conditional migration-blocking risk.**  
**Confidence: High for the missing preflight; existing data validity is unknown.**

Migration `0007_goofy_vanisher.sql` converts `tenant_id` from text to UUID using direct casts for `crawl_cache`, `crawl_jobs`, and `crawl_results`:

`USING "tenant_id"::uuid`

It then adds foreign keys from those values to `organizations(id)`.

The earlier canonical migration created these columns as text. The conversion will fail if any existing value is not a valid UUID; the subsequent foreign-key creation will fail if any converted UUID does not reference an existing organization. Migration `0007` contains no explicit preflight that checks either condition or explains how incompatible rows should be reconciled.

No live database was accessed, so this report does **not** claim that invalid values exist. Before applying or replaying this migration against a populated database, validate all three tables for malformed UUIDs and orphaned organization IDs, and establish an explicit data-reconciliation path.

Evidence: [migration 0007](../database/drizzle/0007_goofy_vanisher.sql); the original text-typed columns are present in [migration 0000](../database/drizzle/0000_reflective_loa.sql).

### DB-003 — Organization slug has both unconditional and soft-delete-aware uniqueness

**Severity: P3 — schema/behavior inconsistency.**  
**Confidence: High.**

In `database/schema/organization-table.ts`, `slug` is declared with `.unique()`, and the table callback separately declares a unique partial index over `slug` where `deleted_at IS NULL`.

The latest snapshot confirms both objects exist:

- Unique constraint `organizations_slug_unique` over `slug` (unconditional).
- Unique index `idx_organizations_slug` over `slug` where `deleted_at IS NULL`.

The unconditional unique constraint means a soft-deleted organization continues to reserve its slug. Therefore the partial index does not provide the apparent behavior of allowing a new active organization to reuse a slug after the prior organization is soft-deleted; it is also redundant for enforcing uniqueness while the unconditional constraint remains.

The intended slug lifecycle must be decided. If reuse after soft deletion is intended, the unconditional uniqueness declaration/constraint conflicts with that policy. No schema change was made.

Evidence: [organization-table.ts](../database/schema/organization-table.ts), [latest snapshot](../database/drizzle/meta/0013_snapshot.json), and the schema's legacy counterpart [organization.ts](../database/schema/organization.ts).

### DB-004 — Archived crawl-queue functions are claimed as absorbed, but are absent from the active database chain

**Severity: P2 — functionality/provenance discrepancy pending code-level trace.**  
**Confidence: High that the active database definitions do not contain these functions; unknown whether application code replaced them.**

The archived migration `database/archive/migrations-legacy/0004_crawl_acquisition.sql` defines three PostgreSQL `SECURITY DEFINER` functions:

- `claim_crawl_jobs`
- `recover_expired_crawl_jobs`
- `complete_crawl_job_if_lease_owner`

The archive README says the functions were absorbed into the canonical `database/schema/index.ts` and `database/drizzle/0000_reflective_loa.sql`. Static inspection of all active migrations `0000`–`0013` and the current schema found no corresponding function definitions.

This establishes a documentation-to-database mismatch, but does not yet prove that crawl queue behavior is broken: application code may have replaced the stored procedures with equivalent transactional logic. That must be checked during the later source-code and call-site audit. Until that trace is complete, the archive README's claim that these functions were absorbed should not be treated as verified.

Evidence: [archive migration 0004](../database/archive/migrations-legacy/0004_crawl_acquisition.sql), [archive mapping README](../database/archive/migrations-legacy/README.md), and the complete active migration inventory under [database/drizzle](../database/drizzle/).

### DB-005 — Legacy TableDefinition modules remain beside the canonical Drizzle schema

**Severity: P3 — maintainability and source-of-truth ambiguity; import impact not yet established.**  
**Confidence: High for the duplicate definitions; import status deferred.**

The folder contains both the central Drizzle schema and older `TableDefinition` modules. Some older files remain directly under `database/schema/` (for example `citation.ts`, `competitor.ts`, `entity.ts`, `kg.ts`, `metric.ts`, `observation.ts`, `prompt-intelligence.ts`, and others), while another set was moved under `database/schema/_legacy/`.

The `_legacy/README.md` says all active database tables are centrally defined in `database/schema/index.ts`, and prohibits new imports from `_legacy`. The remaining top-level `TableDefinition` files nevertheless preserve parallel table descriptions and, in several modules, embedded SQL. The central Drizzle entry point imports the dedicated organization module and re-exports the API-key module; the complete source-tree import graph has not yet been inspected.

This is recorded as a source-of-truth and maintenance risk, not as proof that any application code currently imports an obsolete definition. The later code-link audit must find all importers before any file is classified as dead or safe to remove.

Evidence: [legacy README](../database/schema/_legacy/README.md), [central schema](../database/schema/index.ts), and top-level files in [database/schema](../database/schema/).

## 4. Verification notes and items not classified as confirmed defects

### Bootstrap role provisioning

`database/bootstrap.sql` creates `app_owner` and `app_runtime` as `NOLOGIN` roles and gives `app_runtime` default DML privileges on future tables created by `app_owner`. The script itself does not create a login role, grant either role to a login principal, or switch the migration session to `app_owner`. This may be completed by infrastructure provisioning outside the repository. Deployment manifests and connection configuration must be inspected before classifying it as a defect.

### User-level and platform tables without tenant RLS

The latest snapshot contains other tables without tenant policies, including user-level authentication tables (`users`, `user_credentials`, `sessions`, `email_verification_tokens`, and `password_reset_tokens`) and global/platform tables. Absence of an organization policy is not automatically incorrect for global or user-owned data. Their intended access model and runtime query paths need examination in the application audit; no standalone vulnerability is asserted here.

### Seed directory

`database/seed/index.ts` is empty (0 bytes). This means the database seed entry point currently contains no seed implementation. It is not by itself a defect; test fixtures, local bootstrap, or external seed workflows may live elsewhere and will be checked in later phases.

### Current-schema RLS summary

The latest snapshot has 70 tables. Fifty-one tables have tenant/isolation policy definitions, including the organization table's ID-based policy. Fifty-five tables carry an `organization_id` or `tenant_id` column; of those, the five junction tables listed in DB-001 have no policies. Migration `0005_force_rls.sql` applies both ENABLE and FORCE RLS to the 51 policy-bearing tables.

### Historical archive

The archive README explicitly warns against executing the historical SQL. The legacy migration set also records known provenance issues and is not part of the active Drizzle journal. No archived migration was run or modified.

## 5. Audit constraints and deferred checks

- No live database was connected to or queried.
- No SQL, migration, seed, bootstrap, or database test command was executed.
- No database schema, migration, application source, or deployment file was changed.
- No migration was generated, applied, rolled back, or edited.
- The following checks are deferred to later, separately approved repository phases:
  1. Trace all imports and callers of remaining `TableDefinition` modules.
  2. Trace crawl queue callers and determine whether the three archived stored procedures were replaced in application code.
  3. Verify the deployed database login, role membership, object ownership, grants, and active runtime role.
  4. Inspect DB tests and isolation tests for the five missing junction-table policies.
  5. Validate whether populated databases can safely pass migration `0007` and whether slug reuse is required by product behavior.

## 6. Phase conclusion

The `database/` folder has been completely inventoried and statically reviewed. The strongest confirmed finding is the RLS omission from five tenant-owned junction tables. Other recorded items distinguish confirmed schema inconsistencies from conditional migration risks and questions that require later application or deployment evidence.

This phase is complete. The next repository folder has **not** been inspected. Work must pause until the user explicitly approves the next folder.
