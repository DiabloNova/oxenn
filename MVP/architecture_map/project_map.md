# OXENN Project Map — Complete Product Portfolio

**Document role:** Portfolio-level map of all OXENN product lines and their boundaries  
**Product identity:** OXENN — Product & Market Improvement Intelligence Platform  
**Version:** 1.0  
**Product scope authority:** Owner-approved MVP Product Specification (2026-11-12), Product Strategy v2 (DOC-18), KNOW-25, KNOW-22, KNOW-64, and the current Product Architecture.

> This is a product map, not an implementation-status report. Inclusion here means that a product/capability belongs to the defined portfolio or strategic direction; it does not prove that it is implemented, commercially available, or live. The current MVP subset is defined separately in [MVP_map.md](./MVP_map.md).

## 1. What OXENN is

OXENN is an evidence-grounded platform for understanding existing products and services, assessing their digital presence and market competitiveness, diagnosing measurable gaps, recommending improvements, organizing approved work, and measuring outcomes over time.

The platform connects two complementary assessment pillars through a shared planning and improvement lifecycle:

1. **Digital Product Assessment** — how an existing product or service is represented, discovered, understood, and surfaced across websites, search engines, answer engines, generative AI surfaces, marketplaces, review sources, and other permitted digital channels.
2. **Product Value & Competitiveness Assessment** — why an existing offer wins or loses against customer needs, competitors, substitutes, price/value alternatives, distribution conditions, product attributes, service quality, and market context.

Both pillars feed a shared evidence, diagnosis, recommendation, planning, approval, task, and outcome-management capability. OXENN is therefore not just an SEO dashboard, social-listening tool, competitor table, or set of unrelated AI audits.

The initial commercial focus is Iran, with international expansion later. Launch geography, pilot cohort, language, currency, and exact operational launch configuration remain subject to explicit owner decisions; this map does not invent those values.

## 2. Portfolio hierarchy

### 2.1 Master platform

**OXENN Product & Market Improvement Intelligence Platform**

The master platform provides:
- Registered customer identity and authenticated service access.
- Person, seller/provider, business, organization, and workspace context.
- A model of the customer's existing Offers.
- Product Intelligence Profiles (PIPs), baseline and benchmark records.
- Evidence and source provenance.
- Digital and commercial/product assessments.
- Gaps, opportunities, recommendations, and transparent scenarios.
- Customer-approved plans, tasks, progress, and outcome records.
- Independent service catalog, purchase/activation, entitlements, quotas, and usage metering.
- Reporting, auditability, telemetry, and controlled integrations.

The platform is the common product experience. It is not a requirement that every customer purchase every service or use every domain.

### 2.2 Pillar A — Digital Product Assessment

This pillar evaluates the digital discoverability, representation, credibility, and answerability of an existing customer Offer across permitted digital sources and surfaces.

#### A.1 Search Engine Optimization (SEO)

A standalone service for assessing and improving the technical and on-page search performance of selected websites or web properties associated with an Offer.

Potential assessment areas include:
- Website and page discovery within an explicitly bounded crawl scope.
- Indexability and crawlability signals.
- Technical page and metadata checks.
- Content structure and relevance signals.
- Internal linking and canonical/redirect behavior where applicable.
- Performance and accessibility-related indicators where the selected method supports them.
- Search-result and ranking data only where a real permitted provider/source is connected.
- Prioritized findings with page-level evidence and clear limitations.

SEO is independently selectable and usable. It requests only SEO-specific inputs, access, and consent. It does not require AEO, GEO, Product Assessment & Improvement, or a comprehensive PIP.

#### A.2 Answer Engine Optimization (AEO)

A standalone service focused on how effectively an Offer and its content answer explicit customer questions across supported answer-oriented search or response surfaces.

Potential assessment areas include:
- Buyer-intent and information-seeking question sets.
- Question coverage and answer readiness of selected content.
- Clarity, structure, factual support, and answer extraction.
- Observable inclusion, answer quality, and source references on explicitly supported surfaces.
- Locale, query, surface/provider, timestamp, and captured response evidence.
- Recommendations for making important content more useful and answerable.

