# tests Folder Audit

- **Repository:** `DiabloNova/oxenn`
- **Branch:** `docs/product-roadmap-baseline-2026-11`
- **Audited tree commit:** `fe2160e3498c070a0598870ab4e6b3c9885912aa`
- **Audit date:** 2026-11-07
- **Scope:** Complete recursive contents of `tests/` only
- **Inventory:** 112 tracked files; 715,369 bytes of source/text; complete recursive Git tree, not truncated.
- **Method:** Retrieved all 112 blobs and statically inspected the test sources, test runners, discovery configuration and package scripts. Cross-checked findings against the previously audited source/database/scripts reports and the approved target-architecture decisions. No test, build, lint, typecheck, browser, database, migration, worker, or production command was run.

## 1. Executive summary

The test tree contains useful foundations, including focused unit tests for safe outbound HTTP, authentication, tenant context, AI ingestion/RAG, UI routing, and a real-PostgreSQL acquisition integration harness. However, the repository's standard Vitest commands do not discover most of the tracked test tree, and several tests provide weaker assurance than their names imply.

The most consequential test-suite issues are:

1. Tenant-owned junction tables are explicitly classified as global by the isolation suite, so they are excluded from tenant-isolation checks.
2. The tenant-table alignment test compares two sets derived from the same policy-bearing schema snapshot and does not independently assert the five known tenant-owned junction tables.
3. Privileged database tests validate purpose registration and audit logging but do not test enforcement of the registry's declared `callerModule` and `allowedTables`.
4. The files and suites selected by Vitest cover only a subset of the 112 tracked files; the configured DB project has no matching tests and allows an empty run.
5. Two tests named as empty-state checks actually assert a `ServiceUnavailable` failure, not successful empty data.
6. The acquisition integration runner silently exits successfully when `DATABASE_URL` is absent and is not part of the normal Vitest projects or package test scripts.

These are findings about test coverage, test correctness, and test execution. They do not, by themselves, prove every corresponding production defect. Related production findings are cross-referenced below.

## 2. Inventory and discovery

The complete `tests/` tree contains 112 files:

| Area | Files |
|---|---:|
| `tests/unit/` | 60 |
| `tests/features/` | 19 |
| `tests/services/` | 24 |
| `tests/ui/` | 4 |
| `tests/actions/` | 1 |
| `tests/isolation/` | 1 |
| `tests/scripts/` | 1 |
| `tests/helpers/` | 1 |
| `tests/setup/` | 1 |
| **Total** | **112** |

The corpus contains approximately 438 `it(` declarations. The count is a static source count, not a claim that 438 tests were executed.

### Vitest discovery boundary

- `vitest.config.ts:14-22` includes only `tests/unit/**/*.test.ts(x)` in the `unit` project.
- `vitest.config.ts:23-30` includes only `tests/db/**/*.test.ts` in the `db` project and sets `passWithNoTests: true`.
- `vitest.config.ts:31-39` includes only `tests/ui/**/*.test.ts(x)` in the `ui` project.
- No files were present under `tests/db/` in the audited tree.
- `package.json` exposes `test`, `test:unit`, `test:db`, `test:ui`, `test:acquisition`, and `test:isolation`. The acquisition command targets only `tests/unit/features/acquisition`; there is no package script for the custom suites under `tests/features/` or the legacy suites under `tests/services/`.

Consequently, the configured Vitest projects discover 64 of the 112 tracked files (60 unit and four UI files). The remaining 48 files are outside those project include patterns. Some are manually executable or imported by custom runners, but the package scripts do not establish that the complete set is part of the normal test gate. The separate isolation suite is explicitly wired through `test:isolation`; its existence should not be confused with coverage in `test` or `test:db`.

## 3. Findings

### TST-001 — Most tracked test files are outside the configured Vitest projects

- **Severity:** P2 — test execution and regression assurance
- **Confidence:** Confirmed.
- **Evidence:**
  - `vitest.config.ts:14-39` limits discovery to `tests/unit/**`, `tests/db/**`, and `tests/ui/**`.
  - The audited tree contains 19 files under `tests/features/`, 24 under `tests/services/`, and additional test/support files under `tests/actions/`, `tests/scripts/`, and `tests/isolation/`.
  - `package.json` has no general script that invokes the custom `tests/features/**/run-all.ts` suites or the `tests/services/` suites. The only acquisition command selects `tests/unit/features/acquisition`.
