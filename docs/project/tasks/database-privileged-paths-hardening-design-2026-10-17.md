# Phase 1 Design Record — Privileged Database Paths

**Date:** 2026-10-17  
**Status:** DESIGN FINDINGS — implementation and runtime verification pending  
**Branch:** `audit/product-aware-s0-baseline`  
**Scope:** Close privileged database-path contradictions, reconcile table scopes, and define the operator-only `super_admin` path.

## Security invariants

1. A system-context purpose is not authorization by itself. Every query executed under that purpose must remain within the purpose's declared authority.
2. A caller cannot widen authority by supplying a different purpose string, using a direct client API, nesting a context, reusing a client after context exit, or exploiting a parsing ambiguity.
3. PostgreSQL's runtime role must not own tenant tables or have `BYPASSRLS`; tenant RLS must remain active and effective for normal and privileged application connections.
4. Test-only wildcard paths must be unreachable from production execution.
5. The operator-only `super_admin` grant path must be explicit, auditable, least-privileged, and unavailable to normal application callers.
6. Registry, runtime enforcement, schema names, caller SQL, tests, and documentation must agree.

## Current source evidence

### A. Registry table names are stale

`src/core/database/privileged-paths.ts` and `docs/security/privileged-paths.md` still list legacy tables such as `tenants`, `tenant_users`, and `tenant_invitations`. Current source uses `organizations`, `organization_members`, and `organization_invitations`.

### B. The declared table scope is not enforced at the query boundary

`PostgresClient.connectSystemClient(purpose)` receives a purpose but its `query` wrapper only checks whether a tenant-scoped query is being used outside system mode. It does not validate all relations against `PRIVILEGED_PATHS_REGISTRY[purpose].allowedTables`. Therefore the registry is currently descriptive, not a real per-purpose allowlist.

A regex-only check is not an acceptable final security boundary for arbitrary PostgreSQL SQL. It can miss CTEs, quoted/schema-qualified identifiers, nested subqueries, multi-statements, data-modifying CTEs, and other syntax. A parser-based check could be considered only if it fully supports the accepted SQL dialect and rejects unsupported/ambiguous statements; it must not be described as equivalent to database privilege enforcement without adversarial evidence.

### C. Current purpose scopes do not reflect their callers

Static inspection of callers shows the registry must be corrected from actual query usage, not merely renamed:

| Purpose | Observed current tables (minimum set; complete call-site trace still required) |
| --- | --- |
| `sys-login` | `auth_rate_limits`, `users`, `user_credentials`, `sessions`, `organizations`, `organization_members`, `email_verification_tokens`, `password_reset_tokens` |
| `sys-register` | `auth_rate_limits`, `users`, `user_credentials`, `organizations`, `organization_members` |
| `sys-auth-check` | `sessions`, `users`, `organizations`, `organization_members` |
| `sys-auth-role-check` | `organization_members`, `organizations` |
| `sys-auth-api-check` | `organization_members`, `organizations` |
| `sys-create-workspace` | `organizations`, `organization_members` |
| `sys-list-workspaces` | `organization_members`, `organizations` |
| `sys-accept-invitation` | `organization_invitations`, `organization_members` |
| `sys-switch-workspace` | `organization_members`, `sessions` |
| `sys-api-key-auth` | `api_keys` (confirm full repository implementation) |
| `api-key-issue` | `api_keys` |
| `api-key-revoke` | `api_keys` |
| `sys-admin-run` | wildcard `*`, declared for tests but also referenced by `scripts/auth/grant-super-admin.ts` |
| `test-req` | wildcard `*`, verification-only |

The `sys-login` purpose is currently reused for several authentication workflows, so its scope should be based on the combined complete usage or split into narrower purposes when that materially reduces privilege without breaking atomicity. Do not split solely for cosmetic naming.

### D. Operator CLI conflicts with the test-only guard

`scripts/auth/grant-super-admin.ts` invokes `runWithSystemContext(null, "sys-admin-run", ...)`. `runWithSystemContext` rejects `sys-admin-run` unless `NODE_ENV === "test"` or `VERIFICATION_PROBE_ACTIVE === "1"`. This appears to block the intended operator CLI in ordinary production operation. Do not fix it by making `sys-admin-run` generally available in production.

The operator operation directly changes `organization_members`. Separately, the current `runWithSystemContext` manager attempts a central `audit_records` write for outer and recorded nested contexts; this is an implicit manager-level side effect, not an ordinary caller query grant. The implementation must define how that audit write is authorized and made durable without broadening the caller's table scope. The CLI must use an explicit operator-only execution path and a dedicated least-privilege authority, rather than inheriting a test wildcard.

### E. Connection role assumptions are unsafe or unknown

`PostgresClient` uses `DATABASE_URL` for its normal pool and `AUTHENTICATOR_DATABASE_URL || DATABASE_URL` for its privileged pool. `.env.example` uses the PostgreSQL `postgres` role for both URLs. This is a development example, not proof of deployment credentials; the actual deployment role is **NOT VERIFIED**. A PostgreSQL superuser or role with `BYPASSRLS` can defeat RLS regardless of application-level purpose checks. Runtime role assumptions must be verified in a disposable PostgreSQL environment before the security claim can be accepted.

