# Phase 0 Follow-up — GitHub Source Inventory of Database Entry Paths

- Date: 2026-10-17
- Repository: `DiabloNova/oxenn`
- Main baseline: `feced8d2b451527cfe0e06cf62d9b6bff0af7757`
- Audit branch: `audit/product-aware-s0-baseline`
- Scope: read-only inspection of GitHub source and test files. This report update is documentation-only. No application, schema, migration, dependency, or CI source was changed.
- Database status: **no real/main/production database is connected**.

## Decision

The repository-source inventory of direct PostgreSQL entrypoints is now documented from GitHub's recursive main tree and path-by-path source-file reads. The connector's GitHub code-search endpoint returned zero results with an incomplete index, so those results were **not** treated as proof that matches were absent. Instead, source files under `src/`, `scripts/`, `components/`, and `lib/` were inspected in batches for raw `pg.Pool`/`pg.Client` construction, pool/client leasing, context calls, and global client fallbacks.

This closes the **GitHub source-inventory portion** of the remaining Phase 0 task. It does **not** prove runtime reachability, deployed PostgreSQL role grants, or RLS behavior. Do not claim Phase 0's security gate is fully closed until Phase 1 has an explicit control design for the listed exceptions and the residual questions below are resolved using a checked-out repository and disposable PostgreSQL only.

## Direct entrypoint inventory

