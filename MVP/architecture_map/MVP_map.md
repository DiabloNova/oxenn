# OXENN MVP Map — Products and Services Included in the MVP

**Document role:** Exact product and capability boundary for the current MVP  
**Specification version:** 1.0  
**Effective date:** 2026-11-12  
**Authority:** Owner-approved MVP Product Specification, KNOW-66; independent-service decision KNOW-25 v2; authenticated-access decision KNOW-64.

> This document defines what the MVP is intended to offer. It does not claim that any feature is already implemented, verified, commercially activated, or live. See the Engineering Baseline and the stage gates for implementation evidence.

## 1. MVP objective

The MVP must prove that a registered customer can either:
- Use a specific OXENN service independently (especially SEO, AEO, or GEO) with only that service's required inputs, entitlement, quota, and permissions; or
- Use the broader Product Assessment & Improvement journey to understand an existing Offer, assess its market and competitiveness, identify evidence-backed gaps, approve an improvement plan, track tasks, and record outcomes.

The MVP must not force every customer into the comprehensive assessment journey. A customer who only needs SEO must be able to use SEO without buying AEO, GEO, Product Assessment & Improvement, or the Digital Visibility Suite.

## 2. Target customers and supported Offers

### 2.1 Customer groups from day one

1. Physical-product sellers: manufacturers, brands, wholesalers, retailers, and independent sellers.
2. Digital-product sellers: software, SaaS, applications, platforms, and other digital-product owners.
3. Service providers: companies, consultants, professionals, specialists, and independent individuals.
4. Social-commerce sellers: individuals and organizations that sell or promote through social networks, messaging channels, or other social platforms.

A person may belong to more than one group. A natural person must be able to register and represent an Offer without a formal company registration.

### 2.2 Offer model

The MVP supports exactly three Offer natures:
- physical
- digital
- service

Sales channels are recorded separately. Supported channel categories include website/store, marketplace/directory, social network, messaging channel, offline channel, and direct sales. A single Offer may have multiple channels.

Social commerce is not a fourth Offer type. Deep automatic integrations with every social platform are not required on day one; manual and consent-based evidence capture is acceptable during the MVP.

## 3. MVP commercial offer catalogue

### 3.1 Independently usable digital services

The following services are independently selectable, purchasable/activatable, and usable where offered:

#### SEO — standalone service
- Customer selects SEO without having to select other OXENN products.
- Service requests only the website/property details, scope, permissions, and SEO-specific inputs it needs.
- A comprehensive PIP is not required.
- The run produces scoped findings with page/source evidence, methodology, timestamp, coverage, limitations, and explicit LIVE/MOCK/HYBRID/PARTIAL/FAILED status.
- Findings are prioritized with rationale and actionable remediation guidance.
- Quota and entitlement are specific to the SEO SKU.

#### AEO — standalone service
- Customer selects AEO independently.
- Service defines and records its buyer-intent/question scope, supported answer surfaces/providers, locale, measurement method, and run context.
- It evaluates whether selected content and sources provide clear, credible, answer-ready information for supported answer experiences.
- Observable response evidence and source attribution are stored where the provider exposes them.
- Output states limitations and incomplete provider/source coverage.
- Quota and entitlement are specific to the AEO SKU.

#### GEO — standalone service
- Customer selects GEO independently.
- Service defines the supported generative discovery/answer surfaces, prompts, locales, Offer/brand scope, and observable response metrics.
- It measures only observable mention/representation, factual consistency, references/citations where available, and repeatable response changes.
- It does not claim access to hidden model reasoning.
- Quota and entitlement are specific to the GEO SKU.

AEO and GEO are distinct commercial services even where some evidence methods overlap. The stage for decisions must define ownership of metrics and prevent double-counting. No service may silently fall back to mock data and present it as live.

### 3.2 Optional Digital Visibility Suite

An optional combination of SEO + AEO + GEO. It is available only as a choice, never as a prerequisite. Its product page and confirmation flow must disclose included services, quota allocation, pricing, billing period, renewal, overage, and bundle limits. Its underlying service entitlements and service-level status must remain auditable.

### 3.3 Optional Product Assessment & Improvement pilot

A limited, evidence-grounded unified assessment offering. It is a broader optional service, not a gate for standalone SEO/AEO/GEO.

