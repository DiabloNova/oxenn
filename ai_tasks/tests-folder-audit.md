# Tests Folder Audit

- Repository: `DiabloNova/oxenn`
- Branch: `docs/product-roadmap-baseline-2026-11`
- Audited snapshot: `fe2160e3498c070a0598870ab4e6b3c9885912aa`
- Scope: `tests/` only; static review of all 112 tracked files (approximately 715 KB).
- Method: complete recursive tree inventory, retrieval and decoding of all 112 files, line-level review of critical test suites, test-case inventory, and cross-check against the completed `src/`, `database/`, and `scripts/` audits and the agreed target architecture.
- Execution boundary: **no tests, builds, lint, typecheck, browser, database, migration, worker, or provider commands were run.** No application/test source files were modified.

## Executive summary

The repository has meaningful test coverage in several important areas, especially session-derived identity, localized routing, SSRF-safe fetching, crawl policy bounds, public API key/quota behavior, cost-control calculations, and static RLS migration verification. However, the suite is not a reliable acceptance layer for the newly agreed Oxenn architecture yet.

The most consequential test-quality issue is that the RLS isolation harness explicitly classifies five tenant-owned relationship tables as global. This aligns with the already confirmed database and source findings and means the harness excludes those tables from its tenant isolation verification. A second major issue is that files titled PostgreSQL integration tests exercise static in-memory stores rather than actual PostgreSQL persistence, which can create false confidence around the repository persistence defects already identified in `src/`.

The tests also largely describe the legacy product structure—admin, audit engine, AI visibility, crawler, RAG, dashboard services—and do not define acceptance contracts for the target Digital Twin / Decision Twin, evidence-to-decision reasoning chain, provenance gates, planning and execution approvals, or outcome verification. This is a scope and architecture-alignment gap, not a claim that those planned capabilities should already be implemented in the current code.

## Inventory and test topology

- 112 tracked files, approximately 715 KB, across the `tests/` tree.
- 105 files use a `.test.ts` or `.test.tsx` filename.
- 68 files import Vitest; one uses Node's built-in test API.
- 67 test-named files contain an `it()` or `test()` registration.
- 38 test-named files contain no `it()` or `test()` registration. Thirteen of these export custom `test*` functions intended for bespoke runners; other files rely on separate/manual execution patterns or need runner inclusion to be established.
- One explicit `it.todo()` remains in `tests/unit/services/workspace/workspace.test.ts`.
- Several legacy suites are self-running scripts with bespoke `run-all.ts` entry points rather than ordinary test-framework suites.
- No execution was performed to establish which custom runners are included in CI or to measure pass/fail status. Filename presence is not evidence that a suite is actually executed.

## Target-architecture alignment

The agreed target is a product and technical architecture materially broader than the legacy service catalog. The audit uses this as a target-state reference, not as a requirement to retrofit every legacy test immediately.

| Target capability / layer | Evidence in current tests | Alignment assessment |
|---|---|---|
| Product Intelligence Profile / business reality model | Brand, organization, website, and dashboard fixtures exist | Partial legacy coverage; no canonical reality-state contract or provenance-aware profile lifecycle |
| Digital Product Assessment (SEO/AEO/GEO) | Many SEO, AEO, AI-visibility, competitive, and audit tests | SEO/AEO coverage exists; GEO/geo-market intelligence is not represented as a distinct end-to-end acceptance domain |
| Product Value & Competitiveness / AI buyer perception | Competitive SEO/AI and competitor discovery tests | Partial; several related source paths were found to use synthetic scoring or fixture data |
| Product Evidence Graph | Knowledge graph, vector-store, ingestion, and RAG tests | Partial foundations; key tests use in-memory SQL interception or tolerate empty retrieval; evidence lineage and provenance contracts are not verified end-to-end |
| AI Intelligence Pipeline | Acquisition, normalization, crawler, ingestion, and AI tests | Stronger unit coverage in safe fetch and crawl boundaries; incomplete end-to-end coverage from raw acquisition through normalized evidence and validated intelligence |
| Deterministic Reasoning Orchestrator / Context Builder / Capsule Engine | No clear corresponding contract or dedicated test suite found | Not represented as explicit architecture boundaries in the test corpus |
| Contract & Provenance Gates | Some validation and schema/security tests | No end-to-end gate tests for source provenance, confidence, freshness, versioned contracts, or UNKNOWN versus ZERO semantics |
| Decision & Execution Engine / Planning & Execution Engine | Crawl dispatcher and prompt execution tests | Legacy job execution is covered in places; no target-state decision plan, approval, execution trace, rollback/compensation, and outcome-verification lifecycle |
| Digital Twin / Decision Twin | No occurrences of “Digital Twin” or “Decision Twin” in the 112 files | No acceptance tests for real/estimated/target state, gap computation, simulations, action recommendations, or twin evolution |
| AI copilot / conversational interface | Prompt-intelligence and LLM-related tests | Partial legacy prompt tests; no dialogue-to-plan-to-approved-execution contract |
| Shared LLM Provider Adapter and capability states | One unit test explicitly expects MockLLMClient in test mode | Mock path is covered; provider contract conformance, production selection/failure behavior, and explicit LIVE/MOCK/HYBRID capability states are not adequately established |
| Telemetry & Evaluation | Observability tests and cost-control tests | Partial technical coverage; no target-pipeline quality evaluation, evidence-quality metrics, or outcome-based model evaluation |
| PostgreSQL / pgvector persistence | RLS migration verifier, isolation harness, public API DB tests, acquisition integration script | Mixed: some real DB tests exist, but multiple “Postgres integration” and vector tests are simulated; RLS table inventory is incomplete |

