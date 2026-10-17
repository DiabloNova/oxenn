# Oxenn Database Integrity Repair — Execution Plan

**Date:** 2026-10-17  
**Repository:** `DiabloNova/oxenn`  
**Planning baseline:** `main` at `feced8d2b451527cfe0e06cf62d9b6bff0af7757`  
**Status:** PROPOSED — implementation gate not yet passed  
**Scope:** Product-aware database integrity, persistence contracts, RLS/privileged access, and truthful PostgreSQL verification.

## Non-negotiable constraints

- The repository has no connected production/main database. Never claim live production schema, data, migration state, or runtime behavior has been verified.
- Ignore PR #72 completely.
- Keep `admin_users.role_id` until all dependencies and migration history are traced.
- Include `ai_provider_configs` in the eventual repair.
- Use NULL for historically unknown audit IDs only when domain semantics permit it.
- Use an empty `permissions` default only after authorization policy is confirmed.
- Do not upgrade `drizzle-orm`, `drizzle-kit`, or add/upgrade PGlite merely to make versions look current; verify lockfile, compatibility, and stable releases first.
- Do not edit historical migrations, snapshots, generated artifacts, CI, dependencies, or runtime code outside the currently approved phase.
- Prefer enforceable database/runtime boundaries over documentation-only promises or regex-only SQL allowlists.
- Every database task must include a report under `docs/tasks_reports/database/`.

## Evidence-based phase order

### Phase 0 — Baseline and governance (read-only; performed, verification incomplete)

- Re-check current `main`, repository instructions, product/specification docs, schema source, migrations/journal/snapshots, persistence consumers, RLS checks, CI test discovery, and the internal simulator boundary.
- Record known facts, conflicts, unknowns, and tests not run.
- Keep all claims about a real database marked NOT VERIFIED.

**Current result:** Static source inspection confirms multiple schema/query mismatches and privileged-access concerns. Local commands, tests, migration execution, and PostgreSQL runtime checks were not run in this environment. See `docs/tasks_reports/database/2026-10-17-s0-product-aware-database-audit.md`.

### Phase 1 — Privileged database boundary and runtime role design (first implementation candidate)

**Invariant:** No application caller can obtain broader database authority than the purpose and role it was explicitly granted; tenant-owned rows remain protected by PostgreSQL RLS; operator-only `super_admin` assignment works only through its intended operator path.

Before code changes:
1. Trace every `runWithSystemContext` caller and direct `connectSystemClient` use, including nested/re-entrant contexts.
2. Establish which database roles `DATABASE_URL` and `AUTHENTICATOR_DATABASE_URL` are expected to use in development, CI, and deployment. Actual deployment credentials remain unknown.
3. Reconcile the registry, caller modules, current table names, `database/bootstrap.sql`, migration grants, and security documentation.
4. Choose an enforcement design that does not rely on fragile regex parsing of arbitrary SQL. Evaluate least-privilege DB roles/grants and narrowly scoped query APIs against existing cross-tenant authentication/workspace workflows.
5. Define positive, negative, nested, failure, and bypass tests before implementation.

Potentially related observations requiring confirmation during this phase:
- `connectSystemClient(purpose)` accepts a purpose string but does not enforce the registry's `allowedTables` against executed SQL.
- The wrapper only checks tenant-table detection outside system mode; that does not establish per-purpose table restrictions.
- `scripts/auth/grant-super-admin.ts` uses `sys-admin-run`, which is blocked outside tests/verification probes by the current `runWithSystemContext` guard.
- `.env.example` uses the PostgreSQL `postgres` role for `DATABASE_URL`, and `PostgresClient` uses `DATABASE_URL` for its normal runtime pool. This is a dangerous example default if copied into a deployment; the actual deployment configuration is NOT VERIFIED.

