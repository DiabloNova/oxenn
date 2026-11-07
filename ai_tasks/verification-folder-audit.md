# verification/ Folder Audit

- **Repository:** `DiabloNova/oxenn`
- **Branch:** `docs/product-roadmap-baseline-2026-11`
- **Audited commit:** `4dbcb1265f320e7e71fed6d134f6a176609f6736`
- **Audit date:** 2026-11-07
- **Scope:** Complete recursive contents of `verification/` only
- **Inventory:** 54 tracked files, 730,704 bytes; recursive Git tree was complete and not truncated.
- **File types:** 45 Markdown, 2 text, 2 JavaScript, 2 JSON, 2 SQL, 1 TypeScript.
- **Method:** Retrieved all 54 Git blobs, reviewed report headings/status/branch/commit references, read key reports and executable artifacts, cross-checked claims against current `package.json`, `vitest.config.ts`, and the completed database/source/tests audits. No verification script, SQL, test, build, migration, database, browser, or deployment command was executed.

## 1. Executive summary

The folder is a historical evidence archive, not a single current verification baseline. It contains frontend reconnaissance, environment and database probes, RLS matrices, migration/replay reports, test-runner migration reports, gate reviews, and a recent remediation execution report.

The archive has useful provenance in many places: several reports record exact branches, commits, dates, CI runs, and limitations. However, those reports describe different repository states. Some later claims are contradicted by the currently audited source or by subsequent migrations, and some artifacts lack enough metadata to be reproducible.

The most important findings are:

1. The old RLS coverage report claims 51 tenant-scoped tables and 14 global tables, but the global classification includes five organization-owned junction tables. This reproduces the known tenant-isolation gap from DB-001.
2. The privileged-path verification report says purpose tags are strictly checked, but the current implementation does not enforce the registry's `callerModule` and `allowedTables` restrictions (SRC-002).
3. The old system-context probe defaults to a local PostgreSQL superuser URL, prints the full database URL, invokes account/workspace/member mutation actions, has no cleanup, and its top-level catch does not set a failing exit code.
4. The C06 runner inventory describes an obsolete `test:acquisition` invocation. The current package script runs Vitest against `tests/unit/features/acquisition`, not the legacy `tests/features/acquisition/run-all.ts`.
5. The DB Vitest project currently has no `tests/db/` files and permits an empty successful run.
6. Several reports describe earlier baselines or branches and must not be treated as evidence for the current audit-branch HEAD. In particular, the old deployment memo says no GitHub Actions workflows exist, which is no longer true.

No application or verification artifact was modified in this phase. Only this audit report and `ai_tasks/README.md` are intended to change.

## 2. Inventory

| Subtree | Files | Notes |
|---|---:|---|
| `verification/fe/` | 2 | Frontend reconnaissance and design tokens |
| `verification/phase-0/` | 16 | Environment, system context, schema/replay and RLS probes |
| `verification/phase-1/` | 5 | Environment, static health, CI and codegen reports |
| `verification/phase-2/` | 3 | Fail-closed and error-semantics reports |
| `verification/phase-3/` | 6 | Migration consolidation and schema/RLS reports |
| `verification/phase-4/` | 4 | Tenant whitelist, isolation and crawl migration reports |
| `verification/phase-5/` | 11 | Auth/security implementation reports and M5 gate review |
| `verification/phase-6/` | 2 | Reference matrix and public API reports |
| `verification/phase-7/` | 2 | Test-runner inventory and J-038 report |
| `verification/phase-8/` | 3 | OX-101/102/103 test migration reports |
| `verification/phase1-remediation/` | 1 | Remediation execution evidence |
| **Total** | **54** | **One zero-byte Markdown file** |

The empty file is `verification/phase-4/j027.md`. The report `verification/phase-5/j031.md` is also extremely terse (a one-line success status), and should not be treated as a standalone verification record.

## 3. Findings

### VER-001 — Verification archive mixes historical branches and commits; not all reports identify their exact baseline

