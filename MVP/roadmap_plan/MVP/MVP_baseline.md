# OXENN MVP Baseline — Executable Delivery Programme

**Document role:** Master engineering delivery plan for the approved OXENN MVP  
**Version:** 1.0  
**Prepared:** 2026-11-12  
**Product authority:** [Owner-approved MVP Product Specification](../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)  
**Portfolio map:** [Project Map](../../architecture_map/project_map.md)  
**MVP scope map:** [MVP Map](../../architecture_map/MVP_map.md)

> This is the programme baseline, not a statement of current implementation status and not authorization to begin implementation. Each stage requires a separately authorized task and a revalidated repository scope. Implementation must not be inferred from documentation.

## 1. Mission and intended release

Deliver a coherent, secure and evidence-grounded first OXENN release with two complementary customer paths:

1. Independently purchasable/activatable/useable digital services: SEO, AEO and GEO; optionally combined as the Digital Visibility Suite.
2. An optional, tightly scoped Product Assessment & Improvement pilot for existing physical products, digital products and services, including social-commerce sellers from day one.

The MVP must not force service customers into a full product-assessment journey. A customer may select only SEO, for example, and use it after registration with SEO-specific inputs and permissions. A bundle is optional. Product Assessment & Improvement is optional.

The MVP is successful only when end-to-end behavior is demonstrably real, authorized, traceable, usable and verifiable. A page, API route, schema, model prompt, mock response, provider package, unit test or successful build alone does not demonstrate a complete customer journey.

## 2. Product and engineering invariants

Every stage must preserve the following invariants:

### 2.1 Customer and Offer model
- Target customers include physical-product sellers, digital-product sellers, service providers, and social-commerce sellers.
- Natural persons can register and represent an Offer without a formal company.
- Offer nature is exactly physical, digital or service.
- Sales channels (website, marketplace, social network, messaging, offline/direct) are separate from Offer nature.
- One seller may own multiple Offers; one Offer may use multiple channels.
- A customer Offer is never an OXENN service SKU.

### 2.2 Independent commercial access
- Every service, including free services, requires a registered account and server-authenticated session.
- Registration does not grant all service entitlements.
- SEO, AEO and GEO have independently enforceable entitlements and quotas.
- The optional Digital Visibility Suite never becomes a prerequisite.
- Product Assessment & Improvement is optional and not a dependency for standalone digital services.
- Standalone SEO requires only service-specific inputs, permissions and consent, not a comprehensive PIP.
- The system must not charge for an unselected or unauthorized service.

### 2.3 Evidence and truth
- Distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation.
- Preserve applicable source, timestamp, geography, methodology, sample, scope, permission, freshness and confidence.
- Keep UNKNOWN, NOT_PROVIDED, NOT_APPLICABLE, ZERO, NEGATIVE, INCOMPLETE and FAILED distinct.
- UNKNOWN is not ZERO.
- Do not infer physical product quality from images or sentiment alone.
- Describe only observable AI responses and available provider metadata; never claim access to hidden model reasoning.
- Mark LIVE, MOCK, HYBRID, PARTIAL and FAILED truthfully; never present synthetic data as live.

### 2.4 Execution safety
- OXENN may recommend, plan, assign, organize, remind and track.
- Consequential external actions (publishing, price changes, payments, purchases, outbound messages, supplier/customer contact, social-account changes) require the applicable permissions and explicit customer approval.
- Every important change and approval must have an auditable actor, time, scope and result.
- Retry and execution behavior must be bounded and idempotent where relevant.

### 2.5 Architecture
- Preserve the nine product domains as interconnected capabilities, not nine mandatory purchases.
- Keep service catalog, SKU, plan, subscription, entitlement, quota and usage ledger cross-cutting.
- Put AI provider/framework dependencies behind OXENN-owned interfaces.
- Separate probabilistic model output from deterministic validation, policy, authorization and business state transitions.
- Do not assume a live database or production integration. Verify the actual environment before making claims.
- Do not impose a graph database, microservices, a particular payment provider, a particular crawler, or a particular AI orchestration framework unless repository evidence and explicit architecture decisions support it.

## 3. Delivery strategy

The roadmap is dependency-led. Build the shared security and commercial foundations first, then Offer/PIP and evidence; deliver independently usable digital services in distinct vertical slices; then build the broader product assessment and improvement lifecycle; finally validate integrated pilot journeys and release readiness.

### 3.1 Stage order