AEO must have its own service contract and entitlement. It must not be presented as a synonym for all generative-AI visibility.

#### A.3 Generative Engine Optimization (GEO)

A standalone service focused on how an Offer, its brand, and its supported information are represented or referenced by supported generative-AI discovery and response systems.

Potential assessment areas include:
- Explicitly scoped prompts and user-intent scenarios.
- Observable brand/product mention and representation.
- Factual accuracy and consistency of responses.
- Citation, reference, and source-attribution observations where exposed by the provider.
- Locale, model/surface, provider version where available, timestamp, and response evidence.
- Repeatable measurements and change over time.

A GEO result must describe only the observable response and available metadata. OXENN must not claim access to hidden model reasoning. AEO and GEO can overlap; their exact metric ownership, duplicated checks, and separate customer value must be defined and tested before commercial packaging.

#### A.4 Content Intelligence — conditional portfolio extension

Content Intelligence may be offered as an independently packaged service only when its scope, SKU, entitlement, inputs, outputs, and operational evidence are explicitly approved and supported. It is a possible service extension, not an automatically included MVP service or a reason to make SEO/AEO/GEO dependent on one another.

#### A.5 Digital Visibility Suite — optional bundle

An optional bundle combining SEO + AEO + GEO under clearly disclosed commercial terms. The bundle:
- Is not a mandatory purchase.
- Does not replace the standalone service SKUs.
- Must enumerate included services, quota allocation, billing period, renewal, overage, and restrictions before confirmation.
- Must preserve service-level entitlement checks and prevent double charging or duplicate entitlement creation.

### 2.3 Pillar B — Product Value & Competitiveness Assessment

This pillar examines the economic, customer, product, service, and market reasons an existing Offer may succeed or underperform against alternatives.

Assessment dimensions can include:
- Target customers, needs, jobs-to-be-done, purchase barriers, and demand signals.
- Direct competitors and substitute solutions.
- Product specifications, features, packaging, and differentiated claims.
- Price/value context and business model, where data is available.
- Availability, distribution reach, geographic coverage, and channel fit.
- Service scope, delivery conditions, support, and operational readiness.
- Customer reviews, complaints, returns, and feedback as evidence with source limitations.
- Quality and performance evidence from suitable tests, operational records, controlled experiments, and verified data.
- Root-cause hypotheses, solution options, constraints, cost/time/resources, risks, and dependencies.

This pillar applies to physical products, digital products, and services. The evidence required differs by Offer nature. OXENN must not infer physical product quality from images or sentiment alone; appropriate test, return, complaint, operational, or controlled-experiment evidence is required for quality conclusions.

The service should distinguish directly observed facts from third-party claims, estimates, hypotheses, and simulations. Comparisons must be context-sensitive: geography, category, customer segment, maturity, price range, and sample coverage matter.

### 2.4 Product Assessment & Improvement — optional unified offering

Product Assessment & Improvement combines the shared PIP, selected Digital Product Assessment, Product Value & Competitiveness Assessment, evidence and diagnosis, recommendations, transparent scenario analysis, and approved Growth Execution Plan.

It is the broader end-to-end service for customers who want to understand and improve an Offer, rather than buy only one specialized digital service.

It may include:
- Product and seller/provider understanding.
- Current-state baseline and justified benchmark.
- Evidence-backed assessment across relevant dimensions.
- Gap and opportunity analysis.
- Prioritized recommendations with effort, cost, risk, confidence, and dependencies.
- Simple, explicitly labeled scenario estimates where the evidence permits.
- A customer-approved improvement plan and tracked tasks.
- Outcome capture and limited reassessment.

This broader service is optional. It is not a purchase, onboarding, or PIP prerequisite for standalone SEO, AEO, or GEO.

### 2.5 AI Infrastructure — separate product line

AI Infrastructure is a separate OXENN product line for businesses, public/private organizations, or institutions that need AI infrastructure capabilities. It has its own:
- Product definition and target customers.
- Packaging, SKUs, contracts, and pricing.
- Architecture, security, deployment, support, and operational standards.
- Delivery lifecycle and roadmap.