- **Severity:** P2 — evidence provenance and decision quality
- **Confidence:** Confirmed.
- **Evidence:**
  - `phase-0/README.md` records HEAD `8b4d08e75918a7f179398941ba4bbd94ef900a21`.
  - `phase-0/census.md` records branch `verification/j006-census` and date 2025-09-26.
  - `fe/FE-000-recon.md` records branch `verification/fe-000-recon` and base commit `db92978529850801390916e8f3b755b7fb15d79b`.
  - `phase-7/j038.md` records branch `remediation/j038-vitest` and baseline SHA `4949c04aca0ae7a10a16161266ab5b9f495ec9b6`.
  - `phase-8/ox-102.md` records a date but not an exact commit; `phase-8/ox-103.md` records neither date nor exact commit.
  - `phase1-remediation/EXECUTION-REPORT.md` explicitly says its gate table does not certify later commits or the current PR head, and names the separate branch and CI runs it covers.
- **Impact:** A reader can accidentally combine historical results from different branches into one implied current-state certification. Some later reports also refer to earlier reports as if they describe the live state.
- **Architecture alignment:** The target architecture requires traceable contracts, provenance, and versioned evidence. Verification artifacts need the same baseline identity discipline: branch, commit, date, environment, command, result, and limitations.
- **Disposition:** Preserve these files as historical evidence. Do not rewrite their historical conclusions as current facts; new verification must explicitly bind itself to the exact target commit and architecture version.

### VER-002 — Historical RLS coverage overstates tenant isolation by classifying five organization-owned junction tables as global

- **Severity:** P1 — tenant security assurance
- **Confidence:** Confirmed by the historical report and current database audit.
- **Evidence:**
  - `phase-4/j025.md:13-14` claims 51/51 tenant-scoped tables and 14/14 global tables were covered.
  - `phase-4/j025.md:10` says global tables include core domains and are tested for unrestricted access.
  - The current database audit DB-001 establishes that `pages_keywords`, `pages_topics`, `pages_entities`, `keywords_topics`, and `topics_entities` are organization-owned junction tables but lack tenant RLS policies.
  - The current isolation suite also places those five tables in its global list (TST-002).
- **Impact:** The old 51/14 result is not exhaustive evidence of tenant isolation. The five tables are outside the report's tenant-protected set and can be incorrectly treated as intentionally global.
- **Architecture alignment:** Tenant ownership must be derived from the domain/data contract, not from the existence of a policy. Product Evidence Graph relationships and other organization-owned associations must inherit the owning organization's boundary.
- **Cross-references:** DB-001, DOC-001, SCR-001, SRC-003, TST-002, TST-003.

### VER-003 — Reference-matrix success is based partly on heuristic text matching, not an authoritative ownership contract

- **Severity:** P2 — schema and security assurance
- **Confidence:** Confirmed limitation stated in the report.
- **Evidence:**
  - `phase-6/j035.md:3` says the matrix was generated from the latest Drizzle snapshot.
  - `phase-6/j035.md:25` explicitly acknowledges that consumer matches are heuristic text matches and may include prose or non-database references.
  - The current documentation audit DOC-001 found that the matrix classifies the five organization-owned junction tables as Global.
- **Impact:** A zero-orphan result proves only that the generator's heuristics did not find unmatched references under its rules. It does not prove correct domain ownership, tenant scope, or RLS completeness.
- **Architecture alignment:** The target architecture needs explicit domain ownership and versioned data contracts. A generated reference matrix is useful inventory, but it is not the canonical source of authorization or data classification.
- **Cross-references:** DB-001, DOC-001, SCR-001, TST-003.

### VER-004 — Privileged-path verification overstates the guarantees established by the registry

- **Severity:** P1 — privileged access boundary
- **Confidence:** Confirmed mismatch with current source audit.
- **Evidence:**
  - `phase-5/j029.md:10` says `runWithSystemContext` strictly validates purpose tags against the registry using `Object.hasOwn`.
  - That statement establishes a purpose-key check, but does not establish enforcement of each registry entry's `callerModule` or `allowedTables`.
  - Current source audit SRC-002 found those two registry fields are not enforced by the runtime path.
  - Current tests audit TST-004 found no tests asserting caller-module or table-level restrictions.
- **Impact:** The historical report's language can be interpreted as proof of a least-privilege boundary even though only purpose registration is checked. The registry's declared capability restrictions are not proven.
- **Architecture alignment:** The new architecture separates domain capabilities, orchestration, infrastructure access, and execution authority. Privileged access must be constrained by actual capability contracts, not by descriptive registry metadata alone.
- **Cross-references:** SRC-002, TST-004.