## Design direction

The preferred end state is **database-enforced least privilege plus application purpose validation**, not an application-only naming convention.

Before implementation, inspect and decide among these designs with evidence:

1. **Purpose-specific PostgreSQL roles** with exact table/operation grants, transaction-local role selection, and a narrowly privileged login that can assume only the intended roles; or
2. **A parser-backed query boundary** that rejects unsupported SQL and checks every referenced relation, paired with a runtime role that is not a superuser/owner/`BYPASSRLS`, and with clear treatment of implicit audit writes.

Prefer option 1 if the existing deployment and migration architecture can support it safely. Role design must account for existing caller workflows, role membership, table grants, future migrations, audit logging, and operator CLI execution. Do not assume a role exists or is configured in production. If a purpose-specific role plan would require broad, unapproved deployment changes, stop and document the required deployment contract instead of quietly weakening enforcement.

No final choice is made by this document alone. The implementation design must explicitly address:
- who can assume each purpose role and how that is enforced;
- allowed tables **and operations**, not just table names;
- audit-record writes as an internal capability that does not silently broaden application caller scope;
- transaction-local role/context setup and cleanup;
- nested contexts and prevention of privilege inheritance/escalation;
- direct access to pools/clients that bypasses `runWithSystemContext`;
- existing tables and future tables/migrations;
- RLS behavior with `FORCE ROW LEVEL SECURITY`;
- operator CLI authentication/credentials and audit semantics;
- fail-closed behavior when role, table, purpose, or context is unknown.

## Required tests before marking this phase complete

### Positive paths
- Every registered purpose can execute only its documented valid operations against the intended tables.
- Login/register, workspace creation/listing/switching, invitation acceptance, API-key auth/issue/revoke, and operator grant work using representative disposable PostgreSQL fixtures.
- Audit records are written for success/failure according to the established policy without granting callers arbitrary audit-table access.

### Negative/adversarial paths
- Unknown purpose tag is rejected before a client is leased.
- A registered purpose querying a table outside its scope is rejected by the database or an independently validated boundary.
- CTEs, nested subqueries, quoted identifiers, schema-qualified tables, data-modifying CTEs, and multi-statement attempts cannot bypass scope enforcement.
- Test-only wildcard purposes are rejected in production mode, including direct and nested calls.
- Normal application callers cannot grant `super_admin`; only the designated operator execution path can.
- The operator path cannot change unrelated tables or grant roles outside its documented target.
- No-tenant and wrong-tenant operations fail closed under the actual `app_runtime` role; test fixtures verify that role is not table owner and does not have `BYPASSRLS`.
- Errors, rollback, connection release, nested contexts, and audit-write failure do not leak or retain elevated authority.

## Explicit verification limitations

- No local checkout or executable PostgreSQL instance is available through this workflow.
- No local unit/type/lint/build tests were run.
- No disposable PostgreSQL runtime/adversarial tests were run.
- No live production database or deployment credentials were inspected.
- No application source, schema, migration, dependency, or CI changes were made in this phase of the audit.


## Additional Phase 0 access paths requiring explicit design

### Crawl worker direct-pool exception

The full source scan found `scripts/crawl-worker.ts` constructing a standalone `pg.Pool` from `DATABASE_URL`. It passes this pool to `CrawlDispatcherRepository`, which executes three cross-tenant SECURITY DEFINER functions directly, without using `runWithSystemContext`:
- `public.claim_crawl_jobs(worker_id, limit, lease_ms)`
- `public.recover_expired_crawl_jobs()`
- `public.complete_crawl_job_if_lease_owner(...)`

The only definitions and `GRANT EXECUTE ... TO crawler` statements found are in archived `database/archive/migrations-legacy/0004_crawl_acquisition.sql`. No matching definitions/grants appear in active `database/drizzle/0000` through `0012` or `database/bootstrap.sql`; bootstrap does not create a `crawler` role. This is a **confirmed source/migration-history conflict**. A newly built database from the documented active chain has no source-defined provisioning path for this worker capability; actual execution failure was not tested.

Phase 1 must determine if these functions remain the intended design. If they do, the role/function/grant contract must be established through a reviewed, forward-only active Drizzle migration, with exact EXECUTE grants, restricted relation access, safe SECURITY DEFINER ownership and search path, lease/worker/version checks, and adversarial disposable-PostgreSQL tests. Do not copy or edit the archived migration blindly and do not add a second migration runner.

### Unresolved monitoring fallback

Three monitoring repositories use `drizzle(ctx?.dbClient || (global as any).pgClient)`. The producer of `global.pgClient` was not found in the inspected source/config paths. Until every possible bootstrap/injection is traced, this must be treated as **UNRESOLVED**, not as unreachable. The implementation must not silently fall back to a client whose transaction-local tenant setting and runtime role are unknown.

### Test-only raw access is not production proof

The full 94-file test-tree scan confirmed several test/integration entrypoints use raw pools and direct SQL. In particular, the acquisition and public API integration harnesses can create/delete fixture rows and must use a dedicated disposable database. These paths should be explicitly invoked and guarded; they do not authorize raw pool access in production code.
