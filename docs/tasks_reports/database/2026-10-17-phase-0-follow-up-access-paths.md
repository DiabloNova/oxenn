# Phase 0 Follow-up — Final Caller Map and Remaining Access-Path Gate

- Date: 2026-10-17
- Repository: `DiabloNova/oxenn`
- Main baseline: `feced8d2b451527cfe0e06cf62d9b6bff0af7757`
- Audit branch: `audit/product-aware-s0-baseline`
- Scope: read-only continuation of the bounded Phase 0 audit. No application, schema, migration, dependency, or CI source was changed.
- Database status: **no real/main/production database is connected**.

## Decision

The source-derived purpose/caller map and Phase 1 acceptance criteria are sufficiently clear to plan the security implementation. However, the Phase 0 access-path check is **not fully closed** until a repository-wide local search confirms every use of raw pool/client access and direct SQL entry points. GitHub's code-search connector returned no indexed matches for the relevant symbols, so this report deliberately does not claim that no additional production callsites exist.

Do not restart the broad schema/product audit. Close only this remaining access-path gate using a local repository checkout or Jules, then begin Phase 1.

## Confirmed source facts

1. `runWithSystemContext` rejects unknown purpose tags and blocks `sys-admin-run` / `test-req` outside test mode or an active verification probe.
2. `connectSystemClient(purpose)` accepts the purpose but the inspected query wrapper does not enforce `PRIVILEGED_PATHS_REGISTRY[purpose].allowedTables`.
3. The registry uses stale relation names (`tenants`, `tenant_users`, `tenant_invitations`) while current callers use `organizations`, `organization_members`, `organization_invitations`.
4. The source-derived caller table is in `2026-10-17-phase-0-privileged-path-audit.md`. It includes auth/session/token/rate-limit tables, workspace/membership/invitation tables, API-key operations, and the operator-only role grant. The table is a minimum observed relation map, not a database grant manifest.
5. `scripts/auth/grant-super-admin.ts` calls `sys-admin-run`, which is explicitly test/verification-gated, and uses `process.exit(1)` within the managed callback on one failure path. The operator grant path must be separated from test-only system contexts.
6. `database/bootstrap.sql` defines `app_owner NOLOGIN` and `app_runtime NOLOGIN`, but does not establish which LOGIN identity is used by `DATABASE_URL` / `AUTHENTICATOR_DATABASE_URL`; the latter falls back to the former when absent.
7. `TenantContextManager` writes audit records after the work transaction commits and swallows audit-write failures. Security-sensitive role/key operations need an explicit and tested audit durability policy.
8. Nested system contexts reuse the existing system client while replacing the context purpose. Purpose changes therefore cannot be treated as independently constrained merely by switching database roles on each nested call.
9. `PostgresClient.getPool()` exposes the raw pool. The focused test review found it used in `tests/unit/core/tenant-context/system-mode-bypass.test.ts`, but the repository-wide production-callsite check is still outstanding; absence elsewhere has not been established.
10. `verification/phase-0/auth03-probe.md` states that `runWithSystemContext` leaves `dbClient` unset and that `getDbClient()` returns null. That statement conflicts with the currently inspected `src/core/database/tenant-context/index.ts`, which leases `connectSystemClient(purpose)` and stores the leased client in the context. Treat the probe report as stale unless its historical commit/context can be demonstrated; do not use it as evidence of current runtime behavior without rerunning the probe against this baseline.

## CI evidence

GitHub Actions run [39008391058](https://github.com/DiabloNova/oxenn/actions/runs/39008391058) for main commit `feced8d2b451527cfe0e06cf62d9b6bff0af7757` completed successfully. The observed jobs were:
- Unit Tests: success (including UI tests)
- Isolation Suite: success
- Build and Test: success (typecheck, lint, tenant-table alignment, RLS migration coverage, build, and reference-matrix drift checks)

These are useful baseline results, not proof that the purpose-enforcement gap is fixed. The isolation suite is disposable PostgreSQL testing and does not prove which login role a future deployment will use.

## Exact remaining Phase 0 task

Run a repository-wide source search on the checked-out main baseline for:
- `getPool(`, `new Pool(`, `connectSystemClient(`, `connectClient(), `PoolClient`, `pool.connect(`, and direct `pg` imports;
- every `runWithSystemContext(` call and every `getDbClient()` / raw client query reachable inside each callback;
- direct database access in production scripts, jobs, services, actions, and adapters outside the standard context wrappers.

For each match, record file/line, production vs test-only status, context/purpose, reachable tables/operations, and whether it can bypass purpose enforcement. Inspect surrounding code rather than relying on grep alone. Return exact commands and outputs, including zero-result searches. No app/schema changes during this step.

**Phase 0 acceptance:** every production database entry path is accounted for; raw pool access is either removed from production reachability or explicitly addressed in the Phase 1 enforcement design; the caller-to-purpose relation map has no unexplained callsites; and stale probe/document claims are labeled or reconciled.

## Guardrails

- Do not connect, point, or run destructive tests against a production/shared database.
- Do not make application/schema/migration/dependency changes in this Phase 0 follow-up.
- Do not broaden privileges just to make an existing caller pass.
- After this gate is closed, Phase 1 can begin on a focused branch with the pre-agreed negative/adversarial PostgreSQL acceptance tests.
