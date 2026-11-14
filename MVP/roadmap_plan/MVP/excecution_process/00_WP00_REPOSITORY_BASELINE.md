# MVP-00 WP-00 — Repository Baseline and Evidence Index

**Status:** COMPLETE — repository baseline inspection and evidence capture
**Repository:** DiabloNova/oxenn
**Audit branch:** MVP_00
**Source snapshot:** MVP_00 at 7f1e9d44ae88cf78721f4f5360449cbd14d19acf
**Compared base:** main at 326403812756b815f5d9a7dc77e29097ff7dd6b0
**Audit date:** 2026-11-14
**Scope:** Read-only repository audit and documentation evidence only

> This report establishes repository-level evidence at the exact source snapshot above. It does not establish that any external provider, production database, deployed authorization boundary, payment flow, or production user journey is live. Historical audits and issue records are treated as leads, not current proof.

## 1. Executive result

WP-00 is complete. The current main and the code-bearing baseline of MVP_00 were revalidated before the report was written. Main remained at 326403812756b815f5d9a7dc77e29097ff7dd6b0; MVP_00 remained at 7f1e9d44ae88cf78721f4f5360449cbd14d19acf. The only pre-audit difference between those commits was the already-authorized MVP-00 execution log. Application and database source were therefore identical to the current main baseline during inspection.

The repository has substantial reusable foundations: server-side session and workspace authorization helpers, Workspace tenant-context/RLS infrastructure, a guarded migration discipline, a PostgreSQL-backed isolation suite in CI, bounded internal crawling, a Firecrawl adapter, AI-provider abstractions, billing/plan infrastructure, monitoring repositories, background jobs, and observability components.

Those foundations do not yet establish the new approved product MVP end to end. In particular, the checked-in Workspace schema does not contain canonical persisted Offer/PIP, independent service-SKU/entitlement, optional-bundle, Growth Plan, task, or outcome models. Current billing is primarily a tenant-wide legacy plan/entitlement model. Several existing SEO, AI visibility, competitive-analysis, and report surfaces still use seeded or synthetic data. Provider selection and production reachability remain unverified. The intended customer operating model is one shared Workspace and central dashboard in which SEO, AEO, and GEO can each be activated and used independently; service independence does not imply a separate Workspace for every service.

**WP-00 completion does not complete MVP-00.** Owner decisions, commercial rules, launch/pilot choices, evidence policy, and FR-01–FR-11 traceability remain for later work packages. No application-code, schema, migration, provider, deployment, production, merge, or PR change was made.

## 2. Repository snapshot and provenance

| Item | Verified value |
|---|---|
| Repository | DiabloNova/oxenn |
| Default branch | main |
| Main SHA at final pre-write revalidation | 326403812756b815f5d9a7dc77e29097ff7dd6b0 |
| Audit branch | MVP_00 |
| Audit branch SHA before this report commit | 7f1e9d44ae88cf78721f4f5360449cbd14d19acf |
| Initial branch point | main at 326403812756b815f5d9a7dc77e29097ff7dd6b0 |
| GitHub recursive tree entries | 1,475 |
| Tracked workflow files in the inspected tree | 3 |

The report is tied to the commit above, not to a branch name alone. The branch and main refs were read again immediately before the documentation write. No main movement was observed.

### Governing sources inspected

- AGENTS.md — mandatory repository operating rules, database/migration boundaries, Git safety, verification and completion standards.
- package.json, pnpm-lock.yaml, tsconfig.json, eslint.config.mjs, vitest.config.ts.
- .github/workflows/ci.yml and the currently tracked workflow directory.
- README.md, docs/REPOSITORY_CONTEXT.md, docs/project/MVP_ENGINEERING_BASELINE.md.
- docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md, docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md, MVP/roadmap_plan/MVP/MVP_baseline.md, MVP/roadmap_plan/MVP/roadmap/README.md, and the MVP-00 stage brief.
- Security/RBAC/Platform Admin documents, privileged-path inventory, database canonical-data/ownership/migration/tenant-context documentation, observability/cost-governance documentation, and relevant current audit/task reports.
- Current source for proxy routing, session and authorization, Free Audit, acquisition routing and Firecrawl, Technical SEO, AI Visibility, competitive analysis, billing, report UI, and monitoring.
- Current tests and test configuration for auth/session, Free Audit, acquisition, audit-gate, and tenant isolation.

