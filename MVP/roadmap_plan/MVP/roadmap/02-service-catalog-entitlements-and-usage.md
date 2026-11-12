# MVP-02 — Service Catalog, Entitlements and Usage

**Stage:** MVP-02  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Make standalone service access a first-class commercial and authorization model so a registered customer can select, activate, purchase and use only the service they need.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Make standalone service access a first-class commercial and authorization model so a registered customer can select, activate, purchase and use only the service they need.

### In scope
- Create a canonical OXENN Service Catalog distinct from customer Offers. Model catalog item/version, Service SKU, plan or one-time purchase, subscription where applicable, entitlement, quota, usage ledger, bundle and service run as separate concepts.
- Represent SEO, AEO and GEO as independently selectable SKUs. AEO/GEO/SEO must not be hardwired as one mandatory suite or a workspace-wide tier.
- Represent the Digital Visibility Suite as an optional bundle with explicit member SKUs, commercial terms and quota allocation. A customer may buy a standalone SKU without buying the bundle.
- Represent Product Assessment & Improvement as a separate optional offering. Its entitlement must not gate access to standalone SEO/AEO/GEO.
- Every free, trial, one-time, subscription or paid service remains behind registration and authentication. Identity, entitlement, permission to use a source and provider availability are separate checks.
- Enforce entitlement and quota on the server at request/run time. Check actor, workspace, selected SKU, scope, status, validity window, usage allowance and required permission before starting work.
- Record usage as durable, attributable service consumption with clear units (for example pages, prompts, runs or credits) only after the approved metering rules define those units.
- Make purchase/activation idempotent. Handle duplicate requests, webhook retries, concurrency, cancellation, expiration, renewal, refund and chargeback states without duplicate charges or duplicate entitlement activation.
- Verify payment evidence server-side if a payment provider is introduced. Never trust a client success screen, query parameter or local state to create a paid entitlement.
- Before confirmation show the selected SKU, price, billing period, included quota, overage, renewal/cancellation/refund terms, bundle contents and any service limitations. Never charge for an unselected item.
- Support adding another service later without forcing repurchase of a still-valid entitlement for an existing service.
- Provide auditable administrative operations for granting/revoking entitlements, with least privilege and reason metadata.

### Prerequisites and sequencing
MVP-00 commercial decisions approved; MVP-01 authenticated identity and workspace boundary verified.

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

1. Versioned service catalogue and SKU model, including independent SEO/AEO/GEO SKUs and optional bundles.
2. Server-side entitlement resolution policy and service-level quota model.
3. Usage ledger with concurrency-safe/idempotent consumption semantics and explicit units.
4. Purchase/activation/subscription lifecycle contracts aligned with MVP-00 decisions.
5. Customer selection/confirmation experience and clear service status/limits.
6. Administrative audit path for controlled entitlement correction without client-side privilege.

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

1. SEO-only customer can activate/use SEO while AEO, GEO and Product Assessment remain unpurchased.
2. Missing GEO entitlement does not block an entitled SEO run; entitlement for one SKU does not imply another.
3. Standalone SEO does not require a PIP, bundle or Product Assessment entitlement.
4. Free service use still fails without authentication.
5. Unselected service is not charged, activated or metered.
6. Expired, revoked, suspended, out-of-quota and wrong-workspace entitlements fail safely with clear user feedback.
7. Concurrent quota consumption cannot exceed allowed limits or create duplicate service runs.
8. Duplicate checkout requests and repeated payment callbacks are idempotent.
9. Bundle activation grants only the included services and respects the exact approved bundle terms.
10. Client-side payment claims cannot activate paid access; webhook signature/verification and reconciliation are tested if payment integration is in scope.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- Catalog and SKU definitions are versioned and match the approved commercial decision register.
- SEO, AEO and GEO can be selected and authorized independently.
- Optional bundle membership, price/terms and quota are explicit; no bundle is required.
- Every run is server-authorized against authentication, entitlement, quota and permission.
- Usage metering and purchase/activation behavior are idempotent and auditable.
- Commercial display does not imply unsupported provider availability or service completion.

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

Do not invent prices, quotas, billing intervals, refund terms or a payment provider. If these decisions are open, implement only the approved catalogue contract and mark purchase integration blocked. Do not create a tenth intelligence domain for commercial access; it is cross-cutting.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
