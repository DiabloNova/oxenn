# Stage 3 — Audit Gate Regression Tests and Verification

**Status:** SUCCESS (Stage 3 verification passed)  
**Date:** 2026-10-19  
**PR:** [#86](https://github.com/DiabloNova/oxenn/pull/86)  
**Branch:** `fix/audit-remediation-p1-v1.1`  
**Verified implementation commit:** `0e439e087922245f29476acc946374c6fe6aef0a`

## Invariant

The dependency audit gate must never interpret missing, empty, malformed, or ambiguous severity/patch metadata as safe evidence. Critical/high findings may be risk-accepted only when there is reliable evidence of no upstream fix and all exact allowlist, expiry, and production-path constraints are satisfied. Informational findings are non-blocking warnings.

## Implementation

Updated `scripts/audit-gate.test.mjs` with focused regression coverage for:

- Unknown and malformed severities failing closed; `info` remaining non-blocking.
- npm-bulk patch evidence: only the recognized `<0.0.0` marker establishes unpatched status; missing, empty, and malformed values remain unknown.
- Exact package and GHSA matching, expiry boundaries, missing paths, and production-path rejection.
- npm v7 `fixAvailable` values: `false`, missing, null, and malformed values fail closed as unknown; `true` and object-valued fixes indicate a fix and fail.
- Missing-path fallback limits, including production dependency exposure and expired or mismatched allowlist entries.
- Production dependency tree collection, optional dependencies, npm aliases, and malformed tree input.

No dependency versions, lockfiles, CI workflows, database objects, or issues were changed in this stage.

## Verification

GitHub Actions CI run [39231106676](https://github.com/DiabloNova/oxenn/actions/runs/39231106676) completed with **success** for commit `0e439e087922245f29476acc946374c6fe6aef0a`.

Observed successful jobs and checks:

- Dependency audit gate
- Audit gate regression tests
- Typecheck
- Lint
- Tenant-table schema alignment check
- RLS migration coverage check
- Build
- Build reference matrix
- Generated tracked-file drift check
- Unit tests
- UI tests
- Isolation suite

## Negative-path verification

The regression tests explicitly exercise unknown/malformed severity and patch metadata, a reported fix, incorrect package/GHSA matches, expired acceptance, missing/production dependency paths, and fallback attempts when the package is present in the production dependency tree. The workflow's audit gate regression test step passed.

## Limitations

- Verification is based on the GitHub Actions run above; no separate local checkout or local test invocation was available in this session.
- This report does not claim that the PR has been merged. PR #86 remains open unless its state changes independently.
- The conductor URL referenced by `AGENTS.md` was inaccessible earlier due to a DNS failure; it was not represented as read or followed.

## Stage 5 — Final Diff Review Corrections

The Stage 5 diff review confirmed two test-maintenance findings:

- Restored the HTTP crawl test's per-host request-start interval assertion from 75 ms to its original 90 ms. The production crawl policy was not changed, so weakening the assertion was not justified by the remediation scope.
- Restored regression coverage for the audit-gate missing-path fallback when an audit path is falsely marked production but the independently verified production dependency tree does not contain the package. This protects the existing production-tree override behavior without weakening fail-closed checks for actual production exposure.

The corrections are limited to regression tests. No dependency manifest, lockfile, CI workflow, database artifact, baseline, issue, or main-branch change was made. The final Stage 5 commit's GitHub Actions result is the verification authority; the final response records its exact commit and run.
