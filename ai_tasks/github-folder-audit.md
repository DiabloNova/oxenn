# GitHub Workflows Audit — Phase 2

## Status

**PHASE 2 COMPLETE — awaiting user approval before inspecting the next root folder.**

This phase reviewed the complete tracked contents of `.github/`. No workflow was edited, dispatched, re-run, or otherwise modified.

## Audited baseline

- Repository: `DiabloNova/oxenn`
- Audit branch: `docs/product-roadmap-baseline-2026-11`
- Main code baseline: `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- Current CI run: [Run #616 — 2026-11-06](https://github.com/DiabloNova/oxenn/actions/runs/42181198077)
- Current CI commit: `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- Tracked contents: 2 directories (`.github/`, `.github/workflows/`) and 2 workflow files.
- Files inspected:
  - `.github/workflows/ci.yml` — 132 lines; blob SHA `89348bef19364afc4795e16501216a9fa7448175`.
  - `.github/workflows/capture-regression-baseline.yml` — 183 lines; blob SHA `6ac6e9cdd8922403233be988b835e07f11d2eb11`.

## Findings

### GHA-001 — GitHub Actions use Node 20-runtime action releases and now emit deprecation warnings

- **Priority:** P2 — CI reliability and platform compatibility
- **Status:** Confirmed
- **Evidence:**
  - `ci.yml:22,28` uses `actions/checkout@v4` and `actions/setup-node@v4` in the build job.
  - `ci.yml:74,80,113,119` repeats those versions in the Unit Tests and Isolation jobs.
  - `capture-regression-baseline.yml:30,36,136` uses `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4`.
  - Current main CI logs for run `42181198077` show: **“Node.js 20 is deprecated”** and that the v4 actions are being forced to run under Node.js 24. This warning appears in both Build and Test and Unit Tests job logs.
  - The previous baseline-capture run `39208665432` also emitted the warning for all three v4 actions, including `upload-artifact@v4`.
- **Impact:** The workflows rely on action releases whose declared runtime has reached the platform's deprecation/removal window. They currently complete because GitHub is forcing the old action runtime onto Node 24, but that compatibility path is already generating warnings and should not be treated as a stable long-term configuration.
- **Target files:** Both workflow files listed above.
- **Recommended remediation:** Move to supported Node-24-native action releases after reviewing their release notes and input compatibility. At the time of this audit, the official action repositories document `actions/checkout@v7`, `actions/setup-node@v7`, and `actions/upload-artifact@v7` usage. Validate all jobs after the upgrade; preserve the project's actual runtime setting (Node 22) unless a separate Node-runtime decision is made.
- **Parallelization:** The two workflow files can be updated in parallel only if a single owner coordinates the version matrix and verifies the final action versions consistently. Do not have independent changes overwrite the same workflow file.

### GHA-002 — Workflow action references are mutable version tags, with no workflow dependency lockfile

- **Priority:** P2 — supply-chain security hardening
- **Status:** Confirmed configuration risk; no compromise observed
- **Evidence:**
  - All external action references in the two files use major-version tags (`@v4`).
  - The complete `.github/` tree contains no action dependency lockfile.
  - The current effective token permissions observed in the main CI run were read-only, but that does not make action code immutable.
  - GitHub's secure-use guidance states that a full commit SHA is the immutable reference for an action; the newer workflow dependency lockfile mechanism records verified commits, including transitive action dependencies.
- **Impact:** A tag can be moved or deleted upstream. The code executed by a future workflow run is therefore not cryptographically fixed to the action code that was reviewed when the workflow was authored. This is a supply-chain exposure, not evidence that any referenced official GitHub action has been compromised.
- **Target files:** Both workflow files; a workflow dependency lockfile at the repository root if the project adopts that mechanism.
- **Recommended remediation:** Prefer GitHub's workflow dependency lockfile mechanism where supported, or pin each action to a verified full-length commit SHA with an update process. Verify that the SHA belongs to the official action repository and keep action updates reviewable.
- **Parallelization:** Do not combine lockfile generation with action version upgrades in separate uncoordinated changes. Resolve the intended action releases first, then lock the final references in one controlled change.

### GHA-003 — The main CI workflow does not declare an explicit least-privilege token permission set

