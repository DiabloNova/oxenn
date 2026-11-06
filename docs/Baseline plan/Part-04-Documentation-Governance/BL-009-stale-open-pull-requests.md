# BL-009 — Open Phase 1 pull requests are based on a pre-merge ancestor and have diverged from main

## Metadata
- **Global order:** 9
- **Part:** 04 — Documentation and Repository Governance
- **Priority:** P2 — Integration and change-management risk
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`

## Exact problem

At the audited baseline, PR #114 has been merged into `main`, but PR #108 and PR #109 remain open against an older base. GitHub's compare API reports both branches as diverged from current `main`, each with the same merge base `1517034c5820fb2215567ad3dff2bf04da30c800` and 69 commits behind current main. GitHub reports `mergeable=false` for both PRs at the time inspected.

This creates ambiguity about whether the remaining PR changes are still required, have already been superseded by PR #114, or need to be re-applied against the new baseline. In particular, PR #108 changes authentication/authorization paths that overlap with work merged in PR #114. PR #109 adds an RLS state contract document and needs a content-level disposition.

## Evidence

- Current `main`: `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`.
- PR #108: `phase-1/auth-tenant-boundary`, head `469264be26ef98ab22e265365081e9900cd2013c`, 5 commits ahead / 69 behind, merge base `1517034c5820fb2215567ad3dff2bf04da30c800`; compare status `diverged`; mergeable false.
- PR #108 touches login page, audit engine route, ProtectedRoute, authorization service and authorization tests.
- PR #109: `phase-1/rls-state-contract`, head `bc7d7fdd9993ff6f520b13ba226791c7271ddc7d`, 3 commits ahead / 69 behind, same merge base; compare status `diverged`; mergeable false.
- PR #109 adds `verification/rls-state-contract.md`.
- Neither PR was modified during this audit.

## Root cause

The Phase 1 baseline moved forward through a separate merge while these branches continued to point at the earlier common base. Their current contribution and overlap have not been reconciled against the merged code.

## Target files and resources

This is primarily a branch/PR disposition item, not a code defect. Review:
- PR #108 changed files: `src/app/[locale]/login/page.tsx`, `src/app/api/v1/audit/engine/route.ts`, `src/components/ProtectedRoute.tsx`, `src/services/auth/authorization.ts`, `tests/services/auth/authorization.test.ts`.
- PR #109 changed file: `verification/rls-state-contract.md`.
- Current counterparts on `main` and relevant tests/docs.

## Recommended remediation

1. Compare each PR patch and commit history against current `main` and PR #114's merged content.
2. For each changed hunk, classify as already present, still required, superseded, conflicting or historical-only.
3. For PR #108, run a security-focused semantic review of the auth/tenant changes before deciding whether any unique hunk needs a new branch and tests.
4. For PR #109, reconcile its RLS contract with the current tenant-context implementation, generated table list and migration verifier; retain or move the document only if it adds accurate current value.
5. Record a disposition for every unique change. Only then decide whether to close, update or replace a PR.
6. Do not force-merge either branch or rebase automatically; branch changes require an explicit review decision and authorization.

## Dependencies and impacts

- This is a prerequisite for unambiguous Phase 1 change management.
- Related to BL-008 because its documentation state and precedence affect the PR #109 contract.
- No source change is required if every remaining PR delta is proven redundant; the decision itself must still be recorded.

## Parallelization assessment

**Parallelizable for read-only review; not for branch mutation.**
- PR #108 and #109 patch inventories can be reviewed independently in read-only mode.
- Any rewrite/rebase/cherry-pick must be performed by one integrator after both dispositions are known.
- Do not modify PRs, branches or merge state during baseline documentation without separate authorization.

## Acceptance criteria

- Every unique change in both PRs has a written disposition and supporting current-main evidence.
- No unreviewed stale branch is treated as ready to merge.
- Required changes, if any, are carried into a fresh, narrowly scoped branch with current-main base and their own tests.
- PR close/update/rebase/merge actions occur only after explicit authorization.

## Rollback and recovery

No branch operation is required to document this finding. Preserve current refs until a disposition is approved. If a replacement branch is later created, keep the original PR available as historical evidence until its replacement is verified.

## Verification record

- GitHub PR and compare metadata at audit time: **verified**.
- Detailed patch-level semantic reconciliation: **pending**.
- No PR or branch was modified.
