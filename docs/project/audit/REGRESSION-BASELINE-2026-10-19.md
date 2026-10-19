# Regression Baseline — 2026-10-19

This is the pre-remediation regression yardstick for branch `fix/audit-remediation`.
Do not overwrite these initial values when later runs improve or regress; append a dated comparison instead.

## Source and capture details

- Repository: [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)
- Baseline source `main` commit after PR #82: [`feced8d2b451527cfe0e06cf62d9b6bff0af7757`](https://github.com/DiabloNova/oxenn/commit/feced8d2b451527cfe0e06cf62d9b6bff0af7757)
- Branch commit used for the captured commands: [`2393e0e318e02bf9af4333f3bcf10df4df8f99bf`](https://github.com/DiabloNova/oxenn/commit/2393e0e318e02bf9af4333f3bcf10df4df8f99bf)
- Capture workflow: [Regression Baseline Capture — run #2](https://github.com/DiabloNova/oxenn/actions/runs/39199514382)
- Raw evidence artifact: `regression-baseline-2393e0e318e02bf9af4333f3bcf10df4df8f99bf` (audit JSON, stderr, full lint and test logs, exit codes, and generated summary). The artifact is retained by GitHub until 2027-01-17; the run link above exposes it.
- Environment recorded by the runner: Ubuntu GitHub Actions runner, Node.js `v22.23.3`, pnpm `10.30.3`; dependencies installed with `pnpm install --frozen-lockfile`.

## Command results

| Command | Exit code | Baseline result |
|---|---:|---|
| `pnpm audit --json` | 1 | 54 advisories: 3 critical, 25 high, 19 moderate, 7 low; 949 dependencies reported |
| `pnpm lint` | 0 | 218 warnings, 0 errors |
| `pnpm test:unit` | 0 | 41 test files passed, 1 skipped (42 total); 164 tests passed, 1 todo (165 total) |
| `pnpm test:ui` | 0 | 1 test file passed; 3 tests passed |
| `pnpm run test:isolation` | 0 | All isolation suites passed; RLS and tenant-context verification covered 51 tenant tables with 488 assertions |

The nonzero audit exit is the recorded baseline, not a CI/test failure: preserve the JSON and compare vulnerability totals and advisory details during remediation. Do not treat the aggregate count alone as sufficient; compare severities and affected packages as well.

## Existing output that needs careful interpretation

- The unit-test log includes a `DatabaseUnavailableError` message for the disposable `isolation_test_db` while the test command still exits 0. Preserve this as baseline output and investigate if relevant; do not silently remove or reclassify the message.
- The isolation run emits PostgreSQL RLS and foreign-key rejection messages while completing all suites successfully. Review these alongside the suite assertions before deciding whether a future change is a regression.
- The isolation workflow used an ephemeral PostgreSQL service for tests only. It did not use or require a production/main database connection.

## Regression comparison rules

1. Compare future runs against the exact counts and artifact above; keep this initial baseline immutable.
2. Record changed lint warning/error counts, audit severity/advisory deltas, and per-suite test/file/assertion counts.
3. Any new test failures, reduced isolation coverage, increased warning counts, or increased critical/high advisories must be called out explicitly rather than hidden by an overall green result.
4. Keep command exit codes and the complete raw logs with every future comparison.


## Stabilization review — PR #84

This record is maintained under `docs/project/audit/` as internal engineering evidence and is intentionally excluded from the public documentation index.

### Capture-harness issues found and corrected

The original capture workflow set DATABASE_URL and MIGRATION_DATABASE_URL at the whole-step level. Those values therefore leaked into the unit and UI commands, even though the referenced isolation_test_db had not been initialized yet. The initial unit log included DatabaseUnavailableError while the process exit code stayed zero. That output was a harness defect and must not be treated as proof that database-dependent paths passed. The original results above are preserved as a historical record, not silently rewritten.

The corrected capture workflow scopes the database URLs to the isolation command only, matching the main CI test job. It now records typecheck, lint, tenant-table verification, RLS migration verification, unit tests, UI tests, the isolation suite, production build, reference-matrix generation, Drizzle migration-chain validation, and generated-file drift. It also records the actual commit in SUMMARY.md without shell command substitution.

The pre-remediation dependency audit remains visible as baseline evidence. A non-zero audit result is expected at this stage and is intentionally excluded from the functional-gate loop; it is not described as a clean security audit. Phase 1 must use the separate, authorized policy in PHASE1-DECISIONS.md.

### Evidence retention

The command summary and baseline interpretation are committed in this repository. GitHub Actions retains the raw command logs and audit JSON for 90 days; any need for longer-term raw-log retention must be handled by a separate durable archive before artifact expiry.

### Corrected verification run

The corrected full-gate run completed successfully: [Regression Baseline Capture — run 39207559290](https://github.com/DiabloNova/oxenn/actions/runs/39207559290). The raw evidence artifact is `regression-baseline-f8072cdba0e39f568063274aab3aefdc8d385fee` (artifact ID `12165404715`, SHA-256 `5e9b2dcbeac8f75dff758a00a16b6060784ba73dfce79d1683ea0652806b339e`, created 2026-10-19 and retained by GitHub until 2027-01-17). The captured run reports exit code 0 for typecheck, lint, tenant-table verification, RLS migration verification, unit tests, UI tests, the isolation suite, build, reference-matrix generation, Drizzle migration-chain check, and generated-file drift. The unit log has no `DatabaseUnavailableError` or database connection failures; the isolation suite passed all 51 tenant tables and 488 assertions.

The expected baseline audit exit code remains 1 by design: it records the pre-remediation state (54 advisories: 3 critical, 25 high, 19 moderate, 7 low). This is evidence of the starting security backlog, not a claim that the dependency audit is clean. The immutable summary and artifact digest are committed here; complete raw logs remain available in the linked artifact during the planned remediation window.
