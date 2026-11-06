# BL-010 — Legacy service test files are outside the configured Vitest projects and CI commands

## Metadata
- **Global order:** 10
- **Part:** 03 — Tooling, Tests and Build Diagnostics
- **Priority:** P2 — Verification coverage gap
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`

## Exact problem

The configured Vitest projects include only `tests/unit/**`, `tests/db/**` and `tests/ui/**`. The repository also contains service-level test files under `tests/services/**`, including the AI Visibility engine and Technical SEO analyzer suites. These files are not matched by any configured project. The current CI workflow runs `pnpm test:unit`, `pnpm test:ui` and `pnpm run test:isolation`; it does not execute a command that targets `tests/services/**`.

Some legacy service suites use direct runner functions and `require.main` rather than Vitest `describe/it` contracts. Their presence in the repository therefore does not prove that they execute as part of CI.

## Evidence

- `vitest.config.ts` defines include patterns only for `tests/unit/**/*.test.ts(x)`, `tests/db/**/*.test.ts` and `tests/ui/**/*.test.ts(x)`.
- The recursive repository tree contains test files under `tests/services/**`.
- `.github/workflows/ci.yml` runs `pnpm test:unit`, `pnpm test:ui` and `pnpm run test:isolation`, but no service-test command.
- `tests/services/audit-engine/ai-visibility.test.ts` exports a runner function and has a `require.main` entry point; it is outside the configured projects.
- `tests/services/audit-engine/technical-seo-analyzer.test.ts` likewise exports a direct runner and is outside the configured projects.

## Root cause

The test inventory evolved from a mixture of direct-runner suites and Vitest projects, but the current CI configuration only executes the three declared project roots and does not document which legacy suites remain authoritative.

## Target files

- `vitest.config.ts` — establish explicit discovery/runner strategy for service integration tests.
- `.github/workflows/ci.yml` — execute the selected service test suite or explicitly mark obsolete suites as non-authoritative.
- `package.json` — add a stable script if a separate service runner is retained.
- `tests/services/**` — convert or wire relevant suites, especially:
  - `tests/services/audit-engine/ai-visibility.test.ts`
  - `tests/services/audit-engine/technical-seo-analyzer.test.ts`
  - other service suites after classifying their dependencies and fixtures.
- Relevant test setup and database fixtures.

## Recommended remediation

1. Inventory every file under `tests/services/**` and classify it as an active test, a manual diagnostic, a stale test or a duplicate.
2. For active suites, prefer conversion to the repository's supported Vitest project structure where practical; otherwise provide explicit direct-runner scripts with deterministic exit codes.
3. Add the selected service test command to CI with the required isolated dependencies and test environment.
4. Remove or archive obsolete tests only after proving their assertions are superseded and documenting the reason.
5. Keep tests for live provider/network behavior deterministic through explicit provider adapters and local fixtures; do not require uncontrolled external network calls in ordinary CI.
6. Ensure service integration tests exercise real repository contracts and do not accidentally pass only because memory-backed fixtures satisfy reads.

## Dependencies and impacts

- Related to BL-004 and BL-007: the service test harness must test the final live persistence contract and use disposable infrastructure.
- Existing PostgreSQL isolation tests remain a distinct security suite.
- Test conversion may reveal behavior differences, so avoid treating the change as a mechanical file move.

## Parallelization assessment

**Conditionally safe.**
- Test inventory and classification can be performed in parallel by directory with one owner maintaining the master index.
- Conversion of disjoint service test files can proceed in parallel after shared fixture conventions are agreed.
- CI and Vitest configuration must be integrated by one owner.
- Files that test the same core repository/action should not be edited concurrently with BL-001 through BL-004.

## Acceptance criteria

- Every service test file has an explicit status and execution path.
- All tests designated active execute in CI.
- CI fails when an expected test suite is empty or skipped unexpectedly.
- Service tests use explicit provider modes and reliable persistence fixtures.
- Test results report which service suites executed, skipped or were intentionally excluded.

## Rollback and recovery

If an old suite depends on invalid assumptions or legacy APIs, keep it out of the release gate only with a documented disposition and replacement coverage. Do not silently drop its assertions.

## Verification record

- Test discovery configuration and workflow commands: **verified**.
- Local execution: **not run**.
- Implementation and post-fix verification: pending.
