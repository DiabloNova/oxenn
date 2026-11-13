# MVP-09 — Geo-Market Intelligence and Contextual Benchmarks

**Stage:** MVP-09  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Provide a limited, evidence-grounded layer of market and geographic context for the product-assessment pilot so comparisons are relevant and their coverage and uncertainty are explicit.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Provide a limited, evidence-grounded layer of market and geographic context for the product-assessment pilot so comparisons are relevant and their coverage and uncertainty are explicit.

### In scope
- Define the market context model used in the pilot: geography, market boundary, language/locale, category, customer segment, channel, price context, time window and target use case.
- Capture the seller/provider's target and actual served geographies separately. Do not infer shipping, service coverage or market presence from a generic address.
- Identify direct competitors and substitutes only within the defined Offer category, value proposition, use case, customer group and geography. Keep competitor identity confidence and inclusion rationale.
- Use approved public, user-provided or licensed sources for market signals. Record collection method, source, access permission, date, geographic coverage, sample and known selection bias.
- Represent market observations, third-party claims, estimates and hypotheses separately. Do not present scraped listings, social posts or review samples as a complete census of a market.
- Establish contextual benchmarks only when the comparator set is sufficiently similar and the metric has a compatible definition. Document inclusion/exclusion rules, minimum sample policy, time window and segment normalization.
- Keep price and currency normalization transparent. Use only owner-approved currency and conversion methods; preserve original currency, observation date and exchange-rate source where normalization is applied.
- Handle low-volume, sparse, conflicting or stale sources by reporting insufficient evidence instead of generating a benchmark score.
- Connect geo-market context to relevant PIP, baseline, competitor and assessment versions. Changes in geography/category or source method should invalidate or qualify prior comparisons.
- Expose source coverage and confidence in outputs. Any market sizing or demand estimate must disclose methodology and assumptions; definitive TAM/SAM/SOM or sales forecasts are out of scope without adequate validation.

### Prerequisites and sequencing
MVP-00 has approved pilot geography, locale, source access, evidence policy and benchmark criteria. MVP-03 Offer/PIP and MVP-04 evidence contracts are available.

### Out of scope
- Any product capability not required to meet this stage's goal and exit criteria.
- Broad refactors, speculative framework changes, unrelated cleanup, or rewriting existing modules without tracing their consumers and ownership.
- Claiming a page, route, type, schema, fixture, mock response, provider package or isolated unit test proves a complete user journey.
- Unapproved database, migration, billing-provider, external integration, deployment or production operations.
- Publishing, purchasing, messaging, changing customer assets or other consequential actions on behalf of a customer without explicit approval.

## 3. Execution instructions

The assigned AI/engineering agent must treat this file as the complete stage brief. It does not need to rely on memory of the wider roadmap to understand the required product context, boundaries or completion tests. It must still inspect the current repository before changing code.

1. Confirm the exact authorized repository, branch, base commit, working tree state and file/path scope. Do not assume an old branch or PR remains current.
2. Inspect the existing source, tests, contracts, data adapters, schema/migrations and upstream/downstream consumers relevant to this stage. Record exact paths and commit references.
3. Reconcile existing behavior against this stage contract. Label it PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, LIVE, MOCK, HYBRID, PARTIAL, FAILED or UNKNOWN using evidence, not inference.
4. Write a small design proposal before implementation: domain ownership, contracts, state transitions, trust boundaries, persistence needs, failure behavior, affected modules, test plan and rollback.
5. Choose the smallest end-to-end slice that meets the stage objective. Preserve repository conventions and established architecture. Avoid duplicating existing owners or adding unnecessary services/frameworks.
6. Implement only the authorized scope. If a product, legal, commercial, privacy, data-retention or architecture choice is unresolved, stop at that decision boundary and request owner approval.
7. Add regression tests for existing affected behavior and tests for positive, negative, boundary, permission, partial and failure states.
8. Run focused tests first, then relevant integration/security/type/lint/build checks available in the repository. Record exact commands, environment and results.
9. Review the final diff for scope leakage, secrets, unsafe logs, mock/live confusion, broken links, missing tests and unintended behavior changes.
10. Hand off the exact branch and commit, changed files, tests, acceptance evidence, unresolved issues and remaining risks. Do not proceed to another stage without authorization.

## 4. Work packages and design requirements

1. Market/geography context contract and approved source register.
2. Competitor/substitute qualification and provenance rules.
3. Contextual benchmark eligibility and comparison methodology.
4. Currency, locale, date and geographic normalization rules approved for the pilot.
5. Market coverage report with source and sample limitations.
6. Traceability between market observations, Offer/PIP, baseline, benchmark and findings.

## 5. Security, privacy and reliability requirements

- Enforce authenticated identity and resource authorization on the server, not just in the UI.
- Resolve tenant/workspace context from trusted server-side identity and membership.
- Apply least privilege and separate platform-operator access from customer roles.
- Minimize collection and retention of personal, business, price, customer and social-channel data.
- Treat external source content, files, provider responses and LLM output as untrusted.
- Validate schemas, ownership, scope, provenance, freshness and policy before accepting important results.
- Bound external requests with timeouts, redirects, response limits, rate limits, retry budgets and cost ceilings.
- Use idempotency and durable state for operations that may be retried or invoked concurrently.
- Keep audit records for important state changes, approvals, access decisions and service usage without exposing credentials or unnecessary sensitive content.
- Represent partial, incomplete, unavailable, stale and failed work honestly. Never turn missing values into zero or synthetic success.
- Do not treat technical completion of an external request as proof of business outcome.

## 6. Required verification

1. Competitor candidates outside the selected category, customer use case or geography are not silently treated as direct competitors.
2. Every market observation identifies source, time, scope and applicable geography.
3. Small, stale or biased samples trigger insufficient evidence/low confidence rather than fabricated precision.
4. Benchmarks compare only compatible metric definitions, segments, currencies and time windows.
5. Original currency and observation data remain available after normalization.
6. Missing market data is UNKNOWN/NOT_PROVIDED, not zero demand or zero competition.
7. User-provided market statements are labeled as such and not presented as independent verification.
8. Unauthorized source access or cross-workspace evidence reuse is denied.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- Market and geography context is explicit and versioned for the pilot.
- Competitor/substitute comparisons have documented inclusion rationale and evidence.
- Benchmark eligibility, comparability and insufficient-sample behavior are tested.
- Source coverage, freshness, currency and geographic limitations are visible.
- Market claims are traceable and no unsupported forecast or exhaustive-market claim is made.

All exit criteria are conjunctive unless a criterion is explicitly marked not applicable with a reason and owner approval. A partial implementation must be reported as partial; it must not be marked VERIFIED or LIVE by wording.

## 8. Handoff package

The stage handoff must contain:
- Stage ID and exact product requirement(s) satisfied.
- Repository, branch, base SHA and resulting commit SHA.
- Exact changed paths and a concise explanation of each change.
- Design/contract decisions and any approved deviation.
- Tests executed with commands, environment and pass/fail output.
- Direct evidence for security, permission, entitlement, data, provider and failure behavior as applicable.
- Known defects, residual risks, follow-up tasks and unresolved owner decisions.
- Explicit status for each capability: PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED, LIVE, MOCK, HYBRID, PARTIAL, FAILED or UNKNOWN.
- A statement confirming whether any schema, migration, external integration, deployment or production operation occurred; do not imply one if it did not.

## 9. Stage-specific risks and decision gate

Do not invent the pilot country/region, market share, population, competitor coverage, FX rate, local legal requirements or demand scores. Obtain owner-approved source and currency decisions. A contextual benchmark is not a universal ranking.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
