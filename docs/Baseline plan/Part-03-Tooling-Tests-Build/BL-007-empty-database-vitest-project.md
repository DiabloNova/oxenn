# BL-007 — Database Vitest project is empty and configured to pass without tests

## Metadata
- **Global order:** 7
- **Part:** 03 — Tooling, Tests and Build Diagnostics
- **Priority:** P2 — Verification coverage gap
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`

## Exact problem

The repository defines a Vitest project that discovers `tests/db/**/*.test.ts`, but the audited repository tree contains no files under `tests/db/`. The project sets `passWithNoTests: true` and carries a temporary comment indicating this should be switched off when the directory is seeded. The GitHub Actions workflow does not run `pnpm test:db`.

The repository does have a distinct PostgreSQL isolation job that runs `tests/isolation/suite.ts` and passes. Therefore the accurate finding is not “there are no database tests”; it is that the dedicated database Vitest project currently provides no tests and can silently pass empty, while it is not part of CI.

## Evidence

- `vitest.config.ts` defines the `db` project with include pattern `tests/db/**/*.test.ts` and `passWithNoTests: true`.
- Recursive tree for baseline commit contains **zero files** under `tests/db/`.
- `package.json` exposes `test:db` but `.github/workflows/ci.yml` does not invoke that script.
- CI run `42181198077` does run the separate PostgreSQL Isolation Suite successfully, and the Build and Test job runs schema/RLS/migration verifiers.

## Root cause

A future DB-test project was configured before the corresponding test inventory was created or wired into CI. Its empty success behavior can be mistaken for meaningful database verification.

## Target files

- `vitest.config.ts` — remove empty-pass behavior once a real suite exists.
- `tests/db/**` — add PostgreSQL repository/transaction/migration contract tests.
- `.github/workflows/ci.yml` — decide and wire the intended DB test job.
- `package.json` — retain or adjust `test:db` script only after workflow design.
- Test database setup helpers and fixtures under `tests/setup/**` and `tests/helpers/**`.

## Recommended remediation

1. Define the exact responsibilities of DB Vitest tests versus the existing isolation suite. Avoid duplicating the same assertions.
2. Add tests against a disposable PostgreSQL instance for repository read/write durability, transaction rollback, uniqueness/foreign keys, RLS role behavior, and migration bootstrap as appropriate.
3. Ensure each DB test creates and cleans up isolated tenant fixtures and does not rely on process-local Maps.
4. Add the DB project to CI after its runtime and resource needs are defined.
5. Set `passWithNoTests: false` and make empty discovery a hard failure.
6. Preserve the existing isolation suite; it tests a separate security boundary and is not replaced by ordinary repository tests.

## Dependencies and impacts

- BL-004 should establish the intended live repository adapter contract before writing repository-persistence tests.
- The PostgreSQL isolation job already provides useful coverage and should not be weakened.
- DB tests must use disposable databases only; no production database is involved.

## Parallelization assessment

**Conditionally safe.**
- Test scenario design can proceed in parallel with BL-004.
- Test implementations can be developed in isolated files after repository interfaces and fixture contracts are agreed.
- CI workflow changes and shared DB setup should have one integration owner.

## Acceptance criteria

- `tests/db/` contains real database contract tests.
- `pnpm test:db` fails when no tests are discovered.
- CI runs the intended DB test project against an ephemeral disposable PostgreSQL instance.
- Tests prove durable read-after-write behavior and rollback/failure semantics.
- Existing RLS isolation checks remain active and pass.

## Rollback and recovery

Keep the DB project disabled from production workflows until it has a stable disposable database service. Never redirect the test project to staging or Production to avoid setup work.

## Verification record

- Empty project and missing files at baseline: **verified**.
- Existing isolation job: **verified successful in CI**.
- Local DB tests: **not run**.
- Implementation and post-fix verification: pending.