The approved product authority remains the Product Specification and its canonical owner decisions. The old two-journey scope and prior source audits are historical engineering context, not the current product boundary.

## 3. Repository inventory

The following counts were computed from the checked-out branch tree. They are navigation/inventory counts, not quality or completion scores.

| Area | Observed inventory |
|---|---:|
| src/app files | 99 |
| src/features files | 104 |
| src/services files | 55 |
| src/core files | 12 |
| Workspace schema TypeScript files | 29 |
| Workspace snapshot tables | 70 |
| Platform Admin snapshot tables | 7 |
| Workspace migration journal entries | 16 |
| Platform Admin migration journal entries | 1 |
| Workspace snapshot tables with policy declarations | 56 |
| Policy declarations in the latest Workspace snapshot | 224 |
| Test files matching test/spec TypeScript patterns | 134 |
| Files under scripts/ | 29 |
| Markdown files under docs/ | 86 |

The package contract is Node.js >=22 and pnpm@10.30.3. The main CI workflow installs Node 22. The isolated audit shell had Node 24.22.1, so local command results are not treated as a Node-22-equivalent CI run.

### Main application boundaries

- Next.js App Router API handlers and server actions live under src/app.
- Domain/feature modules live under src/features, including acquisition, AI intelligence, billing, monitoring, public API and admin.
- Shared application services live under src/services.
- Tenant context, unit-of-work and database foundations live under src/core.
- Workspace Drizzle schema and migrations live under database/schema/ and database/drizzle/.
- Platform Admin has a separate schema/migration directory and configuration under database/platform-admin/.

## 4. Security, identity, and workspace baseline

### Server session and authorization

**Repository evidence:**

- src/proxy.ts deliberately bypasses /api; API handlers must enforce their own server-side authorization.
- src/services/auth/session.ts creates database-backed sessions, stores only a SHA-256 token hash, rejects revoked/replaced/expired sessions, joins the active workspace membership, and returns no session when the membership role is absent.
- src/services/auth/authorization.ts derives API identity from the validated server session. Caller-supplied identity headers are not accepted as authentication.
- requireWorkspaceMembership and requireRole consult persisted membership data rather than relying only on a client/session role snapshot.
- The Free Audit route calls authorizeApiRequest before parsing the request body, quota reservation, or crawl execution. Its current unit tests cover anonymous rejection and ensure quota/crawl work is not reached before authentication.
- The Free Audit path uses the internal HTTP crawler, a one-page bounded policy, size/time/redirect limits, quota/idempotency checks, and an abort signal.

**Boundary and limitation:**

These are repository-level implementation facts. They do not prove that every route/action consistently invokes the helpers, nor do they prove production database state, deployed RLS, or deployed proxy/header behavior. A route-by-route authorization matrix is still needed in the downstream security/traceability work.

### Workspace and Platform Admin

The Workspace schema is organization-scoped and has RLS policy declarations for 56 of the 70 tables in the latest snapshot. docs/database/table-ownership-registry.md records the current ownership inventory, including one unresolved Workspace table. AGENTS.md explicitly states that the privileged-path allowedTables registry is audit metadata, not a SQL allowlist.

The Platform Admin control plane has a separate seven-table schema and one generated migration. The inspected security documentation states that no dedicated Platform Admin database has been provisioned or connected, no live OIDC provider is selected/configured, and runtime activation remains fail-closed. Existing legacy admin CQRS handlers are not thereby proven to be wired to the new identity/permission guard.

**Not verified:** no live database, deployed RLS, production session, OIDC provider, or runtime database connection was queried during WP-00.

## 5. Persistence and product-domain readiness

The latest checked-in Workspace snapshot contains 70 tables, including organizations/memberships, users/sessions, brands, websites/pages, crawl jobs/results/cache, observations, entities/relationships, competitors, recommendations, subscriptions, quotas, credits, and monitoring records.

The current canonical snapshot does **not** contain tables named or serving as canonical product persistence for:

- Customer Offer and Offer nature/channel ownership.
- Versioned Product Intelligence Profile (PIP).
- Product/service-specific Service Catalog and Service SKU.
- Independent service entitlement and per-SKU usage ledger.
- Optional bundle and bundle items.
- Customer Growth Plan and task lifecycle.
- Product/market assessment and outcome attribution.

