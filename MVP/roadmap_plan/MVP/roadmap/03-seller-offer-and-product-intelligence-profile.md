# MVP-03 — Seller, Offer and Product Intelligence Profile

**Stage:** MVP-03  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Create the canonical model for who offers what, through which channels, and what is known about an existing Offer—without confusing the customer's product with OXENN's saleable services.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Create the canonical model for who offers what, through which channels, and what is known about an existing Offer—without confusing the customer's product with OXENN's saleable services.

### In scope
- Model a person as an account holder and possible seller/provider. Allow that person to represent an Offer without a registered company. Model a business/organization only when the customer declares one; do not fabricate legal status.
- Model seller/provider ownership and relationship to one or more customer Offers. Resolve ownership transfer, collaborator access and duplicate seller handling before implementation.
- Define Offer with exactly three nature values: physical, digital and service. Keep nature separate from category, business model, lifecycle status and sales channel.
- Define OfferChannel separately and allow multiple channels per Offer. Include website/store, marketplace/directory, social network, messaging, offline and direct channels as appropriate. A social-commerce seller is a customer segment/channel context, not a fourth Offer nature.
- Build staged onboarding: minimal required Offer identity first; optional nature-specific fields next; comprehensive PIP completion only when the customer selects Product Assessment & Improvement or another workflow that needs it.
- Create a versioned, reviewable Product Intelligence Profile with Offer description/category/lifecycle, value proposition, differentiating claims, customer groups, needs/use cases, markets/geographies/languages/channels, pricing/business model where allowed, competitors, constraints, operational readiness and evidence gaps.
- Keep PIP, Current-State Baseline and Benchmark as separate versioned concepts. PIP describes the Offer and intended context; baseline records what is currently observed/known; benchmark is a context-specific comparison basis.
- Track field-level source and confidence where appropriate. Preserve whether each value is user-provided, directly observed, imported, estimated or unknown.
- Support partial PIP completion. Missing values remain explicit; no synthetic defaults or fabricated scores. Different Offer natures use different relevant fields and do not require unrelated fields.
- Allow profile history, review, correction and version comparison. Material edits must not erase historical assessment context; preserve linkage from a report to the PIP version used.
- Expose service-specific intake paths. Standalone SEO may ask for website scope and authorization without asking the customer to complete all Offer questions or create a comprehensive PIP.

### Prerequisites and sequencing
MVP-00 approves Offer/PIP fields and pilot requirements. MVP-01 provides secure identity/ownership. MVP-02 is needed for the broader commercial journey, but standalone service intake must remain independent.

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

1. Canonical seller/provider, person, organization/workspace relationship and Offer domain contracts.
2. Offer creation/update flow with physical/digital/service validation and separate multi-channel recording.
3. Versioned PIP with common and nature-specific fields and explicit partial/unknown states.
4. Field provenance and profile version history.
5. Service-specific intake contract that does not depend on comprehensive PIP completion.
6. Data ownership and access rules for seller, Offer, profile and workspace collaborators.

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

1. An individual can register, create and own an Offer without a formal company record.
2. All three Offer natures are accepted; invalid or fourth nature values are rejected.
3. Social-commerce channel can be linked to a physical, digital or service Offer.
4. One Offer can have multiple channels and one seller can manage multiple Offers where policy permits.
5. Nature-specific validations require only relevant fields and do not reject valid partial profiles.
6. Standalone SEO intake works without creating/completing PIP.
7. Changing a material PIP value creates a new version; a historical assessment still points to the prior version.
8. Unauthorized users cannot view or edit another seller's Offer/PIP.
9. Empty or missing fields are not converted into zeros, fabricated claims or success scores.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- Seller/provider and Offer ownership are explicit, secure and support individuals.
- Offer nature is exactly physical, digital or service; channels are independent and multi-valued.
- PIP is versioned, reviewable and distinct from baseline and benchmark.
- Partial profile is supported without synthetic data.
- Comprehensive PIP is not a prerequisite for standalone SEO/AEO/GEO.
- Tests prove Offer, PIP and access boundaries across the supported customer types.

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

Do not model a customer's Offer as an OXENN Service SKU, and do not model social commerce as a fourth Offer nature. Avoid making every PIP field mandatory at registration. Do not invent an AI-generated profile value without storing it as an estimate/hypothesis and asking for review where required.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