It is not a dependency of the core customer-facing Product Assessment & Improvement MVP. Its exact module catalogue and release scope are not sufficiently specified by the current MVP product document and must be defined in a separate product specification before being represented as an available service.

## 3. Shared product engine and cross-cutting capabilities

The following capabilities support both pillars. They are not automatically independent products or mandatory purchases.

### 3.1 Product Intelligence Profile (PIP)

A versioned and reviewable representation of an existing Offer and its commercial context: description, category, value proposition, customer groups, use cases, markets, channels, pricing/business model where permitted, competitors, constraints, evidence gaps, and goals.

The PIP describes the Offer. It is not the same as the measured current-state baseline or a benchmark. A service-specific workflow may operate without a comprehensive PIP where the service specification says so.

### 3.2 Evidence and provenance

A common evidence layer connects Offer, claims, sources, observations, metrics, assessments, findings, recommendations, decisions, tasks, and outcomes. Evidence classes include user-provided information, direct observation, third-party claim, estimate, hypothesis, and simulation. Important evidence retains applicable source, permission, timestamp, geography, method, sample, scope, freshness, and confidence metadata.

### 3.3 Planning & Execution Engine

A shared engine converts accepted recommendations from either pillar into a reviewable plan. It resolves dependencies and resource conflicts, supports priorities and effort/cost estimates, records owner and task state, collects approval, and tracks results.

AI-generated proposals, expert-reviewed work, customer-approved work, human-executed work, and independently verified outcomes must remain distinguishable. Consequential external actions are not autonomous by default and require the applicable explicit customer approval and authorization.

### 3.4 Geo-Market Intelligence

Contextual market and geography information supports both pillars: local market boundaries, target segments, competitor presence, distribution territories, demand signals, and regional comparisons. It must disclose source coverage, geography, dates, methodology, and confidence. Market estimates are not definitive forecasts without a validated method and adequate data.

### 3.5 Simulation & ROI Lab

A controlled way to compare action scenarios using known baselines, assumptions, costs, effort, time horizon, risk, dependencies, and uncertainty. Simulations are not observations and never guarantee ROI. Advanced predictive modelling is a later capability unless validated data supports more.

### 3.6 Continuous Improvement Loop

Tracks compatible measurements before and after approved changes; connects tasks to measurement windows and evidence; updates the relevant baseline, PIP, or plan; and uses outcome quality to improve later priorities. Monitoring without outcome attribution does not prove that a change caused an improvement.

### 3.7 Other shared platform capabilities

- AI Copilot and plan-aware conversation.
- Reporting, exports, and audit history.
- Data acquisition, files, imports, and consent-based integrations.
- Identity, workspace, organization, roles, and tenant isolation.
- Service catalog, SKUs, plans, subscriptions, entitlements, quotas, and usage ledgers.
- Human approvals and policy controls.
- Telemetry, evaluation, observability, and support tooling.

## 4. Nine-domain architecture mapping

The nine domains organize connected capabilities; they are not nine independent commercial products.

| Domain | Portfolio responsibility | Relationship to a saleable product |
|---|---|---|
| Product Intelligence Profile | Canonical understanding of an existing Offer | Shared foundation / optional comprehensive assessment |
| Digital Product Assessment | SEO, AEO, GEO and related digital-presence intelligence | Contains independent services and an optional bundle |
| Product Value & Competitiveness | Customer, value, price, competitor, substitute, product/service and operating assessment | Assessment pillar / part of Product Assessment & Improvement |
| Geo-Market Intelligence | Geography and market context | Shared intelligence capability |
| Product Evidence Graph | Traceability across sources, claims, evidence, findings and decisions | Shared trust/data capability |
| Simulation & ROI Lab | Transparent scenario and impact estimation | Shared capability; MVP limited |
| Expert Network | Qualified human expertise and review | Later extension; broad marketplace not in MVP |
| Planning & Execution Engine | Approved plans, tasks, workflow, and execution control | Shared engine; core MVP workflow |
| Continuous Improvement Loop | Outcome capture, reassessment, and improvement history | Shared engine; limited MVP capability |

