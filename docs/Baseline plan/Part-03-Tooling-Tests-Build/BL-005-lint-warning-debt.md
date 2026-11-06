# BL-005 — Lint passes with 213 warnings under a narrowly bounded warning allowance

## Metadata
- **Global order:** 5
- **Part:** 03 — Tooling, Tests and Build Diagnostics
- **Priority:** P2 — Material engineering-quality debt
- **Status:** validated
- **Confidence:** high for the CI snapshot
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Depends on:** BL-001 through BL-004 only where the same source files are changed
- **Blocks:** a clean, reviewable engineering baseline

## Exact problem

The successful main-branch CI run reports **213 lint problems (0 errors, 213 warnings)**. The CI workflow invokes lint with `--max-warnings=218`, leaving only five warnings of margin. The warning set includes unused imports and variables, unused parameters, unused ESLint disable directives, and Next.js navigation warnings.

The current gate therefore permits a large warning backlog and is vulnerable to failing after only a small number of new warnings. The passing CI result is accurate, but it must not be described as warning-free.

## Evidence

- GitHub Actions run: `42181198077` for baseline commit `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`.
- Build and Test job: `127770987998`.
- Lint output: `✖ 213 problems (0 errors, 213 warnings)`.
- `.github/workflows/ci.yml` uses the `--max-warnings=218` threshold.
- The log includes rules such as `@typescript-eslint/no-unused-vars`, unused `eslint-disable` directives and `@next/next/no-location-assign-relative-destination`.

## Root cause

Warnings have accumulated across a broad collection of application pages, components, services, repositories and tests, while the CI threshold has been increased to tolerate the backlog instead of establishing a controlled, shrinking baseline.

## Target files

The CI log identifies affected files across these areas (the exact line/rule list must be regenerated from the same pinned commit during remediation):

- `src/app/[locale]/**`
- `src/app/actions/**`
- `src/app/api/v1/**`
- `src/components/**`
- `src/core/database/tenant-context/index.ts`
- `src/features/admin/infrastructure/persistence/postgres/index.ts`
- `src/features/ai-intelligence/repositories/index.ts`
- `src/features/ai-intelligence/services/**`
- `src/lib/audit-engine/**`
- `src/services/**`
- `tests/**`
- `verification/phase-0/run_rls_matrix.js`
- `.github/workflows/ci.yml` — warning threshold and future zero-warning policy.

The CI log specifically includes warnings in `src/app/actions/ai-visibility-audit.ts`, `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`, `src/services/ai/ai-visibility-provider.ts`, `src/features/ai-intelligence/repositories/index.ts`, `src/core/database/tenant-context/index.ts`, `src/features/admin/infrastructure/persistence/postgres/index.ts`, `src/app/api/v1/docs/route.ts`, and many UI/test files.

## Recommended remediation

1. Capture a machine-readable baseline from the exact current branch/commit using the repository's pinned ESLint config and Node/pnpm versions.
2. Classify every warning by rule, file, line, and severity. Do not assume every unused variable is safe to delete; some parameters may be part of public contracts or future lifecycle hooks.
3. Fix warnings through the smallest behavior-preserving change: remove genuinely dead imports/variables, implement or remove incomplete code, rename intentionally unused parameters only where the rule configuration permits, and remove obsolete disable comments.
4. Treat navigation warnings as behavior changes: replace internal `window.location.href` assignments with the appropriate Next navigation API only after confirming client/server execution semantics.
5. Do not introduce broad file-level disables, inline suppression, or a larger warning threshold to make CI green.
6. Reduce the threshold as warnings are removed, then set the release target to zero warnings for the audited rules.
7. Keep a short-lived exception list only for warnings with a documented reason and owner.

## Dependencies and impacts

- Do not edit files concurrently with BL-001 to BL-004 if they share a target path.
- Lint warning cleanup can expose unused or incomplete code paths; any behavior-affecting change needs tests.
- CI thresholds must be adjusted only after the baseline is reproducibly captured.

## Parallelization assessment

**Safe with file-level ownership; unsafe within a shared file.**
- Independent owners may fix separate UI/service/test files in parallel.
- The central repository, auth and provider files should be owned by the related functional finding to avoid overlapping edits.
- Run one final lint and review pass after integrating all branches; do not merge warning-cleanup changes blind to functional modifications.

## Acceptance criteria

- A fresh lint run on the final remediation commit reports zero warnings and zero errors, or every residual exception is individually justified, approved and tracked.
- The CI workflow no longer depends on a high warning allowance.
- No rule is disabled merely to suppress diagnostics.
- Behavior-sensitive fixes have appropriate tests and both Persian/English UI navigation are verified.

## Rollback and recovery

Revert an individual behavior-changing cleanup if regression tests fail; do not restore a global elevated warning threshold as a blanket workaround. Keep the warning inventory as a machine-readable artifact for comparison.

## Verification record

- CI evidence at baseline commit: **verified** (213 warnings, 0 errors).
- Local lint execution during this audit: **not run**.
- Implementation and post-fix verification: pending.