| Stage | Name | Primary outcome | Critical dependency |
|---|---|---|---|
| MVP-00 | Product decisions and delivery governance | No hidden product/commercial decisions; testable stage contracts | Owner decisions and repository snapshot |
| MVP-01 | Identity, workspace and security foundation | Authenticated, tenant-safe service boundary | MVP-00 |
| MVP-02 | Service catalog, entitlements and usage | Independent service selection and server-side access | MVP-01 |
| MVP-03 | Seller, Offer and PIP | Canonical customer Offer model and versioned profile | MVP-01; service-specific inputs remain independent |
| MVP-04 | Evidence acquisition and traceability | Permission-aware source collection and auditable evidence | MVP-01 and shared contracts from MVP-00 |
| MVP-05 | Standalone SEO | End-to-end SEO service independent of other SKUs | MVP-02, MVP-04 |
| MVP-06 | Standalone AEO | End-to-end answer-engine assessment | MVP-02, MVP-04 |
| MVP-07 | Standalone GEO | End-to-end generative-engine visibility assessment | MVP-02, MVP-04; AEO/ GEO separation decision |
| MVP-08 | Optional Digital Visibility Suite | Bundle composition and unified digital reporting | MVP-05, MVP-06, MVP-07 |
| MVP-09 | Geo-market context and contextual benchmarks | Market/geography evidence suitable for comparisons | MVP-03, MVP-04 |
| MVP-10 | Product value and competitiveness assessment | Foundational customer/value/competitor/operational assessment | MVP-02, MVP-03, MVP-04, MVP-09 |
| MVP-11 | Gap analysis, recommendations and transparent scenarios | Evidence-linked decisions and bounded scenario estimates | MVP-05–MVP-10 as applicable |
| MVP-12 | Growth plan, approval and task workflow | Customer-approved plan and trackable tasks | MVP-11 |
| MVP-13 | Outcomes and continuous improvement | Traceable outcome capture and reassessment | MVP-12 and measurable baselines |
| MVP-14 | Integrated pilot validation and release readiness | Verified user journeys and controlled release decision | MVP-01–MVP-13 |

Stages may be split into smaller implementation tasks. Stages must not be silently collapsed if doing so removes separate acceptance evidence.

## 4. Detailed stage specifications

Every stage has a standalone execution brief under [roadmap/](./roadmap/README.md). Each file repeats the product context, relevant constraints, implementation sequence, test expectations, exit criteria and handoff requirements so an AI agent can use it without needing the entire portfolio narrative.

- [MVP-00 — Product decisions and delivery governance](./roadmap/00-product-decisions-and-delivery-governance.md)
- [MVP-01 — Identity, workspace and security foundation](./roadmap/01-identity-workspace-and-security-foundation.md)
- [MVP-02 — Service catalog, entitlements and usage](./roadmap/02-service-catalog-entitlements-and-usage.md)
- [MVP-03 — Seller, Offer and Product Intelligence Profile](./roadmap/03-seller-offer-and-product-intelligence-profile.md)
- [MVP-04 — Evidence acquisition and traceability](./roadmap/04-evidence-acquisition-and-traceability.md)
- [MVP-05 — Independent SEO service](./roadmap/05-independent-seo-service.md)
- [MVP-06 — Independent AEO service](./roadmap/06-independent-aeo-service.md)
- [MVP-07 — Independent GEO service](./roadmap/07-independent-geo-service.md)
- [MVP-08 — Optional Digital Visibility Suite](./roadmap/08-optional-digital-visibility-suite.md)
- [MVP-09 — Geo-market intelligence and contextual benchmarks](./roadmap/09-geo-market-intelligence-and-contextual-benchmarks.md)
- [MVP-10 — Product value and competitiveness assessment](./roadmap/10-product-value-and-competitiveness-assessment.md)
- [MVP-11 — Gap analysis, recommendations and transparent scenarios](./roadmap/11-gap-analysis-recommendations-and-transparent-scenarios.md)
- [MVP-12 — Growth plan, approval and task workflow](./roadmap/12-growth-plan-approval-and-task-workflow.md)
- [MVP-13 — Outcome measurement and continuous improvement](./roadmap/13-outcome-measurement-and-continuous-improvement.md)
- [MVP-14 — Integrated pilot validation and release readiness](./roadmap/14-integrated-pilot-validation-and-release-readiness.md)

## 5. Cross-stage implementation method

For every stage, the assigned AI/engineering team must:

1. Read the stage brief as the stage-specific product and engineering contract.
2. Verify the current repository, branch, base commit, open PRs, working tree, and file ownership. Never assume a branch, task, schema, provider, database, or environment is unchanged.
3. Reconcile relevant code and tests with the approved product requirements. Mark each relevant capability PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, LIVE, MOCK, HYBRID, PARTIAL, FAILED or UNKNOWN.
4. Identify the smallest coherent end-to-end vertical slice. Avoid broad refactors, speculative abstractions and unrelated cleanup.
5. Inspect existing patterns and consumers before changing files. Reuse a proven boundary where appropriate; do not duplicate or replace an existing owner without evidence.
6. Write a short technical design for the stage: affected modules, domain contracts, state transitions, data ownership, security boundary, failure policy, tests and rollback strategy.
7. Implement only the approved stage scope. Stop and ask for owner direction when an unresolved product, commercial, privacy, legal, architectural or destructive decision blocks safe implementation.
8. Add tests at the correct layers: unit, contract, integration, authorization/tenant isolation, failure/partial states, and end-to-end where appropriate.
9. Run focused tests, relevant broader tests, type/lint/build checks as available. Record exact commands, environment, commit and results.
10. Inspect the final diff for scope leakage, accidental secrets, mock/live confusion, broken imports, incorrect links and unrelated changes.
11. Report implemented versus verified versus live separately, list remaining gaps and risks, and hand off only after stage exit evidence is complete.

