# Phase 0 Addendum — Privileged-Path Caller and Runtime-Boundary Audit

- Audit date: 2026-10-17
- Repository: `DiabloNova/oxenn`
- Audited ref: `main`
- Audited commit: `feced8d2b451527cfe0e06cf62d9b6bff0af7757`
- Scope: read-only completion of Phase 0 for privileged database paths; no application, schema, migration, dependency, or CI code changed.
- Database status: **no real/main/production database is connected**. Findings below are from repository source and the existing disposable-PostgreSQL CI workflow only.

## Outcome

The bounded caller trace is sufficient to start Phase 1 with explicit acceptance criteria. A new broad repository-wide database audit is not needed before implementation. A few implementation choices must be resolved as part of the Phase 1 design, not guessed: the production database login role, whether purpose enforcement is provided by separate database roles or a trusted query boundary, the nested-context rule, and the failure policy for audit writes.

## 1. Registered-purpose caller map

The table lists the minimum source-observed relations per purpose before adding the central audit relation. The `runWithSystemContext` manager itself attempts to insert into `audit_records` for every successful or failed outer context and for recorded nested contexts. Therefore, **every purpose that retains this manager-level audit behavior also needs a deliberate audit-write path**. These are not yet approved runtime grants; confirm full query/call-site coverage in the implementation PR.

| Purpose | Observed relation scope | Caller / notes |
| --- | --- | --- |
| `sys-login` | `auth_rate_limits`, `users`, `user_credentials`, `sessions`, `organizations`, `organization_members`, `email_verification_tokens`, `password_reset_tokens` | `src/app/actions/auth.ts` and `src/services/auth/session.ts`; includes rate limiting, credential verification/reset, token flows and session lifecycle. |
| `sys-register` | `auth_rate_limits`, `users`, `user_credentials`, `organizations`, `organization_members` | `src/app/actions/auth.ts`; initial user/workspace/membership creation. |
| `sys-auth-check` | `sessions`, `users`, `organizations`, `organization_members` | `src/services/auth/authorization.ts`, `src/services/auth/session.ts`; session verification and membership/access checks. |
| `sys-auth-role-check` | `organizations`, `organization_members` | `src/services/auth/authorization.ts`; checks active and target-workspace role. |
| `sys-auth-api-check` | `organizations`, `organization_members` | `src/services/auth/authorization.ts`; membership check for API identity. |
| `sys-create-workspace` | `organizations`, `organization_members` | `src/app/actions/workspace.ts`; creates workspace and initial membership. |
| `sys-list-workspaces` | `organizations`, `organization_members` | `src/app/actions/workspace.ts`; returns the caller's memberships. |
| `sys-accept-invitation` | `organization_invitations`, `organization_members` | `src/app/actions/workspace.ts`; resolves and accepts a cross-workspace invitation. |
| `sys-switch-workspace` | `organization_members`, `sessions` | `src/app/actions/workspace.ts`; validates membership and replaces the session. |
| `sys-api-key-auth` | `api_keys` | `src/features/public-api/services/api-service.ts` delegates to `ApiKeyRepository.findByPrefix`; the registry's `tenants` entry is stale and was not observed in that repository lookup. |
| `api-key-issue` | `api_keys` | `scripts/api/issue-key.ts`; operator/CLI issuance path. |
| `api-key-revoke` | `api_keys` | `scripts/api/revoke-key.ts`; operator/CLI revocation path. |
| `sys-admin-run` | `organization_members` for the inspected CLI caller | Registry currently allows `*`; used by `scripts/auth/grant-super-admin.ts`, despite the registry describing the caller as tests. Must not remain a general production wildcard. |
| `test-req` | `*` by registry | Verification-only tag. Keep inaccessible to normal production callers and do not grant production-wide table access merely to preserve this tag. |

This is a source-derived minimum, not a final permission manifest. Phase 1 must include a call-site/query audit for Drizzle-generated statements, helper functions such as rate limiting, all direct query paths, and the manager's audit side effect. Do not infer database grants from this table alone.

## 2. Concrete contradictions and boundary gaps

