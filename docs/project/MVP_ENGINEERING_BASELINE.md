# OXENN — MVP Engineering Baseline

**Document status:** Current engineering baseline for the owner-approved product MVP  
**Revision:** 1.0  
**Prepared:** 2026-11-12  
**Repository:** `DiabloNova/oxenn`  
**Current main commit at preparation:** `5a28d6a88f2579ebc253ec697ec7a26be8f0ba4f`  
**Product authority:** [OXENN MVP Product Specification](../product/OXENN_MVP_PRODUCT_SPECIFICATION.md)

> This document maps the approved product MVP to repository evidence. It is not a claim that every requirement is implemented or production-ready. The code-level assessment below was originally inspected against `main@7bd17ac5d6ff1621fdc00ca2882a12268fbc9bf4`. PR #133 was subsequently merged at `5a28d6a`; its 11 changed files were documentation and tests, with no application source, API, schema, or migration changes. The code-specific observations therefore remain tied to that inspected source baseline. This document is not a fresh full repository audit of every file at the merge commit.

## 1. Purpose and authority

This baseline provides the engineering interpretation of the current OXENN MVP product specification. Use it to:

- Separate approved product scope from actual implementation status.
- Identify reusable infrastructure and incomplete or missing product workflows.
- Establish an evidence-based delivery sequence.
- Prevent UI pages, schemas, mock results, or isolated endpoints from being described as complete user journeys.
- Preserve the distinction between customer Offers and OXENN services/SKUs, including independent service entitlements and quotas.

The authority order is:

1. [OXENN MVP Product Specification](../product/OXENN_MVP_PRODUCT_SPECIFICATION.md) — current product scope.
2. [OXENN Product Architecture](../architecture/OXENN_PRODUCT_ARCHITECTURE.md) — nine-domain target architecture and platform boundaries.
3. [Product & Market Improvement Strategy](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18) — strategic context.
4. Stele decisions `KNOW-66`, `KNOW-25`, `KNOW-64`, and `KNOW-22`.
5. This engineering baseline — code mapping and gaps at the recorded repository snapshot.

The old Phase 0 two-journey scope file is no longer the current product MVP authority. Its historical engineering/security evidence is retained in Git history and in the relevant audit/verification records.

## 2. Repository snapshot and verification limits

### 2.1 Snapshot

- Default branch: `main`.
- Current main commit when this baseline was prepared: `5a28d6a88f2579ebc253ec697ec7a26be8f0ba4f`.
- PR #133 (Wave 0 revalidation) was merged into main on 2026-11-12.
- PR #133 changed 11 documentation/test files. It did not modify application source, APIs, database schema, or migrations.
- Source-level capability observations below are based on the prior inspected `main@7bd17ac5d6ff1621fdc00ca2882a12268fbc9bf4`, which was the product-code baseline immediately before PR #133.
- No new build or test run was performed as part of preparing this document.
- No live production/staging database was queried. A checked-in schema, migration, or repository adapter does not prove live persistence or effective deployed RLS.
- Live provider credentials/reachability and deployed runtime behavior remain separate verification requirements.

### 2.2 Evidence vocabulary

Use these terms consistently:

- **Missing:** no corresponding end-to-end product workflow was found in the inspected paths.
- **Partial infrastructure:** useful components exist, but they do not yet demonstrate the complete customer workflow.
- **Mock/placeholder:** output or interaction is simulated, seeded, hard-coded, or not connected to a real customer workflow.
- **Repository-verified:** source/tests establish behavior in the checked-in repository.
- **Runtime verified:** the behavior was exercised in the relevant deployed or controlled runtime.
- **Live:** the relevant production-connected service/provider/data path was directly verified.
- **Unknown / Not verified:** evidence is insufficient. Do not infer success from code presence.

## 3. Product and commercial invariants for engineering

### 3.1 Customer Offer vs OXENN service

