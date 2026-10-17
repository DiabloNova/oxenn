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
- `scripts/database/build-reference-matrix.ts` imports `TENANT_SCOPED_TABLES` from `src/core/database/tenant-context`, while the generated list inspected is at `src/core/database/tenant-tables.generated.ts`. Verify the referenced module and build script in a runnable checkout before concluding whether this is a broken import.
- Migration `0007_boring_ares.sql` converts crawl-related `tenant_id` values using `::uuid`; any non-UUID existing values would make that conversion fail. There is no production database state available here to determine whether such values exist.

## Project-owner constraints for the current database-repair work

These are explicit project-owner instructions and are not claims derived from the repository:
- No real/main database is currently connected to the repository; the project has been using an internal database simulator. Do not claim production database verification.
- Ignore PR #72 entirely.
- Preserve `admin_users.role_id` until all dependencies are reviewed; do not remove it as part of a speculative cleanup.
- Historical unknown audit IDs may be NULL only where domain semantics permit.
- A default empty `permissions` array is conditional on confirming the authorization policy.
- Include `ai_provider_configs` in the overall database repair scope.
- Inspect `drizzle-orm`, `drizzle-kit`, and `@electric-sql/pglite` dependency state; upgrade only if evidence shows a stable-version change is needed, and avoid opportunistic upgrades.

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
