# MVP-14 — Integrated Pilot Validation and Release Readiness

**Stage:** MVP-14  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Validate the complete MVP customer journeys, security, commercial access, evidence truth and operational support in a controlled pilot environment, then present an evidence-based release recommendation.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Validate the complete MVP customer journeys, security, commercial access, evidence truth and operational support in a controlled pilot environment, then present an evidence-based release recommendation.

### In scope
- Create a traceability matrix from FR-01–FR-11 and all security, privacy, commercial, trust and workflow requirements to implementation paths, tests, runtime evidence and owners.
- Validate the standalone service journeys end to end: registered user → service choice → price/quota/terms → entitlement → service-specific inputs/consent → execution → result validation → evidence/report/history. Run SEO-only, AEO-only and GEO-only scenarios.
- Validate optional bundle purchase/activation and reporting separately. Prove that the bundle is optional, service status remains distinct, and bundle purchase does not duplicate charges or erase existing entitlements.
- Validate Product Assessment & Improvement for the approved pilot Offer natures and customer segments: individual seller, physical, digital, service, and social-commerce channel use cases as selected in MVP-00.
- Validate complete assessment flow: Offer/PIP → evidence → market/customer/value/competitor assessment → baseline/benchmark → gap → recommendation/scenario → customer-approved plan → task → outcome → reassessment.
- Run negative security tests: unauthenticated free service access, cross-tenant access, role abuse, entitlement bypass, quota race, client-side payment spoofing, unsafe URL/crawl inputs, and unauthorized external actions.
- Exercise provider and source failure scenarios: unavailable provider, expired credentials, unsupported locale, timeout, rate limit, partial response, empty evidence, stale data, parser errors and cost-limit stop.
- Validate data retention, deletion/export needs, audit history, sensitive-data handling, backup/recovery and operational access according to approved policy. Verify the actual target environment and do not infer production readiness from local tests or schema files.
- Run performance, capacity and cost checks against MVP-00 budgets: crawl limits, prompt volume, provider costs, concurrent runs, storage and report generation.
- Validate user-visible status and language: LIVE, MOCK, HYBRID, PARTIAL, FAILED, UNKNOWN, stale, insufficient evidence and unsupported source must be unambiguous.
- Prepare pilot support: incident ownership, customer contact route, operational dashboards/alerts, runbook, provider failure handling, entitlement correction path, known limitations and feedback capture.
- Define feature flags, pilot cohort allowlist, staged rollout, stop criteria, rollback/disable procedures and data migration safeguards where applicable.
- Produce a release recommendation based on evidence. A deployment or production activation is a separate action and must not happen without explicit owner authorization.

### Prerequisites and sequencing
MVP-01 through MVP-13 have passed their stage gates or have explicit owner-approved pilot exceptions with documented limitations. MVP-00 pilot cohort, geography, language, sources and success thresholds are approved.

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

1. Requirements-to-code/test/runtime evidence traceability matrix.
2. End-to-end results for each standalone service, optional bundle and approved Product Assessment & Improvement journey.
3. Security, tenant isolation, entitlement, payment, acquisition, provider, data-retention and external-action test reports.
4. Provider/source coverage, quality and failure-mode report.
5. Performance/cost measurements against approved budgets.
6. Pilot runbook, support ownership, release/rollback/stop criteria and known-issues list.
7. Go/no-go recommendation with evidence, residual risks, waivers and owner decisions.

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

1. SEO-only, AEO-only and GEO-only journeys pass without other-service purchases or PIP completion.
2. An authenticated user can add services later and existing valid entitlements remain intact.
3. Bundle and Product Assessment & Improvement are truly optional and correctly represented commercially.
4. Offer and PIP workflows support the approved physical, digital and service scope and social-commerce channel scenarios.
5. At least one pilot assessment can trace evidence through recommendation, approved task and outcome measurement.
6. Unauthenticated, cross-tenant, unauthorized-role, invalid-entitlement and quota-abuse cases fail safely.
7. Mock, live, partial and failed source/provider behavior is correctly labeled in all user-visible reports.
8. No unapproved external side effect occurs.
9. Controlled runtime evidence confirms actual persistence, identity, provider reachability and integration behavior claimed as verified.
10. Rollback/disable procedures are tested or their limitations are explicitly documented.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN.

## 7. Stage exit criteria

- All critical FR-01–FR-11 and security/commercial/trust acceptance criteria are satisfied or covered by explicit owner-approved exceptions.
- All three standalone service journeys pass in the agreed controlled environment.
- The optional Product Assessment & Improvement pilot passes its approved end-to-end scope.
- Provider/source states, evidence and limitations are transparent and auditable.
- Operational support, budget controls, monitoring, incident handling and rollback are ready for the approved pilot.
- Go/no-go recommendation is submitted with residual risks; release remains gated on explicit owner approval.

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

This stage authorizes validation and a release recommendation only. Do not deploy, expose the service publicly, charge real customers, send outbound communications, modify production data or activate production credentials without explicit separate authorization. Passing CI does not prove production readiness.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
