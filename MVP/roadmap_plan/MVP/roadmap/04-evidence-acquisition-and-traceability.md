# MVP-04 — Evidence Acquisition and Traceability

**Stage:** MVP-04  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Provide a permission-aware and auditable evidence layer that supports digital services and product/market assessment without treating user claims, third-party claims, estimates or AI-generated hypotheses as verified facts.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Provide a permission-aware and auditable evidence layer that supports digital services and product/market assessment without treating user claims, third-party claims, estimates or AI-generated hypotheses as verified facts.

### In scope
- Define an evidence record and stable identifiers that can be referenced by Offer, PIP versions, service runs, metrics, observations, claims, assessments, findings, gaps, recommendations, plans, tasks and outcomes.
- Support the approved evidence classes: user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. Preserve the class through aggregation and reporting.
- Retain applicable provenance: source URL or identifier, provider, source owner, collection method, timestamp, geography/locale, scope, sample size, freshness, permission/consent, confidence and known limitations. A field that does not apply or is unavailable must be explicitly absent/unknown, not fabricated.
- Provide manual entry, file import and approved public-source acquisition as permitted in MVP-00. Add automated website crawling or third-party provider access only with explicit authorization and bounded contracts.
- Build acquisition adapters behind OXENN-owned interfaces. Keep provider-specific payloads isolated and map them into validated OXENN evidence contracts.
- Apply SSRF-safe URL validation, allowed protocols, DNS/IP checks as appropriate, redirect revalidation, bounded redirect count, timeouts, response-size limits, content-type rules, robots/terms/permission policy, rate limits and cost ceilings.
- Treat acquired web content, files and AI/provider responses as untrusted input. Never execute embedded instructions or allow retrieved content to alter system policy.
- Validate and normalize source timestamps, locale, units, currencies and identifiers; retain original source values when normalization is needed.
- Track freshness and revalidation status. A stale observation is not silently reused as a current measurement. Keep source unavailable, permission denied, partial collection, parser error and provider failure distinct.
- Deduplicate where it is safe, but preserve source identity and collection history. Do not overwrite conflicting observations; store disagreement and its context.
- Attach evidence to the exact Offer, PIP version, service run, market, geography and observation window it supports. Avoid evidence reuse across workspaces or purposes without permission.
- Create a minimum evidence explorer/reporting path that lets a reviewer inspect the source, method, timestamp, scope, limitations and the claim supported.

### Prerequisites and sequencing
MVP-00 evidence/source policy approved. MVP-01 authorization foundation verified. MVP-03 Offer/PIP contracts available for the comprehensive assessment path. MVP-02 service permissions/entitlements apply to any metered acquisition.

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

1. Versioned evidence contract and evidence-class vocabulary.
2. Source/provider adapter interface and a catalog of approved sources with permissions and limits.
3. Bounded acquisition/crawling controls and documented threat model.
4. Evidence provenance, freshness, confidence and limitation handling.
5. Validated traceability links from evidence to Offer/PIP/assessment/finding and from later recommendation/task/outcome records.
6. Evidence review/report UI or API that exposes source and limitation details to authorized users.

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

1. Every accepted assessment finding links to evidence or is explicitly labeled a hypothesis with no fabricated source.
2. Missing timestamp, geography, sample or permission metadata is shown as unknown/not applicable, not synthesized.
3. SSRF test cases cover loopback, private and link-local addresses, redirects, DNS rebinding risks where applicable, unusual ports, protocols and oversized responses.
4. Acquisition respects consent, source allowlists/denylists, rate limits, timeout, response size and cost budget.
5. Untrusted retrieved instructions cannot change prompts, tool access, tenant scope or policy.
6. Partial collection, source failure, stale source, access denied, parser failure and provider outage remain distinguishable.
7. Conflicting observations remain traceable; latest timestamp does not automatically mean highest trust.
8. Cross-tenant and cross-purpose evidence access is denied unless explicitly authorized.
9. Repeated collection does not silently overwrite the source and history of earlier observations.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- Evidence classes and provenance contracts are accepted and versioned.
- Each important evidence item is attributable to source, scope, method and time to the extent applicable.
- Acquisition is permission-aware and bounded against SSRF, resource exhaustion and unsafe content.
- Partial, failed, stale, contradictory and unknown states remain explicit.
- Downstream stages can reliably reference evidence without copying untrusted raw content into trusted domain state.
- Security and data-retention limitations are documented and tested.

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

Do not introduce a graph database merely because the architecture domain is named Product Evidence Graph. A relational model or another repository-compatible approach may satisfy traceability. Do not claim external source access or database persistence without direct verification. Do not crawl private/social content without explicit permission.

## 10. References

- [Approved MVP Product Specification](../../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../../architecture_map/project_map.md)
- [MVP Map](../../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
