# OXENN — MVP Product Specification

**Document status:** Owner-approved product scope  
**Specification version:** 1.0  
**Effective date:** 2026-11-12  
**Product:** OXENN — Product & Market Improvement Intelligence Platform  
**Repository:** `DiabloNova/oxenn`  
**Authority:** Owner approval recorded in Stele `KNOW-66`, together with the independent-service decision `KNOW-25` (version 2), authenticated-access decision `KNOW-64`, and the product-to-engineering mapping in `DOC-67` (version 4).

> This document is the canonical product-level definition of the current OXENN MVP. The approval of product scope does not mean the capabilities are implemented, production-ready, or released. Implementation status is documented separately in [MVP Engineering Baseline](../project/MVP_ENGINEERING_BASELINE.md).

## 1. Product definition

OXENN helps individuals, sellers, service providers, businesses, and organizations understand existing products and services, assess their market and competitive position, identify evidence-backed opportunities and gaps, plan improvements, and manage progress and outcomes.

OXENN connects product understanding, digital presence, commercial assessment, evidence, recommendations, planning, task management, and outcome measurement. It is not merely a collection of unrelated audits or dashboard tools.

The product MVP focuses on products and services that already exist and are being offered or sold. Creating a new product from an idea, industrial R&D, engineering design, prototyping, and production management are outside this MVP.

OXENN's MVP role is to analyze, assess, explain, recommend, plan, and manage execution through user-approved tasks and progress tracking. OXENN does not autonomously perform consequential external actions.

## 2. Target market and customer types

All four groups are in the target market from the beginning:

1. **Physical-product sellers:** manufacturers, brands, wholesalers, retailers, and independent sellers.
2. **Digital-product sellers:** software, SaaS, applications, platforms, and other digital products.
3. **Service providers:** companies, professionals, consultants, specialists, and independent individuals.
4. **Social-commerce sellers:** individuals and organizations that discover, promote, and sell through social networks or other social channels.

The four groups are market segments, not four mutually exclusive Offer types. A social-commerce seller may offer a physical product, a digital product, or a service. A natural person must be able to register and represent an offer without being required to own a formally registered company.

The first pilot cohort, initial geography, primary language, and currency remain explicit product decisions to be finalized. The strategy document identifies Iran as the initial commercial focus; this is not treated as a fully finalized launch-market configuration until the owner confirms the operating details.

## 3. Core domain concepts

### 3.1 Customer Offer

An **Offer** is a customer's existing product or service that OXENN assesses. Offer nature has exactly three values:

- `physical`
- `digital`
- `service`

An Offer belongs to a person, business, or organization acting as its seller/provider. The model must support multiple offers over time and must not require every seller to be a legal entity.

### 3.2 Seller/provider and sales channels

Seller/provider identity and sales channels are modeled separately from Offer nature.

Examples of sales channels include:

- A business website or online store.
- A marketplace or directory.
- A social network or messaging channel.
- An offline or direct-sales channel.

**Social Commerce is a seller/business and channel dimension, not an exclusive Offer nature.** A single Offer may be represented across multiple channels. Social-commerce sellers remain first-class users from the first release.

### 3.3 Product Intelligence Profile (PIP)

The **Product Intelligence Profile** is a versioned and reviewable description of an Offer and its commercial context. It may contain:

- Offer description, category, lifecycle and availability.
- Value proposition, differentiated claims, and supporting evidence.
- Current and target customer groups, needs, use cases, and purchase barriers.
- Target markets, geographies, languages, and channels.
- Pricing and business model, where provided and permitted.
- Competitors and alternative solutions.
- Operational constraints, capacity, and success measures.
- Known information gaps, contradictions, and required evidence.

The PIP describes the Offer and its intended conditions for success. It is not the same thing as the measured current-state baseline or a benchmark.

### 3.4 Current-State Baseline

The **Current-State Baseline** records what is currently known or observed about an Offer at a particular time. Every material measurement must identify its source, scope, timestamp, method, and limitations. User statements must remain distinguishable from independent observations.

### 3.5 Benchmark

A **Benchmark** is a context-specific comparison basis. It must be appropriate to the Offer's nature, category, market, geography, price range, maturity, and available evidence. A generic score must not be used to imply that unlike products are directly comparable.

### 3.6 Gap, recommendation, plan, and outcome

- A **Gap** is a measurable difference between the supported current state and a justified target or comparison criterion.
- A **Recommendation** is an actionable proposal linked to a gap or opportunity and to its supporting evidence.
- A **Growth Execution Plan** is a user-reviewable and user-approved collection of prioritized actions.
- A **Task** is a trackable execution unit with an owner, due date, status, dependencies, effort/cost estimate where available, and a result measure.
- An **Outcome** records what actually happened after an action, including its measurement window and evidence.

