# Remediation Progress & Execution Log

**Repository:** `DiabloNova/oxenn`  
**Tracking branch:** `audit/wave-0-revalidation-2026-11-08`  
**Baseline architecture:** [OXENN_PRODUCT_ARCHITECTURE.md](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)  
**Execution order:** [IMPLEMENTATION_SEQUENCE.md](./IMPLEMENTATION_SEQUENCE.md)  
**Agent instructions:** [AI_REMEDIATION_AGENT_PROMPT.md](./AI_REMEDIATION_AGENT_PROMPT.md)  
**Initial status recorded:** 2026-11-07  
**Current overall status:** IN PROGRESS — Wave 0 revalidation is underway on the isolated audit branch; no implementation is authorized.

> This file is the single running record of remediation progress. It must be updated as work proceeds, not reconstructed at the end. A finding is not complete merely because code was changed or a command exited successfully.

## 1. Overall status

| Metric | Current value |
|---|---:|
| Individual finding records | 97 |
| Finding records copied into the isolated execution branch | 97 |
| Findings revalidated against current `main` | 13 |
| Findings approved for implementation | 0 |
| Findings with implementation started | 0 |
| Findings with verified implementation complete | 0 |
| Findings blocked / historical-only | 2 |
| Open implementation waves | 7 (not started) |

**No code changes are authorized by this tracker.** The first activity, once explicitly approved, is Wave 0 revalidation. The tracker must be updated after each finding or coherent batch, before moving to the next batch.

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
- **Implemented — verification pending** — code is changed but required tests/review/evidence are incomplete.
- **Verified complete** — acceptance criteria pass on a recorded commit and evidence is linked.
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

The wave column is a proposed dependency placement, not proof that the finding has been revalidated or approved. All records begin as not started, except the two historical scripts that must never be executed.

