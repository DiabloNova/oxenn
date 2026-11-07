# OXENN Architecture-Aligned Remediation — Execution Order

**Architecture:** `docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md`  
**Finding index:** `ai_tasks/baseline issues/README.md`  
**Audited baseline:** `main@7bd2b6ba04e18abbcaf772fac63f29c465a45a42`  
**Status:** Proposed dependency order. Implementation has not started.

This order covers 64 consolidated prior-audit problems (94 original IDs) and two new architecture-driven gaps (ARCH-001 and ARCH-002). Every finding must be revalidated against the current implementation immediately before work begins.

## Global execution rules

1. Implement only on a dedicated branch from the then-current `main`; never edit `main`.
2. Recheck open PRs and overlapping branch changes before touching shared files.
3. Revalidate each finding. If already fixed, stale, or out of scope, record the evidence and disposition instead of applying a stale fix.
4. Never run historical database probes marked HISTORICAL_ONLY / DO NOT RUN.
5. Use only a verified disposable PostgreSQL target for destructive migration and RLS tests.
6. Keep changes small, reviewable, and reversible. Shared schemas, migrations, tenant contracts, and provider interfaces need coordinated ownership.
7. A skipped or empty test suite is not a pass. Record commands, exact commit, environment, output, and limitations.
8. Preserve UNKNOWN, ZERO, MOCK, LIVE, and HYBRID as distinct states.
9. Resolve product/security policy decisions before the related implementation.
10. Keep the dashboard task frontend-only; this plan does not broaden TASK-21.

## Wave 0 — Revalidation and safe test foundation

**Goal:** confirm the live repository baseline and establish a safe verification environment.

- Confirm current `main`, open PRs, branch protections, and file overlap. At this review, PR #108 (`phase-1/auth-tenant-boundary`) and PR #109 (`phase-1/rls-state-contract`) remain open and are based on the older commit `1517034c5820fb2215567ad3dff2bf04da30c800`, not current main `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`. Reconcile/rebase/close them with their owners before changing overlapping auth, audit-engine, or RLS-contract files.
- Confirm whether the audited baseline still matches current main.
- Verify disposable PostgreSQL identity, runtime roles, active migration chain, and safe test commands.
- Inventory test discovery and provider credentials.
- Do not run `verification/phase-0/probe-system-context.ts` or `verification/phase-0/run_rls_matrix.js`.

**Exit gate:** exact baseline and PR overlap recorded; disposable database identity verified; no ambiguous target can receive destructive SQL.

## Wave 1 — Tenant isolation, privileged access, and fetch security

**Goal:** close high-impact security boundaries first.

- **001 (DB-001/SRC-003/TST-002/TST-003/VER-002):** define tenant ownership independently of policy presence; fix the five tenant-owned junction tables and align RLS, runtime inventory, reference matrix, and independent tests.
- **002 (SRC-002/TST-004/DOC-007/VER-004):** enforce privileged caller/table capabilities at the query boundary or replace generic system SQL with narrow repositories.
- **003 (SRC-001):** route all user-controlled fetches through DNS-pinned safe fetching; validate every redirect and enforce total body/deadline limits.
- **006 (SRC-009):** add aggregate crawl budgets, same-origin/allowlist policy, server-side plan clamps, and cancellation.
- **018 (SCR-002):** make database mutation tooling fail closed unless target identity and disposable status are verified.
- **044 (SRC-022):** remove false client-only payment-success claims or activation. Do not integrate a payment provider until one is selected and approved.

**Dependencies:** 001 establishes the ownership inventory used by tenant guards and tests. 003 and 006 should share the hardened fetch boundary but retain separate acceptance criteria.

**Exit gate:** two-tenant RLS/privilege tests pass on disposable PostgreSQL; user-controlled fetches obey DNS/redirect/body/deadline limits; ambiguous DB targets are rejected; unverified payment is never represented as successful.