### VER-005 — Legacy system-context probe is unsafe as a general verification runner

- **Severity:** P2 — operational safety and credential handling
- **Confidence:** Confirmed from static inspection; script was not run.
- **Evidence:**
  - `phase-0/probe-system-context.ts:27` falls back to `postgres://postgres:postgres@localhost:5432/oxenn_test` when `DATABASE_URL` is absent.
  - `phase-0/probe-system-context.ts:30` prints the full `DATABASE_URL`, which can disclose credentials if a non-test URL is supplied.
  - `phase-0/probe-system-context.ts:64-72` invokes registration and login using a hardcoded probe account and password.
  - `phase-0/probe-system-context.ts:120-153` invokes workspace creation, invitation acceptance, workspace switching, invitation sending, member removal, and role update actions.
  - No cleanup/rollback of these application-level mutations is present in the script.
  - `phase-0/probe-system-context.ts:157` uses `runProbe().catch(console.error)`, which logs a top-level failure but does not explicitly set a non-zero process exit code.
- **Impact:** Running this historical probe against a supplied non-test database can create or modify persistent identity/workspace state and leak the connection string into logs. It can also produce a misleading successful process exit after a top-level failure.
- **Architecture alignment:** Verification must use isolated test infrastructure, explicit environment identity, synthetic fixtures, cleanup, and trustworthy result semantics. This probe is not a safe repeatable acceptance test.
- **Disposition:** Do not execute or reuse it as a current test runner without a separately approved safety review.

### VER-006 — The old RLS matrix runner has fixed database targeting and is not guarded by an explicit database-identity check

- **Severity:** P2 — operational safety
- **Confidence:** Confirmed from static inspection; script was not run.
- **Evidence:**
  - `phase-0/run_rls_matrix.js:9-13` hardcodes host `localhost`, port `5432`, and database `oxenn_test`.
  - `phase-0/run_rls_matrix.js:72-75` embeds the two local test-role names and passwords.
  - `phase-0/run_rls_matrix.js:151-175` wraps each test operation in a transaction and attempts `ROLLBACK` on both success and error.
  - `phase-0/run_rls_matrix.js:194-200` writes the transcript and result matrix into the same historical directory.
- **Impact:** The rollback behavior is a positive safeguard, but the script does not first verify the server/database identity. A database with the same local host/port/name could be targeted unintentionally. The script is historical evidence, not a current safe database test command.
- **Positive control:** The inspected transcript records synthetic fixture values and per-operation rollback. The PostgreSQL catalog dump `replay-catalog-A.sql` contains no `INSERT INTO` or `COPY` statements; it is a schema/catalog dump rather than a row-data dump.
- **Disposition:** No SQL was executed and no database was contacted in this audit.

### VER-007 — C06 runner inventory no longer matches current package scripts and repository paths

- **Severity:** P2 — test execution provenance
- **Confidence:** Confirmed.
- **Evidence:**
  - `phase-7/c06-mp1-runner-inventory.md:7-8` says `tests/features/acquisition/run-all.ts` is invoked by `pnpm test:acquisition`.
  - Current `package.json:19` defines `test:acquisition` as `vitest run --project unit tests/unit/features/acquisition`, not the legacy `tests/features/acquisition/run-all.ts`.
  - Current `tests/features/acquisition/run-all.ts` still exists, while `tests/features/acquisition/integration/run-all.ts` has no dedicated package script.
  - `phase-7/c06-mp1-runner-inventory.md:27-40` lists `tests/services/monitoring/run-all.ts`; the current tree no longer contains that path. OX-102 later says it was deleted after its coverage was migrated.
  - Current `package.json:15-24` defines Vitest, unit, DB, UI, acquisition, and isolation scripts.
- **Impact:** Following the old inventory can cause operators to believe the wrong test suite ran. The old report is a useful snapshot of an earlier runner layout but cannot be used as the current invocation map.
- **Architecture alignment:** Each domain's contract suite must have an explicit, discoverable, CI-enforced execution path. The path and runner must be validated against the current architecture and repository tree.
- **Cross-references:** TST-001, TST-006, OX-102, OX-103.

### VER-008 — The DB Vitest project can report success with zero tests in the current tree