- **Impact:** A contributor or CI job can receive a successful result from the standard Vitest commands while a substantial portion of the tracked test corpus has not been discovered. The custom suites may be useful, but their execution is not demonstrated by the standard test entry points.
- **Architecture alignment:** The target architecture requires tests to follow explicit domain/application/infrastructure boundaries and to provide dependable regression gates. A test file that is not in an invoked project is not an effective gate for its domain.
- **Cross-references:** RF-003 (empty DB project / passWithNoTests), SRC-019 (scheduled jobs), and the feature-specific source findings.

### TST-002 — Tenant-owned junction tables are explicitly excluded from isolation checks as global tables

- **Severity:** P1 — tenant-isolation assurance
- **Confidence:** Confirmed test-classification error; production impact is separately evidenced by DB-001.
- **Evidence:**
  - `tests/isolation/suite.ts:8-23` places `pages_keywords`, `pages_topics`, `pages_entities`, `keywords_topics`, and `topics_entities` in `GLOBAL_TABLES`.
  - `tests/isolation/suite.ts:525-538` subsequently describes these tables as global and intentionally excluded from isolation, then checks that they are readable without tenant context.
  - The database audit established that these five organization-owned junction tables carry tenant ownership but lack the expected RLS policies.
- **Impact:** The isolation suite encodes the same incorrect classification as the underlying policy-coverage gap. It cannot detect cross-tenant access to these five tables and can instead treat their unscoped readability as expected behavior.
- **Architecture alignment:** Tenant ownership must be a domain/data-ownership property, not inferred from whether an RLS policy currently exists. The target architecture's organization boundary and evidence graph associations must remain tenant-isolated.
- **Cross-references:** DB-001, DOC-001, SCR-001, SRC-003.

### TST-003 — Tenant-table verification has no independent completeness oracle for known tenant-owned tables

- **Severity:** P1 — false assurance in a security verification test
- **Confidence:** Confirmed.
- **Evidence:**
  - `tests/unit/core/tenant-context/tenant-tables.test.ts:10-18` checks that the runtime list matches the set returned by `verifyTenantTables()`.
  - `tests/unit/core/tenant-context/tenant-tables.test.ts:20-42` hard-codes a required-table list, but it omits all five junction tables identified in DB-001.
  - `scripts/database/verify-tenant-tables.ts` derives the expected set from snapshot tables that already have policies (SCR-001); matching the generated runtime list to that derived set does not prove that every tenant-owned table was included.
- **Impact:** The test can pass with zero drift between two incomplete policy-derived sets while the known tenant-owned junction tables remain absent. Its title and success condition therefore imply broader schema/tenant ownership verification than the assertions establish.
- **Architecture alignment:** The target architecture requires an authoritative distinction between tenant-owned data and tables that have completed policy enforcement. Those are separate facts and need independent verification.
- **Cross-references:** DB-001, SCR-001, SRC-003, and TST-002.

### TST-004 — Privileged-path tests do not verify the declared caller and table restrictions

- **Severity:** P1 — privileged database boundary assurance
- **Confidence:** Confirmed test-coverage gap.
- **Evidence:**
  - `tests/unit/core/tenant-context/privileged-paths.test.ts:20-55` checks rejection of an unregistered purpose and audit logging for a registered purpose.
  - `tests/unit/core/tenant-context/privileged-paths.test.ts:64-90` checks that an error is audited.
  - `tests/unit/core/tenant-context/system-mode-bypass.test.ts:28-63` verifies that queries to tenant-owned tables succeed inside system mode, including a leased-client query.
  - These tests do not assert that the calling module matches the registered `callerModule`, nor that SQL access is limited to the registered `allowedTables`.
- **Impact:** The tests can pass while the privileged registry remains metadata rather than an enforced least-privilege boundary. The system-mode tests prove that bypass is possible, not that each privileged purpose is constrained to its declared capabilities.
- **Architecture alignment:** The target architecture separates orchestration, domain capabilities, infrastructure adapters, and decision/execution authority. Tests must verify capability boundaries rather than merely successful system-context acquisition.
- **Cross-reference:** SRC-002.

### TST-005 — Tests named as empty-state validation actually assert database unavailability

- **Severity:** P2 — incorrect behavioral contract
- **Confidence:** Confirmed.
- **Evidence:**
  - `tests/actions/empty-states.test.ts:25-34` stubs an empty brand repository result, calls the action, then expects `success === false` and an error containing `ServiceUnavailable`.
  - `tests/actions/empty-states.test.ts:36-44` does the same for citation data.
  - The test comments explicitly state that the action fails because the DB is unavailable.
