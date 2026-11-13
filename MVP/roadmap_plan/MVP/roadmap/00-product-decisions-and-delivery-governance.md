# MVP-00 — Product Decisions and Delivery Governance

**Stage:** MVP-00  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Turn the approved product scope into unambiguous, testable and owner-approved delivery contracts before implementation. This is a decision and verification stage, not a feature-coding stage.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Turn the approved product scope into unambiguous, testable and owner-approved delivery contracts before implementation. This is a decision and verification stage, not a feature-coding stage.

### In scope
- Reconcile the owner-approved MVP Product Specification, Product Map, MVP Map, Product Strategy v2 and existing engineering baseline. Preserve the current product model: two assessment pillars, three independent digital services, an optional bundle, an optional Product Assessment & Improvement pilot, and a separate AI Infrastructure line.
- Resolve the first pilot cohort, launch geography, supported language(s), currency, time zone and customer segment sequence. Do not assume that a strategic initial market is an operational launch configuration.
- Approve the first source/provider matrix for SEO, AEO, GEO and product/market assessment. For each source record purpose, access mode, permission/consent, geography/locale, coverage, rate/cost limits, freshness, data retention, provider failure behavior and evidence returned.
- Define the measurable boundary between SEO, AEO and GEO. Agree what each service evaluates, its unit of measurement, supported surfaces/providers, input scope, result contract, metrics and exclusion rules. Explicitly identify overlap and prevent duplicated findings or double counting.
- Resolve service catalogue and commercial rules: SKU identifiers, free/trial versus paid status, purchase/subscription semantics, price display, billing period, quota, overage, renewal, cancellation/refund, bundle composition and service activation timing. Keep unresolved prices and legal terms as owner decisions.
- Define Product Assessment & Improvement pilot depth per Offer nature: minimum PIP fields, assessment dimensions, benchmark eligibility, evidence thresholds, assessment/report outputs, and the boundary between a supported finding and a hypothesis.
- Define workspace roles, seller/provider ownership, Offer limits, task ownership, approval authority and the first pilot's collaboration model without overbuilding enterprise roles.
- Define evidence classes, required provenance fields, confidence policy, freshness windows, sample sufficiency, contradiction handling, and the conditions under which a metric is UNKNOWN, NOT_PROVIDED, NOT_APPLICABLE, ZERO, NEGATIVE, INCOMPLETE or FAILED.
- Revalidate repository reality and engineering findings against the current target branch and exact commit. Inspect existing authentication, proxy/middleware, authorization, persistence adapters, schema/migrations, tests, crawlers, AI providers, competitor features, reports and monitoring before planning code changes.
- Create a requirement-to-code/test/evidence matrix for FR-01 through FR-11 and the cross-cutting security, commercial, evidence and workflow gates. Each requirement gets an owner, stage, test layer, release criticality and proof required.

### Prerequisites and sequencing
No implementation stage may begin until its blocking product, commercial, privacy, operational and acceptance decisions are resolved or explicitly recorded as approved constraints.

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
6. Convert approved decisions into explicit implementation constraints, contracts, stage dependencies and acceptance criteria; do not implement product features in MVP-00. If a product, legal, commercial, privacy, data-retention or architecture choice is unresolved, stop at that decision boundary and request owner approval.
7. Define the regression, integration, security, permission, partial and failure tests required by later implementation stages; do not add feature tests or change application code in MVP-00.
8. Validate this stage's decision register, requirement traceability, dependency matrix, documentation links and handoff artifacts. Record the exact validation commands and results; defer application test suites to the implementation stages that change code.
9. Review the final diff for scope leakage, secrets, unsafe logs, mock/live confusion, broken links, missing tests and unintended behavior changes.
10. Hand off the exact branch and commit, changed files, tests, acceptance evidence, unresolved issues and remaining risks. Do not proceed to another stage without authorization.

## 4. Work packages and design requirements

1. A signed/approved decision register with decision ID, question, options considered, rationale, final value, owner, date, affected stage, and downstream files/contracts.
2. A service separation and metric-ownership matrix for SEO/AEO/GEO, including the first supported provider/surface matrix and explicitly unsupported surfaces.
3. A commercial catalogue and entitlement policy covering standalone SKUs, optional Digital Visibility Suite, optional Product Assessment & Improvement, and the separate AI Infrastructure line.
4. A pilot definition for customer groups, Offer natures, channels, geography, language, source permissions, success measures and exclusions.
5. A repository baseline report tied to exact branch/commit and evidence, with current gaps marked VALID, PARTIALLY_VALID, FIXED/STALE, DUPLICATE, OUT_OF_SCOPE or NEEDS_REVALIDATION.
6. A stage dependency register, threat/risk register, acceptance-test matrix, rollout/rollback outline and explicit unresolved-owner-decision list.

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

1. Validate that every functional requirement FR-01–FR-11 maps to at least one stage and testable criterion.
2. Review the decision register for contradictory statements, hidden assumptions, missing owners and decisions deferred beyond the first affected implementation stage.
3. Check all product/service descriptions against the separate Offer, SKU, bundle and domain concepts.
4. Review source/provider selection for legal access, explicit permission, reliable data provenance, failure semantics and resource/cost limits.
5. Verify that historical audit or PR records are not represented as current implementation proof without revalidation at the inspected commit.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN.

## 7. Stage exit criteria

- No unresolved decision blocks the next authorized stage; any non-blocking unknown has an owner and resolution deadline.
- The SEO/AEO/GEO service boundaries and measurement units are approved and non-duplicative.
- The independent service and optional bundle rules are explicit, including server-side entitlement and quota behavior.
- Pilot geography, language, customer cohort, source permissions and success-measure definitions are approved for the first pilot.
- FR-01–FR-11 and shared non-functional requirements are mapped to stage-level acceptance tests.
- The engineering baseline and all findings relied on for implementation are tied to a verified current repository commit.

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

Do not implement product features, alter schemas, connect external services, choose a payment provider, set commercial prices, or change runtime configuration in this stage. Present unresolved choices to the owner. A historical main@7bd17ac audit is not a current code audit; inspect the actual current commit.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