The pilot includes:
- Seller/provider and Offer onboarding.
- Versioned Product Intelligence Profile (PIP) for a comprehensive assessment.
- Evidence records with provenance and explicit unknown/incomplete states.
- Foundational customer, demand, value proposition, competitor/substitute, price/value, channel, trust, and operational-readiness assessment.
- Contextual Current-State Baseline and Benchmark where suitable data exists.
- Minimum Geo-Market Intelligence required for market/geography context.
- Minimum Product Evidence Graph links across Offer, evidence, findings, gaps, recommendations, plans, and outcomes.
- Gap analysis and prioritized evidence-linked recommendations.
- Simple transparent scenario/effort/cost estimates only when inputs support them.
- Customer review and approval of a Growth Execution Plan.
- Task owners, dates, dependencies, status, history, progress and result measures.
- Manual or limited semi-automated outcome capture and relevant reassessment.

The pilot does not promise advanced predictive accuracy, exhaustive market coverage, or autonomous execution.

## 4. Nine-domain MVP coverage

| Product domain | MVP inclusion | Minimum expected scope |
|---|---|---|
| Product Intelligence Profile | Core for Product Assessment & Improvement | Seller/Offer model, three Offer natures, channel separation, versioned PIP, staged data capture |
| Digital Product Assessment | Core independent service pillar | Independently usable SEO, AEO, and GEO verticals with truthful provider/evidence states |
| Product Value & Competitiveness | Foundational pilot scope | Customer, demand, value, competitor/substitute, price, channel and operational readiness assessment |
| Geo-Market Intelligence | Limited/contextual | Market and geography inputs with explicit sources, date, scope and limitations |
| Product Evidence Graph | Minimum traceability | Evidence provenance and links among Offer, observations, metrics, findings, recommendations and tasks |
| Simulation & ROI Lab | Limited | Transparent arithmetic/scenario estimates with assumptions, ranges, cost/time, risks and uncertainty; no guaranteed ROI |
| Expert Network | Deferred | No broad expert marketplace or network required for MVP |
| Planning & Execution Engine | Core workflow | Approved plan, task ownership, dependencies, status/history and tracked result measures |
| Continuous Improvement Loop | Limited | Outcome capture and reassessment for selected metrics; no unsupported causal claims |

Authentication, workspace/tenant boundaries, service catalog, SKU, entitlement, quota, usage metering, audit history, safety policy, and reporting are cross-cutting platform capabilities. They are not a tenth intelligence domain.

## 5. Independent-service journey versus comprehensive assessment journey

### 5.1 Independent service journey

1. Register and sign in.
2. Select one service SKU (for example, SEO).
3. Review price/free status, quota, billing and renewal terms, required inputs, data use, permissions and limitations.
4. Complete service-specific inputs only.
5. Confirm consent and any necessary source authorization.
6. Server verifies the authenticated identity, service entitlement, applicable quota, permission and valid request scope.
7. Execute the service through an explicitly selected and observable provider/source path.
8. Validate result contracts, evidence and provenance.
9. Store or return the run with truthful completion state and a user-readable report.
10. Allow a later purchase/activation of another service without forcing repurchase of a valid existing entitlement.

An SEO-only customer must never be blocked because they did not create a comprehensive PIP, buy AEO/GEO, or purchase a bundle.

### 5.2 Product Assessment & Improvement journey

1. Register, authenticate, and establish the appropriate workspace context.
2. Identify the person/business/organization acting as seller/provider.
3. Register an Offer with nature physical, digital, or service; record channels separately.
4. Capture common and Offer-specific information and build a versioned PIP.
5. Collect permitted user-provided and observed evidence.
6. Assess relevant customers, demand, value, price, competitors, substitutes, markets, channels, trust and operating readiness.
7. Establish a time-bounded Current-State Baseline and justified contextual Benchmark.
8. Identify supported gaps, opportunities, contradictions and missing evidence.
9. Generate recommendations tied to evidence or explicitly labeled hypotheses.
10. Present transparent assumptions and scenarios where data supports them.
11. Prepare a prioritized Growth Execution Plan for customer review and approval.
12. Track authorized tasks and progress; no consequential external action without explicit approval.
13. Record outcomes, measurement windows and evidence; reassess relevant dimensions.

