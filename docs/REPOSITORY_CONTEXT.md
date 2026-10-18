# Repository Context — Verified Baseline

**Baseline ref:** `main`  
**Baseline commit inspected:** `feced8d2b451527cfe0e06cf62d9b6bff0af7757` (2026-10-17; merge of PR #82)  
**Purpose:** A concise navigation and constraints index for future agents. This document is not a substitute for inspecting the current source, tests, migrations, or Git state before each task.

## Product and stack

- The repository README describes **Oxenn** as a bilingual Persian/English AI visibility and AEO platform for monitoring and improving how brands/content are represented by AI search and large language models.
- Documented stack: Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS, pnpm, Node.js >= 22, Drizzle ORM, PostgreSQL, and pgvector.
- Main areas described by the README: `src/app/` (routes/pages), `src/components/`, `src/lib/`, `src/services/`, `database/`, `tests/`, and `docs/`.
- `docs/product/README.md` lists capabilities as implemented, including AI visibility audits, competitor discovery, knowledge graph foundation, document intelligence, content brief/gap/keyword engines, technical SEO, site architecture, prompt intelligence, citation intelligence, brand intelligence, AEO content intelligence, and RAG intelligence. These are documentation claims and must be verified against actual implementation when a task depends on them.

## Repository control documents

- Root control documents present at the baseline: `AGENTS.md`, `BLUEPRINT.md`, `SPEC.md`, and `SKILL.md`.
- **No root `PLAN.md` was present** in the inspected root listing. `AGENTS.md` says the active plan governs authorized changes; identify the task-specific plan under the documented project paths before implementation.
- **`docs/REPOSITORY_CONTEXT.md` was absent** at this baseline; this file is being added to satisfy the mandatory context-document reference in `AGENTS.md`.
- `https://jules-prompts.wecanuseai.com/llms.txt` is required by `AGENTS.md`, but the retrieval attempt returned a cache-miss/fetch failure. Its contents remain **NOT VERIFIED**; do not claim its guidance was followed.
- Relevant documentation discovered under `docs/` includes `docs/database/canonical-data-contract.md`, `docs/database/reference-matrix.md`, `docs/security/privileged-paths.md`, `docs/product/README.md`, `docs/project/audit/`, `docs/project/roadmap/`, and `docs/project/tasks/`. Read task-relevant Markdown before planning and verify it against source.

## Database architecture and invariants

- `database/schema/index.ts` is declared by `docs/database/canonical-data-contract.md` and `AGENTS.md` as the canonical Drizzle schema source.
- Migration SQL and Drizzle metadata live under `database/drizzle/`; the documented application migration entry point is `pnpm db:migrate` via `src/core/database/migrator.ts`. Do not create a second migration runner, rewrite historical migrations, or regenerate artifacts to hide conflicts.
- `src/core/database/tenant-tables.generated.ts` is a generated list of tables with at least one policy in the latest Drizzle snapshot. `scripts/database/verify-tenant-tables.ts` compares that list with snapshot policy-bearing table names; this static check does not prove RLS is enabled/forced in a live database.
- `scripts/database/verify-rls-migrations.ts` is documented as a static check of migration history for RLS enable/force statements. `tests/isolation/suite.ts` is the documented real-PostgreSQL isolation suite. Check CI workflow wiring before claiming a test suite runs in CI.
- The inspected `src/core/database/privileged-paths.ts` has an explicit purpose-tag registry with per-purpose allowed tables, caller module, and justification. The registry must be reviewed together with all `runWithSystemContext` callers and `docs/security/privileged-paths.md`; registry presence alone does not prove every caller is correctly bounded.
- The inspected `src/core/database/migrator.ts` currently resolves a connection string as `databaseUrl || process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL`, then creates the `vector` extension and runs Drizzle migrations from `database/drizzle`. Compare this actual behavior with the role-specific connection rules in `AGENTS.md` before changing it.
- `vitest.config.ts` configures separate projects for `tests/unit/**`, `tests/db/**`, and `tests/ui/**`. Do not assume files outside those include patterns are discovered by the standard Vitest run; inspect scripts and CI separately.
- The canonical data contract states that the unit-test/internal simulator does not prove PostgreSQL enforcement. Live database behavior, schema declarations, migration history, journal, snapshots, application queries, and tests are distinct evidence sources.

## Known database contract issues to investigate (not authorization to fix)

The following were observed in source/schema comparisons during the read-only baseline. Re-open the live files before relying on them:
- `admin_users`: the canonical schema/snapshot and PostgreSQL persistence repository appear to disagree on fields such as `role`, `permissions`, `sso_identities`, `created_by`, and `updated_by`; schema contains `role_id` and `version`. Trace all callers and historical migrations before deciding a target contract.
- `feature_flags`: persistence SQL references audit/version columns not present in the inspected schema/snapshot. `tenant_overrides` is stored as text and serialized with JSON; changing its type requires a contract and migration review.
- `ai_provider_configs`: persistence SQL references audit/version columns not present in the inspected schema/snapshot. This table is in the requested repair scope.
- Some repository fallback IDs use prefixed random strings, while relevant schema identifiers appear to be UUIDs. Trace actual production paths and tests; do not perform a global replacement.
- `scripts/database/build-reference-matrix.ts` and `scripts/database/verify-tenant-tables.ts` import `TENANT_SCOPED_TABLES` from `src/core/database/tenant-context`; inspection of `src/core/database/tenant-context/index.ts` confirms that this module re-exports the list from `src/core/database/tenant-tables.generated.ts`. This import path is therefore not itself a defect.
- Migration `database/drizzle/0007_goofy_vanisher.sql` converts crawl-related `tenant_id` values using `::uuid`; any non-UUID existing values would make that conversion fail. There is no production database state available here to determine whether such values exist.

## Project-owner constraints for the current database-repair work

These are explicit project-owner instructions and are not claims derived from the repository:
- No real/main database is currently connected to the repository; the project has been using an internal database simulator. Do not claim production database verification.
- Ignore PR #72 entirely.
- Preserve `admin_users.role_id` until all dependencies are reviewed; do not remove it as part of a speculative cleanup.
- Historical unknown audit IDs may be NULL only where domain semantics permit.
- A default empty `permissions` array is conditional on confirming the authorization policy.
- Include `ai_provider_configs` in the overall database repair scope.
- Inspect `drizzle-orm`, `drizzle-kit`, and `@electric-sql/pglite` dependency state; upgrade only if evidence shows a stable-version change is needed, and avoid opportunistic upgrades.

## Additional cross-layer findings from the current read-only audit

These are findings to triage in the database/security repair plan; they are not authorization to change application behavior:
- The August 16, 2024 `docs/project/audit/INFRA_READINESS_AUDIT.md` describes a legacy `database/archive/migrations-legacy/` setup, says no migration runner/Drizzle dependencies exist, and references an older schema model. The current root README, `package.json`, `database/schema/index.ts`, `database/drizzle/meta/_journal.json`, and `src/core/database/migrator.ts` contradict those parts. Treat that audit as historical, not as a current baseline.
- `docs/architecture/README.md` says the canonical schema models 57 tables; the inspected latest snapshot and `docs/database/reference-matrix.md` each report 70 tables. Reconcile the documentation only after confirming generated artifacts in a runnable checkout.
- The privileged-path registry and `docs/security/privileged-paths.md` still list legacy table names such as `tenants`, `tenant_users`, and `tenant_invitations`, which are absent from the latest snapshot; the current schema uses `organizations`, `organization_members`, and `organization_invitations`.
- In `src/core/database/tenant-context/index.ts`, `runWithSystemContext` verifies that the purpose tag is registered and blocks `sys-admin-run`/`test-req` outside test mode or a verification probe. However, `PostgresClient.connectSystemClient` does not enforce `PRIVILEGED_PATHS_REGISTRY[purpose].allowedTables` against SQL; it only checks system-mode context. The allowed-table list is therefore not a per-table runtime allowlist in the inspected query path.
- `scripts/auth/grant-super-admin.ts` invokes `runWithSystemContext(..., "sys-admin-run", ...)`, while the above guard blocks that purpose unless `NODE_ENV === "test"` or `VERIFICATION_PROBE_ACTIVE === "1"`. This appears to conflict with the documented operator CLI path for granting `super_admin`; production behavior needs explicit verification and a narrowly scoped correction plan.
- The admin persistence repositories in `src/features/admin/infrastructure/persistence/postgres/index.ts` issue SELECT statements but return records from static in-memory `Map` stores rather than using the query result rows. This means those read paths do not demonstrate durable PostgreSQL reads even though SQL is issued. Confirm scope across all repository methods before implementation.
- `tests/features/admin/infrastructure/postgres-integration.test.ts` exports a function named `testPostgresIntegration` and does not use Vitest `describe/it`; the inspected `vitest.config.ts` only includes `tests/unit/**`, `tests/db/**`, and `tests/ui/**`. The file is not covered by those standard project include patterns and is not evidence of an automatically executed integration test.
- The canonical snapshot contains 70 tables, including brand, website, crawl, prompt, AI observation, citation, recommendation, and knowledge-graph tables. A dedicated social-account table was not found in the table-name inventory inspected so far; do not conclude the capability is absent until all source models and JSON/association representations are traced.

## Safe working protocol

1. Re-check the current branch, HEAD SHA, and working-tree state before each phase. Preserve unexpected user changes.
2. Read the relevant Markdown under `docs/` plus applicable root control documents; distinguish facts, inferences, conflicts, and unknowns.
3. For database tasks, compare schema source, all relevant SQL migrations, migration journal, snapshots, runtime queries, repository/domain types, test discovery, CI, and privileged-path call sites.
4. Do not change schema, migrations, generated artifacts, dependencies, or CI until the active phase is explicit and the scope/acceptance criteria are authorized.
5. Treat production/live PostgreSQL verification as **NOT VERIFIED** unless a real PostgreSQL environment is provisioned and the relevant negative-path tests are observed.
6. At phase end, capture changed paths, diff, Git state, exact checks performed, checks not run, and unresolved conflicts. Add the required task report under `docs/tasks_reports/database/` for database work.

## Baseline verification limitations

- Repository files were inspected through GitHub's read API at the baseline SHA above.
- No local checkout was available through this workflow; local typecheck, lint, unit tests, migration execution, and PostgreSQL integration tests were **NOT RUN**.
- GitHub API confirmed the branch `audit/product-aware-s0-baseline` existed at the same baseline SHA before this context file was added. Its working-tree state cannot be inferred from GitHub's branch API; there is no local working-tree status available here.
- No real database schema/data was inspected; production state and actual applied migration state are **NOT VERIFIED**.


## Phase 0 access-path follow-up (2026-10-18)

The GitHub-only access-path scan was extended through the full 94-file TypeScript/JavaScript test tree and the previously unreviewed worker-specific database path. Treat these as additional observations to re-verify before implementation:

- `scripts/crawl-worker.ts` creates its own `pg.Pool` from `DATABASE_URL` and calls `CrawlDispatcherRepository` methods before starting per-job tenant context.
- `src/features/acquisition/infrastructure/persistence/postgres/dispatcher-repository.ts` directly executes `public.claim_crawl_jobs`, `public.recover_expired_crawl_jobs`, and `public.complete_crawl_job_if_lease_owner` through that raw pool.
- Those three `SECURITY DEFINER` functions and grants to a `crawler` role were found in `database/archive/migrations-legacy/0004_crawl_acquisition.sql`, but were not found in active `database/drizzle/0000`–`0012` migrations. `database/bootstrap.sql` defines `app_owner` and `app_runtime` as NOLOGIN roles and does not create `crawler`. This is a source-history conflict affecting fresh-database readiness; actual behavior was not run and is **NOT VERIFIED**.
- `src/features/monitoring/repositories/crawl-snapshot-repository.ts`, `monitoring-alert-repository.ts`, and `monitoring-config-repository.ts` use `drizzle(ctx?.dbClient || (global as any).pgClient)`. No producer assignment for `global.pgClient` was found in the inspected source/config paths. Its reachability remains **UNRESOLVED**; tenant ID validation before the fallback does not prove the fallback connection carries the same transaction-local RLS context.
- Test-only raw DB access includes `tests/isolation/suite.ts`, `tests/features/acquisition/integration/run-all.ts`, `tests/features/public-api/public-api.test.ts`, and a number of feature integration/run-all scripts. These should only target explicitly disposable PostgreSQL databases. Presence of a test file does not prove CI executes it.
- The GitHub-only scan covered all 94 tracked TS/JS test files, the tracked UI page/component files, and the source modules selected for database/runtime access patterns. Exact local `rg` output, a local Git status, and runtime verification remain unavailable because there is no checkout in this workflow and the attempted clone/remote access failed. GitHub code search returned incomplete zero-result responses and was not treated as exhaustive.

See `docs/tasks_reports/database/2026-10-17-phase-0-follow-up-access-paths.md` for the full evidence, conflict statement, and Phase 0 completion criteria.