### Required architectural interpretation

The findings below must not be translated directly into implementation tasks against the old architecture. During the later architecture reconciliation phase, each finding must be classified as one of:

1. **Retain:** the invariant remains required in the new architecture (for example tenant isolation, provenance, bounded acquisition, authorization, and auditability).
2. **Reassign:** the invariant remains, but its owner moves to a new domain or layer.
3. **Replace:** the old service/test contract is superseded by a versioned target-architecture contract.
4. **Retire:** the old capability or test is no longer part of the accepted product scope.
5. **Defer:** the capability belongs to a later architecture phase and should receive an explicit future acceptance contract.

The target technical flow to reconcile against is: Application Layer → AI Intelligence Pipeline (acquisition, normalization, evidence extraction/classification) → deterministic Reasoning Orchestrator → Context Builder → Capsule Engine → Knowledge/Reasoning Graph → Contract & Provenance Gates → validated intelligence → Decision & Execution Engine. Shared cross-cutting capabilities include the LLM Provider Adapter, Telemetry & Evaluation, and PostgreSQL/pgvector persistence. The product-level Digital Twin must distinguish real, estimated, and target data, preserve evidence lineage, and support gap analysis, planning, approvals, execution, and outcome verification.

## Findings

### TST-001 — P1: Tenant-isolation harness classifies five tenant-owned relationship tables as global

**Evidence**
- `tests/isolation/suite.ts:8-23` includes `pages_keywords`, `pages_topics`, `pages_entities`, `keywords_topics`, and `topics_entities` in `GLOBAL_TABLES`.
- `tests/isolation/suite.ts:292-295` iterates only `TENANT_SCOPED_TABLES` for tenant table fixtures and verification.
- `tests/isolation/suite.ts:335` again runs the runtime isolation checks only for `TENANT_SCOPED_TABLES`.
- `tests/unit/core/tenant-context/tenant-tables.test.ts:20-42` checks a hard-coded list of required tables but omits all five relationship tables.

**Assessment**

These tables were confirmed in the database audit as tenant-owned and were found to lack the expected RLS policy coverage. By explicitly placing them in the global allowlist, the integration harness excludes them from the tenant-isolation loop. The schema-derived-set test can still pass while the required domain classification is wrong: it checks agreement between derived/runtime metadata, not the correctness of the tenant-vs-global decision itself.

**Cross-references:** DB-001, SRC-003, SCR-001. This is a confirmed test-coverage defect and a false-negative risk for tenant isolation, not a new claim about database runtime behavior.

### TST-002 — P1: “PostgreSQL integration” admin tests verify the in-memory repository store, not PostgreSQL persistence

**Evidence**
- `tests/features/admin/infrastructure/postgres-integration.test.ts:6-18` imports PostgreSQL-named repository classes but resets them with `PostgresTenantRepository.seed([])` and `PostgresAdminUserRepository.seed([])`.
- `tests/features/admin/infrastructure/postgres-integration.test.ts:64-67` saves and reads the repository object and labels the result PostgreSQL persistence.
- `tests/features/admin/infrastructure/postgres-integration.test.ts:99-101` verifies soft deletion through `PostgresTenantRepository.getRawStore()`.
- `tests/features/admin/infrastructure/persistence.test.ts:17-18, 63-68, 98-101` follows the same static-store pattern.

