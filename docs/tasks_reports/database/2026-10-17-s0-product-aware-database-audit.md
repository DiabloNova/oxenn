# S0 Product-Aware Database Integrity Audit

**Date:** 2026-10-17  
**Repository:** `DiabloNova/oxenn`  
**Baseline inspected:** `main` at `feced8d2b451527cfe0e06cf62d9b6bff0af7757` (merge of PR #82)  
**Audit branch:** `audit/product-aware-s0-baseline`  
**Scope:** Read-only audit of product/data contracts, schema/migration consistency, persistence consumers, RLS, privileged database access, test discovery, CI, and dependency declarations. This report does not authorize implementation changes.

## Status

**STATUS: INCOMPLETE — VERIFICATION PENDING**

The static repository audit found concrete cross-layer inconsistencies and security/verification risks. Local commands, tests, migration execution, and PostgreSQL runtime checks were not run because this workflow has no local checkout or connected project database. No application code, schema, migration, dependency, or CI file was changed.

## Invariants under review

1. The canonical schema, migration history, journal, snapshots, SQL consumers, and domain contracts must describe one compatible persistence model.
2. Tenant-owned records must be isolated by PostgreSQL RLS and the application must not broaden access through a privileged system-context path.
3. Authorization decisions must use `organization_members.role`, and `super_admin` assignment must be operator-only.
4. The persistence layer must actually read durable repository records rather than relying on in-process simulator state.
5. CI/test claims must match the tests that are actually discovered and executed.
6. No production/live database safety claim may be made without observing a real database.

## Confirmed observations

### 1. Repository context and governance

- Root `AGENTS.md`, `BLUEPRINT.md`, `SPEC.md`, and `SKILL.md` exist. Root `PLAN.md` was not present in the inspected root listing.
- `docs/REPOSITORY_CONTEXT.md` was absent on the inspected baseline and has been added on this audit branch.
- The required external `https://jules-prompts.wecanuseai.com/llms.txt` retrieval returned a cache-miss/fetch failure. Its contents remain **NOT VERIFIED**.
- The August 16, 2024 `docs/project/audit/INFRA_READINESS_AUDIT.md` describes a legacy migration architecture and claims that Drizzle dependencies and a migration runner are absent. Those claims conflict with current `package.json`, `database/schema/index.ts`, `database/drizzle/meta/_journal.json`, and `src/core/database/migrator.ts`; use that audit as historical evidence only.
- `docs/architecture/README.md` says the schema models 57 tables, while the latest snapshot and `docs/database/reference-matrix.md` report 70 tables. Documentation drift is present.

### 2. Schema/persistence contract mismatches

Inspected source: `database/schema/index.ts`, `database/drizzle/meta/0012_snapshot.json`, and `src/features/admin/infrastructure/persistence/postgres/index.ts`.

- `admin_users` schema/snapshot columns are `id,email,full_name,role_id,is_active,created_at,updated_at,deleted_at,version`. Repository INSERT/UPDATE SQL references `role`, `permissions`, `sso_identities`, `created_by`, and `updated_by`. `role_id` is UUID NOT NULL and references legacy `roles.id`; comments in the schema say `organization_members.role` is the authorization source of truth. Keep `role_id` until its dependencies are fully reviewed, per owner instruction.
- `feature_flags` schema/snapshot columns are `id,key,name,description,is_enabled_globally,tenant_overrides,created_at,updated_at`. Repository SQL also references `created_by`, `updated_by`, and `version`. The schema stores `tenant_overrides` as text with default `{}`, while repository code serializes it with `JSON.stringify`; changing to JSON/JSONB requires a contract and migration decision.
- `ai_provider_configs` schema/snapshot columns are `id,provider_name,endpoint_url,api_key_masked,is_active,failover_provider_id,created_at,updated_at`. Repository SQL also references `created_by`, `updated_by`, and `version`. This table is in the project-owner-approved repair scope.
- Repository fallback identifiers include prefixed strings such as `tenant-...`, `admin-user-...`, `flag-...`, and `ai-provider-...`, while the corresponding canonical IDs are UUID columns. Trace call sites and test assumptions before designing a narrow correction.
- In the inspected admin repositories, SELECT queries are executed but their result rows are not used; read methods return data from static in-memory `Map` stores. This means those methods do not establish durable PostgreSQL read behavior. Review every repository and its intended simulator/production boundary before implementation.

### 3. Migration and RLS evidence

- Latest journal: `database/drizzle/meta/_journal.json`, indexes 0–12. Migration `0005_force_rls.sql` is SQL-only and is present in the journal; the absence of a matching numbered snapshot alone is not evidence of a missing migration.
- Snapshot `database/drizzle/meta/0012_snapshot.json` has 70 tables; 51 have one or more policies. `src/core/database/tenant-tables.generated.ts` contains 51 names. A direct comparison of the two fetched files found **no missing or extra policy-bearing table names**.
- `database/drizzle/0005_force_rls.sql` contains ENABLE and FORCE RLS statements for the listed tenant tables. `scripts/database/verify-rls-migrations.ts` statically walks journal-ordered SQL and checks that both flags remain active at the end of migration history. This script was inspected but **NOT RUN** in a local environment.
- `database/drizzle/0007_goofy_vanisher.sql` casts `crawl_cache.tenant_id`, `crawl_jobs.tenant_id`, and `crawl_results.tenant_id` to UUID with `USING tenant_id::uuid`. If a target database contains non-UUID values, this migration will fail. Actual database values are **NOT VERIFIED**.
- `docs/database/canonical-data-contract.md` explicitly says the generated-list comparison does not verify live RLS and that the simulator cannot prove PostgreSQL enforcement.

### 4. Privileged paths and operator-only super-admin

Inspected source: `src/core/database/tenant-context/index.ts`, `src/core/database/privileged-paths.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `docs/security/privileged-paths.md`, `src/services/auth/authorization.ts`, and `scripts/auth/grant-super-admin.ts`.

- `runWithSystemContext` rejects unregistered purpose tags and blocks `sys-admin-run` / `test-req` unless `NODE_ENV === "test"` or `VERIFICATION_PROBE_ACTIVE === "1"`.
- `scripts/auth/grant-super-admin.ts` uses `sys-admin-run`. That appears to conflict with the requirement that the dedicated CLI is the exclusive operator path for granting `super_admin`, because the guard blocks the tag in a typical production environment. Production CLI behavior is **NOT VERIFIED**.
- The system-client query wrapper checks system-context mode but does not compare SQL table references against `PRIVILEGED_PATHS_REGISTRY[purpose].allowedTables`. The registry's table list is therefore not a per-table runtime allowlist in this inspected query path; a registered purpose's callback can query beyond its declared list unless another boundary prevents it. No adversarial runtime test was run.
- Registry and human-readable documentation still list legacy names such as `tenants`, `tenant_users`, and `tenant_invitations`, absent from the latest snapshot. The current schema and inspected authorization code use `organizations`, `organization_members`, and `organization_invitations`.
- `src/services/auth/authorization.ts` fetches membership roles from `organization_members.role` rather than using the session's role snapshot, aligning with the stated source-of-truth rule in the inspected functions.

### 5. Test discovery and CI

- `vitest.config.ts` includes `tests/unit/**`, `tests/db/**`, and `tests/ui/**` only.
- `tests/features/admin/infrastructure/postgres-integration.test.ts` exports `testPostgresIntegration()` but does not declare Vitest `describe/it` tests and is outside the configured include patterns. It is not evidence of a test automatically executed by the standard Vitest projects.
- `.github/workflows/ci.yml` runs typecheck, lint, static tenant-table verification, RLS migration verification, build, reference-matrix generation/drift check, unit/UI tests, and `pnpm run test:isolation` with a temporary PostgreSQL service.
- CI wiring for the isolation suite is present in source; this audit did not re-run CI or locally execute the suite.
- The isolation suite creates a database named `isolation_test_db` and drops/recreates it if already present. Run it only against a dedicated disposable test PostgreSQL service, never against a production connection.

### 6. Dependencies

- `package.json` declares `drizzle-orm: ^0.45.2` and `drizzle-kit: ^0.31.10`.
- `@electric-sql/pglite` is not a direct dependency in the inspected `package.json`. Its transitive presence/version in the lockfile was not fully audited.
- Latest-stable registry comparison was **NOT PERFORMED**. No dependency upgrade is recommended solely from this static audit.

### 7. Product-aware data model coverage

The product documentation describes brand/website crawling, competitor discovery, prompts and model comparisons, AI observations, citations, recommendations, and knowledge-graph intelligence. The canonical 70-table snapshot includes many of these domains. A dedicated social-account table was not found in the table-name inventory inspected so far; this is **UNRESOLVED**, not proof that social-account capability is absent. Before schema design, trace whether social assets are represented elsewhere, intentionally out of scope, or only documented/planned.

## Recommended remediation order (planning only; no implementation authorized by this report)

1. **P0 — Close privileged-access contradictions:** enforce allowed-table scope at the actual query boundary or define a demonstrably equivalent least-privilege boundary; align registry/docs with current table names; reconcile the operator CLI's `sys-admin-run` guard without weakening test-only paths; add negative/adversarial tests for unknown purpose tags, forbidden tables, production test-only tags, nested contexts, rollback, and audit failure.
2. **P0 — Establish a real persistence contract:** compare all repository SQL, return values, domain types, identifier generators, and simulator fallbacks. Remove ambiguity between durable PostgreSQL reads and static in-memory stores without losing intended simulator/test behavior.
3. **P0 — Resolve schema/query drift for `admin_users`, `feature_flags`, and `ai_provider_configs`:** agree the target domain contract first; preserve `role_id`; decide audit NULL/default behavior only after reviewing semantics; settle `permissions` policy before choosing defaults; generate a forward-only migration through the single approved Drizzle path and inspect SQL, journal, and snapshots.
4. **P1 — Migration safety:** validate migration ordering and the UUID cast in `0007_goofy_vanisher.sql` against representative disposable PostgreSQL data; verify rollback/recovery expectations and schema state after applying the full journal. Never point this at production.
5. **P1 — Make tests executable evidence:** decide whether the feature integration test should be converted/wired into a configured project or explicitly invoked by a dedicated script; test repository reads against inserted DB rows rather than only the in-memory store; keep PostgreSQL negative-path isolation checks in CI.
6. **P1 — Product data-contract audit:** map each documented product capability to canonical tables, persistence adapters, provenance/evidence, organization ownership, and real consumers. Specifically resolve social-account representation and ensure analysis results retain input source/time/model/version and traceable citation/recommendation evidence.
7. **P2 — Reconcile documentation and dependencies:** update stale architecture/audit claims only after source verification; inspect PGlite lockfile role and compare dependency versions to latest stable before any proposed upgrade.

## Verification and Git state

- **PASS (static comparison):** policy-bearing table names in snapshot and generated runtime list match exactly: 51 vs 51; no set differences.
- **PASS (source inspection only):** current migration journal includes 13 entries (0–12); `0005_force_rls.sql` exists and is journaled; `0007_goofy_vanisher.sql` contains the UUID casts described above.
- **NOT RUN:** local typecheck, lint, Vitest, `pnpm db:verify-rls-migrations`, `pnpm test:isolation`, migration application, build, and runtime/adversarial PostgreSQL checks.
- **NOT VERIFIED:** live PostgreSQL schema/data, actual applied migration history, production credentials/roles, production CLI behavior, and persistence behavior against a connected project database.
- **Files changed on audit branch:** `docs/REPOSITORY_CONTEXT.md` (created and refined); this report.
- **Application code, schema, migrations, snapshots, dependencies, and CI:** unchanged.
- **Git status:** no local checkout was available, so local `git status` and `git diff` are **NOT AVAILABLE**. The remote audit branch head must be re-read after the report commit; no PR was created and `main` was not modified.
- **Outstanding governance limitation:** required `llms.txt` could not be fetched and root `PLAN.md` is absent. This task was limited to a user-authorized read-only audit plus creation of the required context/report documentation; no implementation phase was started.


## Phase 1 design follow-up (2026-10-17)

After the plan was approved, a focused caller-level review was performed for the first execution phase. The new design record is `docs/project/tasks/database-privileged-paths-hardening-design-2026-10-17.md`.

- **Confirmed:** current registry/documentation table names are stale; the per-purpose `allowedTables` list is not enforced by `connectSystemClient`; current auth/workspace callers access `organizations` and `organization_members` where the registry lists legacy tables; `sys-admin-run` is used by the operator CLI even though runtime guards treat it as test-only.
- **Additional safety concern:** `.env.example` uses the `postgres` role for both `DATABASE_URL` and the fallback privileged connection URL. This is only an example configuration; the actual deployment role is **NOT VERIFIED**. A superuser/`BYPASSRLS` runtime connection can defeat RLS independently of application context checks.
- **Design principle:** prefer database-enforced least privilege (potentially purpose-specific PostgreSQL roles and exact grants) plus application purpose validation. Do not treat a fragile regex-only SQL allowlist as sufficient security enforcement.
- **Call-site mapping:** the design record lists the observed table set per registered purpose and the required positive, negative, adversarial, rollback, nesting, and audit-failure tests. It explicitly marks the mapping as a minimum set pending a complete implementation-time trace.
- **Status:** this remains a design/audit artifact, not a completed security fix. No application source, schema, migration, CI, dependency, or deployment configuration changed. No runtime tests were run. The absence of a local executable environment means the next code change must be implemented and validated in an environment capable of running the repository checks and a dedicated disposable PostgreSQL service; do not infer security success from the new documentation.