Keep two separate models throughout domain logic, persistence, APIs, billing, and UI:

- **Customer Offer:** the existing physical product, digital product, or service that OXENN assesses.
- **OXENN Service/SKU:** the capability purchased or activated by a customer, such as SEO, AEO, GEO, or Product Assessment & Improvement.

A seller/provider may be an individual, business, or organization. Offer nature is `physical | digital | service`. Sales channels—including websites, marketplaces, social networks, messaging channels, and offline/direct channels—are separate attributes. Social Commerce is not an exclusive Offer nature.

### 3.2 Independent service access

After registration and authentication, a customer can choose only the service needed. In particular:

- SEO, AEO, and GEO are independently selectable and purchasable/activatable.
- The Digital Visibility Suite is an optional bundle, not a mandatory prerequisite.
- Product Assessment & Improvement is optional and is not a gate to standalone SEO/AEO/GEO.
- A user who only needs SEO must not have to complete a comprehensive PIP or purchase AEO/GEO.
- Each service has a separately enforced server-side entitlement and applicable quota.
- Registration proves identity, not paid access to every service.
- The server must not charge for unselected services or create entitlements from client-side claims.

The commercial model should distinguish at least Service Catalog, Service SKU, Plan/Subscription or one-time purchase, Service Entitlement, Usage Quota/Ledger, Bundle/BundleItem, and Service Run. Introduce only the persistence details required by the approved scope; this document does not approve a database schema or migration.

### 3.3 Authenticated access invariant

Every service, including free services, requires a registered account and a server-authenticated session. Free does not mean anonymous. Authentication, service entitlement, quota, provider availability, and permission to access a specific data source are separate checks.

## 4. Nine-domain implementation mapping

The nine domains are connected product capabilities, not nine independently shippable applications. The current repository snapshot did not establish a complete end-to-end MVP workflow for any domain. Existing code provides reusable foundations of varying maturity.

| Domain | Evidence in inspected repository | MVP assessment |
|---|---|---|
| Product Intelligence Profile | Existing account/profile and brand structures are not a canonical versioned Offer PIP. No complete unified Offer/PIP workflow was found in the inspected schema/path inventory. | Core product model missing |
| Digital Product Assessment | SEO analyzers, crawl modules, brand/prompt/citation and AI visibility infrastructure exist. The inspected Technical SEO action uses hard-coded `secure-site.com`, seeded pages, and mock SEO signals. AI Visibility action invokes the engine without explicit provider selection; provider registry defaults to Mock unless Gemini is explicitly selected and credentialed. | Partial infrastructure; live vertical slices not proven |
| Product Value & Competitiveness | Competitor schema, service, repository, and API route exist; the route includes a mock fallback and the Radar UI is not a complete operational product assessment. | Partial infrastructure |
| Geo-Market Intelligence | No dedicated product/market/geography workflow was found in the inspected source/schema inventory. | Missing |
| Product Evidence Graph | Entity/relationship/graph infrastructure exists, but the complete canonical links among Offer, evidence, claim, assessment, gap, recommendation, plan, task, and outcome are not established. | Partial infrastructure |
| Simulation & ROI Lab | No full evidence-grounded scenario/ROI product workflow was found. Simple labeled estimates may be introduced where the evidence supports them. | Limited estimates only; advanced simulation deferred |
| Expert Network | No broad expert-network marketplace is required by the approved MVP. | Deferred |
| Planning & Execution Engine | Background/job infrastructure is not equivalent to a customer-approved Growth Plan and task lifecycle. The complete product-level plan/task model was not found in the inspected schema/path inventory. | Core workflow missing |
| Continuous Improvement Loop | Monitoring configuration, crawl snapshots, alerts, change detection, and regression detection exist. Outcome attribution, task-linked KPI changes, and integrated reassessment are not proven. | Partial infrastructure |

## 5. High-priority implementation and trust gaps

### P1 — Before relying on affected service flows