| Entry path | Evidence from main source | Classification and risk | Required Phase 1 handling |
|---|---|---|---|
| Central runtime pools | `src/features/admin/infrastructure/persistence/postgres/index.ts`: `new Pool` for `DATABASE_URL` (line 50) and `AUTHENTICATOR_DATABASE_URL || DATABASE_URL` (line 58). | Core application entrypoint. The authenticator pool can silently use the ordinary runtime connection string when the distinct URL is missing; actual deployed login roles remain unknown. | Fail closed if the privileged/authenticator identity is not separately configured where required. Verify actual LOGIN role and reject superuser/`BYPASSRLS` for runtime roles. |
| System-context client leasing | `PostgresClient.connectSystemClient(purpose)` leases from the authenticator pool; `TenantContextManager.runWithSystemContext` stores that lease as `ctx.dbClient`. | Standard privileged application route, but purpose is not enforced against relation names at the client query wrapper. `allowedTables` is descriptive, not a SQL permission boundary. Nested system contexts reuse the same client and replace the context purpose rather than getting a separately restricted database identity. | Use least-privileged DB grants/roles or another robust enforcement mechanism. Validate nested contexts, all operations, audit writes, failure paths, and role switching; do not rely on registry metadata or regex-only SQL parsing. |
| Tenant-context client leasing | `TenantContextManager.runWithTenantContext` leases via `PostgresClient.connectClient()`, begins a transaction, sets `app.current_tenant_id` locally, stores the client in context, and releases it. | Expected tenant-scoped route. Repository helpers for crawl cache/jobs/results read this active client and fail when it is missing; no separate runtime pool construction was found in those helpers. | Test positive/negative tenant boundaries against a disposable PostgreSQL DB running as a non-owner/non-`BYPASSRLS` role. |
| Uncontexted query fallback | `PostgresClient.query()` routes through `ctx.dbClient` when present, but falls back to `this.pool.query(sql, params)` when no client is active and the SQL is not classified as tenant-scoped (line around 226). | Confirmed runtime bypass path for uncontexted/unclassified SQL, independent of the raw-pool accessor. Detection relies on a custom SQL text scanner, not a full parser. Admin/CQRS repository methods can call this shared query API. | Decide which operations may run outside context. Prefer making runtime queries fail closed unless they carry an approved tenant/system/operator execution boundary; retain intentional maintenance paths separately. Test CTEs, nested queries, quoted/schema-qualified identifiers, mutations, multi-statements, and false-negative cases. |
| Public raw-pool accessor | `PostgresClient.getPool()` returns the private runtime pool (lines 73–74). The source scan found a call at `tests/unit/core/tenant-context/system-mode-bypass.test.ts:53`; no production callsite was found in the scanned application/script source. | Public API with bypass potential, but no current production caller was observed in the source scan. This is a source-level result, not proof of no dynamic/external consumers. | Remove or restrict the accessor if not required outside tests; keep production dependency boundaries from exposing raw pools. Include a static regression assertion for raw pool access. |
| Crawl-worker direct pool | `scripts/crawl-worker.ts:2,147–155` imports `Pool`, constructs a pool from `DATABASE_URL`, and passes it to `CrawlDispatcherRepository`. | Confirmed separate production-capable worker entrypoint outside `TenantContextManager`. `claim`, `recoverExpired`, and completion operations call cross-tenant SQL functions; per-job processing separately enters tenant context. `src/lib/docsData.ts` also documents the worker's ad-hoc pool exception. | Treat as a named service identity, not as a generic bypass exception. Grant only EXECUTE on the exact required `public.claim_crawl_jobs`, `public.recover_expired_crawl_jobs`, and `public.complete_crawl_job_if_lease_owner` functions; revoke unnecessary table access, verify their SECURITY DEFINER/search_path/owner semantics, and test lease ownership and cross-tenant isolation. Actual DB grants are not verified. |
| Migration runner | `src/core/database/migrator.ts:3,12,18,25,48` creates its own `Pool` using `databaseUrl || MIGRATION_DATABASE_URL || DATABASE_URL`, runs Drizzle migrations, and runs `CREATE EXTENSION IF NOT EXISTS vector`. The package script invokes it via `db:migrate`. | Intentional operator/maintenance entrypoint that may require schema/extension privileges; it is not a tenant request path. URL fallback may unintentionally use the application identity. | Require an explicit migration credential in controlled deployment/release execution; separate it from runtime URLs, document extension bootstrap, and test grant boundaries. Never run migrations against a production/shared DB during this audit. |
| db:push safety guard | `scripts/database/db-push-guard.ts:1,106` imports `Client` from `pg` and connects directly to inspect catalog table count. Package script `db:push` runs this guard before `drizzle-kit push`. | Intentional development/test tooling path. Environment markers, URL substring heuristics, `ALLOW_DB_PUSH`, `DISPOSABLE_DB`, and empty-database check lower risk but do not cryptographically prove a target is disposable; invoking `drizzle-kit push` separately can skip the package guard. | Keep this path dev/test-only, improve defense-in-depth in Phase 1 if needed, and never use shared/production credentials for it. |
| Admin/CQRS repositories and DI | `src/core/container/index.ts` creates `PostgresClient`, a `UnitOfWork`, and registers Postgres repositories. `src/features/admin/api/v1/admin/index.ts` constructs command/query handlers and repositories with the same client; `src/features/admin/application/handlers.ts` constructs repositories with `PostgresClient` but does not pass a UnitOfWork to each repository. | Confirmed direct use of the common query API from repositories. The admin controller comments mention an in-memory store/mock route while its constructors wire Postgres persistence, so actual request-route reachability and intended simulator-vs-Postgres behavior are inconsistent/unverified. The UoW obtains a client, but it does not itself establish a `TenantContextManager` context; transaction behavior needs separate review. | Trace actual route imports/callers and make the intended persistence mode explicit. Do not assume that constructing a UoW automatically routes each repository query through its leased transaction client. Test all admin reads/writes for explicit context/transaction and correct rollback behavior. |
| API-key repository | `src/features/public-api/repositories/api-key-repository.ts` calls `PostgresClient.query()` for create/find/update. Callers in `src/features/public-api/services/api-service.ts` wrap create/update in tenant context and global prefix lookup in `sys-api-key-auth`. | Current observed callers use expected contexts; repository methods themselves remain callable without context and therefore depend on the central fallback policy. | Preserve the caller-purpose map and add tests that invoke repository methods with missing/wrong context; make unwrapped use fail closed if that is the chosen policy. |
| Monitoring repository global fallback | `crawl-snapshot-repository.ts`, `monitoring-alert-repository.ts`, and `monitoring-config-repository.ts` use `drizzle(ctx?.dbClient || (global as any).pgClient)`. Each first calls `getRequiredTenantId()`. | Confirmed fallback reference but no production assignment to `global.pgClient` was found in the scanned `src/`, `scripts/`, `components/`, and `lib/` source set. Because a valid tenant context normally includes `dbClient`, this looks like a stale or externally injected fallback; its runtime reachability is not proven. | Find any test/bootstrap/external injection and then remove the fallback or replace it with a typed, fail-closed accessor. Do not treat this as safe merely because `getRequiredTenantId()` runs first. |
| CLI API-key issue/revoke | `scripts/api/issue-key.ts` and `scripts/api/revoke-key.ts` invoke `runWithSystemContext` with `api-key-issue` / `api-key-revoke` and use the central `PostgresClient.query()` path. | Explicit CLI/operator entrypoints with narrower intent than a wildcard system role; actual DB role permissions remain unverified. | Restrict each CLI identity to its precise required operations and avoid printing/capturing the generated secret beyond the intended one-time CLI output. |
| Super-admin grant CLI | `scripts/auth/grant-super-admin.ts:27` enters `sys-admin-run`, updates `organization_members`, and inserts an audit row. | Confirmed mismatch: `sys-admin-run` is blocked outside tests/verification probes by `runWithSystemContext`, but this script is an operator command. It also calls `process.exit(1)` inside the managed callback on a failure branch. | Create a deliberately controlled operator-only path/credential and durable audit semantics; do not broaden the test-only tag or grant wildcard runtime access. Test authorization and rollback. |
| Drizzle generation/config | `drizzle.config.ts` uses `DATABASE_URL` or a local `postgres:postgres@localhost:5432/postgres` fallback. | Tooling configuration, not proof that a database is connected. Directly invoking the schema push tool may use a local fallback if environment validation is bypassed. | Make command entrypoints explicit and keep generation separate from apply; ensure no command can silently target an unintended database. |
| Test/verification pools and clients | `tests/isolation/suite.ts` creates pools for an admin/setup connection and a test DB; it assigns test URLs to `DATABASE_URL` and `MIGRATION_DATABASE_URL`. Unit tests mock `connectSystemClient`/pool access. | Test-only routes. The isolation suite is intended for disposable PostgreSQL and can perform destructive setup/reset; unit-test fallback URLs must not be mistaken for a live database used in this audit. | Keep the isolation target dedicated and disposable; validate target safeguards before running. No tests were run from this GitHub-only audit. |

