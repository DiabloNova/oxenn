# Remediation Progress & Execution Log

**Repository:** `DiabloNova/oxenn`  
**Tracking branch:** `docs/architecture-aligned-remediation-2026-11`  
**Baseline architecture:** [OXENN_PRODUCT_ARCHITECTURE.md](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)  
**Execution order:** [IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md)  
**Agent instructions:** [AI_REMEDIATION_AGENT_PROMPT.md](./AI_REMEDIATION_AGENT_PROMPT.md)  
**Initial status recorded:** 2026-11-07  
**Current overall status:** PARTIAL — DOC-001 and DOC-002 are verified on `main` after PRs #122 and #123 merged and post-merge CI passed; project-wide Wave 0 remains incomplete.

> This file is the single running record of remediation progress. It must be updated as work proceeds, not reconstructed at the end. A finding is not complete merely because code was changed or a command exited successfully.

## 1. Overall status

| Metric | Current value |
|---|---:|
| Individual finding records | 97 |
| Findings revalidated against current `main` | 3 |
| Findings approved for implementation | 2 |
| Findings with implementation started | 2 |
| Findings with verified implementation complete | 2 |
| Findings blocked / historical-only | 2 |
| Open implementation waves | 7 (not started) |

**This tracker does not itself authorize code changes.** The narrowly scoped DOC-001 investigation was separately authorized and is recorded below; it does not waive mandatory Wave 0 revalidation or user approval for the remaining findings, and it does not authorize starting Wave 1. The tracker must be updated after each finding or coherent batch, before moving to the next batch.

## 2. Status definitions

Use exactly one primary status per finding:

- **Not started** — no current-main revalidation or implementation has been performed.
- **Revalidation in progress** — comparing the finding against a recorded current-main commit.
- **Confirmed** — still valid on current main; evidence and scope refreshed.
- **Already fixed** — current main contains a verified fix; record fixing commit and tests.
- **Superseded** — a newer contract or architecture decision replaces the original issue; explain why and link the replacement.
- **Needs decision** — implementation depends on an unresolved product, security, or policy decision; do not guess.
- **Approved** — user has explicitly approved implementation scope.
- **In progress** — code changes are underway within approved scope.
- **Blocked** — a dependency, external decision, safety gate, or failing prerequisite prevents progress.

Historical-only execution restrictions (for example, `DO NOT RUN`) are safety annotations, not lifecycle statuses. Record the primary status as `Blocked` when a historical artifact is review-only, and preserve the explicit prohibition in the planned-stage label and the finding record. A status change never authorizes execution of a historical script.
- **Implemented — verification pending** — code is changed but required tests/review/evidence are incomplete.
- **Verified complete** — acceptance criteria pass on a recorded commit and evidence is linked.
- **Integrated — verification pending** — the PR is merged to main, but successful CI for the exact merge commit has not yet been confirmed.
- **Integrated — verification failed** — the PR is merged, but post-merge CI failed or required verification did not complete successfully.
- **Closed without merge** — the PR closed without merging; no resolution is claimed.
- **Deferred / out of scope** — user-approved deferral or explicit scope decision is recorded.

Do not use "done", "fixed", or "complete" based only on an edit, local test, green unrelated CI, or an AI-generated claim. "Verified complete" requires evidence.

## 3. Mandatory entry format for every progress update

For every finding or batch, append a dated entry to the Execution Log and update its row in the Finding Ledger.

Each entry must include:

1. Finding ID and link to its individual problem file.
2. Date/time (timezone) and responsible agent/tool.
3. Repository, branch, exact base commit SHA, and working/head commit SHA.
4. Revalidation result against current `main` and evidence supporting it.
5. Exact files changed, or explicitly state "none".
6. Root cause confirmed and the implemented change, if approved.
7. Tests/commands actually executed, with pass/fail/skip counts and relevant output/artifact links.
8. Security, tenant-isolation, data migration, backward-compatibility, and rollback considerations where relevant.
9. Open risks, unresolved decisions, blockers, and dependencies.
10. Status transition and next permitted action.

Never invent command output, test results, CI state, commit hashes, approval, or deployment status. If a check was not run, write "Not run" and explain why. A skipped required check is not a pass.

## 4. Finding ledger — all 97 individual records

