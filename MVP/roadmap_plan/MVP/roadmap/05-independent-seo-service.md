# MVP-05 — Independent SEO Service

**Stage:** MVP-05  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Deliver a complete, truthful SEO service that a customer can select and use on its own, without purchasing AEO/GEO or completing Product Assessment & Improvement.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Deliver a complete, truthful SEO service that a customer can select and use on its own, without purchasing AEO/GEO or completing Product Assessment & Improvement.

### In scope
- Define the minimum SEO input contract: authenticated customer/workspace, selected SEO entitlement, target website/property, ownership or authority proof as required, authorized URL scope, exclusions, crawl budget, preferred locale, and optional connected search/analytics sources with explicit consent. Do not require a comprehensive PIP.
- Implement bounded website discovery and crawling using OXENN-owned interfaces. Validate every URL and every redirect, constrain protocols and destination IPs, cap pages/depth/time/bytes/concurrency and rate, and prevent access to private/internal networks.
- Preserve exact crawl coverage: requested scope, discovered pages, attempted pages, successfully observed pages, excluded pages, failures and reasons. A partial crawl must not appear complete.
- Implement the approved technical checks, only where evidence supports them: HTTP status and redirect chain, indexability directives, canonical behavior, title/meta description, heading structure, internal links, sitemap/robots observations, structured data presence/validity and other checks expressly approved in MVP-00.
- Keep rule definitions, severity, scoring and analyzer versions explicit and testable. Do not create an opaque global SEO score unless the method, denominator, missing-data behavior and interpretation are approved.
- Treat page content as untrusted. Sanitize parsed data, do not execute scripts, avoid fetching embedded arbitrary URLs, and do not allow page instructions to influence system prompts or tools.
- Integrate external search performance or analytics only when credentials, API permission, account scope and provider connectivity are directly verified. Crawler observations and provider metrics are different evidence sources.
- Produce page-level findings with evidence, severity/priority, rule version, observation time, affected URL, remediation guidance and limitation. Distinguish a technical observation from an inferred ranking impact.
- Record run status and provider/data mode as LIVE, MOCK, HYBRID, PARTIAL or FAILED. Development fixtures must be clearly labelled and inaccessible as production evidence.
- Provide a service-specific result/report and history that an SEO-only customer can access, export or revisit subject to entitlement and workspace authorization.

### Prerequisites and sequencing
MVP-00 approves SEO scope, supported sources, crawl policies and metrics. MVP-01 authentication is verified. MVP-02 SEO SKU entitlement/quota is enforced. MVP-04 evidence and safe acquisition contracts are available.

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

1. SEO service contract and minimum input/onboarding flow.
2. Bounded crawler/discovery implementation with a documented threat model and deterministic resource budgets.
3. Versioned technical rule/analyzer contracts and page-level evidence model.
4. Run lifecycle, coverage accounting, partial/failure states and provider metadata.
5. Prioritized SEO findings and a report/history experience for an SEO-only customer.
6. Focused rule tests, crawler security tests and service-level end-to-end coverage.

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

1. An authenticated customer with SEO entitlement can start and view SEO without AEO/GEO entitlements, a bundle or a comprehensive PIP.
2. Unauthenticated requests and users without the SEO entitlement are rejected server-side.
3. Only authorized website scope is crawled; private network, localhost, link-local, protocol abuse and redirect bypasses are blocked.
4. Page, depth, concurrency, response-size, time, rate and cost limits are enforced under normal and failure conditions.
5. Each finding points to the actual page observation and rule version; missing pages are not assigned fabricated passing scores.
6. Invalid robots/canonical/redirect/status/metadata cases produce predictable results under unit and integration tests.
7. Partial discovery, blocked page, timeout, provider outage and parse failure are shown as partial/failed with accurate coverage.
8. Mock fixtures are visibly labelled MOCK and never mixed with LIVE observations without an explicit HYBRID breakdown.
9. Repeated runs are traceable and do not overwrite older evidence.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN.

## 7. Stage exit criteria

- SEO is independently selectable and authorized using its own SKU and quota.
- An SEO-only customer completes the service journey with service-specific inputs only.
- Crawl scope and resource use are bounded and SSRF controls pass relevant tests.
- Findings are page-level, evidence-backed, prioritized and reproducible by analyzer version.
- Coverage and all partial/failure/mock/live states are truthful.
- Controlled end-to-end tests prove the customer can initiate, inspect and revisit a run.

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

Do not claim that a technical crawl proves search rankings or business outcomes. Do not make live search-provider claims without actual credentials, permission and runtime verification. Never use synthetic sites or seeded signals as customer LIVE data.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