## 4. Independent OXENN services and commercial access

OXENN offers standalone services as well as optional combinations. A customer must be able to select, buy or activate, and use only the service needed.

### 4.1 Independent services

SEO, AEO, and GEO must each be independently selectable and purchasable/activatable where offered. Buying one does not require buying the others.

The **Digital Visibility Suite** is an optional bundle of SEO, AEO, and GEO. A bundle must disclose its included services and commercial terms. It is never a prerequisite for using a standalone service.

**Product Assessment & Improvement** is a broader optional service. It is not a prerequisite for standalone SEO, AEO, or GEO.

AI Infrastructure is a separate product line with its own packaging and roadmap. It is not a prerequisite for the core customer-facing MVP.

### 4.2 Registration, entitlement, and usage

- Every OXENN service, including free services, requires a registered account and a server-authenticated session. Free does not mean anonymous.
- Registration establishes identity; it does not unlock every paid service.
- Access to each paid or free service is governed by that service's own server-enforced entitlement and applicable usage quota.
- A customer who only needs SEO must be able to use standalone SEO without buying AEO, GEO, Product Assessment & Improvement, or a bundle.
- Standalone SEO must request only the information, evidence, permissions, and consent needed for SEO. It must not require completion of a comprehensive PIP or a broader Product Assessment.
- A customer may add another service later without repurchasing a service for which they already have a valid entitlement.
- Before confirmation, the customer must see the price, billing period, included quota, overage rules, renewal terms, and bundle contents that apply to the selected item.
- A customer must not be charged for a service they did not select or explicitly authorize.

The commercial model must distinguish the OXENN Service Catalog, Service SKU, plan or one-time purchase, subscription where applicable, entitlement, quota/usage ledger, optional bundle, and service run. These are distinct concepts from the customer's Offer and PIP. The exact persistence schema and payment-provider implementation are engineering decisions and are not approved by this product specification.

## 5. Customer journey

The comprehensive assessment and improvement journey is:

1. Register and sign in; create or join a workspace.
2. Identify the seller/provider and register an existing Offer.
3. Capture the Offer's basic information, channels, goals, and constraints.
4. Build or update a versioned PIP using staged questions and available evidence.
5. Assess customer fit, demand signals, value proposition, pricing, competitors, alternatives, channels, trust, and operational readiness.
6. Establish a Current-State Baseline and context-specific Benchmark.
7. Identify supported gaps, opportunities, uncertainty, and evidence limitations.
8. Generate prioritized recommendations with rationale, effort/cost, risk, and dependencies.
9. Present a Growth Execution Plan for user review and approval.
10. Track approved tasks, owners, due dates, progress, blockers, and results.
11. Reassess relevant measurements and update the PIP, baseline, and plan when new evidence becomes available.

This comprehensive journey is not a mandatory gate for every standalone service. A user may access one independent service after registration and authentication using only the service-specific inputs and permissions it requires.

## 6. Evidence, confidence, and reporting rules

OXENN must distinguish at least the following evidence classes:

- **User-provided information:** statements or data supplied by the customer.
- **Direct observation:** data collected from a source using an explicitly described method.
- **Third-party claim:** information reported by an external source and not independently confirmed.
- **Estimate:** a calculated or inferred value with stated assumptions.
- **Hypothesis:** an explanation or proposition that has not yet been validated.
- **Simulation:** a modeled scenario, not an observed result or guaranteed outcome.

For important evidence, retain provenance appropriate to the source: source URL or identifier, owner/permission where applicable, timestamp, geography, method, sample size, scope, freshness, and confidence. Not every field applies to every evidence item; missing metadata must be explicit rather than fabricated.

The following states must not be conflated:

- Unknown.
- Not provided.
- Not verified.
- Not applicable.
- Zero.
- Negative value.
- Incomplete.
- Failed.

**UNKNOWN is not ZERO.** Missing data must not be converted into a positive score, a negative score, or a fabricated observation.

OXENN must not infer physical product quality from images or online sentiment alone. Quality claims require appropriate evidence such as specifications, test results, complaint/return data, operational records, or controlled experiments.

AI visibility observations must describe the provider, model or surface where available, prompt and locale, timestamp, response evidence, and limitations. OXENN must not claim access to hidden model reasoning.

## 7. Assessment and recommendations

Assessment depth and fields vary by Offer nature, market, and service selected. The common assessment dimensions include:

- Target customer and use case.
- Customer problem, demand signals, and barriers to purchase.
- Value proposition and substantiated differentiation.
- Direct competitors, substitutes, and alternative solutions.
- Price/value context and economic constraints where evidence is available.
- Channel fit, discoverability, and purchase path.
- Trust signals, reputation evidence, and material risks.
- Operational readiness: capacity, inventory, delivery, service scope, support, and constraints.
- Digital presence and visibility, including selected SEO/AEO/GEO services.

Each material finding must link to supporting evidence or clearly state that it is a hypothesis. Recommendations should identify the relevant gap/opportunity, rationale, priority, confidence, expected impact, effort/cost, risk, dependencies, and measurement approach. OXENN must separate correlation from causation when evaluating outcomes.

## 8. Planning, execution, and external-action boundary

A Growth Execution Plan must be reviewable and approved by the customer before its tasks are treated as authorized work. Each task should include a clear action, evidence/rationale, owner, target date, status, dependencies, resources/effort, risk, KPI, and change history.

OXENN may organize, assign, schedule, remind, track, and report on tasks. It must not, by default, publish content, change storefront prices, send external messages, make purchases/payments, contact suppliers/customers, modify social accounts, or perform another consequential external action.

Any future external execution requires appropriate authorization, explicit customer approval for the action, least-privilege access, a durable audit trail, and a mechanism to stop or revoke the action.

## 9. Scope of the MVP

### 9.1 In scope

- Registration, authentication, and workspace boundaries.
- Seller/provider representation for individuals, businesses, and organizations.
- Offer registration for physical products, digital products, and services.
- Sales-channel recording, including social networks and marketplaces.
- A versioned PIP with common and nature-specific fields.
- Evidence records, source provenance, confidence, freshness, and explicit unknown/incomplete states.
- Foundational market, customer, competitor, value, price, and operational-readiness assessment.
- Current-State Baseline, context-specific Benchmark, and evidence-linked Gap Analysis.
- Prioritized recommendations and a customer-approved Growth Execution Plan.
- Task ownership, due dates, dependencies, status, progress history, and outcome metrics.
- Independent selection/use of available services such as SEO, AEO, and GEO after registration, with service-specific entitlements and quotas.
- Optional service bundles.
- Manual or semi-automated progress tracking and limited reassessment.

### 9.2 Out of scope

- Creating a new product from an idea.
- Industrial R&D, engineering design, prototyping, manufacturing, or production planning.
- Autonomous execution of external actions.
- Full ERP, warehouse, shipping, payments, order management, or supply-chain operations.
- Deep automatic integrations with every social network, marketplace, payment gateway, carrier, or sales system.
- A broad Expert Network or expert marketplace.
- Advanced financial/ROI simulation presented as guaranteed prediction.
- Definitive TAM/SAM/SOM or sales forecasts without adequate evidence and a disclosed method.

MVP support for social-commerce sellers does not require deep platform integrations on day one. Manual and consent-based evidence collection is acceptable while integrations are validated and delivered in controlled stages.

## 10. Relationship to the nine product domains

The nine-domain architecture remains the product's organizing model. It does not mean all nine domains must ship as separate full products in the first release.

| Product domain | MVP role |
|---|---|
| Product Intelligence Profile | Core Offer understanding and versioned profile |
| Digital Product Assessment | Selected digital services and evidence-backed digital presence assessment |
| Product Value & Competitiveness | Foundational product, customer, price, value, and competitor assessment |
| Geo-Market Intelligence | Contextual, evidence-limited market and geography inputs |
| Product Evidence Graph | Minimum provenance and traceability linking evidence, Offer, findings, and recommendations |
| Simulation & ROI Lab | Simple, explicitly labeled estimates only where data supports them |
| Expert Network | Deferred |
| Planning & Execution Engine | Core Growth Plan, approval, task and progress management |
| Continuous Improvement Loop | Limited outcome capture and reassessment |

Service catalog, SKU, entitlement, quota, billing, authentication, workspace isolation, auditability, and usage metering are cross-cutting platform capabilities, not an additional intelligence domain.

## 11. Functional acceptance criteria

| ID | Acceptance criterion |
|---|---|
| FR-01 | A user can create an Offer with nature physical, digital, or service; unrelated fields are not mandatory. |
| FR-02 | Each Offer can have a versioned PIP with common and nature-specific information. |
| FR-03 | Material evidence has an appropriate source/type, time, and confidence or an explicit missing/unknown state. |
| FR-04 | Commercial assessment separates observed facts, third-party claims, estimates, hypotheses, simulations, and limitations. |
| FR-05 | Current state and benchmark/target can be compared at a defined metric level; unavailable data is explicit. |
| FR-06 | Each recommendation links to a relevant gap/opportunity and supporting evidence or a clearly labeled hypothesis, with rationale and priority. |
| FR-07 | A customer can review and approve a Growth Execution Plan. |
| FR-08 | Tasks carry an owner, due date, status, dependencies, change history, and a result measure. |
| FR-09 | A customer can record outcomes and reassess or revise the relevant assessment/plan. |
| FR-10 | No consequential external action occurs without the required permission and explicit approval. |
| FR-11 | A registered and authenticated customer can independently select, purchase/activate, and use SEO, AEO, or GEO where offered; each service has its own server-enforced entitlement and quota; bundles are optional; no standalone service requires purchase of another service or completion of a comprehensive PIP. |

