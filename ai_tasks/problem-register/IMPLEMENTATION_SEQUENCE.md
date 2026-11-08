# Dependency-Based Code Remediation Sequence

**Purpose:** arrange the 97 individual problem records into a technically safe order for later implementation.  
**This is not the full product Roadmap and does not authorize code changes.**  
**Source records:** [findings/](./findings/) · **Subject categories:** [categories/](./categories/README.md)

## Mandatory Wave 0 — Revalidation and safety gate

Before any implementation wave, revalidate **all 97 findings** against the then-current main branch, not only the historical audit baseline. Record for each item whether it remains valid, is already fixed, is superseded, is a policy decision, or is out of scope. Update the corresponding individual record with exact commit and evidence.

- Reconcile PR #108 and PR #109 with current main before touching overlapping auth/RLS files.
- Reconcile issue #115 with the full SSRF call-site inventory and issue #116 with workspace membership authorization.
- PR #117 is open and unmerged in the current check. Revalidate its head, checks, and current behavior before deciding whether SRC-022 still needs work; do not duplicate its patch or assume it is merged.
- Verify a disposable PostgreSQL target by positive identity before any database test or migration. Do not run `verification/phase-0/probe-system-context.ts` or `verification/phase-0/run_rls_matrix.js`; records VER-005 and VER-006 are historical-only safety warnings.
- Recheck the time-bounded dependency advisory in VER-013 against the exact release candidate by 2026-11-19.
- No production database, deployment, external provider, payment provider, or destructive command is authorized by this document.

## Implementation waves

### Wave 1 — Security, tenant isolation, and safe access boundaries

Establish explicit ownership and authorization contracts first. Coordinate DB-001 with the independent tenant inventory and tests; enforce privileged capabilities before relying on the registry; close SSRF/redirect/resource-abuse paths; then verify workspace-admin and email-verification policies. Do not run destructive database tooling until SCR-002 is independently verified.

- [DB-001](./findings/010-DB-001.md)
- [DOC-001](./findings/015-DOC-001.md)
- [DOC-002](./findings/016-DOC-002.md)
- [DOC-007](./findings/021-DOC-007.md)
- [DOC-008](./findings/022-DOC-008.md)
- [SCR-001](./findings/040-SCR-001.md)
- [SRC-001](./findings/047-SRC-001.md)
- [SRC-002](./findings/048-SRC-002.md)
- [SRC-003](./findings/049-SRC-003.md)
- [SRC-009](./findings/055-SRC-009.md)
- [SRC-012](./findings/058-SRC-012.md)
- [SRC-013](./findings/059-SRC-013.md)
- [SRC-017](./findings/063-SRC-017.md)
- [SRC-018](./findings/064-SRC-018.md)
- [SRC-023](./findings/069-SRC-023.md)
- [TST-002](./findings/074-TST-002.md)
- [TST-003](./findings/075-TST-003.md)
- [TST-004](./findings/076-TST-004.md)
- [VER-002](./findings/083-VER-002.md)
- [VER-004](./findings/085-VER-004.md)
- [RF-005](./findings/005-RF-005.md)
- [RF-006](./findings/006-RF-006.md)
- [SCR-002](./findings/041-SCR-002.md)

### Wave 2 — Canonical schema, persistence, and transaction contracts

ARCH-003 must be resolved before repository row mapping. Reconcile migration safety and slug policy, trace legacy schema imports, establish the active crawl dispatcher contract, then make PostgreSQL reads/writes durable and shorten transactions. SRC-016's invitation expiry/persistence portion belongs here; its email/UI completion remains coupled to Wave 4.

- [ARCH-003](./findings/097-ARCH-003.md)
- [DB-002](./findings/011-DB-002.md)
- [DB-003](./findings/012-DB-003.md)
- [DB-004](./findings/013-DB-004.md)
- [DB-005](./findings/014-DB-005.md)
- [SRC-004](./findings/050-SRC-004.md)
- [SRC-011](./findings/057-SRC-011.md)
- [SRC-014](./findings/060-SRC-014.md)
- [SRC-015](./findings/061-SRC-015.md)
- [SCR-003](./findings/042-SCR-003.md)
- [SRC-016](./findings/062-SRC-016.md)
- [DOC-004](./findings/018-DOC-004.md)

