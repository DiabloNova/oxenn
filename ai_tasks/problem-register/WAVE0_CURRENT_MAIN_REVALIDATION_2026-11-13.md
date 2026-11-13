# Wave 0 Current-Main Revalidation — 2026-11-13 (IN PROGRESS)

- Repository: `DiabloNova/oxenn`.
- Current-main baseline inspected: `a9f22b6f794ee9ff6640fad78b581e51b9e385cf` (merge of PR #135, 2026-11-13 14:36:53 UTC).
- Review branch: `wave0/revalidate-current-main-20261113`, created directly from that exact main SHA.
- Previous ledger snapshot: `main@9ac5fe016f11bddad789153efcaaa3f3fef93b44`. The compare range to current main contains 52 commits and 66 changed paths. Therefore the old 77/97 count is historical evidence at 9ac5fe0, not a current-main completion count.
- This entry records an in-progress current-main review. It does **not** declare Wave 0 complete and does not authorize Wave 1.

## Previously Not Started batch — current-main inspection

The 20 records previously marked Not started were read and their principal current-main evidence paths inspected. The following are provisional dispositions; items with incomplete evidence remain open and their canonical Ledger statuses are not changed in this batch.

| Finding | Current-main evidence / provisional disposition |
|---|---|
| DOC-007 | `docs/security/privileged-paths.md` now uses canonical organization table names and explicitly states that the registry is audit metadata, not an SQL allowlist. The registry and representative callers are present. A complete caller-to-SQL trace is still required before marking fixed; partial/superseded pending that trace. |
| DOC-008 | `SECURITY_MODEL.md`, `RBAC_MODEL.md`, and `docs/security/README.md` now distinguish Workspace RBAC from Platform Admin RBAC, identify separate role authorities, and prohibit implicit mapping. The full cross-context negative-test and document-consistency evidence is not complete; partial pending final reconciliation. No live Platform Admin database/provider is configured or inferred. |
| DOC-009 | `docs/api/README.md` still documents `/api/v1/analytics/llm/route.ts`; `route.ts` is an implementation filename, not part of the public HTTP path. Confirmed. |
| FNT-001 | `src/config/fonts.ts` loads the active application fonts from `public/fonts/`; the root `font/` catalogue is a separate collection. Confirmed as an ownership/loader contract gap. |
| FNT-002 | No authoritative source/license/provenance record was found in the inspected font documentation. Embedded Box Face terms and missing authoritative records for the other families remain unresolved. Confirmed; no license or redistribution assumption is made. |
| FNT-003 | Current tree confirms the one-byte files `font/1`, `font/Yekan/1`, and `font/tajrid/1` (each size 1 byte). Confirmed; no deletion was performed. |
| FNT-004 | The central font loader defines Yekan Bakh and Peyda; BoxFace is not configured there. The design-document claim and approved typography decision still need a final cross-check. Confirmed as a documentation/configuration mismatch pending that decision. |
| GHA-001 | Both current workflows still use `actions/checkout@v4` and `actions/setup-node@v4`; the baseline workflow also uses `actions/upload-artifact@v4`. The current main core CI jobs pass, but current-run warning logs were not independently inspected. Partially valid; do not claim a fresh Node-runtime warning from the pass result alone. |
| GHA-002 | Both workflows still use mutable major-version action tags. `.github/` contains only the `workflows/` directory and no workflow dependency lockfile. Confirmed supply-chain pinning gap. |
| GHA-003 | `.github/workflows/ci.yml` has no explicit `permissions:` declaration; the separate baseline workflow declares `contents: read`. Confirmed. |
| GHA-004 | `capture-regression-baseline.yml` still triggers only on pushes to `fix/audit-remediation`. Whether it is archival or an active baseline mechanism remains an owner decision. Needs decision; no trigger was changed. |
| GHA-005 | `vitest.config.ts` remains an ESM configuration. The latest main CI success does not establish whether the historical config-loader warning is still emitted. Blocked pending current-run warning evidence and a scoped compatibility check. |
| GHA-006 | Historical `punycode`/`url.parse()` warnings still lack a current dependency/call-site attribution. Blocked pending a warning-stack diagnostic on the exact candidate; no warning suppression or dependency edit was made. |
| PUB-001 | `PlatformsSection.tsx` exists, but the localized homepage page does not import/render it. Confirmed for the inspected homepage path; no component mounting change was made. |
| PUB-002 | `public/optimus-ai-sample-report.pdf` remains an 866-byte placeholder. `dashboard/reports/page.tsx` sets a success message after a local timeout rather than producing or downloading a PDF. Confirmed. |
| PUB-003 | `public/icon.svg` assigns a black background under light preference and a white background under dark preference, matching the reported inverted mapping. Confirmed for the SVG; metadata wiring still requires its separate verification. |
| PUB-004 | `public/logo-horse.png` remains 1,147,252 bytes. The inspected homepage header/footer use the inline logo; repository-wide dynamic/non-code references were not exhaustively ruled out. Partially valid; do not delete the asset. |
| PUB-005 | The listed placeholder/starter assets remain in `public/`. Their presence is confirmed, but incomplete reference tracing prevents classifying every one as unused. Partially valid; no cleanup performed. |
| PUB-006 | `PlatformsSection.tsx` still lists `Anthropic Claude` (`claude`) and `Anthropic` (`anthropic`) as peer entries. Confirmed taxonomy inconsistency. |
| SRC-015 | The active Drizzle journal currently ends at migration `0015`; the dispatcher still calls `claim_crawl_jobs`, `recover_expired_crawl_jobs`, and `complete_crawl_job_if_lease_owner`, whose definitions were recorded only in archived legacy SQL. Confirmed static repository gap. No migration, database, or worker was run. |

## Current-main delta checks on previously reviewed findings

- **SRC-013:** PR #135 is merged at `a9f22b6f794ee9ff6640fad78b581e51b9e385cf`. The current free-audit route calls `authorizeApiRequest` before request-body/quota/crawl work and applies per-user, ingress-IP, and global limits. It uses the internal HTTP crawler rather than Firecrawl. This resolves the repository-level authentication/rate-limit claim; deployed/runtime behavior remains unverified. The three core CI jobs on the exact merge commit succeeded.
- **TST-002 / TST-003:** PR #133 is merged at `5a28d6a88f2579ebc253ec697ec7a26be8f0ba4f`. On that exact merge commit, Build and Test, Unit Tests, and Isolation Suite all completed successfully. These findings can be treated as verified in the checked-in repository/ephemeral CI only; no live database/RLS claim is made.
- **VER-002:** remains a historical verification-report overstatement only. The historical report is qualified; this is not evidence of a current RLS gap.
- **SRC-022 / PR #117:** PR #117 is closed and unmerged. Current main's invoice page now explicitly says payment processing is unavailable, displays sample invoice data only, and has no client-side payment-success handler. The original false-success behavior is no longer present on current main; no PR was merged or closed by this review.
- **Issue #116:** current `getSession()` joins `organization_members` and returns no session when the membership role is absent; session tests cover revoked/replaced sessions. A direct `authorizeApiRequest` 401 regression for the missing-membership case was not conclusively established here. Issue #116 remains open and has no comments; no issue state was changed.
- **Issue #115:** remains open with no comments. The repository code-search response was incomplete, so a complete provider-bound/local-fetch call-site inventory and redirect-hop verification have not been established. Do not close or disposition this issue yet.
- **PR #108 / PR #109:** both are closed and unmerged. They are not treated as integrated changes. Their overlapping auth/RLS patches still require reconciliation against current main before any future edits to those boundaries.

## CI and safety evidence

- On exact current main `a9f22b6f794ee9ff6640fad78b581e51b9e385cf`, GitHub reports **Build and Test — success**, **Unit Tests — success**, and **Isolation Suite — success**.
- The same ref also has an auxiliary `record-remediation-event` check failure in its check history. It is separate from the three core CI jobs and requires its own triage; it is not silently counted as a core test pass.
- VER-005 and VER-006 remain `HISTORICAL_ONLY / DO NOT RUN`; neither prohibited script was executed.
- No database was connected or accessed. No migration, database test, production operation, external provider call, payment-provider action, deployment, issue/PR closure, or merge was performed.

## Remaining Wave 0 work

1. Revalidate the previously reviewed 77 findings against all relevant changes in the 52-commit / 66-path delta from `9ac5fe0` to `a9f22b6`; do not carry forward old statuses without path-level evidence.
2. Complete individual-record evidence and final status transitions for the 20 previously Not started findings; in particular finish the blocked GHA diagnostics, the DOC-007 call-site trace, and owner decisions.
3. Complete issue #115's full crawler/provider call-site inventory and finish issue #116's direct API-boundary regression evidence.
4. Reconcile closed-unmerged PR #108/#109 against current auth/RLS code and PR #117 against current invoice/payment behavior.
5. Recheck VER-013 against its exact advisory/package and candidate lockfile no later than 2026-11-19. The current lockfile contains brace-expansion 1.1.21, 2.1.7, and 5.0.12, but the exact historical advisory identity/acceptance record was not available in the inspected path; do not infer closure from version strings alone.
6. Triage the auxiliary `record-remediation-event` failure and retain exact CI-run evidence.

**Wave 0 status: IN PROGRESS — NOT COMPLETE.** The 97-row Ledger's historical counts and statuses have intentionally not been rewritten in this partial batch. Update individual records and aggregate counts only after their current-main evidence and dispositions are complete.


## 52-commit delta: direct finding-to-path reconciliation

A path-to-record scan of all 97 current-main finding files against all 66 changed paths identified 17 findings with direct path references in the delta. This narrows the substantive re-review set; it does not mean the other 80 findings were automatically marked complete. Their cited paths must be confirmed unchanged before carrying their prior dispositions forward.

| Finding | Current-main delta result |
|---|---|
| DOC-001 | `src/lib/docsIndex.ts` and documentation navigation changed. Current docs index is generated from the canonical documentation set; verify the index contract and link inventory before final closure. |
| DOC-002 | Current reference matrix and docs verifier changed. The verifier explicitly distinguishes current canonical docs from historical RLS snapshots; historical 70/51 figures are not presented as current RLS truth. Prior Verified-complete disposition remains valid for documentation scope only. |
| DOC-003 | `docs/README.md` now names the current product specification, engineering baseline, architecture, and roadmap authorities; `docs/project/README.md` explicitly retires the former Phase 0 two-journey scope and keeps old audit work historical. The old roadmap-authority claim is superseded. |
| DOC-005 | Current documentation index and product README distinguish intended product behavior from implementation evidence and prohibit describing planned/documented capability as implemented or live without code and verification. The original overstatement concern is materially addressed; implementation claims remain evidence-gated. |
| DOC-006 | Current product specification and MVP baseline describe Current-State Baseline, context-specific Benchmark, Gap Analysis, planning, and outcomes, but do not name or define a canonical Digital Twin model. Owner decision is still required: intentional product reframing (supersede DBT/DTGA) or an omitted first-class contract. |
| DOC-007 | Current privileged-path documentation uses canonical `organization_members`, identifies `roles` as frozen legacy schema, and lists direct callers. It explicitly says the registry is audit metadata, not SQL enforcement. The stale-table/source-path documentation claim is superseded; the separate SRC-002 enforcement finding remains valid. |
| DOC-008 | Current Security Model explicitly separates Workspace RBAC and Platform Admin RBAC, forbids implicit role mapping, and documents that a Workspace `super_admin` is not a Platform Admin principal. Platform Admin OIDC/schema work is described separately; no live database or deployed admin identity is inferred. Documentation separation is now explicit. |
| DOC-009 | `docs/api/README.md` was not changed in this delta and still lists `/api/v1/analytics/llm/route.ts`. Confirmed. |
| SRC-002 | The current registry comment says `allowedTables` is audit metadata only. The underlying `runWithSystemContext` still validates a purpose key rather than enforcing caller/table/operation capabilities at the SQL boundary. Confirmed; documentation updates do not fix this runtime authorization gap. |
| SRC-006 | `auditService.ts` remains a `MockAiAuditService` with synthetic progress/scores, while the Free Audit API now performs a bounded internal crawl. The broad finding is partially valid: the Free Audit route was materially changed, but other synthetic analysis paths still require endpoint-by-endpoint provenance review. |
| SRC-013 | PR #135 added server-side session authorization before body/quota/crawl work and per-user/IP/global limits; current main CI passed on the exact merge commit. Repository-level authentication/rate-limit gap is resolved; deployed behavior is not claimed. |
| TST-002 | PR #133 merged at `5a28d6a88f2579ebc253ec697ec7a26be8f0ba4f`; Build and Test, Unit Tests, and Isolation Suite all succeeded on that exact merge commit. Verified in repository/ephemeral CI only. |
| TST-003 | Same exact PR #133 merge and three successful core CI jobs. Independent expected ownership inventory and mutation tests are present. Verified in repository/ephemeral CI only. |
| VER-002 | The historical Phase 1 report remains a historical snapshot and is explicitly qualified/superseded; this is not evidence of a current RLS enforcement gap. Preserve its historical-only interpretation. |
| PUB-001 | Homepage source still does not import/render `PlatformsSection`; the component exists but is not mounted on the localized homepage. Confirmed. |
| GHA-001 | Current CI still uses `actions/checkout@v4` and `actions/setup-node@v4` (Node 22 setup); action-runtime deprecation must be confirmed from current-run logs rather than inferred from a green CI result. Partially valid pending current warning evidence. |
| GHA-003 | Current `ci.yml` still lacks an explicit workflow-level `permissions:` block. Confirmed least-privilege permissions gap. |

The 66-path change set also includes the hardened HTTP crawl provider and its tests. Issue #115's required complete inventory is not satisfied by one changed provider or an incomplete GitHub code-search response; keep the issue open pending a complete repository-wide call-site and redirect-hop review.