A code change is not authorized merely because a stage brief describes it. The current owner instruction/task must authorize the target branch, paths, and operations.

## 6. Shared technical acceptance gates

### 6.1 Identity and tenancy
- Every API and server action uses authenticated server context where required.
- Cross-user and cross-workspace access tests deny unauthorized access.
- Tenant identity is not trusted from client-controlled headers or body fields.
- Platform administrator privileges are distinct from tenant roles.

### 6.2 Service access and billing
- Each SKU has an explicit server-enforced entitlement and applicable quota.
- Free services remain authenticated.
- Unselected services are neither charged nor activated.
- Client state cannot create paid entitlements.
- Retries, duplicate callbacks and concurrent requests cannot double-consume or double-charge.

### 6.3 Data and evidence
- Data ownership, scope, retention and access are explicit.
- Important measurements are time- and scope-bound.
- Evidence references are durable and auditable.
- Partial, missing, stale, contradictory and failed data is represented honestly.
- Persistence claims require proof of the real read/write path in the target environment.

### 6.4 Acquisition and providers
- Source permissions, allowed protocols, redirects, timeouts, response sizes, rate limits and cost limits are bounded.
- Provider, model/surface, run time, locale, input scope and response evidence are recorded where available.
- Provider outage, invalid credentials, unavailable source, partial coverage and mock mode are distinct outcomes.
- No fallback to synthetic data may be labeled LIVE.

### 6.5 AI and recommendation safety
- Retrieved content is untrusted data, not instructions.
- Structured output must pass deterministic schema, evidence, scope and policy validation.
- LLM output never bypasses authorization or approval.
- Recommendations disclose evidence, assumptions, uncertainty, cost/effort, risk and dependencies.
- Causal improvement is not claimed without an adequate measurement design.

### 6.6 External execution
- Consequential actions are off by default.
- Explicit approval is scoped to the action and context.
- Revocation/stop behavior and audit history are available.
- Successful tool/API completion is not equated with business outcome success.

## 7. Global Definition of Done

A stage is complete only when all applicable items are true:
- Stage-specific scope is implemented and no unapproved work is included.
- All stage acceptance criteria are satisfied.
- Positive, negative, boundary, cross-tenant, and partial/failure cases are tested as applicable.
- Existing functionality and contracts affected by the change have regression coverage.
- The implementation is documented at the relevant product/engineering boundary.
- No mock, fixture, estimate, hypothesis or simulation is misrepresented as observed/live fact.
- Security, privacy, cost, rate, retry, idempotency, retention and audit needs are addressed.
- Focused and required broad checks have results recorded with the exact commit and commands.
- Remaining risks, open decisions and known limitations are explicit.
- The owner receives a concise evidence-based handoff and decides whether the next stage may begin.

A stage may be marked **IMPLEMENTED** without being **VERIFIED** only when the remaining verification is explicitly documented and the stage is not represented as complete or release-ready.

## 8. Overall MVP acceptance

The MVP can be proposed for pilot only after:
- A registered customer can use the selected standalone service without purchasing other services.
- SEO-only use works without comprehensive PIP completion.
- AEO and GEO are distinct, observable and not double-counted.
- Optional bundle terms and entitlements are transparent and correct.
- Every service requires authentication and the correct service entitlement.
- The broader assessment supports physical, digital and service Offers, including social-commerce sellers as a channel/customer segment.
- The PIP, evidence, baseline, benchmark, gaps and recommendations are traceable.
- The customer can approve a plan and track tasks.
- Outcomes can be recorded with evidence and measurement windows.
- No consequential external action is performed without required explicit approval.
- The relevant user journeys pass controlled integration/E2E checks and security review.
- Live provider/data/database claims are verified in the actual target environment, not inferred from repository artifacts.

## 9. Programme-level non-goals

This MVP does not deliver new-product ideation, industrial R&D, design/prototyping/manufacturing, full enterprise resource planning, deep integrations with every external platform, a broad expert marketplace, autonomous external actions, advanced guaranteed ROI forecasting, or AI Infrastructure as a dependency of the customer-facing assessment product.

## 10. Known open decisions

The roadmap must not invent launch geography/language/currency, pilot cohort, exact commercial prices, trial policy, quotas, overage, renewal, refund, legal/consent wording, allowed source matrix, confidence formula, workspace role model, Offer limits, exact AEO/GEO metric division, or pilot success thresholds. Resolve each through an owner-approved decision before the affected stage is committed.

## 11. Canonical references

- [MVP Product Specification](../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Product Architecture](../../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)
- [Project Map](../../architecture_map/project_map.md)
- [MVP Map](../../architecture_map/MVP_map.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service decision — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