- **Priority:** P3 — security configuration hardening
- **Status:** Confirmed omission; current effective permissions are read-only
- **Evidence:**
  - `ci.yml` has no workflow-level or job-level `permissions:` declaration.
  - In contrast, `capture-regression-baseline.yml:8-9` explicitly sets `permissions: contents: read`.
  - The current main CI run's runner log reported effective `GITHUB_TOKEN` permissions as `Contents: read`, `Metadata: read`, and `Packages: read`. No write permission was observed in that run.
- **Impact:** The main CI workflow relies on repository/organization defaults to keep its token read-only. A future change to those defaults could silently broaden the token available to code executed during pull-request CI.
- **Target files:** `.github/workflows/ci.yml`.
- **Recommended remediation:** Declare the minimum permissions required by the workflow explicitly. The workflow appears to need repository read access for checkout; confirm whether any package access is genuinely required before granting it. Keep the capture workflow's existing read-only declaration.
- **Parallelization:** Safe as an isolated workflow-hardening change, provided the final run confirms every job still has the permissions it needs.

### GHA-004 — The regression-baseline workflow is scoped to an old, heavily diverged branch

- **Priority:** P2 if the workflow is expected to capture current baselines; otherwise archival housekeeping
- **Status:** Observed; intended lifecycle requires a decision
- **Evidence:**
  - `capture-regression-baseline.yml:4-6` triggers only on pushes to `fix/audit-remediation`.
  - The workflow has no `workflow_dispatch`, `push: main`, or pull-request trigger.
  - The latest recorded run was on 2026-10-19 (`39208665432`, commit `33234c9372a82ebbb2ac46581fdc913ce4a04dbe`).
  - At audit time, `fix/audit-remediation` was **256 commits behind main and 0 commits ahead**.
- **Impact:** Normal pushes to `main` and other development branches do not refresh this baseline capture. If this workflow is intended to provide an active pre-remediation/regression baseline for current code, it is no longer connected to the current mainline. If it was intentionally a one-off historical capture, its present trigger may be correct.
- **Target files:** `.github/workflows/capture-regression-baseline.yml`; any future audit-governance documentation that defines the workflow's lifecycle.
- **Recommended remediation:** Decide and document whether the workflow is (a) an archival, one-time capture or (b) an active baseline mechanism. For (a), label it clearly as historical and preserve the artifact/commit provenance. For (b), define an explicit current trigger and baseline input so it cannot silently capture a stale branch.
- **Parallelization:** Not safe until the intended lifecycle and baseline source are decided.

### GHA-005 — Vitest emits a Vite config-loader compatibility warning in CI

- **Priority:** P3 — future toolchain compatibility
- **Status:** Confirmed runtime warning; root cause is outside this folder
- **Evidence:**
  - The Unit Tests job in run `42181198077` emitted: `Your Vite config uses features that are unsupported by configLoader: 'native'`, specifically ESM syntax in a file loaded as CommonJS at `vitest.config.ts:1:1`.
  - The same warning was emitted in the UI test run.
  - The message says native config loading is planned to become the default in a future major Vite version.
- **Impact:** The current tests pass, but the config relies on a loading mode that the toolchain is warning will become incompatible with a future default. Suppressing the warning would hide the signal without resolving the compatibility question.
- **Target files:** `vitest.config.ts` (already reviewed in the root-file phase); any necessary package/module metadata only after broader impact analysis.
- **Recommended remediation:** Inspect the current Vitest/Vite config-loader contract and choose a module-compatible configuration approach. Do not apply a blanket `type: module` change without reviewing the effect on all root scripts and configuration files.
- **Parallelization:** Not safe to modify the module mode concurrently with other root configuration or tooling changes.

### GHA-006 — Node dependency deprecation warnings appear in current CI logs without a traced package owner

- **Priority:** P3 — dependency/toolchain maintenance
- **Status:** Confirmed warning; originating dependency unresolved
- **Evidence:**
  - The current Build and Test job emitted Node warning `DEP0040` for deprecated `punycode`.
  - The current Unit Tests job emitted `DEP0040` for `punycode` and `DEP0169` for legacy `url.parse()` behavior.
  - The workflow logs do not identify the requiring package or call site.