### Wave 3 — AI provider behavior and evidence integrity

Define LIVE/MOCK/HYBRID and provenance contracts before removing mock fallbacks. Stabilize persistence from Wave 2 first; then remove production fixture seeding, ensure provider selection is explicit, unify embedding spaces, correct execution state and derive metrics from final evidence.

- [DOC-005](./findings/019-DOC-005.md)
- [SRC-005](./findings/051-SRC-005.md)
- [SRC-006](./findings/052-SRC-006.md)
- [SRC-007](./findings/053-SRC-007.md)
- [SRC-008](./findings/054-SRC-008.md)
- [SRC-020](./findings/066-SRC-020.md)
- [SRC-026](./findings/072-SRC-026.md)
- [TST-009](./findings/081-TST-009.md)

### Wave 4 — Commercial entitlements and real workflow execution

Build the durable SKU/subscription/entitlement/usage model before quota consumers. Keep SEO/AEO/GEO independently purchasable and bundles optional. Reconcile PR #117 before touching payment UI; do not duplicate its work or treat it as complete while open/unmerged. Complete scheduled work and worker observability only when real execution is in scope. Finish the user-facing invitation/email flow from SRC-016 here.

- [ARCH-001](./findings/095-ARCH-001.md)
- [SRC-010](./findings/056-SRC-010.md)
- [SRC-021](./findings/067-SRC-021.md)
- [SRC-022](./findings/068-SRC-022.md)
- [SRC-019](./findings/065-SRC-019.md)
- [SCR-004](./findings/043-SCR-004.md)
- [TST-006](./findings/078-TST-006.md)
- [TST-007](./findings/079-TST-007.md)
- [TST-008](./findings/080-TST-008.md)

### Wave 5 — Test discovery, CI supply chain, and developer tooling

After the underlying contracts are stable, make test discovery and required gates truthful, resolve CI action/runtime/pinning/permissions, fix async harness and environment parser behavior, and make repository tooling fail safely. Coordinate root config changes to avoid conflicting module-mode or script changes.

- [RF-001](./findings/001-RF-001.md)
- [RF-002](./findings/002-RF-002.md)
- [RF-003](./findings/003-RF-003.md)
- [RF-004](./findings/004-RF-004.md)
- [GHA-001](./findings/028-GHA-001.md)
- [GHA-002](./findings/029-GHA-002.md)
- [GHA-003](./findings/030-GHA-003.md)
- [GHA-004](./findings/031-GHA-004.md)
- [GHA-005](./findings/032-GHA-005.md)
- [GHA-006](./findings/033-GHA-006.md)
- [SCR-005](./findings/044-SCR-005.md)
- [SCR-006](./findings/045-SCR-006.md)
- [SCR-007](./findings/046-SCR-007.md)
- [TST-001](./findings/073-TST-001.md)
- [TST-005](./findings/077-TST-005.md)
- [VER-007](./findings/088-VER-007.md)
- [VER-008](./findings/089-VER-008.md)
- [VER-012](./findings/093-VER-012.md)

### Wave 6 — Frontend, product documentation, assets, and historical evidence

Resolve product-scope decisions before editing authoritative specifications. Verify font source and commercial/web-embedding rights before activation. Only after route/service behavior is verified should documentation status claims and endpoint paths be corrected. Preserve historical verification artifacts and bind new evidence to exact commits.

