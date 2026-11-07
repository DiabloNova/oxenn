# Scripts Folder Audit

- **Repository:** `DiabloNova/oxenn`
- **Branch:** `docs/product-roadmap-baseline-2026-11`
- **Audited tree commit:** `35509dd2f2da808232eeab04017d80f39a8f19b0`
- **Audit date:** 2026-11-07
- **Scope:** Complete recursive contents of `scripts/` only
- **Method:** Full Git tree inventory and static source review of every tracked file. No script was executed; no database, application, deployment, CI, or production operation was run.

## 1. Inventory

The complete recursive tree was not truncated. The folder contains **20 files** (106,124 source characters) across five subdirectories, plus nine files directly under `scripts/`.

| Area | Files |
|---|---:|
| `scripts/` root | 9 |
| `scripts/api/` | 2 |
| `scripts/auth/` | 1 |
| `scripts/database/` | 5 |
| `scripts/dev-tools/` | 2 |
| `scripts/docs/` | 1 |
| **Total** | **20** |

Files reviewed:

- Root: `audit-gate.mjs`, `audit-gate.test.mjs`, `crawl-worker.ts`, `db-seed.ts`, `docs-index-generator.ts`, `docs-snippet.ts`, `env-check.ts`, `generate-docs-data.ts`, `test-domain.ts`.
- API: `api/issue-key.ts`, `api/revoke-key.ts`.
- Auth: `auth/grant-super-admin.ts`.
- Database: `database/build-reference-matrix.ts`, `database/db-push-guard.ts`, `database/reference-matrix-consumers.ts`, `database/verify-rls-migrations.ts`, `database/verify-tenant-tables.ts`.
- Developer tools: `dev-tools/get_routes.sh`, `dev-tools/get_signatures.sh`.
- Docs: `docs/verify-phase-0-baseline.mjs`.

`scripts/db-seed.ts` is a tracked zero-byte file. This is recorded as an inventory fact; whether it is an accidental stub or intentionally reserved depends on its callers and package scripts, which were not re-audited in this phase.

## 2. Findings

### SCR-001 — Tenant-table generation and reference-matrix classification equate “has an RLS policy” with “is tenant-owned”
- **Severity:** P1 — security-boundary correctness
- **Confidence:** Confirmed in the scripts; runtime impact requires source-level follow-up.
- **Files / evidence:**
  - `scripts/database/verify-tenant-tables.ts:48-57` derives its complete table set exclusively from snapshot tables with one or more policies.
  - `scripts/database/verify-tenant-tables.ts:60-73` generates `TENANT_SCOPED_TABLES` from that set.
  - `scripts/database/build-reference-matrix.ts:124-128` (within the table-generation loop) labels a table Tenant-Scoped only when it appears in that generated list; every other table is labeled Global.
- **Root cause:** The scripts use the presence of an RLS policy as the definition of tenant ownership. Those are different properties: a table can contain `organization_id` and be tenant-owned while still missing its required RLS policy.
- **Impact:** The five organization-owned junction tables already identified in DB-001 / DOC-001 can be omitted from the generated runtime tenant table list and represented as Global in the generated reference matrix. The verification script can therefore report a clean match between the generated list and the snapshot while failing to detect the underlying missing-policy security gap. This is a false assurance, not merely a documentation-label issue.
- **Recommended direction:** Maintain independent authoritative sets for tenant ownership and RLS policy coverage. Verify that every tenant-owned table has the required policy and runtime enforcement; never infer Global solely from absence in the policy-derived set.
- **Dependencies:** DB-001, DOC-001; later inspection of `src/core/database/tenant-context`, generated table-list consumers, and query/repository enforcement is required to quantify runtime exposure. Do not run either generator's write mode during this audit.