**Assessment**

The assertions demonstrate behavior of the in-process store, not a fresh database connection, SQL persistence, process restart, or cross-instance visibility. The test title and messages therefore overstate what is validated. This directly intersects SRC-004, where the source audit found PostgreSQL repository paths returning process-local maps instead of persisted rows. The current tests cannot disprove that defect and may conceal it.

### TST-003 — P1: Privileged-path tests do not test the registry's declared least-privilege constraints

**Evidence**
- `tests/unit/core/tenant-context/privileged-paths.test.ts:20-26` tests rejection of an unregistered purpose tag.
- `tests/unit/core/tenant-context/privileged-paths.test.ts:29-55` tests audit insertion for a registered purpose.
- `tests/unit/core/tenant-context/privileged-paths.test.ts:58-90` tests an error audit record when the callback throws.

**Assessment**

The tests do not exercise whether a registered path's `callerModule` and `allowedTables` are enforced against the actual caller and queried table set. They validate registration/purpose lookup and audit logging, not the complete authorization boundary. This leaves SRC-002 unguarded by a regression test.

### TST-004 — P2: Empty-state tests assert service failure rather than a successful empty result

**Evidence**
- `tests/actions/empty-states.test.ts:25-34` describes a well-typed empty brand-intelligence state but expects `success === false` and a `ServiceUnavailable` error.
- `tests/actions/empty-states.test.ts:36-44` does the same for citation intelligence.
- The repository methods are mocked to return empty data at lines 26 and 37-38, but the expected result is a database-unavailable failure.

**Assessment**

The test names and the assertions express different contracts. They do not prove that a tenant with zero brands or zero citations receives a valid empty state. In the new architecture this distinction is especially important: “no evidence / not yet measured” must not be collapsed into a service failure or into a numeric zero. Revisit this test only after the owning application contract is settled.

### TST-005 — P2: AI-intelligence runner globally replaces PostgreSQL query behavior with an in-memory simulator

**Evidence**
- `tests/features/ai-intelligence/run-all.ts:17-18` creates a process-local embedding store.
- `tests/features/ai-intelligence/run-all.ts:33-35` globally replaces `Pool.prototype.query`.
- `tests/features/ai-intelligence/run-all.ts:37-86` intercepts vector insert/search SQL and implements the result using an in-memory array and local cosine calculation.
- `tests/features/ai-intelligence/run-all.ts:88-118` similarly serves organization queries from the in-memory `db` map.

**Assessment**

This runner can validate selected application behavior under its simulator, but it is not a PostgreSQL/pgvector integration test. Global prototype replacement also makes the behavior of the suite dependent on its custom runner and process isolation. Its results must not be used as evidence that production persistence, RLS, pgvector operators, or multi-process consistency work.

### TST-006 — P2: Vector-store test treats an empty similarity-search result as success

**Evidence**
- `tests/features/ai-intelligence/vector-store.test.ts:50-73` performs a similarity query under Tenant A.
- `tests/features/ai-intelligence/vector-store.test.ts:63-66` explicitly accepts zero results and logs that the empty result is expected in offline simulation mode.
- `tests/features/ai-intelligence/run-all.ts:60-86` supplies the mock SQL search implementation.

**Assessment**

The test checks that any returned row belongs to the tenant, but it does not require that an inserted, matching vector can be retrieved. An empty result therefore passes the test without proving retrieval correctness. This is a coverage gap for the Evidence Graph / retrieval foundation and does not validate the SRC-008 embedding compatibility issue.

### TST-007 — P2: Bespoke test runners can report success without waiting for asynchronous event work to finish

**Evidence**
- `tests/features/admin/run-all.ts:27-33` prints the all-passed message from an unawaited 100 ms `setTimeout`.
- `tests/features/ai-intelligence/run-all.ts:195-200` uses the same unawaited timer before printing that all suites passed.
- The AI runner comment says it is waiting for asynchronous event-bus execution, but the timer does not establish that all queued handlers have completed.

**Assessment**

