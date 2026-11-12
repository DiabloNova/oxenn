# MVP-07 — Independent GEO Service

**Stage:** MVP-07  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Deliver a separately purchasable Generative Engine Optimization service measuring observable Offer/brand representation on supported generative discovery and answer surfaces, with clear separation from AEO.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Deliver a separately purchasable Generative Engine Optimization service measuring observable Offer/brand representation on supported generative discovery and answer surfaces, with clear separation from AEO.

### In scope
- Define a versioned GEO scope: Offer/brand entities, market/locale, target audience, query/prompt set, generative search/answer surfaces, sample and measurement window. A standalone customer may provide only service-specific information.
- Maintain explicit provider and surface inventory: supported, experimental, unavailable or unsupported. Record model/surface and version where exposed. Do not infer provider support from a package or UI selector.
- Capture only observable outputs permitted by the provider and applicable terms. Record query/prompt, timestamp, locale, provider/surface, response evidence, available citations/references, and capture limitations.
- Define GEO metrics around observable brand/product mention, inclusion/representation, factual consistency, source references/citations where exposed and changes across repeatable samples. Define denominators and missing-result behavior before scoring.
- Separate absent mention from provider failure, no result, blocked query, unsupported locale, missing citation, ambiguous entity resolution and partial data. Keep UNKNOWN distinct from ZERO.
- Preserve prompt/query sets as versioned inputs. Detect changes in prompt wording, locale, entity naming, provider version and collection method so historical comparisons remain valid.
- Apply repeated-run/sample policies and confidence indicators appropriate to the evidence. Do not claim statistical significance from arbitrary prompt repetitions.
- Resolve entity ambiguity conservatively. Similar brand names, product names, transliterations and market-specific aliases must not be silently merged.
- Generate evidence-linked GEO recommendations and report exactly what was observed. Never claim access to hidden model reasoning, internal training data or ranking algorithms.
- Use OXENN-owned provider adapters and deterministic validation. Provider-specific types must not leak into domain contracts.
- Enforce GEO-specific entitlement, quota, provider cost budget, permission and retention policies.

### Prerequisites and sequencing
MVP-00 approves GEO terminology, supported surface matrix, prompt/sample policy and non-overlapping metrics. MVP-01 auth, MVP-02 GEO entitlement/quota and MVP-04 evidence/provenance are verified. AEO's boundary is documented before shared response metrics are introduced.

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

1. GEO service-specific onboarding and Offer/entity identity contract.
2. Versioned prompt/query set and supported provider/surface registry.
3. Observable-response evidence model and reproducible GEO metrics.
4. Entity ambiguity and confidence handling.
5. Provider adapters, retries, rate/cost controls and truthful status semantics.
6. GEO report with sample coverage, references, limitations and change history.

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

1. GEO-only use succeeds with a GEO entitlement and no SEO/AEO/bundle/PIP prerequisite.
2. Every observation records query, locale, provider/surface, timestamp and available model/version metadata.
3. Absent mention is distinct from provider outage, unsupported surface, refusal and incomplete sample.
4. Entity ambiguity or alias collision does not silently attribute a response to the wrong Offer.
5. Historical comparison rejects or flags incompatible prompt, locale, provider or metric versions.
6. No internal reasoning or unavailable model metadata is asserted.
7. Quota, concurrency, retries and provider cost are bounded.
8. GEO and AEO outputs do not double count a shared observation as two distinct positive events.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- GEO is independently selectable, authorized, metered and usable.
- Every GEO observation has enough provenance to understand its query and surface.
- Metrics are observable, defined, versioned and explainable.
- Provider/surface limitations, unavailable data and sample uncertainty are visible.
- AEO/GEO separation and shared evidence rules are documented and tested.
- A GEO-only controlled end-to-end journey passes.

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

Do not market GEO as access to a model's hidden reasoning or training corpus. Do not state that a brand is absent from all generative systems based on a limited sample. Do not use search-result or answer-surface data without applicable permission.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