- **Impact:** The tests do not verify that a valid empty dataset is returned as a successful empty state. They can pass while the user-facing empty-state behavior is broken or inaccessible.
- **Architecture alignment:** The architecture explicitly distinguishes `UNKNOWN` from `ZERO`. An unavailable data source, a known empty collection, and a measured zero are different states. These tests currently collapse the first two in their stated scenario.
- **Cross-reference:** SRC-006 and SRC-014.

### TST-006 — Acquisition integration runner can report a successful skip and is not in the standard Vitest gate

- **Severity:** P2 — integration coverage reliability
- **Confidence:** Confirmed.
- **Evidence:**
  - `tests/features/acquisition/integration/run-all.ts:22` reads `DATABASE_URL`; its startup guard returns after logging a skip when the variable is absent.
  - The runner is outside the `tests/unit`, `tests/db`, and `tests/ui` Vitest include patterns.
  - `package.json` does not expose a script for this integration runner; `test:acquisition` targets only `tests/unit/features/acquisition`.
- **Impact:** An invocation of this runner without a configured database exits without exercising the real PostgreSQL acquisition integration scenarios. The standard test commands do not establish that this runner was invoked at all.
- **Positive coverage:** The 373-line runner contains valuable real-database scenarios for tenant separation, deduplication concurrency, state transitions, and acquisition/cache behavior. The finding concerns whether those scenarios are reliably selected and reported as executed, not the value of the scenarios themselves.
- **Architecture alignment:** Acquisition is an infrastructure capability supporting the assessment pipeline. The integration boundary must be tested against real persistence and tenant context, with skipped execution distinguishable from a passing integration run.
- **Cross-references:** DB-004, DOC-004, SRC-015.

### TST-007 — Crawl state-machine test checks rejected transitions but barely asserts the allowed transition contract

- **Severity:** P2 — domain invariant coverage
- **Confidence:** Confirmed.
- **Evidence:** `tests/unit/features/acquisition/state-machine.test.ts:11-24` iterates over the status matrix but asserts only that transitions for which `canTransition` returns false throw. It asserts `retryFailedJob("FAILED")`, rejection of retry from `CANCELLED`, and one allowed transition, `RUNNING -> QUEUED`. It does not independently declare and assert the expected set of allowed transitions.
- **Impact:** A regression that incorrectly rejects a legitimate transition can remain undetected for most state pairs. Because the expected validity is sourced from `canTransition` itself, the loop primarily checks consistency between the predicate and assertion function rather than the domain's intended transition matrix.
- **Architecture alignment:** The deterministic orchestration and execution lifecycle depends on explicit, versioned state transitions. State-machine tests should establish the domain contract independently of the implementation predicate.
- **Cross-reference:** SRC-019 and the acquisition lifecycle findings.

### TST-008 — Inngest integration test treats a named placeholder as sufficient scheduled-work coverage

- **Severity:** P2 — background execution coverage
- **Confidence:** Confirmed.
- **Evidence:** `tests/unit/inngest/inngest-integration.test.ts:12-17` checks only that the scheduled function exists and that its name is `scheduled-monitoring-placeholder`. It does not exercise scheduling, event handling, monitoring work, retries, or persisted outcomes.
- **Impact:** The test can remain green while scheduled monitoring is still a no-op. It verifies registration shape, not execution behavior.
- **Architecture alignment:** Continuous improvement and monitoring require observable execution and verified outcomes; a registered placeholder does not establish that lifecycle.
- **Cross-reference:** SRC-019.

### TST-009 — Architecture-level provider mode and provenance behavior are not established by the current test suite

- **Severity:** P2 — architecture contract coverage gap
- **Confidence:** Confirmed as a test-suite coverage gap; runtime behavior is covered separately in source findings.
- **Evidence:**
  - Static corpus scan found no `HYBRID` mode reference in the 112 files; explicit `LIVE` references appear in only four files.
  - The corpus is heavily mock-oriented: 67 files contain `MOCK` references, and many provider/network boundaries are replaced with mocks.
  - No test suite was identified that asserts an explicit `LIVE / MOCK / HYBRID` mode contract end-to-end, verifies that mock-derived values cannot be represented as live measurements, or validates provenance/version compatibility across the assessment-to-evidence boundary.
