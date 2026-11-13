# MVP-06 — Independent AEO Service

**Stage:** MVP-06  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Deliver an independent Answer Engine Optimization service that measures answer readiness and observable behavior on explicitly supported answer-oriented surfaces, with traceable question scope and response evidence.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Deliver an independent Answer Engine Optimization service that measures answer readiness and observable behavior on explicitly supported answer-oriented surfaces, with traceable question scope and response evidence.

### In scope
- Define AEO's unit of work: customer-selected Offer/brand or content scope, target audience and intent, question set/version, locale, supported answer surfaces, run window and permitted source context. Standalone AEO must not require comprehensive PIP.
- Create a versioned buyer-intent/question set with provenance and review. Support manually supplied questions and approved generation only as candidate questions; generated questions are hypotheses until reviewed or explicitly labeled.
- Define answer readiness criteria for selected content: directness, completeness, clarity, factual support, structure, entity consistency and source accessibility. Every criterion must have a deterministic method or a clearly labeled evaluator judgement.
- Assess only permitted pages/content sources in the selected scope. Link each content observation to URL/source, time, extraction method, locale and crawl limitations.
- Where answer providers are supported, query through provider adapters that record provider/surface, model/version where available, query, locale, timestamp, response text or approved evidence excerpt, citation/source references and execution limitations.
- Use repeatable prompt and sampling rules. Distinguish an absent answer, provider refusal, unavailable surface, transient error, incomplete result and no observable citation.
- Generate actionable AEO recommendations linked to observed readiness gaps or response evidence; disclose confidence, assumptions and the exact content scope.
- Keep AEO separate from GEO's generative-engine representation metrics. Define metric ownership so the same observed event is not counted twice. Shared raw evidence may be referenced by both only when consent and purpose allow.
- Enforce AEO SKU entitlement, quota, provider cost budget and customer consent at run time. Do not charge for prompts that were not executed under the approved metering policy.
- Report question coverage, supported surface coverage, response sample limitations and run status. Do not imply that one sample represents all users or every answer system.

### Prerequisites and sequencing
MVP-00 has approved the AEO definition, its distinction from GEO, question taxonomy, providers/surfaces, locale policy and metric ownership. MVP-01 authentication, MVP-02 AEO entitlement/quota and MVP-04 evidence contracts are verified.

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

1. AEO service-specific intake and versioned question-set contract.
2. Answer-readiness rule/evaluator contract with method and confidence limitations.
3. Approved answer-surface/provider adapters and response evidence records.
4. Repeatable run and sampling configuration with quota/cost enforcement.
5. Evidence-linked AEO findings, recommendations and report/history.
6. Tests for question versioning, response capture, provider errors, partial coverage and standalone service access.

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

1. An authenticated customer with AEO entitlement can run AEO without SEO/GEO entitlements, a bundle or a comprehensive PIP.
2. Question set version, query text, locale, surface/provider and run timestamp are attached to every result.
3. Provider response/citation evidence is stored only when actually returned; absent citation is not fabricated.
4. Provider unavailable, refusal, timeout, partial response and empty response are distinct states.
5. One response sample is not presented as universal market truth or statistically representative coverage.
6. AEO metric tests validate exact methods and reject silent metric duplication with GEO.
7. Generated questions are labeled as candidates/hypotheses until approved under the decision policy.
8. Untrusted answer/provider content cannot execute instructions or alter system policy.
9. Quota and provider cost limits apply under retries and concurrency.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- AEO is independently selectable, entitled, metered and usable.
- Question scope, locale, provider/surface and sampling are versioned and reproducible.
- Findings link to captured source/content or actual answer-surface evidence.
- Coverage, uncertainty, missing results and provider failures are explicit.
- AEO/GEO metric ownership is documented and double counting is prevented.
- An AEO-only controlled end-to-end journey passes.

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

Do not claim hidden reasoning, universal answer-engine behavior or guaranteed inclusion. Do not confuse content readiness with observed provider output. Do not use model-generated answers as if they were third-party observations.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