## 12. Non-functional requirements and trust

- Enforce authentication and authorization server-side at every relevant Route Handler and Server Action.
- Derive tenant/workspace identity from a trusted server session; never trust caller-supplied identity headers.
- Enforce tenant isolation in data access and verify RLS behavior in the relevant test environment.
- Enforce each service entitlement and quota server-side; UI visibility is not authorization.
- Do not grant paid service access from client-side payment/status claims. Payment confirmation must be verified server-side.
- Make LIVE, MOCK, HYBRID, UNKNOWN, PARTIAL, and FAILED states explicit and user-visible where relevant.
- Never present mock, seeded, synthetic, or fallback data as live observation.
- Keep an audit trail for PIP/profile versions, assessments, plans, task changes, approvals, service activation, usage, and outcomes.
- Protect business, price, cost, customer, and social-channel information; collect only data necessary for the selected service and with applicable consent.
- Disclose service scope, price, quota, billing/renewal conditions, limitations, and data requirements before confirmation.
- Use safe, bounded acquisition and crawling controls, including SSRF protection, allowed protocols, redirect validation, timeouts, response limits, and rate/cost controls.
- Keep scoring/analyzer/benchmark methods versioned and reviewable.
- Preserve partial and failed execution states rather than converting them into success.

## 13. Success measures

Numeric targets must be set only after the initial pilot and measured baseline exist. Track at least:

- Account-to-first-service activation, separated by service and customer segment.
- Independent service selection and conversion, including SEO-only use.
- Offer registration and PIP readiness by Offer nature.
- Percentage of assessment results traceable to evidence.
- Customer-rated usefulness and actionability of findings/recommendations.
- Growth Plans approved and tasks started/completed.
- Task delay/blocker rate and time to useful first result.
- Outcome/KPI changes before and after actions, distinguishing attribution from correlation.
- Service execution completion, partial/failure rates, provider latency, and cost per run.
- Quota use, overage, refunds/adjustments, and billing/entitlement correctness.

## 14. Decisions still open

The following matters are not fixed by the approved product scope and must not be guessed:

1. Exact initial geography, language, and currency configuration.
2. First pilot segment, while all four target groups remain in the market.
3. Minimum evidence standards, authorized sources, freshness requirements, and acquisition permissions.
4. Scoring, confidence, and commercial-capacity methodology for each Offer nature.
5. Depth and sequencing of integrations with websites, analytics, social platforms, marketplaces, and sales systems.
6. Workspace roles and task ownership model.
7. Exact execution-management features in the first release.
8. Price, plan period, included usage, overage, and optional bundle composition for each service.
9. Offer limits per workspace and MVP quotas.
10. Service-specific product boundaries and which services are launch-ready; implementation and live-provider readiness must be proven separately.

## 15. Authority and history

This document is the current product MVP authority for the OXENN repository.

- `KNOW-66` records owner approval of the product specification and four target seller groups.
- `KNOW-25` version 2 records independent service selection, purchase/use, and optional bundles.
- `KNOW-64` records the registration and authenticated-session requirement for all services, including free services.
- `DOC-18` records the broader product strategy.
- `KNOW-22` records the nine-domain dashboard/product architecture.
- `DOC-67` version 4 maps the product decisions to architecture, phased work, and engineering gaps.

The former two-journey MVP boundary (Technical SEO Audit and AI Visibility Audit) is retained only as historical engineering context. It is no longer the current product MVP boundary. These capabilities may remain reusable services/capabilities within Digital Product Assessment, but they do not exclusively define the product MVP.

Product approval does not mean the repository already implements these requirements and does not, by itself, authorize any particular engineering, database, deployment, or production change. Engineering work must follow the separate current engineering baseline and separately approved execution tasks.

---

## Canonical decision references

- OXENN Stele project: `oxenn-59hxc`
- Owner-approved product specification: [KNOW-66](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-66)
- Independent service purchasing/access: [KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- Authenticated access to all services: [KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
- Product strategy: [DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- Nine-domain architecture: [KNOW-22](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22)
- Product-to-engineering mapping: [DOC-67](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-67)