The success message is not tied to a deterministic drain/flush or completion signal for asynchronous event work. A delayed handler can still be running when the runner prints success. This is a runner reliability risk, not proof that a particular handler currently fails.

### TST-008 — P2: Acquisition integration coverage is conditional and can silently skip when no database URL is configured

**Evidence**
- `tests/features/acquisition/integration/run-all.ts:101-107` returns normally after logging “suite skipped” when `DATABASE_URL` is absent.
- The same script exercises tenant context, job deduplication, dispatch claim/recovery, lease ownership, and a local HTTP crawl through lines 142-347.

**Assessment**

The script contains valuable end-to-end coverage, including dispatcher functions associated with DB-004/SRC-015. However, a successful process exit without a database does not mean those integration checks ran. The run record must distinguish “passed” from “skipped”; this audit did not execute the script or determine CI invocation.

### TST-009 — P2: Workspace service behavior is explicitly unimplemented in the test suite

**Evidence**
- `tests/unit/services/workspace/workspace.test.ts:3-5` contains only one `it.todo()` and no assertions.

**Assessment**

Workspace membership, role lifecycle, and workspace-level behavior are important cross-cutting foundations for tenant ownership and the target product workspace model. This is a confirmed coverage gap; it does not independently establish a runtime defect.

### TST-010 — P2: Inngest tests verify placeholder registration, not scheduled execution

**Evidence**
- `tests/unit/inngest/inngest-integration.test.ts:7-10` checks that the client exists.
- `tests/unit/inngest/inngest-integration.test.ts:12-17` checks that the scheduled function exists and has the name `scheduled-monitoring-placeholder`.
- `tests/unit/inngest/inngest-integration.test.ts:19-23` checks only that route handlers are truthy.

**Assessment**

No schedule trigger, event execution, retry, idempotency, failure handling, or monitoring outcome is asserted. The test explicitly blesses a placeholder. This aligns with SRC-019: a function being registered is not evidence that scheduled monitoring performs work.

### TST-011 — P2: Billing tests cover plan constants, not the payment lifecycle

**Evidence**
- `tests/unit/features/billing/subscription.test.ts:4-17` checks plan IDs, selected entitlements, and one quota value only.

**Assessment**

There is no corresponding test in this folder for checkout initiation, provider callbacks/webhooks, payment verification, invoice state transitions, or durable payment records. Consequently, the tests do not detect the local-timer-only payment success path described in SRC-022.

### TST-012 — P2: LLM tests prove the mock path, not provider selection or production capability state

**Evidence**
- `tests/unit/services/ai/ai.test.ts:39-46` explicitly asserts that `getLLMClient()` returns `MockLLMClient` in the test environment.
- No test file in the audited tree names a LIVE/MOCK/HYBRID capability contract or exercises a real provider adapter contract end-to-end.

**Assessment**

A mock unit test is useful and expected, but it does not validate provider selection, credential/configuration failures, provider-specific response normalization, fallback labeling, or the boundary between measured and simulated outputs. This matters for the target architecture, which requires explicit capability state and must not present mock output as live evidence. Cross-reference SRC-007 and SRC-008.

### TST-013 — P2: No tests define the Digital Twin / Decision Twin product contract

**Evidence**
- A full text scan of all 112 decoded test files found no occurrence of “Digital Twin” or “Decision Twin”.
- No dedicated tests were found for real-versus-estimated-versus-target state, gap computation, twin versioning, counterfactual scenarios, or target-state progression.

**Assessment**

The test suite reflects the older SEO/AEO/AI-visibility service catalog and does not yet encode the user's target Digital Twin workflow. This is an architecture-scope gap, not a claim that the current code should already pass such tests. Acceptance contracts must be designed after the architecture's domain ownership and MVP sequencing are confirmed.

### TST-014 — P2: No end-to-end tests cover the target reasoning and provenance chain

**Evidence**

No dedicated test suite was identified for the full sequence of deterministic Reasoning Orchestrator → Context Builder → Capsule Engine → Knowledge/Reasoning Graph → Contract & Provenance Gates → validated intelligence → Decision & Execution Engine.

**Assessment**

Existing graph, ingestion, and RAG tests cover fragments, but they do not establish evidence lineage, source freshness, confidence semantics, versioned contracts, contradiction handling, UNKNOWN≠ZERO, or the complete transition from validated intelligence to a decision. This is a key target-architecture acceptance gap.

