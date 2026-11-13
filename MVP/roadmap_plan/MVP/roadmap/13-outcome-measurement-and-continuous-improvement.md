# MVP-13 — Outcome Measurement and Continuous Improvement

**Stage:** MVP-13  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Close the loop between approved tasks and measured results by recording comparable outcome evidence, updating the relevant baseline and improving future priorities without unsupported causal claims.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Close the loop between approved tasks and measured results by recording comparable outcome evidence, updating the relevant baseline and improving future priorities without unsupported causal claims.

### In scope
- Define an Outcome as a dated measurement of what actually happened after a task or intervention, tied to Offer, approved plan, task, metric, baseline, measurement method and evidence.
- Capture measurement window, source, geography/locale, unit, sample, method/version, timestamp, confidence, external factors and limitations where applicable.
- Separate expected impact, scenario estimate, task completion, observed change and verified business outcome. A task marked complete does not prove the intended KPI changed.
- Compare before/after measurements only when definitions, units, scope, geography, source method, sample and time windows are compatible. Explain adjustments and mark incompatible comparisons.
- Record external factors that may affect results, including seasonality, campaign changes, price changes, inventory, channel policy, competition or unrelated product changes when known.
- Use causal language only where the measurement design supports it. Otherwise report a temporal association or observed difference and state that causality is not established.
- Reassess only relevant PIP fields, baseline metrics, benchmarks, gaps and recommendations. Preserve previous versions so the customer can see what changed and why.
- Create a history of improvement cycles linking recommendation → approved plan → task → actual action evidence (where supplied) → outcome → reassessment.
- Support manual outcome entry and permitted data imports first. Automated analytics/provider integration is added only when the source, permission, reliability and mapping are validated.
- Represent unavailable, delayed, partial, contradictory and failed measurement windows explicitly. Do not fill missing outcome values with zero.
- Use verified outcomes to inform future recommendation prioritization only after data quality and metric compatibility checks. Do not allow low-confidence outcomes to silently train or alter production logic.
- Provide customer-visible reports showing what changed, what did not, what remains unknown and which conclusions are supported.

### Prerequisites and sequencing
MVP-11 recommendations and MVP-12 approved plan/task lifecycle are available. A compatible baseline and KPI definition exists for each outcome being measured.

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

1. Outcome and measurement-window contracts linked to plan/task and baseline versions.
2. Metric compatibility and before/after comparison rules.
3. Outcome evidence capture workflow and manual/import adapters.
4. Versioned reassessment process for PIP, baseline, benchmark, gaps and recommendations.
5. Improvement-cycle history and a customer-readable outcome report.
6. Data quality, attribution and causality guardrails.

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

1. Outcome cannot be marked verified without a valid source/method and compatible metric definition.
2. Task completion and expected scenario values are not automatically copied into actual outcome values.
3. Before/after comparison rejects or flags mismatched units, scopes, geographies, sources or measurement windows.
4. Missing or unavailable data remains UNKNOWN/INCOMPLETE rather than zero.
5. Confounding factors and causal limitations are visible in reports.
6. Each outcome links to the correct plan, task, Offer, metric and assessment context.
7. Reassessment creates a new version and preserves prior baselines and reports.
8. Low-confidence or contradictory observations do not silently update trusted recommendation logic.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- At least one agreed pilot task can be linked to an actual outcome measurement.
- Outcome values are traceable to source, method, time window and compatible baseline.
- Reports distinguish task status, expected impact, observed change and verified outcome.
- Reassessment preserves version history and updates only relevant product intelligence.
- Causal claims are appropriately qualified.
- Unknown, partial and failed measurement states remain honest and visible.

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

Do not promise that a recommendation caused a result without a valid attribution design. Do not manufacture post-action data or treat task completion as outcome. Do not create automatic optimization loops from unverified measurements.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