## 5. Customer and Offer model

### 5.1 Customer segments

OXENN targets all four groups from the beginning:
1. Physical-product sellers: manufacturers, brands, wholesalers, retailers, and independent sellers.
2. Digital-product sellers: software, SaaS, applications, platforms, and other digital products.
3. Service providers: companies, professionals, consultants, specialists, and independent individuals.
4. Social-commerce sellers: individuals and organizations selling or promoting through social networks, messaging, or other social channels.

These segments can overlap. A social-commerce seller may offer a physical product, a digital product, or a service. A natural person can register and manage an Offer without being a formally registered company.

### 5.2 Customer Offer types

Offer nature has exactly three values:
- physical
- digital
- service

Sales channels are separate and may include a website/store, marketplace/directory, social network, messaging channel, offline channel, or direct sales. An Offer may use multiple channels.

Do not model social commerce as a fourth Offer type. Do not confuse a customer Offer with an OXENN service SKU.

## 6. Commercial architecture

The service catalog is cross-cutting. It must distinguish:
- Service Catalog item and version.
- Service SKU.
- One-time purchase or plan/subscription.
- Price, billing period, renewal and applicable taxes/terms.
- Entitlement and its scope (account/workspace/Offer/service).
- Included quota, overage, and usage ledger.
- Optional Bundle and its member services.
- Service Run and its execution evidence.

Server-side entitlement and quota checks are mandatory. Registration authenticates identity but does not grant every paid entitlement. A valid entitlement for one service must not be blocked by a missing entitlement for a different service. UI state or a client-provided payment claim is not proof of entitlement.

Potential add-ons—such as page volume, prompt volume, model/surface access, products, markets, seats, expert review, white-label, API, or integrations—must not be treated as approved SKU until their price, scope, metering, availability, and operational support are explicitly decided.

## 7. Product lifecycle

The broad improvement lifecycle is:

**Understand Offer → Build/Update PIP → Acquire/Review Evidence → Assess Relevant Dimensions → Establish Baseline & Benchmark → Identify Gaps/Opportunities → Recommend Options → Simulate Transparently Where Appropriate → Customer Review & Approval → Plan & Tasks → Track Execution → Record Outcomes → Reassess.**

This complete lifecycle describes Product Assessment & Improvement. It is not mandatory for every service. Standalone SEO/AEO/GEO uses its own minimal input, consent, evidence, entitlement, and run path.

## 8. Product boundaries and non-products

The following must not be confused with new product lines:
- The nine architecture domains are capability areas.
- AI Copilot, evidence graph, reports, identity, service catalog, and planning engine are shared platform capabilities.
- A dashboard page is not necessarily a separately sold product.
- A customer Offer is not an OXENN SKU.
- A bundle is not a mandatory suite.
- Expert Network is a domain for future capability, not a commitment to a broad MVP marketplace.
- The historical Technical SEO Audit and AI Visibility Audit journeys are implementation lineage and reusable capabilities; they do not define the whole current OXENN product or current MVP.
- “Digital Twin” is not the current product model name for a product record; Product Intelligence Profile (PIP) is the approved concept. This does not authorize an autonomous personal digital twin.
- Fred/Free Audit must obey authenticated access. Its exact future packaging must be specified rather than inferred from a legacy route.

## 9. Portfolio truth and governance

When describing a product, label whether it is:
- Strategic portfolio direction.
- Approved MVP scope.
- Optional package or bundle.
- Conditional candidate service.
- Deferred capability.
- Separate product line.
- Implemented, verified, or live (only with current technical evidence).

Never promote a candidate, planned item, UI mock, test fixture, provider library, or historical workflow into a commercially available product by wording alone.

## 10. Canonical references

- [Owner-approved MVP Product Specification](../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [Product Architecture](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md)
- [MVP Engineering Baseline](../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Nine-domain architecture — KNOW-22](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22)
- [Independent service purchasing/access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated access to every service — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