- **Severity:** P2 — false-green verification gate
- **Confidence:** Confirmed current configuration.
- **Evidence:**
  - Current `vitest.config.ts:29-34` defines the `db` project with `include: ["tests/db/**/*.test.ts"]` and `passWithNoTests: true`.
  - The current audited tree contains no files under `tests/db/`.
  - Current `package.json:17` exposes `test:db` as the DB project runner.
  - OX-101 explicitly documented this temporary empty-project state and a future OX-104 flip to `false` once `tests/db` is seeded; the current configuration still has the temporary true setting.
- **Impact:** `pnpm test:db` can exit successfully without exercising any database tests. A green result is not evidence of database integration coverage.
- **Architecture alignment:** Persistence, RLS, provenance, and contract gates need real adapter/integration verification, separate from mocked unit tests.
- **Cross-references:** RF-003, TST-001, TST-006.

### VER-009 — Historical API productionization claims require revalidation against current source and architecture

- **Severity:** P2 — evidence-to-implementation mismatch
- **Confidence:** Confirmed historical claim; current contradiction is documented in the source audit.
- **Evidence:**
  - `phase-6/j036.md` describes public API authentication, atomic quota enforcement, Upstash rate limiting, and a seven-case integration run as productionalized.
  - The current source audit SRC-010 found that the declared quota middleware has no route consumers and that usage/credit enforcement is incomplete.
  - The current source audit SRC-021 found that the API-key settings UI is local-only and that no server actions create/revoke keys or call `withPublicApi`.
  - The J-036 test invocation is a direct `tsx --test` command against a legacy path, not a current standard Vitest project.
- **Impact:** The historical implementation report cannot be used as proof that the current public API contract is active end-to-end. The discrepancy may reflect subsequent code changes or branch divergence; it must be reconciled before the feature is included in the new product architecture.
- **Architecture alignment:** The current product MVP and service boundaries must decide whether public API, quota, and key lifecycle are in scope. A prior implementation report does not make a capability part of the target architecture.
- **Cross-references:** SRC-010, SRC-021, TST-001.

### VER-010 — Old deployment and static-health memos are point-in-time records, not current operational guidance

- **Severity:** P2 — documentation staleness
- **Confidence:** Confirmed historical/current-state difference.
- **Evidence:**
  - `phase-0/deploy-memo.md` says `.github/workflows` is absent and no in-repo GitHub Actions quality gates exist.
  - The current repository has `.github/workflows/ci.yml` and `.github/workflows/capture-regression-baseline.yml`, both reviewed in the `.github/` audit.
  - `phase-0/README.md` records a failing static-health baseline at its specified historical commit; later reports (J-010, OX-102, and the remediation execution report) describe different commits and subsequent passing checks.
  - `phase-5/m5-gate-review.md` records an M5 FAIL at its exact 2026-10-04 HEAD. It also says the CI workflow did not run tests at that time; subsequent OX-101/OX-102 and current workflow evidence show later test-gate changes.
- **Impact:** These reports remain valid evidence for the commits they identify, but their conclusions must not be copied into current operational checklists without a new check against the target commit.
- **Architecture alignment:** Historical technical state is useful for migration provenance, but the new architecture must be evaluated against current implementation and explicit target contracts, not inherited baseline status.

### VER-011 — Frontend reconnaissance and design-token notes lack a unified, current architecture baseline

- **Severity:** P2 — design-system and frontend planning provenance
- **Confidence:** Confirmed documentation gap.
- **Evidence:**
  - `fe/FE-000-recon.md` is tied to branch `verification/fe-000-recon` and base commit `db92978529850801390916e8f3b755b7fb15d79b`.
  - `fe/FE-001-tokens.md` describes a dark-first, append-only `ox-` token foundation and leaves ThemeProvider and existing component migrations to later FE phases, but does not record an exact branch, commit, or execution date.
  - FE-000 contains duplicate section numbering and describes the earlier component/theme layout and route inventory.
- **Impact:** These notes are useful historical UI reconnaissance, but they are not sufficient authority for the current dashboard shell, product navigation, component boundaries, or visual tokens.
- **Architecture alignment:** The dashboard frontend is to be derived from the approved product architecture and its MVP domains. Existing UI observations should be re-mapped to that structure before FE implementation; do not treat FE-000/001 recommendations as pre-approved changes.

### VER-012 — One verification placeholder is empty and another is too terse to substantiate its status