- **Impact:** Unit tests can validate isolated calculations while leaving the product's operational mode, data provenance, and evidence contract unverified. This matters particularly for Technical SEO and AI Visibility MVP outputs, where users must be able to distinguish measured, estimated, mocked, and unavailable data.
- **Architecture alignment:** Directly related to explicit provider modes, `UNKNOWN != ZERO`, Contract & Provenance Gates, and versioned contracts. This is not a claim that every mocked unit test is inappropriate; deterministic mocks remain useful when the mode and provenance are explicit.
- **Cross-references:** SRC-005, SRC-006, SRC-007, SRC-008, SRC-014.

## 4. Target-architecture crosswalk

| Target area | Evidence in tests/ | Alignment assessment |
|---|---|---|
| Technical SEO and AI Visibility MVP | Audit engine, SEO extractor, AEO insight, free/premium audit, AI visibility and competitive-analysis tests | Partial. Useful unit coverage exists, but some suites are outside Vitest discovery and several network/provider paths are mocked. |
| Product Intelligence Profile | Brand, observation, prompt, analytics and repository tests | Partial/legacy-shaped. Existing AI-intelligence tests do not establish the target profile as a coherent versioned domain contract. |
| Product Evidence Graph / Knowledge & Reasoning Graph | Knowledge-graph, vector-store, ingestion and RAG tests | Partial. Component tests exist; provenance, evidence lineage, version compatibility and measured-vs-estimated semantics are not established end-to-end. |
| Deterministic Reasoning Orchestrator / Context Builder / Capsule Engine | No complete end-to-end contract suite identified | Not established in this test tree. Treat as an architecture implementation/validation gap, not automatically an MVP defect. |
| LLM Provider Adapter | Mock-heavy AI tests and provider-specific unit tests | Partial. Explicit LIVE/MOCK/HYBRID behavior and fallback provenance are not comprehensively verified. |
| Decision & Execution Engine | Crawl state-machine and integration scenarios; scheduled-monitoring existence test | Partial. Authorization, approval boundaries, idempotent execution, verified outcomes and retry semantics are not covered as one architecture-level lifecycle. |
| Telemetry / Evaluation / Continuous Improvement | Monitoring, observability and analytics unit tests | Partial. No complete evaluation-to-priority-to-execution-to-outcome feedback loop is established. |
| Digital Twin lifecycle | No Digital Twin test references found | Not present in this test tree. This is a future target-architecture coverage item, not a current MVP blocker: the agreed MVP is Technical SEO Audit and AI Visibility Audit, and the Digital Twin is supporting/longer-horizon capability. |

### Important positive coverage

- `tests/unit/services/crawler/safe-http-fetch.test.ts` exercises DNS resolution, public/private address decisions, IP-pinned HTTPS requests, TLS host preservation, deadline handling and transport behavior for the newer safe fetch path.
- `tests/features/acquisition/integration/run-all.ts` contains meaningful PostgreSQL-backed tenant isolation and concurrency scenarios, subject to the discovery/skip caveat in TST-006.
- `tests/unit/services/cost-control/cost-control.test.ts` explicitly distinguishes unknown model pricing (`undefined`) from a free-tier model priced at zero. This is a useful localized expression of `UNKNOWN != ZERO`, though it does not establish that semantic across product metrics and assessment results.
- The unit suite includes focused coverage for auth lifecycle, API authorization, safe crawling, RAG/vector-store behavior, UI locale routing, and database migration/RLS verification scripts.

## 5. Deferred architecture decisions and non-findings

- No Digital Twin tests were found. This is recorded as a target-architecture coverage gap only; it is not classified as a current release defect while the agreed MVP remains Technical SEO Audit and AI Visibility Audit.
- The absence of a complete Geo-Market Intelligence, Simulation & ROI Lab, Expert Network, or full Planning & Execution test lifecycle is likewise a roadmap alignment observation, not proof that a currently promised MVP capability is broken.
- The fact that many tests use mocks is not itself a defect. The issue is whether the system records and exposes the mode/provenance of those results and whether a real integration gate exists where required.
- Static inspection cannot establish whether CI invokes external scripts outside the repository package scripts. No CI execution or workflow change was performed in this phase.

## 6. Scope and next-step gate

- No application source, test source, database schema, migration, CI workflow, package script, or deployment artifact was changed.
- No tests or other executable commands were run.
- Only this audit report and `ai_tasks/README.md` are intended to change in the audit branch.
- No remediation plan is finalized here. Before proposing any fix, all findings from the completed folder audits must be mapped to the approved target architecture, with explicit decisions about retained, replaced, deferred, or obsolete legacy behavior.
- The next root folder is not authorized by this report. Wait for the user's explicit approval before beginning it.