### TST-015 — P2: Plan-level quota and budget enforcement is not proven by the current tests

**Evidence**
- `tests/features/public-api/public-api.test.ts:106-160` includes real database-oriented public API quota consumption and a concurrent quota test.
- `tests/unit/services/cost-control/cost-control.test.ts:25-93` tests price calculations, quota metadata, and the in-process budget service.
- No test in the folder demonstrates persisted enforcement of the broader workspace plan quotas identified in SRC-010.

**Assessment**

The public API quota tests are useful and should be retained if the public API remains in scope. They do not prove enforcement of crawl, observation, brand, prompt, and monthly token quotas across all product domains or across multiple processes. Reconcile the quota owner and enforcement contract with the new architecture before extending these tests.

### TST-016 — P2: Legacy SSRF route coverage is not equivalent to the newer safe-fetcher coverage

**Evidence**
- `tests/unit/services/crawler/safe-http-fetch.test.ts:79-257` covers public/private IP classification, DNS validation, redirect revalidation, response-size limits, compression handling, and timeouts for the newer crawler fetch path.
- `tests/unit/features/acquisition/fetcher.test.ts:24-225` covers pinned addresses, redirects, response limits, and cancellation for acquisition.
- `tests/unit/api/v1/analysis/competitive.test.ts:177-252` checks a shared deadline and unsafe URL rejection for competitive analysis.

**Assessment**

These are positive, substantial tests for the safer paths. They do not automatically cover the legacy audit-engine route identified in SRC-001, which follows a different extractor/redirect path. The new architecture reconciliation must decide whether the legacy route is retired, routed through the shared acquisition boundary, or retained with its own explicit security contract. Do not assume tests for one fetcher protect another.

### TST-017 — P2: Crawl tests do not establish the aggregate resource and same-origin invariants identified in the source audit

**Evidence**
- The fetcher tests assert per-request redirect, timeout, and response-size behavior.
- The acquisition integration script uses a one-page local HTTP server scenario at `tests/features/acquisition/integration/run-all.ts:295-347`.
- No end-to-end test was identified for a total crawl byte budget across many pages or for preventing every discovered external link from being fetched.

**Assessment**

Unit tests for individual response limits are valuable, but they do not prove an aggregate crawl budget or the intended origin boundary across a multi-page crawl. This is a test coverage gap related to SRC-009.

### TST-018 — P2: Legacy feature tests use memory fixtures that cannot prove production tenant isolation

**Evidence**
- `tests/features/ai-intelligence/security.test.ts:70-101` creates repository instances and checks cross-tenant behavior using the feature repository abstraction.
- `tests/features/ai-intelligence/tenant-pipeline.test.ts:24-42` directly seeds `db.brands` in a process-local map.
- `tests/features/ai-intelligence/run-all.ts:88-118` intercepts organization SQL and resolves it from the in-memory `db` map.

**Assessment**

These tests can validate domain guard behavior, but they do not establish PostgreSQL RLS isolation or cross-process persistence. Their results must be kept separate from database-level tenant-isolation evidence. Cross-reference SRC-004 and DB-001.

### TST-019 — P1: Isolation suite can drop a fixed local database name with FORCE

**Evidence**
- `tests/isolation/suite.ts:30-35` hard-codes the test database as `localhost:5432/isolation_test_db` and the administrative connection as `localhost:5432/postgres`.
- `tests/isolation/suite.ts:39-45` drops the existing `isolation_test_db` with `FORCE` when it already exists, then recreates it.

**Assessment**

Running this suite against a local PostgreSQL instance where that fixed database name contains data will forcibly drop it. The test file does not derive the database name from an isolated per-run identifier or require a separate explicit safety confirmation. This is a confirmed destructive test-harness behavior; no database was contacted during this audit.

### TST-020 — P3: Test discovery and execution conventions are fragmented

**Evidence**
- Thirty-eight test-named files have no `it()` or `test()` registration.
- Thirteen files export custom `test*` functions and depend on bespoke `run-all.ts` runners.
- `tests/features/acquisition/run-all.ts` is only `export {};`.
- Some custom runners are self-invoking scripts while other test-named files are imported by a runner; the tree alone does not prove all are wired into CI.

**Assessment**

The repository has multiple execution conventions. This makes it difficult to infer from filenames or a single test command which acceptance checks actually ran. The next test-infrastructure review should map every test file to an explicit runner/CI job and distinguish registered, manually invoked, skipped, and orphaned suites. This audit did not inspect or alter CI configuration as part of the tests-only scope.