### SCR-002 — The db:push guard does not prove that a target is disposable
- **Severity:** P2 — destructive-operation safety
- **Confidence:** Confirmed in the guard's checks.
- **File / evidence:** `scripts/database/db-push-guard.ts:28-52` checks environment markers; `:63-84` blocks a fixed list of URL substrings; `:86-99` accepts two environment booleans; `:102-126` checks only the count of rows in `information_schema.tables`.
- **Root cause:** Production detection is a blacklist of known hostname fragments rather than a positive allowlist of approved disposable database targets. `ALLOW_DB_PUSH=true` and `DISPOSABLE_DB=true` are operator-supplied assertions, not independent evidence of disposability. The catalog check does not inventory every schema object that could conflict with schema push (for example, sequences, standalone types, or materialized views).
- **Impact:** An empty production database on an unlisted/custom hostname can pass if the environment markers and two booleans are set. A database containing non-table schema objects may also be treated as empty. The guard's success message therefore overstates what it has established.
- **Recommended direction:** Prefer an explicit approved-host/database identity policy and a comprehensive catalog check for all relevant user objects; retain independent environment and operator gates. Fail closed when target identity cannot be verified.
- **Dependencies:** Review the actual `db:push` command wiring and deployment environment policy in a later approved phase. This finding does not assert that the command has been run against production.

### SCR-003 — Super-admin CLI does not consistently complete transaction and connection cleanup
- **Severity:** P2 — privileged-operation reliability
- **Confidence:** Confirmed cleanup gaps in the script; exact pool lifecycle depends on the imported database client.
- **File / evidence:** `scripts/auth/grant-super-admin.ts:26-52` opens a transaction, performs the role update and audit insert, and commits on success, but does not close the database pool. The no-membership branch calls `process.exit(1)` at `:38-42`; the catch blocks call `process.exit(1)` at `:53-61`.
- **Root cause:** The command has no encompassing `finally` cleanup and uses immediate process termination in failure paths. An exception after `BEGIN` has no explicit rollback path in this script.
- **Impact:** The CLI can leave pool resources open after a successful run, and failures bypass orderly context/pool cleanup. PostgreSQL will normally roll back an uncommitted transaction when its connection closes, but relying on abrupt process termination is not an explicit or observable rollback strategy.
- **Recommended direction:** Use a transaction API with guaranteed rollback and release, close pools in `finally`, and set an exit code after cleanup instead of calling `process.exit` inside the transaction.
- **Dependencies:** Confirm whether `runWithSystemContext` owns transaction boundaries and whether `getDbClient()` returns a dedicated or pooled connection during the later database-context audit.

### SCR-004 — Worker catch suppresses diagnostics, while the orchestrator persists ordinary execution failures
- **Severity:** P3 — worker observability
- **Confidence:** Confirmed after cross-checking the src/ execution path.
- **Files / evidence:** scripts/crawl-worker.ts:102-139, especially the empty catch at :116-136; src/features/acquisition/application/orchestrator.ts:230-276 catches ordinary execution failures, marks the job failed through the dispatcher (unless cancellation/abort semantics apply), publishes crawl.failed, then rethrows.
- **Root cause:** The worker catch keeps its polling loop alive but does not write a worker-side diagnostic or structured log for the rethrown error.
- **Impact:** The prior version of this finding incorrectly stated that ordinary orchestrator failures were not marked failed and that recovery depended on lease expiry. The source cross-check shows that the normal failure path is persisted and published by the orchestrator. The remaining gap is worker-side diagnostic context for failures that reach this catch; exceptions before the orchestrator's internal try or failures while persisting/publishing failure state still warrant verification.
- **Recommended direction:** Emit a sanitized structured worker log/metric while preserving the orchestrator as the single owner of job-state transitions. Do not add a duplicate failure transition in the worker.
- **Dependencies:** Dispatcher SQL function availability is tracked separately in DB-004 / SRC-015. No worker was started.

### SCR-005 — test-domain.ts launches asynchronous checks concurrently without awaiting the test sequence
- **Severity:** P2 — test reliability
- **Confidence:** Confirmed.
- **File / evidence:** `scripts/test-domain.ts:18-38` invokes asynchronous callbacks and attaches detached `.then/.catch` handlers without returning/awaiting the promise; the async repository and observation checks are launched at `:164-186` and `:211-285`.
- **Root cause:** The custom `runTest` helper is synchronous from its caller's perspective. Top-level calls therefore proceed while earlier async checks are still running.
- **Impact:** Checks that use shared domain services/state can overlap and become order-dependent; the script has no single awaited completion boundary or structured test summary. A passing log from one check does not establish that all checks have completed.
- **Recommended direction:** Replace the ad-hoc runner with the repository's test runner or an explicitly awaited sequential/parallel test harness with isolated fixtures and teardown.
- **Dependencies:** Check whether this script is still invoked by package scripts or CI before deciding whether to retire or modernize it.