## Caller-to-purpose index

The following production call sites were source-confirmed. This is a caller map, not a relation-grant manifest:

- `sys-login` / `sys-register`: `src/app/actions/auth.ts`; additional `sys-login` user/account/session operations in `src/app/actions/account.ts` and `src/services/auth/session.ts`.
- `sys-auth-check`, `sys-auth-role-check`, `sys-auth-api-check`: `src/services/auth/authorization.ts`; `sys-auth-check` also appears in `src/services/auth/session.ts`.
- `sys-create-workspace`, `sys-list-workspaces`, `sys-accept-invitation`, `sys-switch-workspace`: `src/app/actions/workspace.ts`; `sys-list-workspaces` also appears in account deactivation flow.
- `sys-api-key-auth`: `src/features/public-api/services/api-service.ts`.
- `api-key-issue`, `api-key-revoke`: `scripts/api/issue-key.ts`, `scripts/api/revoke-key.ts`.
- `sys-admin-run`: `scripts/auth/grant-super-admin.ts` (mismatch with its test/verification-only gate).
- `test-req`: `verification/phase-0/probe-system-context.ts` (verification-only).
- Tenant-context accessors: account/workspace actions, auth/session services, billing and acquisition repositories, and public API key workflows. Acquisition cache/job/result helpers require an active context client; the dispatcher is the exception with a raw pool by design.