This is a schema-level finding at this commit. It does not imply those domains have no types or prototypes anywhere; it means the inspected canonical persisted model does not yet establish those end-to-end product contracts.

### Workspace is the shared customer operating context — owner direction (2026-11-14)

The preferred user-facing model is one customer Workspace with a central dashboard. SEO, AEO, and GEO are distinct services that customers can activate and use independently inside that same Workspace. Service independence is a service-access and entitlement boundary, not a requirement to create separate Workspaces or separate customer identities per SKU. Workspace membership and the dashboard context remain shared; each service must still have its own server-enforced entitlement, quota, usage metering, and service-specific evidence. An optional bundle may aggregate access but must not become a prerequisite for standalone services. The detailed entitlement subject and accounting rules (for example, workspace-wide versus Offer-scoped usage) remain to be designed in WP-02/WP-03 and must not be silently assumed by this note.

### Existing billing is not yet the approved independent-service catalogue

- src/features/billing/domain/plans.ts defines tenant-wide Free, Professional, Business, and Enterprise plans.
- src/features/billing/services/subscription-service.ts resolves a tenant subscription and checks plan-level feature entitlements/quotas.
- The Workspace tables include tenant_subscriptions, tenant_quotas, and credit_transactions.
- This is reusable plan/credit infrastructure, but it is not the approved commercial contract of separately selectable SEO, AEO, and GEO SKUs with their own entitlements and usage ledgers within a shared Workspace. The absence of SKU-specific entitlement and metering must not be solved by splitting each service into a separate Workspace. The optional Digital Visibility Suite and optional Product Assessment & Improvement pilot are not represented as independent persisted SKU/bundle contracts in the inspected snapshot.

Do not reuse the old plan model as if it already enforces FR-11. The product, commercial and schema design must be resolved in the relevant MVP-00 work packages before implementation.

## 6. Acquisition, provider, and evidence baseline

### Crawling/acquisition

- src/features/acquisition/application/orchestrator.ts composes an internal HTTP provider and conditionally adds Firecrawl when FIRECRAWL_API_KEY is present.
- ProviderRouter applies bounded retries/fallback according to provider error eligibility.
- HttpCrawlProvider uses the repository's local safe-fetch/SSRF transport.
- The dedicated Free Audit endpoint directly uses HttpCrawlProvider; it does not use Firecrawl or Gemini.
- Firecrawl seed validation includes local DNS/host validation and the adapter constrains returned documents to the seed origin. However, the adapter source itself notes that the upstream service may already have fetched an off-origin URL before the response is rejected. A local DNS preflight plus post-response filtering is not equivalent to enforcing every redirect hop before the remote provider fetches it.