### SCR-006 — Developer shell helpers are brittle, and the root reconstruction wrapper still cannot resolve them by its referenced paths
- **Severity:** P3 — developer-tool correctness
- **Confidence:** Confirmed for path mismatch and shell implementation.
- **Files / evidence:**
  - `scripts/dev-tools/get_routes.sh:6-19` iterates over unquoted command substitution (`for file in $(find ...)`) and infers UI states from literal keyword matches in page files only.
  - `scripts/dev-tools/get_signatures.sh:5` hardcodes `src/app/actions/auth.ts`.
  - Both helper files exist under `scripts/dev-tools/`, not at the repository root.
- **Root cause:** The route helper relies on whitespace-splitting shell expansion and shallow text heuristics; the signatures helper assumes a fixed source path. The previously audited root `update_recon.sh` invokes `./get_routes.sh` and `./get_signatures.sh`, so the presence of these nested helpers does not satisfy those root-relative paths.
- **Impact:** Reconstruction output can omit or misclassify routes/states, and the root wrapper still fails to find the nested scripts unless it changes directory or references their actual paths. This refines RF-001: the helper scripts are present, but not where the wrapper expects them.
- **Recommended direction:** Use quoted, null-delimited file iteration; inspect route/component structure rather than grep-only heuristics; resolve helper paths relative to the wrapper's own directory and validate the signatures source path.
- **Dependencies:** RF-001. The helper scripts were not executed.

### SCR-007 — Environment-file parsing in env-check is not dotenv-compatible
- **Severity:** P3 — configuration validation consistency
- **Confidence:** Confirmed parser limitation.
- **File / evidence:** `scripts/env-check.ts:66-79` splits each line at the first equals sign and stores the remainder verbatim; it does not parse quoted values, escapes, `export` prefixes, or multiline values.
- **Root cause:** A custom partial parser is used to populate `process.env` before validation.
- **Impact:** Valid dotenv values can be interpreted differently by this checker than by the application's actual environment loader, causing false validation failures or validating a value with surrounding quotes that the runtime loader would normalize.
- **Recommended direction:** Reuse the same dotenv parsing semantics as the application/runtime, or clearly constrain and validate the accepted .env syntax.
- **Dependencies:** Confirm actual environment-loading order and whether this helper is used in CI/build workflows.

## 3. Cross-checks for later phases

1. **Tenant boundary:** Trace the five tenant-owned junction tables from DB-001 through the generated runtime list, tenant-context manager, Drizzle schema, repositories, and raw SQL consumers. The current scripts do not establish that these tables are safe.
2. **Database push:** Inspect package-script wiring and the actual schema-push behavior before proposing a replacement guard. Do not run `db:push`.
3. **Privileged CLI commands:** Verify transaction ownership, pool lifecycle, actor attribution, and audit-record requirements for API-key issue/revoke and super-admin grant scripts.
4. **Crawl worker:** Cross-checked against src/features/acquisition/application/orchestrator.ts; ordinary failures are persisted by the orchestrator. SCR-004 is downgraded to a worker-log/observability gap. Dispatcher function availability remains DB-004 / SRC-015.
5. **Test-domain:** Determine whether it remains an invoked test entry point; if so, assess its fixtures, shared state, and teardown.
6. **Documentation tooling:** Verify generated docs index output and source visibility policy in the later application-source phase. The generator itself was reviewed statically; generated files were not changed.
7. **ESM compatibility:** The `db-push-guard.ts` and `verify-tenant-tables.ts` CLI wrappers use `require.main === module`. Confirm the repository's actual TS execution/module mode before treating this as a runtime defect.

## 4. Cross-phase correction

The source audit confirmed that CrawlOrchestrator.execute persists ordinary execution failures and publishes crawl.failed before rethrowing. SCR-004 is therefore limited to missing worker-side diagnostics; the earlier claim that ordinary failures were not persisted is withdrawn. See src-folder-audit.md / SRC-015 for the separate dispatcher-function dependency.

## 5. Not executed / limitations

- No script, shell helper, test, build, lint, migration, SQL query, database connection, worker, or deployment command was executed.
- No file under `scripts/` was changed.
- No application source, package configuration, database schema, docs source, CI workflow, or production environment was re-audited in this phase.
- Findings that depend on imported `src/` behavior or package-script wiring are explicitly marked for later verification.
- The audit is static and scoped to the complete `scripts/` tree at the recorded commit.
