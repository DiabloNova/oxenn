# MVP-11 — Gap Analysis, Recommendations and Transparent Scenarios

**Stage:** MVP-11  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Turn validated baseline and assessment evidence into explainable gaps, prioritized recommendations and limited scenario estimates without fabricating precision or promising outcomes.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Turn validated baseline and assessment evidence into explainable gaps, prioritized recommendations and limited scenario estimates without fabricating precision or promising outcomes.

### In scope
- Define a Gap as a measurable difference between a supported current state and a justified target or compatible benchmark criterion. Store metric, unit, direction, time window, target rationale, source, comparator and limitations.
- Do not create a gap when baseline or target evidence is absent, incompatible or too uncertain. Record an information gap or hypothesis instead.
- Keep gaps specific to the Offer, PIP version, market/locale, assessment run and metric version. Changes in source, method, geography or target must be represented in history.
- Generate recommendations only from a supported gap/opportunity or an explicitly labeled hypothesis. Each recommendation includes evidence references, rationale, expected mechanism, confidence, priority, effort/cost range, risk, dependency, owner type and measurement approach.
- Distinguish expected impact from observed impact. Use prioritization criteria approved in MVP-00; do not let an LLM invent ranking weights or numeric confidence.
- Provide alternative recommendations where a root cause is uncertain or several interventions may be viable. Explain trade-offs and what evidence would discriminate among options.
- Build simple transparent scenarios only where inputs support them. A scenario records assumptions, baseline, variables, formulas/version, cost/time/resources, range, uncertainty, dependencies and risks.
- Show sensitivity to important assumptions. Avoid precise point estimates when evidence only supports a range or qualitative estimate.
- Keep simulations separate from observed evidence and user outcomes. Do not market modeled ROI, revenue or market share as guaranteed or measured.
- Validate LLM-produced recommendations against deterministic contracts, evidence references, permission policy, safety rules, required fields and unsupported-claim checks.
- Allow a customer to challenge, dismiss, defer or request more evidence for a recommendation. Preserve decision history and reasons.
- Prepare a prioritized recommendation backlog suitable for the Growth Execution Plan stage, but do not execute external actions here.

### Prerequisites and sequencing
Relevant service/assessment evidence from MVP-05–MVP-10 is available as applicable. MVP-00 has approved target/benchmark criteria, confidence policy and pilot scoring rules.

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

1. Versioned metric/target/gap contracts and benchmark compatibility rules.
2. Gap analysis engine/report with evidence and explicit insufficient-data outcomes.
3. Recommendation contract with rationale, evidence, confidence, effort/cost, risk, dependencies and KPIs.
4. Prioritization method with transparent version and approved weights/criteria.
5. Scenario model for bounded estimates with assumptions, ranges, formulas and sensitivity.
6. Deterministic validation and review controls for AI-generated analytical artifacts.

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

1. A gap is created only when baseline and target/benchmark metrics are compatible and evidence-supported.
2. UNKNOWN or missing input cannot become zero and cannot create a false positive gap.
3. Every material recommendation cites supporting evidence or is visibly marked as hypothesis.
4. Confidence and priority values follow approved deterministic rules; model text cannot assign arbitrary scores.
5. Scenario output reproduces from its recorded inputs, assumptions and model version.
6. Changes to assumptions change the estimate transparently; uncertainty is visible.
7. No simulation is represented as an observed result or guaranteed ROI.
8. Invalid LLM output, missing provenance and unsupported claims are rejected or marked incomplete.
9. User rejection/defer decisions are stored with actor, time and reason where provided.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN.

## 7. Stage exit criteria

- Supported gaps are measurable, contextual and traceable.
- Recommendations are evidence-linked or explicitly labeled hypotheses and have complete decision metadata.
- Prioritization is explainable, versioned and deterministic where numeric.
- Scenarios are reproducible, assumption-driven and visibly uncertain.
- Unsupported precision and guaranteed-result language are absent.
- A reviewer can inspect source evidence and challenge or defer a recommendation.

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

Do not invent target metrics, benchmark weights, confidence formulas, ROI formulas or expected lift. If MVP-00 has not approved a method, show an unscored gap/recommendation or stop for owner decision. LLM reasoning alone is not evidence.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
