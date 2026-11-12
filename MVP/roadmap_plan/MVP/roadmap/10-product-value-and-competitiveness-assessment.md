# MVP-10 — Product Value and Competitiveness Assessment

**Stage:** MVP-10  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Deliver the foundational Product Value & Competitiveness Assessment pilot for existing physical, digital and service Offers, grounded in customer, product, competitor, price/value and operational evidence.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Deliver the foundational Product Value & Competitiveness Assessment pilot for existing physical, digital and service Offers, grounded in customer, product, competitor, price/value and operational evidence.

### In scope
- Build assessment workflows for existing Offers only. Do not generate a new product concept, perform industrial R&D, design/prototype a product or plan manufacturing.
- Select assessment dimensions based on Offer nature and pilot scope. Physical goods, digital products and services must not be forced into one identical questionnaire or scoring model.
- Capture target customer groups, customer needs/use cases, problem fit, demand signals, purchase barriers and buying process. Distinguish customer statements, survey/sample evidence, behavioral observation and hypotheses.
- Compare the Offer with qualified direct competitors and substitute solutions using the contextual criteria defined in MVP-09: category, geography, target group, use case, maturity and price/value context.
- Assess value proposition and differentiation. Separate the seller's claimed differentiators from independently supported differentiators; link material claims to evidence.
- Assess specifications and features for physical/digital Offers; service scope, deliverables, expertise, capacity, availability and delivery/support conditions for service Offers.
- Assess price/value and packaging only with comparable price units, currency, geography, time and service/product scope. Preserve original prices and date. Do not imply that the lowest price is the best value.
- Use public reviews, complaints, return data and customer feedback only with source, sample, selection bias, date and permission limitations. A small or biased review sample cannot represent all customers.
- For physical quality/performance, require suitable evidence such as product tests, lab results, warranty/return records, complaint patterns, operational logs or controlled experiments. Images and sentiment alone are not quality proof.
- Assess distribution, availability, channel fit, trust signals, operational readiness, inventory/capacity constraints and service support only to the level supported by inputs and evidence.
- Create dimension-specific findings with observation/hypothesis type, evidence, confidence, method, sample, limitation and assessment version. Avoid a single unexplained score.
- Present missing and contradictory information explicitly. An incomplete assessment may be useful, but it must not appear comprehensive or verified.

### Prerequisites and sequencing
MVP-00 defines pilot depth and assessment dimensions. MVP-03 Offer/PIP, MVP-04 evidence and MVP-09 market/geography context have passed their applicable exit criteria.

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

1. Offer-nature-aware assessment contracts and versioned assessment runs.
2. Customer, demand, use-case and purchase-barrier assessment.
3. Competitor/substitute comparison framework tied to MVP-09 context.
4. Value proposition, differentiation, price/value, channel and operational-readiness findings.
5. Quality-evidence policy for physical products and evidence rules for digital products/services.
6. Assessment report with coverage, sample, confidence, supporting evidence and explicit limitations.

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

1. All three Offer natures can be assessed using relevant fields without forced unrelated questions.
2. Competitor comparisons reject or flag incomparable geography, category, scope, price units or time windows.
3. Seller claims and third-party assertions are not labeled direct observation unless independently observed.
4. Physical quality claims require appropriate evidence and cannot be generated from images/review sentiment alone.
5. Review/complaint data displays sample size, source, date and selection limitations.
6. Missing data, contradictory sources and low confidence remain explicit without fabricated scoring.
7. Unauthorized access to another seller's Offer or evidence is denied.
8. Assessment result references exact Offer/PIP/evidence/benchmark versions used.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- The pilot can assess relevant dimensions for physical, digital and service Offers.
- Findings are traceable to evidence or explicitly labeled hypotheses.
- Comparisons are contextually valid or explicitly marked incomparable/insufficient.
- Quality, review, price and operational claims follow their evidence rules.
- Assessment coverage and limitations are clear to the customer.
- Controlled end-to-end assessment is verified for the agreed pilot scope.

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

Do not claim comprehensive market research or definitive competitor coverage. Do not infer physical quality from imagery/sentiment, and do not create universal rankings across unlike Offers. The first pilot dimensions must follow MVP-00 decisions.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