### TST-021 — P3: Some architecture-oriented tests validate source text or symbol presence rather than observable behavior

**Evidence**
- `tests/unit/services/monitoring/repository.test.ts:5-20` asserts that repository source text contains specific `TenantContextManager` method strings.
- `tests/unit/services/monitoring/tenant-isolation.test.ts:5-16` checks table-list membership and a query matcher, not a real database isolation scenario.
- `tests/unit/inngest/inngest-integration.test.ts:7-23` checks that imported symbols and route handlers are truthy.

**Assessment**

These checks can protect narrow conventions, but they can pass while runtime behavior is incorrect or while the architecture has moved. Retain source-level tests only where they enforce a deliberate static rule; target architecture acceptance should primarily assert externally observable contracts and invariants.

## Positive coverage worth preserving during architecture reconciliation

- **Session identity and authorization:** `tests/unit/api/v1/session-derived-identity.test.ts`, `tests/unit/api/v1/tenant-auth-boundaries.test.ts`, `tests/unit/services/auth/authorize-api-request.test.ts`, and `tests/unit/authorization-lifecycle.test.ts` cover forged identity headers, session-derived tenant identity, stale role snapshots, and rate-limit behavior.
- **Acquisition security:** `tests/unit/services/crawler/safe-http-fetch.test.ts` and `tests/unit/features/acquisition/fetcher.test.ts` have detailed DNS/IP, redirect, response-byte, timeout, and cancellation scenarios.
- **Competitive preflight:** `tests/unit/api/v1/analysis/competitive.test.ts` explicitly covers a shared aggregate deadline for URL validation, consistent with the positive source-audit observation.
- **Public API quotas:** `tests/features/public-api/public-api.test.ts` includes database-oriented API-key hashing, authentication, quota consumption, and concurrent quota checks.
- **RLS migration static verification:** `tests/unit/scripts/database/verify-rls-migrations.test.ts` covers dynamic and static RLS-changing DDL inside DO blocks and function/procedure bodies. Its value is limited by the separate incomplete tenant table classification in TST-001.
- **Workspace administration:** `tests/unit/app/actions/account.test.ts` includes a “sole admin” scenario, which is relevant to SRC-017.
- **Localization and accessibility behavior:** `tests/ui/language-routing.test.tsx` covers locale switching, route preservation, transition recovery, and keyboard/mobile dock interactions.
- **Cost calculations:** `tests/unit/services/cost-control/cost-control.test.ts` includes pricing semantics and concurrency-oriented budget checks, although persisted cross-process enforcement remains unproven.

## Reconciliation queue for the later architecture phase

This is deliberately **not** a remediation plan. It records the test contracts that must be reassigned or redesigned once the new architecture's domain ownership and delivery sequence are finalized.

1. Tenant isolation and privileged access: correct tenant/global classification, RLS policy coverage, caller identity, allowed-table enforcement, and auditable system operations.
2. Persistence and evidence: durable writes/reads across process boundaries, tenant-scoped evidence lineage, pgvector behavior, and deterministic retrieval.
3. Acquisition and normalization: shared outbound-fetch boundary, DNS/redirect controls, origin policy, aggregate budgets, provenance, and reproducible failure semantics.
4. Intelligence quality: explicit live/mock/hybrid modes, provider adapter contracts, measured-versus-simulated status, confidence, freshness, and UNKNOWN≠ZERO.
5. Reasoning contracts: deterministic orchestration, context/capsule versioning, evidence graph, contradiction handling, provenance gates, and validated intelligence output.
6. Digital Twin and decisions: real/estimated/target state, gap computation, simulations, decision records, approval requirements, execution plans, action audit trail, and outcome verification.
7. Operations: scheduled execution, retries/idempotency, quotas, billing/payment verification, telemetry, and evaluation.
8. Test harness safety and observability: safe isolated database lifecycle, explicit runner registration, truthful skip reporting, deterministic async draining, and clear distinction between mock and real integration tests.

## Final status

The `tests/` folder has been statically inventoried and reviewed. Findings are recorded without changing source or executing tests. All findings remain subject to the mandatory new-architecture reconciliation stage before any remediation proposal is authored. The next root folder must not be opened until the user explicitly approves it.