## Wave 2 — Durable persistence, migrations, and execution records

**Goal:** make PostgreSQL and versioned migrations the reliable source of truth.

- **004 (SRC-004):** hydrate domain entities from PostgreSQL; keep in-memory repositories only for explicit demo/test mode.
- **007 (DB-004/SRC-015/DOC-004):** restore the crawl dispatcher contract in an active migration or replace it with supported transactional SQL; test claim, lease recovery, and completion on a fresh database.
- **017 (DB-002):** add migration preflight and reconciliation for text-to-UUID tenant conversion.
- **029 (SRC-011):** move network/model work outside long-lived tenant transactions.
- **030 (SRC-014):** use one audit ID end-to-end and never report durable success after failed persistence.
- **051 (DB-003):** decide soft-deleted organization slug reuse before changing uniqueness.
- **062 (DB-005):** trace imports before retiring legacy schema modules.

**Exit gate:** fresh and populated disposable database migration tests pass; reads survive process restart; crawl worker lifecycle works; failed writes cannot be reported as persisted success; schema source of truth is clear.

## Wave 3 — Evidence integrity and AI assessment correctness

**Goal:** prevent synthetic or untraceable information from appearing as measured product intelligence.

- **005 (DOC-005/SRC-005/006/007/TST-009):** enforce LIVE/MOCK/HYBRID provenance, remove automatic demo writes to real tenants, and align feature maturity claims.
- **013 (SRC-023):** persist a UUID brand and verify tenant ownership before an AEO audit.
- **014 (SRC-020):** return the final failed execution state and use verified brand-specific aliases/model identifiers.
- **027 (SRC-012):** enforce server-side payload, text, metadata, chunk, and retrieval ceilings.
- **028 (SRC-008):** prevent mock embeddings/entities/sentiment from entering production data; use one versioned embedding contract.
- **055 (SRC-026):** calculate citation shares from the final validated occurrence set.
- **050 (SCR-004):** preserve worker diagnostics and leave lifecycle transitions to the orchestrator.

**Dependencies:** 004 and Wave 2 persistence must be stable before removing demo fallbacks. 005 defines the provenance/mode contract used by 014, 028, and 055.

**Exit gate:** accepted assessment/evidence records identify source, provider/model, version, freshness, and mode; mock values are not stored as live measurements; missing data remains UNKNOWN.

## Wave 4 — Commercial entitlements and customer workflows

**Goal:** align service sales, usage, and user-facing workflows with the revised commercial architecture.

- **008 (SRC-010):** implement atomic durable quota reservation and consumption.
- **065 (ARCH-001):** model independent SEO/AEO/GEO SKUs, optional bundles, subscriptions, entitlements, and usage metering; keep customer products distinct from OXENN services.
- **037 (SRC-016):** complete invitation acceptance, email delivery handling, and durable expiry transitions.
- **038 (SRC-017):** preserve at least one active workspace administrator under concurrent changes.
- **058 (SRC-018):** decide email-verification policy before implementation.
- **021 (RF-009):** reconcile configured email provider with its actual send capability and fallback behavior.
- **060 (SRC-021):** decide public API scope; if approved, connect key lifecycle, middleware, and durable quotas.
- **042 (SRC-019/TST-008):** decide scheduled prompt/monitoring MVP scope; implement a real worker or label/disable placeholders.
- **061 (PUB-002):** decide PDF export scope; implement real generation only if approved.

**Dependencies:** 008 requires durable billing state. 065 depends on canonical subscription persistence and quota contracts. Public API, scheduled work, and PDF export are scope decisions, not assumed MVP commitments.

**Exit gate:** each enabled service has a server-side entitlement; quotas are durable and atomic; workspace workflows are recoverable; unavailable integrations are clearly disabled or labeled.

## Wave 5 — Test assurance and CI supply chain

**Goal:** make green checks prove that intended behavior actually ran.