- [RF-007](./findings/007-RF-007.md)
- [RF-008](./findings/008-RF-008.md)
- [RF-009](./findings/009-RF-009.md)
- [DOC-003](./findings/017-DOC-003.md)
- [DOC-006](./findings/020-DOC-006.md)
- [DOC-009](./findings/023-DOC-009.md)
- [FNT-001](./findings/024-FNT-001.md)
- [FNT-002](./findings/025-FNT-002.md)
- [FNT-003](./findings/026-FNT-003.md)
- [FNT-004](./findings/027-FNT-004.md)
- [PUB-001](./findings/034-PUB-001.md)
- [PUB-002](./findings/035-PUB-002.md)
- [PUB-003](./findings/036-PUB-003.md)
- [PUB-004](./findings/037-PUB-004.md)
- [PUB-005](./findings/038-PUB-005.md)
- [PUB-006](./findings/039-PUB-006.md)
- [SRC-024](./findings/070-SRC-024.md)
- [SRC-025](./findings/071-SRC-025.md)
- [VER-009](./findings/090-VER-009.md)
- [VER-010](./findings/091-VER-010.md)
- [VER-011](./findings/092-VER-011.md)
- [VER-013](./findings/094-VER-013.md)
- [VER-001](./findings/082-VER-001.md)
- [VER-003](./findings/084-VER-003.md)

### Wave 7 — LangChain interim adapter

Start only after the OXENN-owned runtime interface, provider modes, provenance, and evaluation gates are defined. LangChain remains inside an adapter; it must not own business state, permissions, quotas, approvals, or execution. SCRS remains a later candidate gated by real workload comparisons.

- [ARCH-002](./findings/096-ARCH-002.md)


## Historical / Non-executable Findings

The following two records remain part of the 97-finding inventory and their primary category membership, but are intentionally excluded from implementation Waves 1–7. They are historical safety warnings, not executable remediation assignments. Their exclusion does not change the mandatory Wave 0 requirement to revalidate all 97 findings; it explicitly prohibits executing or reusing the historical verification artifacts.

- [VER-005](./findings/086-VER-005.md) — **Blocked** · `HISTORICAL_ONLY / DO NOT RUN`. The historical `probe-system-context.ts` can fall back to a local PostgreSQL superuser target, print the database URL, and mutate application state without reliable cleanup. Do not execute or reuse it; any future verification requires a newly designed harness that positively verifies a disposable database target.
- [VER-006](./findings/087-VER-006.md) — **Blocked** · `HISTORICAL_ONLY / DO NOT RUN`. The historical `run_rls_matrix.js` hardcodes database targeting and role credentials without positively verifying target identity. Do not execute or reuse it; any future verification requires a maintained runner that proves the target is disposable before connecting.


## Dependency rules

1. ARCH-003 precedes SRC-004 and any brand/page/diagnostic persistence rewrite.
2. DB-001, SCR-001, SRC-003, DOC-001, TST-002, and TST-003 must be treated as one tenant-ownership/enforcement contract, while each finding remains a separate acceptance record.
3. SRC-001 and SRC-009 share the safe-fetch boundary but retain distinct SSRF and crawl-budget acceptance criteria.
4. DB-004, DOC-004, and SRC-015 share the crawl dispatcher provenance issue; active implementation must be proven before documentation is updated.
5. SRC-005 through SRC-008 depend on durable persistence and explicit provenance/mode contracts; do not remove mock behavior before defining a safe explicit demo/test boundary.
6. ARCH-001 precedes durable quota enforcement in SRC-010 and any public API entitlement work in SRC-021.
7. Payment state in SRC-022 cannot activate a subscription or entitlement without verified server-side settlement.
8. ARCH-002 comes after provider mode, provenance, and evaluation contracts; SCRS activation is a separate future decision.
9. Product/documentation decisions precede edits to authoritative product scope; font licensing precedes font activation or redistribution.
10. A test or CI gate must not be declared green when its required suite is empty, skipped, or not invoked.

## Execution constraints

- Each implementation change must reference the relevant individual finding file(s) and update its status with evidence.
- Related findings may share one code change where appropriate, but they must retain separate acceptance criteria and separate closure evidence.
- Do not start parallel changes that modify the same schema, migration, workflow, tenant boundary, or repository contract without an explicit shared owner and file boundary.
- Resolve product/security policy questions before implementing behavior that depends on them.
- Re-check open PRs/issues and current main before every implementation wave.
- The dashboard task remains frontend-only; this sequence does not authorize backend scope expansion.
- This sequence is a dependency proposal. Final implementation scope and start require the user's explicit approval.
