# Baseline Plan — Finding Index

## Audited baseline

- **Repository:** `DiabloNova/oxenn`
- **Branch under inspection:** `main`
- **Exact commit:** `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Audit date:** 2026-11-06
- **Current documentation branch:** `docs/product-roadmap-baseline-2026-11`
- **Scope:** read-only source, documentation, GitHub branch/PR metadata and GitHub Actions evidence. No app code or database changes were made.

## Execution order

The global order reflects priority, blast radius and prerequisites. Part folders group related problem types; they do not reset the global order.

| Global order | ID | Part / category | Finding | Priority | Dependencies | Status |
|---:|---|---|---|---|---|---|
| 1 | [BL-004](./Part-02-Persistence/BL-004-in-memory-repository-fallbacks.md) | Part 02 — Persistence | Product repositories use process-local memory and fail-open fallbacks instead of consistent durable PostgreSQL behavior | P1 | — | validated |
| 2 | [BL-001](./Part-01-Data-Integrity/BL-001-technical-seo-synthetic-data.md) | Part 01 — Data integrity | Technical SEO dashboard generates and persists synthetic crawl observations | P1 | BL-004 | validated |
| 3 | [BL-002](./Part-01-Data-Integrity/BL-002-ai-visibility-silent-mock-fallback.md) | Part 01 — Data integrity | AI Visibility silently defaults to Mock when live provider is not explicitly selected/configured | P1 | BL-004 | validated |
| 4 | [BL-003](./Part-01-Data-Integrity/BL-003-default-brand-id-and-seed-contract.md) | Part 01 — Data integrity | Default brand uses fictional data and a non-UUID identifier incompatible with the audit action contract | P1 | BL-004 | validated |
| 5 | [BL-005](./Part-03-Tooling-Tests-Build/BL-005-lint-warning-debt.md) | Part 03 — Tooling/build | Lint passes with 213 warnings under a 218-warning allowance | P2 | Coordinate with overlapping source changes | validated |
| 6 | [BL-006](./Part-03-Tooling-Tests-Build/BL-006-dynamic-filesystem-build-tracing.md) | Part 03 — Tooling/build | Runtime filesystem traversal in docs API triggers whole-project Turbopack tracing warnings | P2 | — | validated |
| 7 | [BL-007](./Part-03-Tooling-Tests-Build/BL-007-empty-database-vitest-project.md) | Part 03 — Tests | Database Vitest project has no files, allows empty success and is not run in CI | P2 | BL-004 | validated |
| 8 | [BL-008](./Part-04-Documentation-Governance/BL-008-conflicting-historical-architecture-and-roadmap-docs.md) | Part 04 — Documentation | Historical architecture and roadmap documents contain stale or conflicting claims | P2 | — | validated |
| 9 | [BL-009](./Part-04-Documentation-Governance/BL-009-stale-open-pull-requests.md) | Part 04 — Governance | Open Phase 1 PRs are stale/diverged from current main and are not mergeable at audit time | P2 | — | validated |
| 10 | [BL-010](./Part-03-Tooling-Tests-Build/BL-010-service-tests-not-in-ci.md) | Part 03 — Tests | Service test files are outside the configured Vitest projects and CI commands | P2 | BL-004, BL-007 | validated |

## CI baseline observations

GitHub Actions run `42181198077` for the audited main commit completed successfully:
- Build and Test: success.
- Unit Tests: success — 59 test files passed, 1 skipped; 335 passed, 1 todo.
- UI Tests: success — 4 files, 33 tests passed.
- PostgreSQL Isolation Suite: success.
- Typecheck, Lint, Drizzle migration-chain check, schema/table alignment, RLS migration coverage and Next build: successful.

A green workflow does not imply a warning-free repository. The same run reported 213 lint warnings (0 errors) under a `--max-warnings=218` gate and two Turbopack dynamic-filesystem tracing warnings. Node action/dependency deprecation messages also appeared; their dependency/source attribution requires additional review before they become separate validated findings.

PostgreSQL error log entries from the isolation suite include intentional negative RLS/foreign-key cases; because the suite completed successfully, they are not counted as defects without separate evidence.

## Audit coverage and completeness

The recursive Git tree at the baseline contained 805 files (not truncated), including approximately 346 files under `src/`, 112 under `tests/`, 77 under `database/`, 78 under `docs/`, and two GitHub workflow files. The current ten findings are validated observations, not a claim that all 805 files have been individually reviewed.

**Audit state: in progress.** Further review remains required for:
- all API routes/server actions and authorization boundaries;
- every repository class/method and all tenant-owned queries;
- schema, migration SQL, RLS functions, grants, indexes and live database assumptions;
- every background worker, job state transition, retry/lease and privileged database function;
- external provider integrations, configuration and runtime failure paths;
- UI workflows, localization/accessibility and feature-to-implementation consistency;
- dependency warnings/deprecations and all build/runtime diagnostics;
- test inventory, skipped/todo tests, flaky tests and missing negative/failure cases;
- production/staging configuration and operational readiness, which cannot be inferred from GitHub CI alone.

Every new validated issue must receive the next stable ID and be inserted in the correct global order. False positives must be recorded with evidence and a reason; they must not be silently removed.

## Changes made during this audit

Only documentation scaffolding and finding records have been added to the documentation branch. No application code, schema, migration, database, deployment, protected branch or existing pull request has been modified.