1. **Free Audit authentication:** the inspected `src/app/api/v1/audit/free/route.ts` does not perform a server-side session/workspace authorization check, while `src/proxy.ts` bypasses `/api`. The route selects its mock path when `FIRECRAWL_API_KEY` is missing or contains a recognized placeholder value; a failed live Firecrawl scrape returns an HTTP 500 response rather than falling back to mock data. This conflicts with the owner-approved authenticated access invariant in `KNOW-64` and the current [Security Model](../security/SECURITY_MODEL.md). The route remains a confirmed repository-level gap until separately remediated and verified.
2. **Truthful live/mock behavior:** provider choice, credentials, LIVE/MOCK/HYBRID status, fallback policy, partial results, and failure states must be explicit. Synthetic output must not appear as live observation.
3. **Persistence and tenant proof:** repository code, SQL statements, schemas, and migrations do not by themselves establish durable application reads, deployed database connectivity, or effective RLS. Verify the entire path and tenant isolation in an appropriate environment.
4. **Service-level entitlement:** the independent service model requires server-side authorization for each Service SKU and its quota. UI hiding/showing is not authorization; client payment state does not establish entitlement.
5. **Scope integrity:** the old Technical SEO + AI Visibility two-journey boundary is historical engineering context, not the current product MVP. Those capabilities may remain reusable or independently purchasable services within Digital Product Assessment.

### P2 — New MVP foundations

- Service Catalog, Service SKU, Plan/Subscription, Entitlement, Usage Quota/Ledger, and optional Bundle contracts.
- Independent service request/inputs/run paths; standalone SEO must not require a complete PIP.
- Seller/provider identity for individuals, businesses, and organizations.
- Offer Registry with three Offer natures and separate sales channels.
- Versioned PIP, evidence provenance, baseline, and contextual benchmarks.
- Evidence-backed customer, market, competitor, value, pricing, and operational-readiness assessments.
- Growth Plan, approval, tasks, dependencies, and KPI outcome lifecycle.

### P3 — Later depth

- Deep social-commerce and marketplace integrations.
- Advanced financial/ROI simulations.
- Broad Expert Network capabilities.
- More advanced multi-product/multi-market portfolio management and enterprise integrations.

## 6. Required delivery sequence

The following sequence reflects product dependencies. It is a planning baseline, not an implementation authorization.

### Stage A — Product, policy, and release gates

- Finalize launch geography/language/currency and first pilot cohort.
- Define allowed evidence sources, permissions, freshness, sample, and confidence policy.
- Define independent service packaging, price, included quota, billing periods, optional bundles, and usage limits.
- Confirm workspace roles, Offer limits, and task ownership.
- Define the service-specific minimum input and consent requirements.
- Keep all free services behind registration and authentication.
- Establish release gates for auth, tenant isolation, SSRF-safe acquisition, provider truthfulness, persistence, and service entitlements.

**Exit evidence:** decisions are recorded; release-blocking security and data-truth gaps have owners and testable acceptance criteria.

### Stage B — Service Catalog, Entitlements, Offer Registry, and PIP

- Define the canonical OXENN service catalog and independent Service SKUs.
- Define one-time purchase or subscription semantics, entitlements, quotas, and usage records.
- Support optional bundles without making them mandatory.
- Implement Offer with physical/digital/service nature and separate Seller/Provider and OfferChannel dimensions.
- Support an individual seller without a registered company.
- Build versioned PIP for comprehensive product assessment.
- Define minimum inputs for standalone SEO/AEO/GEO so they do not require complete PIP.

**Exit evidence:** an authenticated customer can activate one standalone service and run it with only that service's required information and valid entitlement/quota.

### Stage C — Evidence, baseline, benchmark, and core assessment

- Establish evidence types, provenance, access permissions, and freshness.
- Build contextual baseline/benchmark metrics.
- Assess customers, demand, value, competitors, pricing, channels, and operational readiness.
- Connect selected SEO/AEO/GEO capabilities with explicit provider/runtime status.