The wave column is a proposed dependency placement, not proof that the finding has been revalidated or approved. DOC-001 and DOC-002 have verified dispositions on `main`; DB-001's repository fix is present, while Production/runtime verification remains outstanding. The remaining 92 findings are not started and the two historical scripts remain blocked. These finding-level dispositions do not satisfy the project-wide Wave 0 exit condition.

| Finding | Planned stage | Current status | Verified commit | Evidence / log |
|---|---|---|---|---|
| [RF-001](./findings/001-RF-001.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [RF-002](./findings/002-RF-002.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [RF-003](./findings/003-RF-003.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [RF-004](./findings/004-RF-004.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [RF-005](./findings/005-RF-005.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [RF-006](./findings/006-RF-006.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [RF-007](./findings/007-RF-007.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [RF-008](./findings/008-RF-008.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [RF-009](./findings/009-RF-009.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [DB-001](./findings/010-DB-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Already fixed in repository; Production/runtime state unverified | `4e54e8b` | CI isolation evidence on disposable PostgreSQL |
| [DB-002](./findings/011-DB-002.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-003](./findings/012-DB-003.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-004](./findings/013-DB-004.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-005](./findings/014-DB-005.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DOC-001](./findings/015-DOC-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | **Verified complete** — merged into `main` via PR #122 on 2026-11-09 | [4e54e8b](https://github.com/DiabloNova/oxenn/commit/4e54e8b2acee85c9728fd3da9f0e596f08b08bad) | [Execution log](./REMEDIATION_PROGRESS.md#doc-001-investigation-branch-2026-11-09) · [Merge correction](./REMEDIATION_PROGRESS.md#correction--doc-001-merge-status--2026-11-09) · [PR #122](https://github.com/DiabloNova/oxenn/pull/122) |
| [DOC-002](./findings/016-DOC-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | **Verified complete** — merged to `main`; post-merge CI passed | [2f5a4d9e](https://github.com/DiabloNova/oxenn/commit/2f5a4d9ea42ec1491e1ab1601ebb12c18d93c472) | [Execution log](./REMEDIATION_PROGRESS.md#doc-002-post-merge-reconciliation-2026-11-09) · [PR #123](https://github.com/DiabloNova/oxenn/pull/123) · [merge commit 2f5a4d9e](https://github.com/DiabloNova/oxenn/commit/2f5a4d9ea42ec1491e1ab1601ebb12c18d93c472) · [main CI run #42605739033](https://github.com/DiabloNova/oxenn/actions/runs/42605739033) |
| [DOC-003](./findings/017-DOC-003.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [DOC-004](./findings/018-DOC-004.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DOC-005](./findings/019-DOC-005.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [DOC-006](./findings/020-DOC-006.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [DOC-007](./findings/021-DOC-007.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [DOC-008](./findings/022-DOC-008.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [DOC-009](./findings/023-DOC-009.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [FNT-001](./findings/024-FNT-001.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [FNT-002](./findings/025-FNT-002.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [FNT-003](./findings/026-FNT-003.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [FNT-004](./findings/027-FNT-004.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [GHA-001](./findings/028-GHA-001.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [GHA-002](./findings/029-GHA-002.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [GHA-003](./findings/030-GHA-003.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [GHA-004](./findings/031-GHA-004.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [GHA-005](./findings/032-GHA-005.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [GHA-006](./findings/033-GHA-006.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [PUB-001](./findings/034-PUB-001.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [PUB-002](./findings/035-PUB-002.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [PUB-003](./findings/036-PUB-003.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [PUB-004](./findings/037-PUB-004.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [PUB-005](./findings/038-PUB-005.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [PUB-006](./findings/039-PUB-006.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [SCR-001](./findings/040-SCR-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SCR-002](./findings/041-SCR-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SCR-003](./findings/042-SCR-003.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SCR-004](./findings/043-SCR-004.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SCR-005](./findings/044-SCR-005.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [SCR-006](./findings/045-SCR-006.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [SCR-007](./findings/046-SCR-007.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [SRC-001](./findings/047-SRC-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-002](./findings/048-SRC-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-003](./findings/049-SRC-003.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-004](./findings/050-SRC-004.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-005](./findings/051-SRC-005.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-006](./findings/052-SRC-006.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-007](./findings/053-SRC-007.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-008](./findings/054-SRC-008.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-009](./findings/055-SRC-009.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-010](./findings/056-SRC-010.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-011](./findings/057-SRC-011.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-012](./findings/058-SRC-012.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-013](./findings/059-SRC-013.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-014](./findings/060-SRC-014.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-015](./findings/061-SRC-015.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-016](./findings/062-SRC-016.md) | Wave 2 (persistence/expiry) + Wave 4 (localized UI/email workflow) | Not started — pending Wave 0 revalidation | — | — |
| [SRC-017](./findings/063-SRC-017.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-018](./findings/064-SRC-018.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-019](./findings/065-SRC-019.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-020](./findings/066-SRC-020.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-021](./findings/067-SRC-021.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-022](./findings/068-SRC-022.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-023](./findings/069-SRC-023.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-024](./findings/070-SRC-024.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [SRC-025](./findings/071-SRC-025.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [SRC-026](./findings/072-SRC-026.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [TST-001](./findings/073-TST-001.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [TST-002](./findings/074-TST-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [TST-003](./findings/075-TST-003.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [TST-004](./findings/076-TST-004.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [TST-005](./findings/077-TST-005.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [TST-006](./findings/078-TST-006.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [TST-007](./findings/079-TST-007.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [TST-008](./findings/080-TST-008.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [TST-009](./findings/081-TST-009.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [VER-001](./findings/082-VER-001.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [VER-002](./findings/083-VER-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [VER-003](./findings/084-VER-003.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [VER-004](./findings/085-VER-004.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [VER-005](./findings/086-VER-005.md) | Wave 0 — Historical-only safety review (DO NOT RUN) | Blocked | — | — |
| [VER-006](./findings/087-VER-006.md) | Wave 0 — Historical-only safety review (DO NOT RUN) | Blocked | — | — |
| [VER-007](./findings/088-VER-007.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [VER-008](./findings/089-VER-008.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [VER-009](./findings/090-VER-009.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [VER-010](./findings/091-VER-010.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [VER-011](./findings/092-VER-011.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [VER-012](./findings/093-VER-012.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Not started — pending Wave 0 revalidation | — | — |
| [VER-013](./findings/094-VER-013.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Not started — pending Wave 0 revalidation | — | — |
| [ARCH-001](./findings/095-ARCH-001.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [ARCH-002](./findings/096-ARCH-002.md) | Wave 7 — LangChain interim adapter | Not started — pending Wave 0 revalidation | — | — |
| [ARCH-003](./findings/097-ARCH-003.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
 
## 5. Execution log

Append newest entries at the bottom. Do not delete or rewrite historical entries; correct mistakes with a dated correction entry.

### Initial entry — 2026-11-07

- Scope: creation of the progress-tracking document and initialization of the 97-item ledger.
- Branch: `docs/architecture-aligned-remediation-2026-11`.
- Code changes: none.
- Tests: none; no remediation was performed.
- Revalidation: not started.
- User authorization for code remediation: not yet granted.
- Result: tracker initialized; all 97 findings await Wave 0 review. VER-005 and VER-006 are marked historical-only and must not be run.


### DOC-001 investigation branch — 2026-11-09

- Finding: [DOC-001](./findings/015-DOC-001.md).
- Date/time (timezone): 2026-11-09 07:50 UTC.
- Responsible agent/tool: ChatGPT, using the GitHub repository integration.
- Repository: `DiabloNova/oxenn`.
- Branch: `investigation/015-doc-001-tenant-owned-junction-tables`.
- Revalidation target/base commit: `main` at `f92886262840286589ee62934090438a424e8191`.
- Implementation/head commit verified: `642ca1849e4501f987ec86d7ea2e2d339c9557e7`. At verification time the branch was 5 commits ahead of `main`, 0 behind. PR [#122](https://github.com/DiabloNova/oxenn/pull/122) was open, mergeable, and not merged; the change is therefore **not present on `main`**.
- Revalidation result: the finding was confirmed against the recorded `main` baseline. The baseline used a separate runtime table list for Matrix scope while tenant-table validation derived ownership from schema markers; this allowed tenant ownership and RLS-policy presence/coverage to be represented inconsistently. The five affected junction tables are `pages_keywords`, `pages_topics`, `pages_entities`, `keywords_topics`, and `topics_entities`.
- Root cause and change: ownership scope, RLS policy declarations, tenant-policy coverage, migration coverage, and runtime-enforcement verification are now distinct dimensions. A shared schema-marker-based ownership classifier is used by the tenant-table and migration checks and the reference-matrix generator. Regression coverage keeps the five junction tables Tenant-Owned independently of policy presence.
- Implementation paths changed at commit `642ca184` (12):
  - `ai_tasks/docs-folder-audit.md`
  - `ai_tasks/problem-register/findings/015-DOC-001.md`
  - `docs/database/canonical-data-contract.md`
  - `docs/database/reference-matrix.md`
  - `scripts/database/build-reference-matrix.ts`
  - `scripts/database/verify-rls-migrations.ts`
  - `scripts/database/verify-tenant-tables.ts`
  - `scripts/docs-index-generator.ts`
  - `src/lib/docsIndex.ts`
  - `tests/unit/core/tenant-context/tenant-tables.test.ts`
  - `tests/unit/scripts/database/build-reference-matrix.test.ts`
  - `tests/unit/scripts/docs-index-generator.test.ts`
  - This progress-record correction changes only `ai_tasks/problem-register/REMEDIATION_PROGRESS.md`.
- Verification actually observed in [GitHub Actions run #42581412521](https://github.com/DiabloNova/oxenn/actions/runs/42581412521) — overall conclusion `success`; all 3 workflow jobs completed successfully:
  - Unit Tests: `pnpm exec vitest run --project unit` — 62 test files passed, 1 test file skipped; 359 tests passed, 1 todo. The skip and todo are recorded as such, not counted as passes.
  - UI Tests: `pnpm exec vitest run --project ui` — 4 test files passed; 33 tests passed.
  - Build and Test: Typecheck, Lint (0 errors; 213 warnings), tenant-table verification (56 tenant-owned tables), RLS migration coverage, Phase 0 baseline/documentation-link check, Drizzle migration-chain check, production build, Reference Matrix generation, and generated-file no-drift check all completed successfully.
  - Isolation Suite: `pnpm run test:isolation` against the CI-created ephemeral PostgreSQL 16 database `isolation_test_db` — all isolation suites passed; ENABLE/FORCE and SELECT/INSERT/UPDATE/DELETE policies were verified for 56 tenant tables, with 543 assertions. The CI container was stopped after the suite.
- Security/data boundary: no production database was connected to or modified; no schema or migration files were changed in this implementation batch. PostgreSQL verification used only the disposable CI container.
- Open risks / limits: PR #122 remains unmerged, so the verified result is branch-only. The unit run had 1 skipped test file and 1 todo test as stated above. Review suggestions for additional migration-parser and malformed Global-exception edge-case tests remain suggestions, not evidence of executed tests; they are not claimed as passed here. Static Matrix generation does not itself prove production runtime enforcement.
- Status transition: `Not started — pending Wave 0 revalidation` → **`Verified complete` on the investigation branch only**. This records the evidence for DOC-001 and does not mark Wave 0 or Wave 1 complete, nor does it authorize work on other findings.
- Next permitted action: retain PR #122 for review/merge under the normal user-approval gate; after merge, reconcile the finding against the resulting `main` commit. No other finding or wave is authorized by this entry.


### Correction — DOC-001 merge status — 2026-11-09

- The prior DOC-001 entry correctly recorded that PR #122 was open at the time of that entry. This is a point-in-time statement and is now superseded: PR [#122](https://github.com/DiabloNova/oxenn/pull/122) was merged on 2026-11-09 into `main` at `4e54e8b2acee85c9728fd3da9f0e596f08b08bad`.
- DOC-001 is therefore present on `main`; the earlier branch-only status is no longer current. No other finding or wave is implicitly authorized by that merge.

### DOC-002 implementation — 2026-11-09

- Finding: [DOC-002](./findings/016-DOC-002.md); related record: [DB-001](./findings/010-DB-001.md).
- User authorization: explicit approval of the complete DOC-002 plan and its stated scope/limitations on 2026-11-09.
- Repository: `DiabloNova/oxenn`; branch: `investigation/016-doc-002`.
- Revalidation target: `main` at `4e54e8b2acee85c9728fd3da9f0e596f08b08bad`; branch base matched that commit before edits.
- Implementation commits: `7a4ce6094b10f8c8781eecc43cda1a1d74af6ed9` (documentation/governance, checker/tests and CI step); `50b949f9752419d54872eb5b8e9432e87e31fab1` (TypeScript/Vitest integration); `8e54d61330acb8dcc67785380013e154a32110ec` (typecheck correction); `3ace8e7c1c1a46e5c3aa2e70920d531b80ea8d1d` (generated docs navigation index sync).
- Paths changed (13 net): `docs/architecture/database/tenant-context-spec.md`; `docs/architecture/database/reconciliation-report.md`; `docs/security/README.md`; `docs/architecture/README.md`; `docs/project/MVP_PHASE_1_SECURITY_TENANT_ISOLATION.md`; `docs/architecture/features/ARCHITECTURE.md`; `ai_tasks/docs-folder-audit.md`; `ai_tasks/problem-register/findings/016-DOC-002.md`; `ai_tasks/problem-register/findings/010-DB-001.md`; `scripts/docs/verify-rls-docs.ts`; `tests/unit/scripts/docs/verify-rls-docs.test.ts`; `.github/workflows/ci.yml`; `src/lib/docsIndex.ts` (required generated navigation snippet update for the changed historical report). The temporary `.mjs` checker was replaced by the typed `.ts` implementation and is not present in the final tree. The DB Reference Matrix and generated tenant-table map remained unchanged.
- Main documentation changes: the 12-table current inventory was removed from the tenant-context spec; the 2024 reconciliation report's 51/19 figures were retained with a prominent superseded/historical notice; active READMEs now point to the canonical contract and generated Matrix; Phase 1's 70/51 baseline is labelled historical; the feature policy example uses `app.current_tenant_id`; Phase 0's already-correct 56-table reconciliation was left unchanged.
- DB-001 disposition: its five junction-table policy and migration defects are already fixed in the checked-in repository through migrations `0014_db_001_join_table_rls.sql` and `0015_db_001_composite_tenant_fks.sql`; the finding remains open only for separate Production/runtime verification, not for a repository code fix.
- New documentation guard: an explicit allowlist checks active documents and separately checks historical labels. It does not globally ban 51/19 references and does not duplicate schema/migration validation.
- Verification: the prepared-document checker smoke test passed on the staging copy (4 current docs, 2 historical docs). The first full CI dispatch (#663, SHA `50b949f`) failed at TypeScript typecheck due to one implicit-any parameter; this was corrected in commit `8e54d61`. CI run #664 at SHA `8e54d61` passed typecheck, lint, documentation gate, unit/UI tests, isolation suite, and build, but the generated-file drift guard correctly exposed the stale auto-generated `src/lib/docsIndex.ts` snippet. That generated navigation snippet was refreshed in commit `3ace8e7`. Final full CI run [#665](https://github.com/DiabloNova/oxenn/actions/runs/42588930161) at SHA `3ace8e7` completed successfully on 2026-11-09. Build and Test, Unit Tests, and Isolation Suite jobs all passed; Typecheck, Lint, tenant-table verifier, RLS migration verifier, Phase 0 verifier, new RLS docs verifier, Drizzle chain check, Build, Reference Matrix generation, and generated-file no-drift check all passed.
- Database/production boundary: no schema, SQL migration, Drizzle journal/snapshot, generated Matrix, generated tenant-table map, or existing database verifier was changed. The isolation suite runs only in the workflow's disposable PostgreSQL service. No Production/staging database was connected to or modified.
- PR/merge boundary: no PR was created; no merge or direct `main` change was performed.
- Current status: DOC-002 implementation is complete and CI-verified on the investigation branch. No PR or merge has been created. DOC-001 is merged; DB-001 is already fixed in repository with Production runtime unknown.


### Post-closeout validation — 2026-11-09

- Final CI run [#666](https://github.com/DiabloNova/oxenn/actions/runs/42589259231) executed on the closeout commit `7074f50e1cf0ab665912943c6bd944d00ca30b2c` and completed successfully.
- Build and Test: success, including Typecheck, Lint, tenant ownership verifier, RLS migration coverage, Phase 0 documentation check, new RLS documentation consistency gate, Drizzle migration-chain check, application Build, Reference Matrix generation, and generated-file no-drift check.
- Unit Tests: success, including the focused RLS documentation regression tests and UI tests.
- Isolation Suite: success against the workflow's disposable PostgreSQL service.
- This final workflow validates the DOC-002 closeout status/audit changes. The subsequent ledger-only commit records this result and does not change application or test code.

### DOC-002 post-review remediation — 2026-11-09

**Authorization and branch boundary**
- The user approved all Codacy and HayDeer inline findings, the additional regression coverage, and inspection/correction of redundant Vercel project settings after identification.
- All repository edits were made only on `investigation/016-doc-002`. PR #123 remains open and unmerged. The PR base is `main` at `4e54e8b2acee85c9728fd3da9f0e596f08b08bad`; no commit was written to `main`.
- The final code/test commit is `b85a9fbe46d21a01b553685130d7c5102ea55acf`. Subsequent changes in this section are documentation-only status records.

**Code and documentation corrections**
- `scripts/docs/verify-rls-docs.ts`: added a canonical repository-path resolver that rejects absolute paths and lexical traversal, canonicalizes the repository root and target with `realpathSync`, and rejects symlink escapes. The explicit current/historical allowlists are frozen.
- The direct-execution guard now converts `import.meta.url` with `fileURLToPath`, avoiding percent-encoded path mismatches for workspaces containing spaces or Unicode.
- `tests/unit/scripts/docs/verify-rls-docs.test.ts`: expanded to cover stale active 51-table claims, historical Phase 1 date/evidence labels, DOC-002's 56/14 current inventory, Phase 0 distinction, missing required documents, `../` traversal, absolute paths, symlink escapes, and decoded entrypoint paths. The focused file now contains 14 test cases.
- `findings/016-DOC-002.md`: corrected the implementation path to `.ts`, explaining that the `.mjs` prototype was temporary.
- `REMEDIATION_PROGRESS.md`: corrected the current DOC-001 row to show PR #122 merged into `main`; preserved its dated historical execution notes.

**Verification**
- Intermediate CI run #670 on `5c16aafb` exposed two incorrect test-fixture mutations; those tests were corrected. This was a test-fixture issue, not a production checker failure.
- Final CI run #672 on `b85a9fbe` passed all three jobs: Build and Test, Unit Tests/UI Tests, and Isolation Suite. [Run #672](https://github.com/DiabloNova/oxenn/actions/runs/42598489930).
- Build and Test passed TypeScript typecheck, lint, tenant-table alignment, RLS migration coverage, Phase 0 verification, the RLS documentation checker (4 active and 2 historical documents), Drizzle migration-chain check, build, Reference Matrix generation, and generated-file no-drift guard.
- Unit Tests: 63 test files passed and 1 skipped; 373 tests passed and 1 remained todo. UI tests: 4 files and 33 tests passed.
- Isolation Suite passed against disposable CI PostgreSQL: 56 tenant tables and 543 assertions. No production/staging database was accessed.

**Vercel project review and limited configuration correction**
- The `oxenn` team is on the Hobby plan. Vercel bot comments identify the precise failure as `api-deployments-free-per-day`: more than 100 deployments in 24 hours, retry after 24 hours. This is an owner/team quota, not an application build error.
- Three Vercel projects were confirmed to point to the same `DiabloNova/oxenn` repository, `main` production branch, Next.js framework, repository root, and Node 24 configuration: `oxenn`, `oxenn-q9bo`, and `oxenn-5987`. No project environment variables or custom domains were returned; each has its own default `vercel.app` aliases and existing production deployment.
- Kept `oxenn` as the canonical preview project. Set only `previewDeploymentsDisabled=true` on `oxenn-q9bo` and `oxenn-5987`. Verified the setting persisted. Their production deployments and aliases were preserved; no project was deleted, no Git connection or production setting was changed, and no environment variable was touched.
- The daily deployment quota was already exhausted during this work. No further deployment was forced; the current Vercel failure status remains until the quota window resets. The two duplicate projects should no longer generate new PR preview deployments.

**Review disposition and remaining external blocker**
- All six original inline Codacy/HayDeer review threads were resolved after their fixes were committed and CI passed.
- A separate Codacy bot summary comment still reports six critical issues, but its individual issue records are not present in the GitHub PR timeline and the Codacy dashboard endpoint was inaccessible through the available connection. GitHub code-scanning returned no alerts, which is not evidence that Codacy's separate six-item report is clear. Those six items are therefore not claimed resolved and require the Codacy issue details for triage.
- PR #123 remains open; no merge was performed or authorized.

## 6. Wave-level gates

| Stage | Entry condition | Exit condition |
|---|---|---|
| Wave 0 — Revalidation and safety | Explicit user approval to begin revalidation; current `main` SHA recorded | All 97 findings reconciled; PRs/issues and safety gates checked; statuses and evidence updated; unresolved decisions identified |
| Wave 1 — Security and tenant boundaries | Wave 0 complete; security scope approved | Tenant ownership, authorization, safe-fetch, privileged access and related tests meet each finding's acceptance criteria |
| Wave 2 — Persistence and schema | Wave 1 prerequisites satisfied; schema crosswalk and migration plan reviewed | Canonical schema/repository contracts and durable persistence verified with safe database tests |
| Wave 3 — AI evidence and providers | Required persistence and provenance prerequisites satisfied | LIVE/MOCK/HYBRID, provider adapter, evidence provenance and assessment correctness verified |
| Wave 4 — Commercial and execution | Catalog/entitlement model approved; payment and workflow scope explicit | Entitlements, quotas, billing state and real workflow behavior meet acceptance criteria |
| Wave 5 — CI and tooling | Underlying contracts stable enough for reliable gates | Required tests are discovered and executed; CI/tooling gates cannot pass falsely |
| Wave 6 — Frontend, docs and assets | Product scope and backend/API contracts stable; frontend-only boundary respected | Approved UI, localization, assets and documentation changes verified |
| Wave 7 — LangChain adapter | OXENN-owned runtime interface, provider modes, provenance and evaluation gates approved | LangChain is contained behind the adapter; OXENN retains business state, permissions, approvals and execution |

A wave may be split into smaller batches. Do not start a later wave merely because its calendar slot has arrived. Its entry conditions must be met.

## 7. Safety and scope controls

- No implementation before explicit user approval of the scope and relevant wave.
- Do not merge, close, rebase, or alter existing PRs/issues without explicit authorization.
- Reconcile PR #108, PR #109, issues #115/#116, and PR #117 against current main before overlapping work. Do not assume any PR is merged or any issue resolved without checking.
- Never execute `verification/phase-0/probe-system-context.ts` or `verification/phase-0/run_rls_matrix.js`. They are historical unsafe probes.
- Never run migrations or database mutation tests against production or an unverified database. Verify disposable database identity before use.
- Keep customer products being assessed distinct from OXENN services/SKUs purchased by the customer.
- SEO, AEO, and GEO remain independently purchasable; bundles are optional.
- LangChain is an interim adapter implementation only. Do not let it own OXENN business state, authorization, approvals, entitlements, or execution.
- SCRS is not production-ready by assumption; any future adoption requires real workload evaluation.
- LLM output is not authorization to execute an action. Preserve deterministic gates, provenance, and human approval where required.
- Preserve `UNKNOWN != ZERO`; never represent mock or unavailable data as a live measured result.
- Keep the dashboard work frontend-only unless the user explicitly changes that scope.
- Do not change unrelated files or opportunistically refactor adjacent code.

## 8. Completion and reporting

At the end of each batch, report:
- what was revalidated or changed;
- finding IDs and status transitions;
- exact commit(s);
- tests and actual results;
- what remains blocked or unverified;
- whether the next dependency gate is satisfied.

At the end of each wave, provide a concise wave summary and wait for the required user approval before proceeding if the scope or next wave has not already been authorized.

The project is complete only when every in-scope finding is either verified complete or has an explicitly approved disposition (deferred, superseded, already fixed, or out of scope), with evidence. The number of changed files or closed issues is not a completion metric.


### DOC-002 post-merge reconciliation — 2026-11-09

- Finding: [DOC-002](./findings/016-DOC-002.md).
- PR [#123](https://github.com/DiabloNova/oxenn/pull/123) was merged to `main` at [`2f5a4d9ea42ec1491e1ab1601ebb12c18d93c472`](https://github.com/DiabloNova/oxenn/commit/2f5a4d9ea42ec1491e1ab1601ebb12c18d93c472).
- Post-merge CI run [#42605739033](https://github.com/DiabloNova/oxenn/actions/runs/42605739033) passed.
- Current disposition: **Verified complete on main**. The earlier branch-only/unmerged wording in the individual finding and README is superseded; dated implementation and review notes remain historical.
- Scope note: this records repository and CI evidence only. No production or staging database connection or query was made.