**Finding:** issue [#115](https://github.com/DiabloNova/oxenn/issues/115) remains **VALID / OPEN** as a provider-boundary risk. Its required call-site inventory and negative provider-not-called tests are not established by the evidence reviewed here. No SSRF remediation was made in WP-00.

### AI/visibility providers

- src/services/ai/ai-visibility-provider.ts provides both a synthetic Mock provider and a Gemini provider.
- AIVisibilityProviderRegistry.getProvider() selects Gemini only when explicitly asked for gemini and the API key exists; the default path returns the mock provider.
- src/features/ai-intelligence/services/ai-visibility-audit-engine.ts accepts an optional provider type.
- src/app/actions/ai-visibility-audit.ts invokes the engine without passing a provider type. On that path, the registry's default mock is selected.
- The mock provider returns fixed illustrative responses and references such as secure-site.com; those results cannot be treated as real observations of a customer's brand or AI engines.

**Status:** AI Visibility has reusable engine/provider infrastructure, but the default customer action observed in this path is **MOCK**, not verified live AI provider execution. Actual credentials, provider selection, source provenance, coverage, and live behavior remain **UNKNOWN**.

### Technical SEO and competitive analysis

- src/app/actions/technical-seo.ts defines createMockPageSeoSignals, uses the fixed secure-site.com domain, and seeds example pages when the tenant has no pages. The sampled action analyses those synthetic signals.
- src/app/api/v1/analysis/competitive/route.ts validates submitted public URLs, but the reviewed comparison stage derives scores and competitor strengths/weaknesses from URL-seeded pseudo-random values; it does not fetch competitor website evidence in that stage. LLM-generated insight may be attempted, with a deterministic simulation fallback.
- These code paths are not proof of a real, evidence-backed SEO or competitive assessment journey.

**Status:** reusable analyzers and provider-facing code exist, but the sampled flows are **MOCK / HYBRID / PARTIAL**, not verified live end-to-end user journeys.

## 7. Reports, monitoring, and observability

- src/app/[locale]/dashboard/audits/[id]/page.tsx constructs report details in the page from query/default values and static arrays, including illustrative score, Firecrawl logs, provider insights and recommendations. It is a **MOCK** report surface, not evidence of a persisted audit result.
- Monitoring foundations exist in src/features/monitoring, with crawl snapshots, configuration/alert repositories, change detection and regression-detection services. Their presence does not prove the complete customer outcome/continuous-improvement loop required by FR-09.
- Observability context/tracker and cost-governance documentation exist. No deployed telemetry pipeline, production alerting, live provider metrics, or customer-visible cost-control path was exercised in WP-00.

## 8. CI, workflows, and test baseline

### Tracked CI contract

The checked-in .github/workflows/ci.yml contains three jobs:

1. **Build and Test:** dependency audit gate, audit-gate regression tests, TypeScript typecheck, ESLint (configured with --max-warnings=218), tenant-table/RLS checks, documentation baseline/link verification, RLS documentation consistency, Drizzle migration-chain check, Next.js build, database reference-matrix generation, and generated-file drift verification.
2. **Unit Tests:** pnpm test:unit and pnpm test:ui.
3. **Isolation Suite:** PostgreSQL/pgvector 16 service and pnpm test:isolation against a temporary CI database.

package.json also defines pnpm test:db, but the reviewed CI workflow does not invoke it. The Vitest db project has passWithNoTests: true with a temporary comment; no tests/db/ directory was present in the inspected tree. The test-file inventory contains 134 matching test files: 90 under tests/unit, 4 under tests/ui, and 40 across tests/services, tests/features, and tests/actions. The configured Vitest project globs cover the unit and UI roots; a complete runner-to-file mapping for the other 40 files was not established in WP-00. Do not claim all 134 files are run by the two Vitest CI jobs.

### Exact GitHub evidence

- Main CI run [#43582227215](https://github.com/DiabloNova/oxenn/actions/runs/43582227215) was a successful push run on main at 326403812756b815f5d9a7dc77e29097ff7dd6b0, the same application-code snapshot audited here. The Build and Test, Unit Tests and Isolation Suite jobs all concluded **success**.
- No GitHub Actions workflow run was registered for branch MVP_00 at the time of inspection. Its two observed check runs were Vercel Preview Comments, both successful; these are not the repository CI suite.
- A separate Remediation Event Recorder run [#43582395547](https://github.com/DiabloNova/oxenn/actions/runs/43582395547) failed in its Record lifecycle and CI evidence step. It is not one of the three CI jobs above. Other recorder runs on the same main commit succeeded later; the isolated failure's root cause was not established in this audit.
- GitHub's workflow API listed eight workflows as active, while the checked-out tree contained three workflow files: ci.yml, capture-regression-baseline.yml, and remediation-event-recorder.yml. The other API-listed entries include temporary/Phase-1 verification names not present in the inspected branch tree. This registry/tree mismatch is **UNRESOLVED**; WP-00 did not delete or alter workflows.

### Local verification performed

| Command / check | Result | Evidence / limitation |
|---|---|---|
| node --test scripts/audit-gate.test.mjs | **PASS** | 14 tests passed, 0 failed |
| git diff --check | **PASS** | No whitespace errors in the initial documentation snapshot; rerun after final report commit |
| node scripts/docs/verify-phase-0-baseline.mjs | **NOT RUN locally** | Could not start because package typescript was unavailable in the constrained audit shell |
| pnpm install --frozen-lockfile | **BLOCKED locally** | The package installation process was killed by the temporary execution environment before dependencies/binaries were ready |
| pnpm typecheck, pnpm lint, pnpm build, pnpm test:unit, pnpm test:ui, pnpm test:db, pnpm test:isolation | **NOT RUN locally** | Required project dependencies were not installed in the audit shell |
| Exact-base GitHub CI | **PASS** | The successful main CI run above is tied to the exact application-code SHA audited |

No local test failure is inferred from an installation process being killed. Likewise, the main CI pass is evidence for the exact base commit, not a new CI run for the documentation-only report commit.

## 9. Current GitHub PR and issue state

### Open pull requests observed

| PR | Current state | Baseline relevance |
|---|---|---|
| [#142 RF-006 Preview CSP reporting](https://github.com/DiabloNova/oxenn/pull/142) | Open, mergeable, 10 changed files | Changes next.config.ts, src/proxy.ts, CSP report route/config, docs, and tests. Not merged into this snapshot. Revalidate proxy/security behavior if it is later merged. |
| [#143 TST-004 review branch sync](https://github.com/DiabloNova/oxenn/pull/143) | Open; 0 changed files | Main synchronization only in current PR metadata. |
| [#144 VER-004 review branch sync](https://github.com/DiabloNova/oxenn/pull/144) | Open; 0 changed files | Main synchronization only in current PR metadata. |

No open PR was merged, retargeted, edited, or otherwise modified during WP-00. The #142 changes are not present in the audited main commit and must not be silently assumed as current implementation.

### Carried-forward issue disposition against current code

| Issue | WP-00 disposition | Current evidence and remaining action |
|---|---|---|
| [#115 — provider-bound crawler URL SSRF boundary](https://github.com/DiabloNova/oxenn/issues/115) | **VALID / OPEN** | Firecrawl validates the seed locally and filters returned results, but the adapter explicitly acknowledges the provider may already have fetched an off-origin URL. Requires a separately scoped remediation and negative tests proving unsafe targets are not submitted/fetched. |
| [#116 — revoked/missing workspace membership authorization regression](https://github.com/DiabloNova/oxenn/issues/116) | **PARTIALLY_VALID / OPEN** | Current session lookup left-joins membership and returns no session when the membership role is absent. Existing tests cover session creation refusal after membership revocation, but a direct getSession/authorizeApiRequest regression for an otherwise valid session with no active membership was not found. Add that specific regression before treating the issue's acceptance criteria as complete. |
| [#87 — npm info severity classification](https://github.com/DiabloNova/oxenn/issues/87) | **FIXED / STALE in current source** | SEV_RANK includes info: 4; audit-gate tests assert info is WARN. The issue record remains open and was not closed here. |
| [#88 — missing/malformed patched_versions evidence](https://github.com/DiabloNova/oxenn/issues/88) | **FIXED / STALE in current source** | Parser classifies missing/empty/malformed patch data as unknown and fails closed for critical/high severity; regression tests cover those paths and fallback. The issue record remains open and was not closed here. |
| [#141 — password-reset email send timing](https://github.com/DiabloNova/oxenn/issues/141) | **FIXED / STALE for the described await regression** | Current requestPasswordReset invokes sender.send(...).catch(...) without awaiting the email-send promise. The precise awaited-send behavior described by the issue is absent. No behavioral timing test was run in WP-00; revalidate if this path becomes a release gate. |

These classifications are repository-baseline dispositions only. They do not authorize changes to issue state, unrelated PRs, or the affected application code.

## 10. Baseline findings and downstream implications

| ID | Finding | State | Suggested owning work package / stage |
|---|---|---|---|
| RB-01 | Canonical Offer, versioned PIP, standalone Service SKU/Entitlement, bundle, Growth Plan, task and outcome persistence contracts are not present in the current Workspace schema snapshot. | **VALID GAP** | WP-03/WP-06/WP-07; MVP-02/03/10/12/13 |
| RB-02 | Existing tenant-wide plans/quotas/credits do not establish independent SEO/AEO/GEO SKU entitlement and usage. | **VALID GAP** | WP-02/WP-03; MVP-02/05/06/07/08 |
| RB-03 | Sampled Technical SEO, AI Visibility, competitive-analysis and report flows contain seeded/mock/synthetic behavior. | **VALID GAP** | WP-02/WP-05/WP-08; MVP-04 through MVP-11 |
| RB-04 | Firecrawl provider-side redirect/fetch boundary remains an SSRF risk (issue #115). | **VALID / OPEN** | Security gate before enabling the affected provider-bound acquisition path |
| RB-05 | Missing-membership session lookup has enforcement logic but lacks the issue-specific regression test (issue #116). | **PARTIAL** | WP-08; MVP-01 |
| RB-06 | CI does not invoke test:db; the Vitest db project has a no-tests-allowed setting and the separate 40 test files outside the unit/UI roots need explicit runner mapping. | **NEEDS REVALIDATION / COVERAGE GAP** | WP-09; maintain CI acceptance matrix |
| RB-07 | Workflow API's eight-active-workflow listing does not match the three workflow files in the current Git tree. | **UNRESOLVED** | WP-09; investigate workflow registration/history without deleting anything |
| RB-08 | Platform Admin code is present but the dedicated database/OIDC runtime is not activated per checked-in security documentation. | **KNOWN OPERATIONAL BLOCKER** | Separate operational authorization; not part of customer MVP feature work |
| RB-09 | The engineering baseline document's source observations predate the current main snapshot and explicitly disclaim a fresh full audit. This WP-00 report is the current scoped revalidation evidence. | **STALE SOURCE SNAPSHOT** | Reference this report for current findings; update the baseline document only under a separately approved documentation scope if needed |
| RB-10 | Root README.md still describes the product mainly as an AI visibility/AEO platform, while the owner-approved product specification now defines two assessment pillars and the wider product MVP. | **DOCUMENTATION DRIFT** | Product documentation alignment after owner review; no change made here |

## 11. Evidence not established in WP-00

The following remain **UNKNOWN / NOT VERIFIED** and must not be described as live or production-ready:

- Live Workspace database connectivity, schema application state, deployed RLS behavior, or a persistent production PostgreSQL instance.
- Actual Firecrawl/Gemini provider credentials, selected deployment provider, provider reachability, and real provider data provenance.
- Production session/authentication behavior, trusted proxy header provenance, and full route/action authorization coverage.
- Service-specific billing/entitlement correctness, payment confirmation, renewals/refunds, and commercial/legal terms.
- Real customer Offers, PIP versioning, market evidence, benchmark quality, outcomes, and end-to-end pilot behavior.
- Deployed telemetry/alert delivery and cost enforcement.
- Full behavior of the 40 test files outside the configured tests/unit and tests/ui Vitest roots.

## 12. Scope and completion gate

WP-00 did not:

- change application source, tests, schema, migration SQL, journals, snapshots, or generated database artifacts;
- add or configure an external provider, payment integration, database connection, or runtime environment variable;
- modify main, any other branch, open PR, GitHub issue state, deployment, or production resource;
- approve geography, customer cohort, service prices, legal terms, provider contracts, retention, or other owner decisions;
- claim any mock, schema, route, CI database, or historical test as proof of a live production workflow.

**WP-00 disposition: COMPLETE.** The repository baseline report and evidence index are recorded at this exact commit lineage. The parent MVP-00 stage remains **IN PROGRESS**. WP-01 and all owner decision packages remain pending; no downstream implementation stage is authorized by this report.

## 13. Primary source paths

- AGENTS.md
- README.md
- package.json, vitest.config.ts, .github/workflows/ci.yml
- src/proxy.ts
- src/services/auth/session.ts, src/services/auth/authorization.ts
- src/app/api/v1/audit/free/route.ts
- src/features/acquisition/application/orchestrator.ts
- src/features/acquisition/application/provider-router.ts
- src/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider.ts
- src/app/actions/technical-seo.ts
- src/app/actions/ai-visibility-audit.ts
- src/services/ai/ai-visibility-provider.ts
- src/features/ai-intelligence/services/ai-visibility-audit-engine.ts
- src/app/api/v1/analysis/competitive/route.ts
- src/app/[locale]/dashboard/audits/[id]/page.tsx
- src/features/billing/domain/plans.ts
- src/features/billing/services/subscription-service.ts
- database/drizzle/meta/0015_snapshot.json
- database/drizzle/meta/_journal.json
- database/platform-admin/drizzle/meta/0000_snapshot.json
- docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md
- docs/project/MVP_ENGINEERING_BASELINE.md
- docs/REPOSITORY_CONTEXT.md
- docs/security/SECURITY_MODEL.md, docs/security/RBAC_MODEL.md