| Finding | Planned stage | Current status | Verified commit | Evidence / log |
|---|---|---|---|---|
| [RF-001](./findings/001-RF-001.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Confirmed — present on pinned main | 7bd2b6ba | update_recon.sh calls missing root helpers; no fail-fast before report replacement |
| [RF-002](./findings/002-RF-002.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Confirmed — present on pinned main | 7bd2b6ba | verify_aeo_content.py process/credential/readiness/error handling review |
| [RF-003](./findings/003-RF-003.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Confirmed — DB test project empty and passWithNoTests | 7bd2b6ba | vitest.config.ts; no files under tests/db |
| [RF-004](./findings/004-RF-004.md) | Wave 5 — Test discovery, CI supply chain, and developer tooling | Partially mitigated — package db:push guarded | 7bd2b6ba | drizzle.config.ts fallback; guard protects package script; no CI bypass found |
| [RF-005](./findings/005-RF-005.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Confirmed — placeholder accepted by env-check | 7bd2b6ba | .env.example + env-check; local-only comments mitigate but do not enforce |
| [RF-006](./findings/006-RF-006.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Confirmed — CSP header absent | 7bd2b6ba | next.config.ts; HSTS preload domain suitability unverified |
| [RF-007](./findings/007-RF-007.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Confirmed — current-main product docs lack target model | 7bd2b6ba | SPEC.md/README compared with target architecture not in main |
| [RF-008](./findings/008-RF-008.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Confirmed — duplicate and malformed headings | 7bd2b6ba | AGENTS.md lines 511, 534, 1252 |
| [RF-009](./findings/009-RF-009.md) | Wave 6 — Frontend, product documentation, assets, and historical evidence | Confirmed — production sender remains nonfunctional | 7bd2b6ba | email adapter + invitation action; non-empty provider suppresses token fallback |
| [DB-001](./findings/010-DB-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [DB-002](./findings/011-DB-002.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-003](./findings/012-DB-003.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-004](./findings/013-DB-004.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DB-005](./findings/014-DB-005.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [DOC-001](./findings/015-DOC-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [DOC-002](./findings/016-DOC-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
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
| [SRC-001](./findings/047-SRC-001.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Confirmed — present on pinned main | 7bd2b6ba | Legacy audit crawler + robots/sitemap fetch; SRC-001 revalidation section |
| [SRC-002](./findings/048-SRC-002.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-003](./findings/049-SRC-003.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-004](./findings/050-SRC-004.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-005](./findings/051-SRC-005.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-006](./findings/052-SRC-006.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-007](./findings/053-SRC-007.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-008](./findings/054-SRC-008.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-009](./findings/055-SRC-009.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Confirmed — present on pinned main | 7bd2b6ba | Acquisition policy/provider/route; SRC-009 revalidation section |
| [SRC-010](./findings/056-SRC-010.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-011](./findings/057-SRC-011.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-012](./findings/058-SRC-012.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-013](./findings/059-SRC-013.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Confirmed — present on pinned main | 7bd2b6ba | Free audit route/provider path; SRC-013 revalidation section |
| [SRC-014](./findings/060-SRC-014.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-015](./findings/061-SRC-015.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-016](./findings/062-SRC-016.md) | Wave 2 — Canonical schema, persistence, and transaction contracts | Not started — pending Wave 0 revalidation | — | — |
| [SRC-017](./findings/063-SRC-017.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-018](./findings/064-SRC-018.md) | Wave 1 — Security, tenant isolation, and safe access boundaries | Not started — pending Wave 0 revalidation | — | — |
| [SRC-019](./findings/065-SRC-019.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-020](./findings/066-SRC-020.md) | Wave 3 — AI provider behavior and evidence integrity | Not started — pending Wave 0 revalidation | — | — |
| [SRC-021](./findings/067-SRC-021.md) | Wave 4 — Commercial entitlements and real workflow execution | Not started — pending Wave 0 revalidation | — | — |
| [SRC-022](./findings/068-SRC-022.md) | Wave 4 — Commercial entitlements and real workflow execution | Confirmed — present on pinned main; PR #117 unmerged | 7bd2b6ba | Invoice page + PR #117 diff/checks; SRC-022 revalidation section |
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
| [VER-005](./findings/086-VER-005.md) | Wave 0 — Historical-only safety review (DO NOT RUN) | DO NOT RUN — historical script; review only | — | — |
| [VER-006](./findings/087-VER-006.md) | Wave 0 — Historical-only safety review (DO NOT RUN) | DO NOT RUN — historical script; review only | — | — |
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


### Wave 0 restart — 2026-11-08 (live execution)

- Scope: restart Wave 0 from the beginning on a new branch. This entry supersedes the prior incomplete attempt as the active execution record; the prior history is preserved above.
- Branch: `audit/wave-0-revalidation-2026-11-08`. Created from `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`; the new ref was read back and verified at the same SHA before any commit.
- Source register: `docs/architecture-aligned-remediation-2026-11` at `57d0bb4a51bf7549dfd994681fdfd3e4e7a5b5d2`. All 97 individual finding files, 8 category records plus category README, agent prompt, implementation sequence, register README, and target architecture were fetched successfully.
- Current-main inventory: recursive tree returned 1,149 entries with `truncated=false`. The source-register tree returned 1,347 entries with `truncated=false`. The target architecture file `docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md` exists on the source register branch but is absent from pinned `main`; it is carried as a target-architecture reference, not treated as already merged.
- Source evidence: 82 exact current-main files referenced by the finding records were fetched successfully with blob SHAs. Additional current-main auth files/tests were fetched for Issue #116. No code was changed.
- Scoped PR/Issue reads: PR #108 (open, unmerged, base SHA `1517034c5820fb2215567ad3dff2bf04da30c800`, mergeable state `dirty`); PR #109 (open, unmerged, same old base SHA, mergeable state `clean`); PR #114 (merged 2026-11-06, head `517e1896d878c50650030e5cd7bf430b11809b7c`, merge commit now at pinned main); PR #117 (open, unmerged, base is pinned main SHA, head `1ec9bcd77df0f743ebe68b6233a76469558e9e8e`, mergeable state `unstable`). Issues #115 and #116 are both open.
- PR checks observed: PR #108 has 5 successful checks and `Build and Test` failed; PR #109 has 6 successful checks; PR #117 has 5 successful checks and one neutral AI-review check. These are historical/current check-run observations for the fetched PR heads, not a claim that the PRs are mergeable.
- Preliminary Issue #116 evidence: `getSession()` LEFT JOINs `organization_members` and returns null when `m.role` is absent; `authorizeApiRequest()` rejects a missing session. The current `organization_members` schema has no separate revoked/deleted column. Existing session tests cover absent sessions and revoked/replaced sessions, but no direct active-session-with-missing-membership regression case was found in the inspected tests. Final status remains pending full finding reconciliation.
- Issue #115: safe-fetch primitives and a safe-site crawler are present in current main after PR #114, but the full provider-bound and local-fetch call-site inventory is not complete; no final disposition assigned.
- Finding revalidation: 0/97 complete at this checkpoint. All individual statuses remain `Not started — pending Wave 0 revalidation` until evidence is reviewed and logged.
- Code changes: none. Database changes/migrations: none. CI/workflow changes: none. Dependency changes: none. Deployments: none. PR/Issue mutations: none. Tests/commands: none executed.
- Safety: `VER-005` and `VER-006` remain historical-only and DO NOT RUN. No production or disposable database was contacted.
- Next action: complete SSRF call-site inventory and continue finding-by-finding revalidation against the pinned `main` SHA, updating this tracker after each coherent batch.


### Wave 0 batch 1 — security/crawler boundary and PR #117 overlap — 2026-11-08

- Baseline: `main` `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`.
- Revalidated findings: `SRC-001`, `SRC-009`, `SRC-013`, `SRC-022` (4/97 total). All four remain confirmed on the pinned main baseline. Per-finding evidence, file blob SHAs, line ranges, and inspected tests are appended to their individual finding records.
- SSRF inventory: all 18 `src/app/api/v1` route handlers were enumerated. Relevant URL ingress paths identified: `/audit/engine`, `/audit/free`, `/audit/premium`, `/content/studio`, `/optimization/technical`, `/crawl`, and `/crawler/start`. `/analysis/competitive` performs DNS validation only and documents that it does not crawl these URLs.
- Direct Firecrawl bypasses confirmed in `/audit/free`, `/content/studio`, and `/optimization/technical`: URL syntax validation only, followed by `firecrawlApp.scrapeUrl`; no local DNS-pinned validation before provider invocation.
- Legacy audit engine remains on native `fetch`: main crawler uses static `isSafeUrl` checks without DNS pinning; auxiliary robots/sitemap requests use default redirect-following fetch and do not revalidate redirect hops.
- Hardened paths observed: premium audit uses `crawlPublicSite`/`fetchPublicUrl`; `/crawler/start` delegates to the safe crawler; `/crawl` validates the seed host before provider selection and the internal provider uses DNS-validated safeFetch. The acquisition Firecrawl provider receives a prevalidated seed, but its remote `crawlUrl` adapter does not show provider-side redirect/domain restrictions; local DNS pinning cannot be claimed for the provider's own network.
- `SRC-009` remains valid: HTTP provider accepts discovered links from any HTTP(S) host; bytes are accumulated but no total-job byte cap is enforced; `/api/v1/crawl` exposes several policy fields and clamps redirects to plan limits but not all other resource fields to plan-specific entitlements.
- `SRC-013` remains valid: `/api/v1/audit/free` has no session/API-key authorization or rate limiter and invokes Firecrawl when configured.
- Issue #116: current `getSession()` LEFT JOINs `organization_members` and returns null when `m.role` is absent; `authorizeApiRequest()` rejects the resulting missing session. The membership schema has no soft-revocation/deletion column. Existing tests do not directly simulate an otherwise valid session row with a missing membership row; implementation appears fail-closed for deletion, but the direct regression test remains unverified. Issue #116 remains open; no issue mutation.
- PR #117 / `SRC-022`: current main invoice page still simulates payment success with a local timeout. PR #117 is open/unmerged, based on pinned main, and changes only the invoice page plus a new test. Its five non-neutral checks passed and one AI-review check is neutral; GitHub mergeable state is `unstable`. No PR mutation.
- GitHub code-search responses for `Firecrawl`, `scrapeUrl`, and `fetch` were marked incomplete with zero results; they were not used as proof of completeness. The inventory above is based on the complete main tree, all 18 API v1 routes, and the bounded crawler/audit/provider source set.
- No tests executed; no code, database, migration, CI, dependency, deployment, PR, or Issue changes.
- Next: continue the remaining finding groups and update the tracker after the next coherent batch.


### Wave 0 batch 2 — root files and operating/configuration controls — 2026-11-08

- Baseline: `main` `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`.
- Revalidated findings: `RF-001` through `RF-009` (9/97 in this batch; 13/97 total). Per-finding evidence, exact main blob SHAs and line ranges are appended to each record.
- `RF-001`: root helper paths referenced by `update_recon.sh` are absent; similarly named helpers exist under `scripts/dev-tools/`, but the script calls neither path. It does not fail closed before replacing the report.
- `RF-002`: visual verification script kills any listener on port 3000, uses a fixed sleep and embedded credentials, writes to a machine-specific path, and catches errors without a non-zero exit. It was not run.
- `RF-003`: `tests/db/` has no files, while the Vitest DB project and root config both allow no-test success. No test command was run.
- `RF-004`: Drizzle config retains a local superuser fallback, but package `db:push` executes a fail-closed guard first. Guard tests cover production markers, explicit authorization/disposable flags and database emptiness. The two inspected workflows use `drizzle-kit check`, not `drizzle-kit push`; no in-repository unguarded push workflow was found. Direct raw CLI invocation could bypass the package-script guard, so disposition is partially mitigated, not a proven in-repository destructive path.
- `RF-005`: `.env.example` marks local DB credentials as development-only, but `env-check` accepts any PostgreSQL URL format and a 16-character `SESSION_SECRET`; the documented placeholder is longer than that and is not rejected. Existing env-check tests cover mode selection only.
- `RF-006`: Next response headers still omit CSP; HSTS includes subdomains/preload, but actual domain eligibility is unverified.
- `RF-007`: `SPEC.md` and README in main do not define the digital-twin target-state lifecycle. The target architecture does, but only on the separate source-register branch and not in main.
- `RF-008`: AGENTS.md retains duplicate section 15 and malformed section 16 heading.
- `RF-009`: ProductionEmailSender still throws on send. With non-empty EMAIL_PROVIDER, invitation action selects it, logs asynchronous send failure, and returns success without raw token; the fallback only occurs when sender construction throws. Existing tests do not test production send failure.
- No scripts, tests, database commands, or migrations were executed. No code/config/CI/dependency/deployment/PR/Issue changes.
- Next: proceed to DB and schema findings, continuing to record each batch before moving on.

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
