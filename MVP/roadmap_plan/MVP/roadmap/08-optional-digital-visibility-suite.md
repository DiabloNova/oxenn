# MVP-08 — Optional Digital Visibility Suite

**Stage:** MVP-08  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Provide an optional unified commercial and reporting experience for customers choosing SEO + AEO + GEO, while preserving independent service purchase, entitlements, runs, quotas and evidence.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Provide an optional unified commercial and reporting experience for customers choosing SEO + AEO + GEO, while preserving independent service purchase, entitlements, runs, quotas and evidence.

### In scope
- Define the Digital Visibility Suite as an optional bundle containing the exact approved SEO, AEO and GEO SKUs. Display member services, quotas, terms, renewal, limitations and any usage allocation clearly before purchase.
- Allow customers to keep, buy or activate one service independently; adding the bundle must not require them to repurchase a valid existing entitlement or erase its usage history.
- Define bundle activation and entitlement fan-out atomically and idempotently. Bundle cancellation, expiry, renewal and refund behavior must follow the approved commercial decision.
- Keep each underlying service independently executable and observable. Bundle purchase is not a monolithic run and must not imply that every service has completed.
- Provide a consolidated report that groups service outputs by Offer/site, market, locale and time window while preserving source service, provider, analyzer/prompt version and status.
- Show coverage by service, source and sample. A successful SEO run must not mask a failed GEO run. Overall bundle status must express partial completion where any component is incomplete or failed.
- Reuse compatible evidence by reference with permissions and provenance intact. Do not duplicate billing or count the same evidence as independent confirmation.
- Do not create a combined visibility score unless the aggregation method, component weights, missing-data policy, metric comparability and user interpretation have been approved and validated.
- Provide side-by-side trend views only for compatible metric versions, scopes, locales and observation windows. Label incompatible comparisons rather than forcing a trend.
- Add bundle-level usage and cost reporting without weakening per-service quota, rate and provider-cost controls.

### Prerequisites and sequencing
MVP-05 SEO, MVP-06 AEO and MVP-07 GEO have independently passed their service exit criteria. MVP-02 optional bundle mechanics and bundle terms are approved.

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

1. Optional bundle SKU and exact member/terms configuration.
2. Atomic bundle purchase/activation/cancellation lifecycle.
3. Compatibility rules for existing standalone entitlements.
4. Unified report and progress view retaining per-service evidence and status.
5. Bundle-level usage, quota and commercial transparency.
6. Tests for partial run, idempotency, component failure, no double charge and independent service preservation.

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

1. Customer can buy SEO alone and is not forced to buy the suite.
2. Customer can add the bundle later without paying twice for an already-entitled service under the approved commercial policy.
3. Bundle activation grants exactly the approved member entitlements and no unrelated service.
4. Each service can run separately; a bundle status never falsely reports all complete when one service failed or is incomplete.
5. Cancellation/expiry/retry are idempotent and preserve audit history.
6. Combined report retains provenance, service identity, version and individual failure state.
7. Any aggregate score has approved method and missing-data handling; otherwise no aggregate score is displayed.
8. Bundle and individual quota consumption do not double count or bypass limits.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- The Digital Visibility Suite is clearly optional and contains exactly the approved member SKUs.
- Standalone SEO/AEO/GEO remain usable without bundle entitlement.
- Bundle commercial state and usage are accurate, auditable and idempotent.
- Unified reporting preserves each service's evidence and truthful state.
- Partial/failure conditions are visible at service and bundle level.
- Commercial and regression tests prove no forced repurchase or accidental charge.

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

Do not bundle Product Assessment & Improvement into the Digital Visibility Suite unless a later owner decision explicitly changes the approved package. Do not invent bundle price or combined score. Bundle UI is not proof that service providers are live.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