The registry in `src/core/database/privileged-paths.ts` still lists legacy relation names (`tenants`, `tenant_users`, `tenant_invitations`) while current callers use `organizations`, `organization_members`, and `organization_invitations`. Do not use registry entries as enforcement until they match current SQL and a runtime/DB enforcement mechanism actually checks them.

## Stale AUTH-03 probe

`verification/phase-0/auth03-probe.md` says that `runWithSystemContext` leaves `dbClient` unset and that `getDbClient()` returns null. Current source in `src/core/database/tenant-context/index.ts` contradicts this: a non-nested system context calls `connectSystemClient(purpose)`, stores that leased client as `dbClient`, and releases it in `finally`. Mark the old report stale for this baseline. Its transcript mentions a local `oxenn_test` URL but was not rerun during this GitHub-only inspection; do not cite it as current runtime evidence.

## Verification method and limits

- Baseline verified from GitHub REST tree and branch metadata: `feced8d2b451527cfe0e06cf62d9b6bff0af7757`.
- The recursive source tree contains 354 TypeScript/JavaScript paths under `src/`, `scripts/`, `components/`, and `lib/`; those paths were inspected in batches for the access symbols listed above. Results were inspected in source-file context rather than relying only on snippets.
- GitHub code search returned zero matches with `incomplete_results: true`; it was not considered a complete search.
- No local checkout, shell grep, app runtime, typecheck, lint, or test suite was executed in this audit.
- No connection to a real/main/production database was made. The future deployed identity of `DATABASE_URL`, `AUTHENTICATOR_DATABASE_URL`, and `MIGRATION_DATABASE_URL`, actual PostgreSQL grants, `BYPASSRLS` attributes, stored-function ownership/search paths, and RLS behavior remain unverified.