- **009 (RF-003/VER-008):** prevent DB test project from passing with zero tests.
- **023 (TST-007):** assert an independently defined crawl transition matrix.
- **032 (TST-001):** include or explicitly classify tracked tests outside Vitest projects.
- **033 (TST-006):** make acquisition integration tests an explicit gate; distinguish skip from pass.
- **034 (TST-005):** test successful empty data separately from unavailable data.
- **035 (SCR-005):** await async checks and propagate failures.
- **049 (GHA-005):** resolve Vite/Vitest config-loader warning with a bounded change.
- **012 (GHA-001/002):** use supported immutable action references and verify workflow provenance.
- **048 (GHA-003):** declare least-privilege CI token permissions.
- **052 (GHA-006):** trace the exact dependency owner before proposing upgrades.

**Dependencies:** establish the intended test inventory before tightening gates. Use Dependency Upgrade Plan only after dependency owner, release compatibility, usage, tests, and rollback materials are known.

**Exit gate:** empty/skipped suites cannot appear green; required gates run on the implementation branch; CI actions are immutable and least-privilege.

## Wave 6 — Documentation, operational evidence, and product/asset decisions

**Goal:** make documents and customer-facing claims match verified implementation.

- **011 (VER-001/007/010/011/012):** preserve historical records and require exact commit/environment/command provenance for new verification.
- **020 (DOC-003):** correct superseded roadmap authority and stale paths.
- **024 (VER-009):** revalidate historical API productionization claims.
- **039 (RF-007/DOC-006/SRC-024):** Digital Twin target-state model is now captured in architecture; implementation remains deferred until scheduled in product scope.
- **040 (FNT-001/002/004):** verify font source, commercial rights, embedded license, and typography ownership before distribution.
- **041 (PUB-001/006):** reconcile provider/model taxonomy and product presentation.
- **043 (DOC-009):** verify route before correcting HTTP endpoint documentation.
- **045 (PUB-003):** choose canonical icons and correct metadata/theme mapping.
- **046/047 (PUB-004/005):** trace all consumers before optimizing/removing assets.
- **053 (RF-008):** correct AGENTS heading numbering without changing policy semantics.
- **054 (SCR-007):** align env-check parsing with runtime loader or document supported syntax.
- **057 (GHA-004):** decide whether old workflow is archival or active.
- **059 (SRC-025):** generate locale-specific metadata and font assignment.
- **063 (RF-006):** verify real domains/reporting destination before CSP/HSTS rollout.
- **064 (DOC-008):** separate workspace RBAC and platform-admin RBAC in docs, then verify source enforcement.
- **036 (VER-013):** recheck the time-bounded `braces` advisory against the exact release no later than 2026-11-19.

**Dependencies:** product/security policy decisions precede implementation. Font licensing precedes distribution. Historical evidence remains immutable context.

## Wave 7 — Interim LangChain adapter and later SCRS evaluation

**Goal:** adopt LangChain without allowing it to own OXENN business architecture.

- **066 (ARCH-002):** define the OXENN-owned runtime contract, implement LangChain behind it, and migrate one representative workflow first.
- Keep provider/model metadata, mode, provenance, cost, latency, errors, and trace identifiers.
- Do not expose LangChain types outside the adapter.
- Evaluate LangGraph only for a demonstrated multi-step orchestration need.
- Do not activate SCRS until its runtime/transport is operational and real OXENN workload comparisons pass.

**Dependencies:** Wave 3 provenance contracts, Wave 5 evaluation gates, and the AI workflow inventory.

**Exit gate:** one representative workflow passes contract, provenance, regression, latency, and cost evaluation through the OXENN-owned adapter; approvals and business state remain in OXENN.

---

## Final implementation gate

Start with Wave 0 revalidation, then follow the dependency order. Close a finding only with its acceptance evidence and updated disposition. Obtain explicit approval before any operation requiring unresolved product/security policy, production credentials, external providers, destructive database action, deployment, merge, or PR mutation.