This is an optional journey. The standalone service journey must remain available independently.

## 6. Core functional requirements

The MVP must satisfy the approved FR-01 through FR-11 requirements:

| ID | MVP behavior |
|---|---|
| FR-01 | Create an Offer as physical, digital, or service; do not force unrelated fields |
| FR-02 | Maintain a versioned PIP with common and nature-specific fields |
| FR-03 | Retain evidence source/type, time and confidence or explicit missing/unknown state |
| FR-04 | Distinguish observed fact, third-party claim, estimate, hypothesis, simulation and limitation |
| FR-05 | Compare current state to a justified target/benchmark metric by metric; missing data remains explicit |
| FR-06 | Link recommendations to a supported gap/opportunity and evidence or labeled hypothesis |
| FR-07 | Let the customer review and approve a Growth Execution Plan |
| FR-08 | Track task owner, due date, status, dependencies, change history and result measure |
| FR-09 | Record outcomes and reassess/update relevant assessment and plan |
| FR-10 | Prevent consequential external actions without permission and explicit approval |
| FR-11 | Allow independently selected, purchased/activated and usable SEO/AEO/GEO with service-specific entitlement and quota; bundle optional; no comprehensive PIP prerequisite |

## 7. Security, commercial, evidence and trust requirements

- Every service, including a free service, requires registration and a server-authenticated session.
- Registration is not a universal paid entitlement.
- Every service's entitlement and quota are enforced server-side.
- Paid access is never granted from client-side payment or status claims; payment confirmation is verified server-side.
- A customer is charged only for a selected and authorized item.
- The system distinguishes Offer, Service SKU, plan/subscription, entitlement, quota/usage record, bundle, and service run.
- Tenant/workspace identity comes from trusted server authentication context, not caller-controlled identity headers or request fields.
- Every source acquisition is bounded and permission-aware; crawling requires SSRF defenses, redirect validation, timeout, size and rate limits.
- Evidence states and provenance must be visible and auditable. UNKNOWN is not ZERO.
- User-provided claims are not silently converted into independent observations.
- LIVE, MOCK, HYBRID, PARTIAL and FAILED states are explicit; mock/seed/synthetic data is never described as live.
- Physical quality claims require appropriate evidence, not imagery or sentiment alone.
- Simulations are explicitly labeled and are not guaranteed results.
- Customer review/approval is required before consequential external action.
- Business, pricing, customer and social-channel data is minimized, protected and accessed only with valid permissions.

## 8. Explicit MVP exclusions

- Creating new products from ideas.
- Industrial research and development, engineering design, prototyping, manufacturing or production management.
- Autonomous publishing, price changes, purchases, payments, messages, supplier/customer contact or social-account modifications.
- Full ERP, order, inventory, warehouse, logistics, shipping, payment or supply-chain management.
- Deep integrations with every social network, marketplace, CMS, analytics, payment or sales platform.
- A broad Expert Network marketplace.
- Advanced predictive ROI/financial simulations or unsupported sales forecasts.
- Enterprise portfolio orchestration and deep ERP/CRM integration as a general release requirement.
- AI Infrastructure as a dependency of the core customer-facing assessment MVP.
- Treating the historic Technical SEO Audit and AI Visibility Audit as the complete current product boundary.

## 9. Decisions that remain open (do not invent)

Before the affected release stage, the owner/product authority must decide:
- Initial launch geography, language, currency and pilot cohort.
- Allowed evidence sources, account permissions, consent wording and freshness windows.
- Sample-size and confidence policy for each metric.
- Distinct AEO versus GEO metric ownership and supported provider/surface matrix.
- Service prices, trial/free policy, quotas, overage, billing period, renewal, refund and bundle composition.
- Workspace roles, seller/provider ownership, Offer limits and task ownership policy.
- Supported crawling boundaries and rate/resource budgets.
- Minimum data and success criteria for the pilot.
- Which product-assessment dimensions are included in the first pilot for each Offer nature.

An implementation agent must surface unresolved items as blockers or explicit owner decisions; it must not make commercial, geographic, legal, privacy, or product-scope choices by assumption.

## 10. Canonical references

- [Owner-approved MVP Product Specification](../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](./project_map.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