GitHub Actions run [39008391058](https://github.com/DiabloNova/oxenn/actions/runs/39008391058) for main commit `feced8d2b451527cfe0e06cf62d9b6bff0af7757` was previously observed as successful for Unit Tests, Isolation Suite, and Build and Test. That is baseline CI evidence only; it does not prove the direct-entrypoint exceptions are safely permissioned.

## Remaining acceptance gates

The GitHub source inventory is complete enough to prevent the raw-pool paths already found from being overlooked. The security gate remains **not fully closed** until these items are resolved:

1. From a local checkout or controlled Jules run, repeat the literal whole-repository scan and save exact commands/output, covering generated/config files and any path class omitted from the GitHub source batches.
2. Determine whether the monitoring `global.pgClient` fallback is injected by any test/bootstrap/external runtime path; otherwise remove it or make it fail closed in Phase 1.
3. Trace actual route/reachability for the Admin API/CQRS/DI path and decide whether it is intentionally simulated or should use Postgres under explicit context and transaction handling.
4. Define enforcement for the crawler worker's three cross-tenant SECURITY DEFINER functions and prove the actual worker database identity has only the minimum required grants.
5. Define separate login identities and least-privilege grants for runtime/authenticator, crawler worker, migration, db:push guard, and operator CLI paths. The repository bootstrap's NOLOGIN roles are not evidence that deployment uses them.
6. Reconcile the stale AUTH-03 report by rerunning a safe probe against this baseline only in a disposable environment, or label it permanently as historical/stale with its source commit.
7. Carry forward the adversarial Phase 1 tests: unregistered purpose, forbidden table/operation, nested context purpose changes, SQL parser bypass shapes, test-only tags in production, operator-role separation, audit durability, connection release, rollback, and non-owner/non-`BYPASSRLS` integration tests.

**Phase 0 outcome:** direct entry paths discovered on GitHub are now classified and linked here. This is not a claim that database security is fixed, that the simulator is connected to a real DB, or that Phase 1 implementation has been performed.

## Guardrails

- Do not connect, point, or run destructive tests against a production/shared database.
- Do not make application/schema/migration/dependency/CI source changes during this audit.
- Do not broaden privileges just to make an existing caller pass.
- Phase 1 requires a separate focused implementation branch and the pre-agreed acceptance tests.

## Second-pass cross-check — test-only direct clients and tenant-client consumers

This addendum records a second pass over the relevant test/verification files and direct tenant-client consumers. It is documentation-only; no application, schema, migration, dependency, CI, or test source was changed.

### Additional test-only access sites confirmed

- `tests/features/acquisition/integration/run-all.ts:3,73,122-123,357,366` imports `Pool`, creates a dedicated pool from `databaseUrl`, leases clients directly for integration setup/cleanup, and closes `PostgresClient.getInstance().getPool()` at teardown. The same test uses `TenantContextManager.getDbClient()` for context assertions at lines 144 and 183. This is a test harness entrypoint, not a production request path; its target URL must be disposable.
- `tests/features/admin/tenant-isolation-behavior.test.ts:8,62` obtains the raw pool from `PostgresClient.getPool()` and calls `pool.connect()` in an isolation test. This is a second observed test consumer of the public raw-pool accessor; it should not be mistaken for a production consumer.
- `tests/isolation/suite.ts:1,35-37,51-52,76-77` creates direct pools/clients for database setup and test execution. The suite is capable of destructive database reset/setup; it must only target the explicitly disposable isolation database.
- `tests/features/admin/infrastructure/persistence/postgres/fail-closed.test.ts:51` exercises `connectClient()`; unit tests under `tests/unit/core/tenant-context/` mock `connectSystemClient()` and pool methods. These are tests of the wrapper rather than additional production pool constructors.
- `verification/phase-0/probe-system-context.ts:59-61` invokes `runWithSystemContext(..., "test-req", ...)` and reads `getDbClient()`. This probe is verification-only and its historical transcript must not be treated as current runtime evidence without a rerun against the stated commit in a disposable environment.

### Additional tenant-client consumer confirmed

- `src/features/billing/services/subscription-service.ts:15,69,105,151` calls `getRequiredTenantId()`, obtains `getDbClient()`, rejects a missing client, and passes the context client directly to Drizzle for subscription, quota, and credit operations. The service itself does not establish the tenant context; its actual caller/reachability path still needs to be traced before treating the context precondition as guaranteed.

### Correction / clarification to the inventory

The earlier public-accessor row correctly found no production callsite for `PostgresClient.getPool()` in the scanned application/script source, but the test-only uses are not limited to `tests/unit/core/tenant-context/system-mode-bypass.test.ts:53`. The additional test consumers above are now explicitly recorded. No production callsite of `getPool()` was found in the GitHub source scan; this remains a source-level observation, not proof against dynamic or external consumers.

### AUTH-03 historical artifact status

The current `main` source at `src/core/database/tenant-context/index.ts:185-200` leases a client with `connectSystemClient(purpose)` and stores it in `dbClient`; `getDbClient()` returns that stored client at lines 348-355. Therefore the claim in `verification/phase-0/auth03-probe.md` that all system-context calls necessarily receive `null` is inconsistent with this baseline. The report is stale for current-main claims; this source inspection does not establish when or why it became stale, and no runtime probe was executed in this pass.

### Second-pass limits

The additional reads were source inspection only. No local checkout, shell-wide grep, runtime probe, typecheck, lint, test suite, PostgreSQL connection, or production/shared database access was performed. The deployment identities, actual grants, RLS enforcement, worker function grants, and runtime reachability remain unverified. Phase 0's GitHub source inventory is substantially closed, but the security acceptance gate remains open until the local/Jules search and Phase 1 enforcement design/tests are completed.