**Exit evidence:** findings and scores are traceable to evidence, and missing/partial/mock/failed data is never presented as verified fact.

### Stage D — Gaps, recommendations, Growth Plan, and tasks

- Link every gap to baseline and evidence.
- Generate recommendations with rationale, confidence, priority, effort/cost, risk, and dependencies.
- Let customers review and approve a Growth Plan.
- Track tasks with owner, due date, status, dependencies, change history, and result KPI.

**Exit evidence:** a customer can approve a plan and track at least one task from proposal through a recorded outcome.

### Stage E — Outcomes and limited continuous improvement

- Record actual outcome values, evidence, time window, and external factors.
- Compare compatible before/after measurements without claiming unsupported causality.
- Reassess the relevant PIP, baseline, and plan.

**Exit evidence:** an outcome can be traced to the relevant action, time window, measurement method, and source.

## 7. Verification and release gates

A capability is not accepted as complete solely because a page, API route, type, schema, migration, mock response, unit test, or successful build exists.

For each user-facing service/workflow, verify:

- Positive and negative authorization paths, including cross-tenant boundaries.
- Entitlement and quota checks for the selected service.
- Provider selection and explicit LIVE/MOCK/HYBRID behavior.
- Failure, partial-result, retry, timeout, and resource-limit behavior.
- Evidence provenance, result history, and data persistence.
- Relevant integration/E2E behavior in a controlled environment.
- User-visible status and accurate limitations.

Do not describe production DB connectivity, live provider reachability, deployed RLS, or runtime authorization as verified without direct evidence from the relevant environment. The PR #133 repository and CI records are not proof of live production or staging database state.

## 8. Product acceptance criteria

The engineering acceptance criteria are the eleven functional requirements in the [Product Specification](../product/OXENN_MVP_PRODUCT_SPECIFICATION.md), FR-01 through FR-11. In particular:

- FR-01 defines physical/digital/service Offer nature, with sales channel separate.
- FR-07 and FR-08 define approval and task lifecycle.
- FR-10 prohibits unapproved consequential external actions.
- FR-11 independently tests selection, purchase/activation, entitlement, quota, and use of SEO/AEO/GEO without mandatory bundle purchase or comprehensive PIP completion.

These criteria must be decomposed into independently testable engineering tasks before implementation. The approved product document does not itself approve schema changes, migrations, branch creation, production changes, or deployment.

## 9. Engineering boundaries

- Keep Product Specification and Engineering Baseline separate: product requirements are not implementation evidence.
- Keep OXENN Service SKUs and customer Offers separate.
- Keep registration, entitlement, quota, provider configuration, and data-source permissions as separate checks.
- Keep social commerce as seller/channel context, not an Offer nature.
- Preserve the nine product domains; do not turn each one into a separate mandatory purchase or mandatory MVP project.
- Preserve the no-autonomous-external-action boundary.
- Do not claim a live capability based on mock, seeded, synthetic, placeholder, or simulated behavior.
- Treat the former two-journey scope as historical context only.

## 10. Approval boundary

This baseline establishes the target engineering sequence and the evidence required to accept it. It does not authorize immediate implementation. Each engineering stage or material change requires its own task, scoped branch/PR, acceptance criteria, verification plan, and explicit owner authorization. No database/schema/migration, deployment, or production operation is authorized by this document.

---

## Canonical references

- [OXENN MVP Product Specification](../product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [OXENN Product Architecture](../architecture/OXENN_PRODUCT_ARCHITECTURE.md)
- [Security Model](../security/SECURITY_MODEL.md)
- [Owner-approved MVP specification — KNOW-66](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-66)
- [Independent service decision — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Nine-domain architecture decision — KNOW-22](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22)
- [Product-to-Engineering Blueprint — DOC-67](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-67)