1. **Purpose is not enforced at query execution.** `PostgresClient.connectSystemClient(purpose)` accepts the purpose but the inspected wrapper does not use it to restrict SQL relations. It only applies the tenant-context check. `allowedTables` currently functions as registry metadata, not a runtime table allowlist.
2. **Registry drift.** The registry and `docs/security/privileged-paths.md` refer to `tenants`, `tenant_users`, and `tenant_invitations`, while inspected current callers use `organizations`, `organization_members`, and `organization_invitations`. Other purpose scopes are also incomplete, e.g. `sys-login` needs sessions and credential/token/rate-limit relations; `sys-auth-check` uses sessions and organization membership, not just users.
3. **System SQL is broadly reachable inside any valid system context.** `PostgresClient.query` forwards unscoped SQL to the pool when there is no active context and forwards queries to the active context client in system mode. The system-client wrapper does not consult the registry scope. A correct fix must not rely on table-name regex checks as the security boundary for arbitrary PostgreSQL syntax.
4. **Raw pool access exists.** `PostgresClient.getPool()` exposes the underlying `pg.Pool`. The focused caller set inspected it in tests; before Phase 1 completion, verify with a repository-wide search that production modules do not use this raw escape hatch or otherwise acquire a client outside the wrappers.
5. **Nested contexts need an explicit privilege rule.** When a system context is already active, `runWithSystemContext` reuses the parent's client and changes the context's `purpose` without leasing a new client. Per-connection role switching alone would therefore not enforce a narrower nested purpose automatically. Phase 1 must either enforce an intersection/no-widening rule, reject unsafe purpose changes, or use another demonstrably safe design.
6. **Audit failure is currently fail-open.** The manager commits the work, attempts audit writes afterward, and catches/logs audit-write errors without failing the operation. The grant CLI also writes an explicit audit record inside its own transaction, but its actor fields are hard-coded as system values. Decide and test which operations require atomic/fail-closed audit behavior; do not silently promise guaranteed audit persistence.
7. **Operator grant path is contradictory.** `grant-super-admin.ts` invokes `sys-admin-run`, while `runWithSystemContext` blocks `sys-admin-run` and `test-req` unless `NODE_ENV=test` or `VERIFICATION_PROBE_ACTIVE=1`. The CLI's use of `process.exit(1)` inside the callback can terminate before normal asynchronous cleanup; replace with a thrown/returned error in the implementation design.
8. **Database role configuration is not end-to-end.** `database/bootstrap.sql` defines `app_owner NOLOGIN` and `app_runtime NOLOGIN`, with default DML grants to `app_runtime`. This does not define which LOGIN role `DATABASE_URL` / `AUTHENTICATOR_DATABASE_URL` use, nor does the application code inspected explicitly switch into `app_runtime`. If `AUTHENTICATOR_DATABASE_URL` is absent, the authenticator pool falls back to `DATABASE_URL`.
9. **Existing isolation test is useful but not proof of the app's effective login.** `tests/isolation/suite.ts` creates/recreates a dedicated `isolation_test_db`, checks ENABLE/FORCE RLS and policies, and uses `SET ROLE app_runtime` for portions of its assertions. This is not equivalent to running the application's actual pools with the intended non-owner, non-superuser, non-BYPASSRLS login. Phase 1 must add/adjust a disposable-PostgreSQL test that verifies the effective role attributes and exercises the real application connection path.
10. **No live database verification is possible today.** Any assertion about deployed credentials, effective grants, existing data, or migration effects on a real database remains unverified until a separate environment is provisioned and explicitly identified as disposable/test.

## 3. Required Phase 1 design decisions

- Prefer a PostgreSQL-enforced least-privilege boundary where feasible, combined with application purpose validation. First establish the intended LOGIN role and safe role-membership/SET ROLE model; the existing NOLOGIN group roles alone do not establish this.
- Do not grant broad privileges to the authenticator pool just to make auth flows work. Map every observed relation and operation, and separate operator/CLI capabilities from web request purposes.
- Remove the `*` wildcard from any production-available purpose. Test/verification contexts must be test-only at both application and database boundaries.
- Define nested-context semantics explicitly and test attempts to widen privilege through nesting.
- Decide audit semantics by operation: security-sensitive grants/revocations should not report success if their required audit record was not durably committed. Ensure audit persistence does not require bypassing the least-privilege design.
- Avoid regex-only SQL relation allowlisting. If purpose-specific DB roles cannot safely express the needed boundary, choose and justify a parser-based/structured-query boundary and retain DB grants/RLS as defense in depth.
- Add adversarial PostgreSQL tests for out-of-scope reads/writes, CTEs, nested queries, quoted/schema-qualified relations, data-modifying CTEs, multi-statement attempts, unknown purposes, production use of test tags, nested scope widening, incorrect tenant context, role owner/superuser/BYPASSRLS behavior, audit failures, rollback and client release.
- Verify no direct raw-pool/client path bypasses the chosen enforcement.

## 4. CI evidence and limitations

At audit time, GitHub reported successful checks for `main` commit `feced8d2b451527cfe0e06cf62d9b6bff0af7757`:
- Build and Test — success
- Isolation Suite — success
- Unit Tests — success

These passing checks are useful baseline evidence only. They do not resolve the source-level purpose-enforcement gap described above, and they do not establish the role used by a future production database connection.

## 5. Phase 0 disposition

**Status: COMPLETE for the bounded privileged-path investigation; implementation remains pending.**

The available source evidence is enough to proceed to Phase 1 without restarting the broad audit. The Phase 1 implementation must begin with the design decisions above, then change code and tests in a focused branch. Do not make application/schema/dependency changes as part of this Phase 0 addendum. Do not connect or point tests at a production/shared database.