**Acceptance criteria:**
- No unregistered purpose can lease privileged access.
- Direct system-client use cannot bypass purpose/context validation.
- A purpose cannot silently query tables outside its approved scope; enforcement must be robust for the actual query surface.
- Tenant-scoped data remains inaccessible without the correct tenant context to the normal runtime role.
- The operator CLI path has a deliberate, least-privilege authorization path and cannot be invoked by normal application callers.
- Audit behavior, transaction rollback, nested contexts, client release, and error propagation remain correct.
- Negative/adversarial tests demonstrate rejected out-of-scope and context-free access.
- A dedicated disposable PostgreSQL CI test verifies actual role/RLS behavior; simulator-only tests are insufficient.

**Approval gate:** No runtime, role/grant, migration, CI, or dependency changes until the implementation design and exact changed-file scope are reviewed and approved. Never point a destructive isolation test at a production or shared database.

### Phase 2 — Durable persistence contract

- Trace every repository method, domain entity, SQL statement, and simulator/test consumer for `admin_users`, `feature_flags`, and `ai_provider_configs`.
- Correct the persistence boundary so PostgreSQL repository reads use query result rows and writes do not rely on static in-process Maps for durable behavior.
- Separate simulator adapters from PostgreSQL adapters where the existing architecture requires it; do not make a broad rewrite without evidence.
- Replace invalid prefixed fallback IDs only after tracing identifier creation and callers; preserve UUID/domain contracts.
- Add repository-level positive and negative tests against a dedicated PostgreSQL instance.

### Phase 3 — Schema/query/migration contract reconciliation

- Treat `database/schema/index.ts` as canonical schema source and compare it with every relevant SQL consumer, migration, journal entry, snapshot, and domain type.
- Reconcile the observed column drift for `admin_users`, `feature_flags`, and `ai_provider_configs`.
- Preserve `admin_users.role_id` until dependencies and historical semantics are resolved; keep `organization_members.role` as the authorization source of truth.
- Decide audit-column nullability/defaults and `permissions` semantics from domain and authorization evidence, not convenience.
- Resolve the `tenant_overrides` serialization/type contract explicitly.
- Inspect the UUID casts in migration `0007_goofy_vanisher.sql` and test migration from an empty database and a representative pre-migration fixture on disposable PostgreSQL.
- Generate migrations only through the documented Drizzle workflow; stop on ambiguous schema/journal/snapshot prompts.

### Phase 4 — Real PostgreSQL verification and CI truthfulness

- Verify the migration chain and role/bootstrap setup on disposable PostgreSQL with pgvector.
- Wire database tests into CI only after confirming that tests are real, discovered, fail closed when absent, and cannot target shared/production databases.
- Test actual table ownership, role grants, RLS ENABLE/FORCE, policy expressions, and cross-tenant SELECT/INSERT/UPDATE/DELETE failures.
- Keep static verification and live PostgreSQL verification as separate evidence categories.

### Phase 5 — Product/data lineage and documentation

- Trace product workflows from organization and digital assets through acquisition, normalization, analysis, AI observations/citations, recommendations, and persistence.
- Resolve whether social-account data is represented through an existing model/association or is a true product/data-contract gap.
- Reconcile stale architecture/security docs only after source, generated artifacts, and runtime evidence are aligned.

### Phase 6 — Dependency decision and final review

- Inspect `package.json` and lockfile for `drizzle-orm`, `drizzle-kit`, and `@electric-sql/pglite`, including direct versus transitive use.
- Compare stable versions and compatibility only when dependency evidence is complete; do not upgrade opportunistically.
- Run the authorized typecheck, lint, unit/database/UI tests, build, static migration checks, and disposable PostgreSQL suites where available.
- Perform adversarial self-review and report exact commands/results, skipped checks, changed paths, remaining risks, and the final Git/PR state.

## Current stop condition

Phase 0 source inspection has identified the Phase 1 design questions, but this workflow does not have a local checkout or connected project database. No runtime/schema/migration/dependency/CI changes are authorized by this plan document itself. Do not mark any phase SUCCESS without the evidence required by its acceptance criteria.
