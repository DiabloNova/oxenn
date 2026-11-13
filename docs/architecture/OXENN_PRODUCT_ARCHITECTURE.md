# OXENN Product Architecture — Architecture-Aligned Remediation Baseline

**Product:** OXENN  
**Product identity:** OXENN  
**Status:** Approved working architecture baseline for repository remediation  
**Revision date:** 2026-11-07  
**Source architecture:** `DiabloNova/oxenn_documents/product_architecture.md` (main)  
**Repository baseline:** `DiabloNova/oxenn` main at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`  
**Scope:** Product, commercial, application, intelligence, data, execution, security, and operational boundaries used to reassess existing repository findings.

> This document records the revised architecture decisions used to design remediation. It is a target architecture, not evidence that the corresponding capabilities are implemented or production-ready. Remediation specifications must distinguish verified current behavior from target-state requirements.

---

## 1. Product definition and operating model

OXENN is a Product & Market Improvement Intelligence Platform. It helps a business understand a product or service, evaluate its digital presence and competitive position, identify evidence-backed gaps, assess improvement scenarios, plan and approve actions, execute authorized work, and measure actual outcomes over time.

OXENN connects the following cycle:

1. Establish the product, organization, market, and objective context.
2. Collect real-world data and preserve source provenance.
3. Assess digital presence and product value/competitiveness.
4. Identify gaps between observed state and the defined target state.
5. Explain root causes and uncertainty.
6. Evaluate feasible improvement scenarios and their costs, risks, and expected value.
7. Build a prioritized improvement plan.
8. Obtain required human and organizational approvals.
9. Execute approved actions through controlled adapters.
10. verify execution and measure business outcomes.
11. Update the product profile, evidence, and next improvement cycle.

The system must connect intelligence to decisions, decisions to authorized execution, and execution to measured outcomes. A generated recommendation is not an approved decision; a successful tool call is not proof of business impact.

### 1.1 Product being assessed vs. OXENN service being purchased

These are separate concepts and must remain separate in domain models, APIs, persistence, billing, and UI:

- **Customer product/service:** the product, service, brand, or portfolio that OXENN assesses and helps improve.
- **OXENN service/SKU:** a capability or service that the customer purchases from OXENN, such as SEO, AEO, GEO, or a product assessment.

A customer's product profile must not be confused with the customer's OXENN subscription, purchased service, entitlement, or usage allowance.

### 1.2 Digital-twin and target-state model

The Product Intelligence Profile is the canonical, versioned representation of the customer's product and business context. It may also hold a separately versioned desired/target state (the product's digital-twin target model). OXENN compares observed evidence with this target, records measurable gaps, and uses approved plans to reduce them.

Observed facts, user-provided goals, inferred attributes, assumptions, and predicted states must be explicitly distinguished. The target model is not a fabricated copy of reality and must never overwrite observed data. The AI copilot can explain the gap and discuss the plan, but cannot bypass approval or execution controls.

---

## 2. Product domains

The nine domains in the source product architecture remain the core product domains. They are interconnected capabilities, not a mandatory linear workflow.

### 2.1 Product Intelligence Profile

Canonical, versioned context for organization, brand, product/service, target audience, business model, markets, geography, languages, objectives, constraints, connected sources, historical assessments, and data gaps. Supports multiple products and markets as the product matures. Stores observed and target-state representations separately and records user corrections.

### 2.2 Digital Product Assessment

Evidence-based assessment of how a customer's product is discovered, represented, and understood digitally.

- **SEO:** traditional search visibility and technical/content/search performance.
- **AEO:** the ability of relevant content and entities to answer user questions clearly, authoritatively, structurally, and with extractable evidence in answer-oriented experiences.
- **GEO (Generative Engine Optimization):** how brands/products are represented, mentioned, recommended, and cited in generative AI environments.

The boundaries between AEO and GEO vary across providers. OXENN must define operational metrics and output contracts for each SKU, disclose overlap, and avoid counting the same signal twice. GEO in this context means Generative Engine Optimization; it must not be confused with Geo-Market Intelligence.

Every assessment records scope, baseline, observations, evidence, source, collection time, freshness, confidence, coverage, limitations, findings, and historical versions.

### 2.3 Product Value & Competitiveness

Assesses product characteristics and competitive strength beyond digital visibility: features, quality indicators, packaging, pricing, delivery, service coverage, customer feedback, differentiation, value proposition, customer fit, and comparable alternatives. Competitor analysis is supporting evidence for the customer's product assessment, not automatically a standalone general-purpose product. Missing or incomparable competitor data must remain explicit.

### 2.4 Geo-Market Intelligence

Assesses a product within explicitly scoped geographic markets (country, region, city, or relevant segment), including local demand signals, competitors, customer expectations, language, purchasing conditions, and market-specific digital presence. It is contextual to product assessment and market decisions; a generic market-opportunity radar is not part of the first MVP.

### 2.5 Product Evidence Graph

A logical evidence and relationship model connecting organizations, products, markets, competitors, sources, claims, observations, metrics, findings, gaps, recommendations, scenarios, decisions, initiatives, tasks, execution records, and outcomes. It is not defined by a graph database or visualization. Relational storage, graph structures, vector search, or a hybrid may be selected according to proven needs.

### 2.6 Simulation & ROI Lab

Evaluates proposed actions using measured baselines, explicit assumptions, cost/resource estimates, dependencies, time horizons, risk, uncertainty ranges, and potential outcomes. Simulations must never be represented as observed facts or guaranteed ROI. MVP simulations may be simple and assumption-driven.

### 2.7 Expert Network

Connects customers to qualified human expertise when specialized review or execution is needed. AI-generated, expert-reviewed, customer-approved, expert-executed, and independently verified states must be distinguishable. A broad marketplace/network is not required for the first MVP.

### 2.8 Planning & Execution Engine

Converts accepted findings into alternatives and prioritized plans. Each action has dependencies, owner, cost/resource estimate, authorization requirements, status, idempotency/retry policy where relevant, execution adapter, and verification evidence. The engine owns workflow state, permissions, approvals, auditability, and execution semantics; an AI framework or third-party automation provider does not own these business rules.

### 2.9 Continuous Improvement Loop

Compares new observations with baselines, targets, approved changes, and prior outcomes. It updates product intelligence and future priorities only from appropriately validated evidence. Monitoring without outcome attribution is not sufficient to claim continuous improvement.

---

## 3. Cross-cutting platform capabilities

These capabilities support all nine domains and are not additional product domains:

- AI Copilot and plan-aware conversation.
- Reporting and outcome measurement.
- Data acquisition, import, and integrations.
- Identity, workspace, organization, roles, and tenant isolation.
- Evidence, provenance, history, and audit trail.
- Service catalog, subscription, entitlements, quotas, and usage metering.
- Human approvals and policy enforcement.
- Telemetry, evaluation, and operational monitoring.

### 3.1 Service catalog and commercial packaging

This is a required cross-cutting commercial layer. It is not a tenth intelligence domain.

OXENN must offer independent services and optional combinations. A customer must be able to purchase only the service needed; buying the complete suite must not be mandatory.

**Independent service SKUs:**
- SEO.
- AEO.
- GEO.
- Content Intelligence (where independently packaged and supported).
- Product Assessment.
- Product Competitiveness Assessment (as a scoped product-assessment service, not a generic competitor-radar substitute).

**Optional bundles:**
- Digital Visibility Suite = SEO + AEO + GEO.
- Product Assessment & Improvement = product profile + scoped digital assessment + product value/competitiveness assessment + evidence + scenario evaluation + approved improvement plan.
- Enterprise Product Portfolio = multi-product and multi-market management, organizational roles/approvals, integrations, and portfolio reporting.

**Separate product line:** AI Infrastructure for businesses and public/private organizations. It has its own packaging, delivery, security, support, and roadmap. It is not a dependency of the core customer-facing product assessment MVP.

Commercial contracts must represent catalog items, versions, prices/plans, subscriptions, service-level entitlements, quotas, consumption, add-ons, and organization/workspace scope. A workspace-wide tier alone is not sufficient to model independent purchases. Billing and entitlements must be checked server-side; UI visibility is not authorization.

Potential add-ons include prompt volume, crawl/page volume, models, products, markets/locations, seats, expert review, white-label, API, and integrations. Their availability and metering must be explicit and versioned.

### 3.2 Shared workspaces and enterprise

The initial customer experience may be limited to one workspace and one product/service. The architecture must not block future organization-level portfolios, role-based access, approval workflows, resource/budget controls, and integrations with enterprise systems. Enterprise portfolio management is a later capability, not a reason to overbuild the first release.

---

## 4. Technical architecture

The architecture is TypeScript-centered and must preserve clear boundaries between domain logic, probabilistic model reasoning, deterministic validation, business decisions, and external execution.

### 4.1 Application and domain layer

The application layer owns request validation, authentication/authorization, tenant and workspace context, domain use cases, service entitlements, API contracts, and orchestration of application workflows. Domain and business rules must not depend directly on a third-party AI framework.

### 4.2 AI intelligence pipeline and reasoning control

The target pipeline consists of:

1. Request intake and task classification.
2. Product/workspace/market scope resolution.
3. Evidence and context retrieval.
4. Bounded context construction.
5. Structured reasoning-unit/capsule preparation where useful.
6. Model invocation through an internal provider/runtime adapter.
7. Deterministic contract, provenance, policy, and evidence validation.
8. Acceptance or rejection of the analytical artifact.
9. Decision proposal generation.
10. Approval and controlled execution.
11. Result verification and outcome measurement.

The Reasoning Orchestrator controls workflow selection and deterministic transitions. The Context Builder controls bounded, relevant context. Capsule structures are introduced only where they improve traceability, contracts, or evaluation; no fixed graph of reasoning steps is mandatory.

### 4.3 LangChain interim decision and SCRS transition

Use **LangChain as an interim implementation framework** until the SCRS project becomes operational and has been validated for OXENN's real workloads.

This decision has strict boundaries:

- LangChain is an implementation/runtime tool, not the owner of OXENN's domain logic, state machine, permissions, approvals, billing, or execution semantics.
- Internal modules must depend on stable OXENN interfaces, not directly on LangChain-specific classes or types.
- All model/provider calls pass through an OXENN-owned adapter boundary.
- LLM output alone never authorizes a business or external action.
- LIVE, MOCK, and HYBRID modes must be explicit, observable, and tested. Provider/model/version, cost, latency, failures, and trace identifiers should be recorded without leaking sensitive content.
- LangGraph may be evaluated for multi-step workflow orchestration, but it must not become the source of truth for business state, permissions, approvals, or durable execution.
- SCRS adoption is selective and conditional. Do not introduce a separate Python runtime or fixed seven-stage graph by assumption.
- Before replacing the interim framework, compare both approaches on representative OXENN tasks: output quality, evidence/provenance integrity, contract compliance, reliability, observability, latency, cost, maintainability, and operational complexity.
- SCRS must not be called production-ready until its runtime, transport, operational behavior, and real workload measurements are verified. Synthetic benchmarks or offline validators alone are insufficient.

### 4.4 Contract and provenance gates

All important outputs must have versioned contracts and stable identifiers. Validation must check schema, scope, evidence references, provenance, freshness, missing inputs, contradictions, confidence, and policy. Unknown information must remain unknown: **UNKNOWN != ZERO**. Invalid or unsupported output is rejected, quarantined, or marked incomplete; it must not silently become accepted intelligence.

### 4.5 Provider and integration adapters

LLM providers, crawlers, analytics sources, CMSs, project tools, and other external systems are accessed through bounded adapters. Provider-specific types must not leak into domain models. Adapters define timeouts, redirect limits, retries, idempotency, error mapping, rate limits, authorization, and observable result contracts.

### 4.6 Decision and execution controls

Accepted intelligence may create recommendations and decision proposals. Consequential actions require the applicable customer, expert, or organization approval. Execution must be auditable and verifiable. A successful API response proves only the technical action result, not the intended business outcome.

---

## 5. Data architecture and integrity

PostgreSQL/pgvector is the target persistent foundation, but target architecture does not prove that production persistence is currently complete.

The data layer must support:
- Transactional domain records and referential integrity.
- Versioned product profiles, targets, assessments, evidence, plans, decisions, executions, and outcomes.
- Schema and migration versioning.
- Tenant and organization isolation, including database RLS where applicable.
- Audit and provenance records.
- Controlled access to embeddings and vector retrieval.
- Backup, recovery, retention, and lifecycle management.

Schema definitions, migration history, snapshots, generated types, repositories, runtime queries, and RLS policies must agree. A successful migration command alone is not proof of application correctness. Legacy schema modules must not be removed until imports and ownership are traced and the canonical source of truth is established.

---

## 6. Reliability, security, and operational quality

Security and reliability are cross-cutting requirements:

- Explicit authentication and authorization at every server-side boundary.
- Tenant context derived from trusted identity, not user-controlled identifiers.
- Organization/workspace roles separated from platform-administrator roles.
- Least privilege, credential isolation, and server-side entitlement checks.
- SSRF-resistant acquisition, bounded redirects, timeouts, response limits, and safe URL validation.
- Prompt-injection defense and strict separation of untrusted retrieved content from instructions.
- Bounded retries, idempotency, partial-failure handling, durable job state, and recovery.
- Sensitive-data minimization in logs and telemetry.
- Feature flags, shadow evaluation, limited rollout, and rollback for new reasoning paths.

Telemetry & Evaluation must cover both technical and intelligence quality: workflow traces, latency, errors, retries, token/cost, provider availability, evidence coverage, citation/provenance integrity, contract validity, unsupported claims, uncertainty, recommendation quality, and verified outcomes.

Monitoring claims must be backed by actual telemetry access. An empty Datadog or Grafana search is not proof that monitoring does not exist; it means no relevant evidence was available through that connection and query.

---

## 7. Product and delivery boundaries

### 7.1 Commercial MVP direction

The initial commercial offer should validate independently purchasable SEO, AEO, and GEO services, an optional Digital Visibility Suite, and a tightly scoped Product Assessment & Improvement pilot. AI Infrastructure follows a separate product track.

### 7.2 Initial technical scope

- One workspace and one product/service profile.
- A service catalog with independently purchasable service SKUs and server-enforced entitlements.
- Real, evidence-backed SEO/AEO/GEO workflows only where the provider and data path are genuinely operational.
- Baselines, findings, evidence, recommendations, approval, a unified plan, human-in-the-loop execution, and outcome measurement.
- Initial data intake through user forms, files, and available public sources.
- Simple transparent simulations with explicit assumptions and uncertainty.

### 7.3 Explicitly deferred

- Large enterprise product portfolios and deep ERP/CRM integration.
- Broad expert marketplace/network.
- Fully autonomous external execution.
- Complex predictive simulation without sufficient data.
- Generic market-opportunity radar as a standalone MVP.
- Any service or dashboard feature presented as LIVE without verification.

This is the product direction, not permission to alter the current dashboard task. The existing dashboard task remains frontend-only unless separately changed by the user.

---

## 8. Implementation state vocabulary

Every capability and finding must distinguish its actual state. Use the following meanings consistently:

- **PLANNED:** defined in target architecture; no implementation evidence.
- **IN_PROGRESS:** implementation exists but is incomplete.
- **IMPLEMENTED:** code exists; not necessarily verified.
- **VERIFIED:** relevant behavior passed defined tests or independent checks.
- **LIVE:** verified production-connected behavior is operating.
- **MOCK:** simulated or fixture-backed behavior.
- **HYBRID:** explicitly combines live and mock/simulated sources; each source is labeled.
- **DEPRECATED:** intentionally retired; migration and remaining consumers are documented.
- **UNKNOWN:** evidence is insufficient to determine the state.

Do not treat IMPLEMENTED as VERIFIED or VERIFIED as LIVE. Do not infer that an integration is operational merely because a provider package or UI control exists.

---

## 9. Architecture-aligned remediation rules

Every existing audit finding must be reassessed against this document and the current repository baseline. A prior recommendation is not automatically valid.

For each finding, record:
1. Original stable finding ID and source audit file/line or exact evidence location.
2. Current validity: VALID, PARTIALLY_VALID, STALE/FIXED, DUPLICATE, OUT_OF_SCOPE, or NEEDS_REVALIDATION.
3. Evidence confidence and the latest inspected commit/ref.
4. Relevant product domain and technical boundary.
5. Whether the target architecture changes the original interpretation or proposed fix.
6. Root cause, not only symptom.
7. Recommended repository-compatible solution and alternatives rejected.
8. Exact affected files/modules and ownership boundaries.
9. Dependencies, ordering, parallelization constraints, and risks.
10. Required unit, integration, contract, security, migration, performance, or end-to-end tests.
11. Acceptance criteria and evidence required to close the finding.
12. Explicit non-goals and any approval needed before implementation.

Preserve original finding IDs and audit documents. If multiple IDs share one root cause, keep individual traceability and define a coordinated remediation group; do not silently collapse or delete findings. If a finding is stale, record the evidence that makes it stale. If it cannot be revalidated, do not invent a fix; mark it NEEDS_REVALIDATION.

### 9.1 Prioritization

Prioritize by security/data-integrity impact, tenant isolation, correctness of real vs. mock behavior, durability of contracts and persistence, execution safety, customer-visible reliability, and architectural dependency. Priority must not be derived solely from the old P1/P2/P3 label; retain the original priority and record any justified reassessment separately.

### 9.2 Implementation gate

This branch is for architecture and remediation documentation only. No code changes, schema/migration changes, test rewrites, dependency upgrades, CI edits, deployment changes, PR merges, or production actions are authorized by this documentation task. Implementation begins only after the remediation inventory and dependency order are reviewed and the user authorizes the next execution scope.

---

## 10. Reference architecture acceptance criteria

The architecture is being applied correctly when:
- Customer products and OXENN-purchased services are distinct throughout the model.
- SEO, AEO, and GEO can be purchased independently and can be combined optionally.
- The nine product domains remain coherent and interconnected.
- Product/target state, evidence, findings, decisions, execution, and outcomes remain traceable.
- AI frameworks are replaceable implementation details behind OXENN-owned interfaces.
- LangChain is treated as interim; SCRS adoption is evidence-gated.
- LLM output cannot bypass deterministic validation, entitlements, permissions, or human approvals.
- LIVE/MOCK/HYBRID and UNKNOWN states are explicit and truthful.
- Data, tenant isolation, migrations, contracts, and runtime behavior are verified together.
- No target capability is represented as implemented without repository and test evidence.
- All prior findings remain traceable to their source and have a documented architecture-aligned disposition.