- **Severity:** P3 — evidence completeness
- **Confidence:** Confirmed.
- **Evidence:** `phase-4/j027.md` is zero bytes. `phase-5/j031.md` contains only a one-line success status without objective, exact commit, command transcript, or acceptance criteria.
- **Impact:** These files cannot independently support a completion or release decision.
- **Disposition:** Preserve as historical artifacts; do not infer missing results.

### VER-013 — The latest remediation evidence records an upcoming dependency-risk review date

- **Severity:** P2 — time-bound accepted risk (not a confirmed current vulnerability finding)
- **Confidence:** Confirmed as a statement in the report; current dependency status was not re-audited in this folder phase.
- **Evidence:** `phase1-remediation/EXECUTION-REPORT.md` records one high `braces` advisory accepted until 2026-11-19, with the report explicitly scoped to a specific remediation branch, commit, and CI run rather than the current audit-branch HEAD.
- **Impact:** The acceptance date is still in the future at this audit date (2026-11-07). The report should be treated as a pending review reminder, not as proof that the advisory remains present or has been resolved on the current branch.
- **Architecture alignment:** Dependency/security acceptance must remain an explicit, time-bounded operational decision and should be rechecked against the exact release commit.

## 4. Target-architecture crosswalk

| Target architecture area | Verification evidence | Alignment assessment |
|---|---|---|
| Technical SEO and AI Visibility MVP | FE audit, old audit-engine reports, J-036 public API report, OX test migration records | Historical evidence exists, but must be revalidated against the current MVP boundaries and current code. |
| Product Intelligence Profile | Older brand/AI intelligence and schema inventories | Legacy data model and service boundaries; not a canonical target-domain contract. |
| Product Evidence Graph | System-B inventory, RLS matrix, replay catalog, graph-related test references | Useful infrastructure history, but five organization-owned association tables are misclassified and provenance contracts are not established by these reports. |
| Deterministic Reasoning Orchestrator / Context Builder / Capsule Engine | No complete verification lifecycle found in this folder | Not established by the historical verification artifacts. |
| Contract & Provenance Gates | Commit/branch metadata in some reports; missing metadata in others; heuristic reference matrix | Partial. The evidence archive itself needs exact commit and contract-version binding. |
| LLM Provider Adapter / LIVE-MOCK-HYBRID modes | J-036 and AI-related historical reports | No complete mode/provenance verification was identified in this folder. |
| Decision & Execution Engine | Acquisition/RLS/auth probes and runner inventories | Partial and legacy-oriented; the probes are not safe repeatable acceptance suites. |
| Telemetry / Evaluation / Continuous Improvement | Observability and scheduled-work references | No complete evaluation-to-decision-to-execution-to-verified-outcome loop is evidenced. |
| Digital Twin lifecycle | No explicit Digital Twin verification artifact found | Future architecture coverage item, not an MVP defect while the agreed MVP remains Technical SEO Audit and AI Visibility Audit. |

## 5. Positive evidence and safety observations

- All 54 tracked blobs were retrieved; no tree truncation occurred.
- `replay-catalog-A.sql` contains no `INSERT INTO` or `COPY` statements; it is a catalog/schema dump, not a row-data export.
- The inspected RLS transcript uses synthetic tenant/user identifiers and records a `ROLLBACK` for each individual DML operation.
- The credential-pattern scan found no private-key header, AWS access-key pattern, or GitHub token pattern in the inspected verification artifacts. Environment URLs and test values exist in historical examples; the system-context probe's behavior of printing the supplied full database URL remains a separate concern (VER-005).
- The latest remediation report explicitly limits its CI claims to named commits/runs and warns that its report update itself changes the commit under verification. This is a good provenance practice that should be retained.

## 6. Scope, constraints, and next gate

- No files under `verification/` were changed.
- No verification script, SQL, test, build, lint, typecheck, migration, database, browser, or deployment command was executed.
- Only `ai_tasks/verification-folder-audit.md` and `ai_tasks/README.md` are intended to change in the audit branch.
- The reports in this folder are evidence, not instructions to repeat historical migrations, probes, or database operations.
- No remediation proposal is finalized here. All prior findings and historical recommendations must first be mapped to the approved target architecture, with explicit decisions about retained, replaced, deferred, or obsolete behavior.
- The next root folder is not authorized by this report. Wait for the user's explicit approval before beginning it.
