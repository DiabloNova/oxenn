# MVP-01 — Identity, Workspace and Security Foundation

**Stage:** MVP-01  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Establish a trustworthy authenticated boundary for every OXENN user and service, with explicit workspace context and tenant isolation before commercial activation or Offer data is exposed.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Establish a trustworthy authenticated boundary for every OXENN user and service, with explicit workspace context and tenant isolation before commercial activation or Offer data is exposed.

### In scope
- Implement or verify account registration, sign-in, sign-out, session lifecycle, expiration, refresh/rotation and recovery using the repository's supported identity architecture.
- Every service—including free audit or trial access—must require a registered account and a server-authenticated session. A public page may explain a service but must not execute it anonymously.
- Define the identity boundary between a natural person, seller/provider, business/organization, workspace and workspace member. An individual seller must be supported without creating a fictitious legal company.
- Resolve workspace creation, membership, invitations and role assignment according to MVP-00 decisions. If the first pilot is single-user, keep the implementation minimal while preserving safe ownership and future extension points.
- Derive user and workspace context from a trusted server session and authorized membership lookup. Never trust caller-controlled user IDs, workspace IDs, identity headers or role claims as authority.
- Apply authorization consistently to Route Handlers, Server Actions, server-rendered data access, background jobs, file downloads and service-run retrieval.
- Define separate platform-operator and tenant roles. A platform administrator must not be treated as a tenant owner by accident.
- Protect session cookies, CSRF-sensitive mutations, credential storage, password/identity recovery, rate-limited authentication endpoints, audit events and account enumeration behavior.
- Establish tenant-safe repository/query patterns and verify database row-level controls only in an environment where the actual database is connected and testable. Do not claim deployed RLS from SQL files alone.
- Add security telemetry and an auditable record for authentication, membership changes, privileged access and denied access without logging passwords, tokens or unnecessary personal data.

### Prerequisites and sequencing
MVP-00 decision register and security acceptance criteria approved. Revalidate current auth, proxy, route handlers, server actions, role model, schema and tests before implementation.

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

1. Documented identity, person/seller/provider, organization, workspace and membership contracts.
2. Consistent server-side authentication and authorization helpers used by all relevant service/API boundaries.
3. A role/permission matrix approved for the pilot.
4. Tenant-safe data access patterns and a test harness for user/workspace boundary checks.
5. Audit events and safe operational diagnostics for authentication and authorization outcomes.
6. Migration and rollout plan for any necessary identity or ownership data changes, separately reviewed before execution.

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

1. Unauthenticated calls to every service execution boundary are rejected, including free services.
2. Authenticated user A cannot read or mutate user B's workspace, Offers, files, evidence, runs, subscriptions or reports.
3. Users with limited workspace roles cannot perform owner/admin operations.
4. Client-supplied workspace/user/role identifiers cannot override the trusted session context.
5. Expired, revoked, invalid and rotated sessions behave correctly; logout/revocation takes effect as specified.
6. Server actions and background jobs enforce equivalent authorization boundaries; UI hiding alone is not considered a control.
7. Authentication endpoints resist basic abuse and do not leak credentials or sensitive identity details.
8. Any claimed RLS behavior is tested against an actual controlled database; otherwise mark runtime/database enforcement UNKNOWN.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN or NOT VERIFIED.

## 7. Stage exit criteria

- All relevant service and data endpoints require server-authenticated identity.
- Workspace ownership and membership are checked server-side for every tenant-owned resource.
- Positive, negative, cross-tenant and privilege-boundary tests pass.
- Audit events exist for security-relevant identity and membership changes.
- Known legacy bypasses or unprotected service routes are fixed and regression-tested or formally excluded from exposure until fixed.
- Database/RLS claims are limited to the environments directly tested.

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

Do not expose a legacy Free Audit route anonymously. Do not silently choose a multi-organization role model or claim a database connection exists. Reconcile the current repository security model and any prior findings before editing; preserve unrelated authentication integrations.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele.ai/p/oxenn-59hxc/nodes/KNOW-64)