- **Impact:** These warnings indicate that some code executed during CI still uses deprecated Node APIs. The `url.parse()` message specifically notes that its behavior is not standardized and may have security implications. No exploitable vulnerability is established from the warning alone.
- **Target files:** Not yet attributable. The likely investigation surface is the dependency graph and the code/configuration that loads the packages; this must be established in the later dependency/source phases.
- **Recommended remediation:** Trace the warning stack with an appropriately scoped diagnostic run or dependency analysis, identify the owning direct/transitive package, then select a compatible upgrade or replacement. Do not suppress the warnings or patch transitive files in `node_modules`.
- **Parallelization:** Not safe until each warning is attributed to its source package and the supported upgrade path is understood.

## Existing findings corroborated by the workflows

These observations support previously recorded baseline items and must not be counted as unrelated duplicate defects:

1. **BL-005 — Lint-warning debt:** the current main CI run reports **213 warnings and 0 errors**; the workflow allows up to 218 warnings at `ci.yml:46`. The job passes but the warning debt is not resolved.
2. **BL-006 — Dynamic filesystem build tracing:** the current main build reports two Turbopack warnings in `src/app/api/v1/docs/route.ts` at lines 46 and 50 because dynamic filesystem access causes the whole project to be traced. The build passes, but the warnings remain.
3. **BL-007 — Database Vitest project:** the CI workflow runs `test:unit`, `test:ui`, and the separate PostgreSQL isolation suite, but does not invoke `pnpm test:db`. Whether the current database Vitest project contains tests must be rechecked during the `tests/` folder review.
4. **BL-010 — Service tests not in CI:** the workflow does not directly run a separate service-test project. The precise test inventory and whether service tests are included in another command must be verified during the `tests/` folder review.

## Current main CI execution evidence

The current main run `42181198077` on commit `7bd2b6ba04e18abbcaf772fac63f29c465a45a42` completed successfully:

- Build and Test: success.
- Unit Tests: success — 59 files passed, 1 skipped; 335 tests passed, 1 todo.
- UI Tests: success — 4 files, 33 tests passed.
- Isolation Suite: success — 51 tenant tables, 488 assertions.
- Lint: 213 warnings, 0 errors; accepted by the 218-warning threshold.
- Build: successful, with the two documented Turbopack dynamic-filesystem warnings.
- Dependency audit gate: pass, but 5 moderate advisories were reported as non-blocking.

This is evidence for that exact main commit and run only. It is not proof that untested workflows, tests, deployment, or other branches are healthy.

## Historical regression-capture artifact — not current main status

The previous regression-capture run `39208665432` produced a retained artifact for commit `33234c9372a82ebbb2ac46581fdc913ce4a04dbe` on `fix/audit-remediation` (2026-10-19). Its raw report recorded 25 high and 3 critical npm audit findings, while all non-audit gates exited zero. That artifact describes the old branch/commit; it is **not** the current main dependency state. The current main CI's audit-gate result is the five-moderate-advisory result above. The historical artifact is retained as audit provenance, not used as a current defect claim.

## External references used for current GitHub Actions guidance

- GitHub's [Node 20 Actions runtime deprecation notice](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/).
- Official [actions/checkout](https://github.com/actions/checkout) release documentation (currently documents v7 and its Node 24 runtime transition).
- Official [actions/setup-node](https://github.com/actions/setup-node) release documentation (currently documents v7 and its Node 24 runtime transition).
- Official [actions/upload-artifact](https://github.com/actions/upload-artifact) usage documentation (currently documents v7).
- GitHub's [secure use guidance](https://docs.github.com/en/actions/reference/security/secure-use) and [workflow dependency lockfile guidance](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles).

## Scope and state changes

- Read-only inspection of the two tracked workflow files and relevant GitHub Actions run/job logs/artifact metadata.
- Added this report under `ai_tasks/`.
- No workflow was edited or triggered.
- No application source, database schema, migration, deployment, issue, or PR was changed.
- No folder other than `.github/` was opened for source inspection in this phase.

## Approval gate

**The `.github/` folder phase is complete. The next root folder has not been started.**

Awaiting user approval before proceeding to `database/`.
