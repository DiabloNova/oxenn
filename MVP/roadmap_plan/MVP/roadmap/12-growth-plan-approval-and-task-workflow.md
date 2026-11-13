# MVP-12 — Growth Plan, Approval and Task Workflow

**Stage:** MVP-12  
**Status:** Planned execution contract; not implementation evidence or an authorization to execute.  
**Product:** OXENN Product & Market Improvement Intelligence Platform  
**Applies to:** The current owner-approved MVP, with customer Offers limited to physical products, digital products and services, and with social-commerce sellers included from the start.  
**Primary goal:** Convert accepted recommendations into a customer-reviewable, explicitly approved Growth Execution Plan and a reliable task lifecycle without enabling unapproved external side effects.

## 1. Context an execution agent must know

OXENN has two assessment pillars: Digital Product Assessment and Product Value & Competitiveness Assessment. The first MVP provides independently selectable SEO, AEO and GEO services, an optional Digital Visibility Suite bundle, and a limited optional Product Assessment & Improvement pilot. The core platform manages customer Offers, evidence, assessments, plans, tasks and outcomes. AI Infrastructure is a separate product line and is not a dependency of this MVP.

A customer Offer is the customer's existing physical product, digital product or service. An OXENN Service SKU is what the customer purchases or activates. Sales channels are separate from Offer nature: a social-commerce seller may sell any of the three Offer natures. Do not conflate a customer Offer, a service SKU, a bundle or an architecture domain.

Standalone SEO/AEO/GEO must remain usable after registration with only service-specific inputs, permissions, entitlement and quota. A standalone service must not force a comprehensive Product Intelligence Profile (PIP), Product Assessment & Improvement, or purchase of another service. Every service—including a free one—requires a registered account and server-authenticated session. The broad assessment journey is optional.

Evidence must distinguish user-provided information, direct observation, third-party claim, estimate, hypothesis and simulation. UNKNOWN is not ZERO. AI-generated content does not become verified evidence merely because it is well-formed. OXENN does not autonomously perform consequential external actions; explicit approval and permissions are required.

Canonical requirements are FR-01–FR-11 in the owner-approved MVP Product Specification. The [MVP Map](../../../architecture_map/MVP_map.md) and [MVP Baseline](../MVP_baseline.md) provide navigation, but this brief repeats the context needed for this stage.

## 2. Stage objective and boundaries

Convert accepted recommendations into a customer-reviewable, explicitly approved Growth Execution Plan and a reliable task lifecycle without enabling unapproved external side effects.

### In scope
- Create a Growth Execution Plan as a versioned, user-reviewable collection of selected recommendations and proposed tasks for a specific Offer and assessment context.
- Allow the customer to select, reject, reprioritize or defer recommendations before plan approval. Show rationale, expected outcome, confidence, effort/cost, risk, dependencies and required permissions.
- Represent plan states explicitly, for example DRAFT, IN_REVIEW, APPROVED, REJECTED, ACTIVE, PAUSED, COMPLETED and ARCHIVED, using the exact state vocabulary approved by engineering. Preserve transition history.
- Model each Task with a clear action description, linked recommendation/evidence, owner, due date, status, dependencies, effort/cost where available, risk, required approval, KPI/result measure and change history.
- Resolve task ownership according to pilot roles. If the task is assigned to the customer rather than executed by OXENN, make that responsibility clear.
- Detect dependency cycles, missing owners, invalid due dates, conflicting resources and tasks that cannot start until another task completes.
- Provide comments, blockers, status updates, reminders and progress summaries within the authorized product scope.
- Require an explicit customer approval action for the exact plan version and scope before its tasks are treated as authorized commitments. Any material plan change after approval must trigger the required re-approval.
- Treat approval to organize or track tasks as distinct from permission to execute external actions. Publishing, price changes, customer/supplier messages, purchases, payments, account changes and similar actions remain disabled unless a separately approved and authorized execution capability exists.
- Keep task execution manual or status-tracked during MVP unless a specific low-risk internal action has separately passed approval and safety requirements.
- Record actor, timestamp, plan version, decision, approval scope, task state changes and evidence without leaking sensitive data.

### Prerequisites and sequencing
MVP-11 has produced validated recommendations. MVP-01 identity/roles and the MVP-00 approval/ownership policy are approved.

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

1. Versioned Growth Execution Plan and plan-state transition model.
2. Recommendation selection/review/approval experience.
3. Task model with owner, dates, status, dependencies, cost/effort, risk, KPI and audit history.
4. Dependency validation and blocker management.
5. Customer approval record tied to exact plan version and scope.
6. Task progress dashboard and manual outcome/result capture entry points.

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

1. A plan cannot enter APPROVED without an authenticated authorized customer action.
2. Approval applies only to the exact plan version and included tasks; material changes invalidate or require renewed approval.
3. Users without plan authority cannot approve or change protected plan state.
4. Task ownership, dates, dependencies and status transitions are validated.
5. Dependency cycles and invalid references are rejected.
6. Task status tracking does not silently publish, send, purchase, pay or alter external systems.
7. Cross-workspace task and plan access is denied.
8. Plan and task audit history records actor, time and prior/new state.
9. Rejected/deferred recommendations remain traceable and are not accidentally scheduled.

Verification must be performed against the exact branch/commit being handed off. Tests against mocks prove mock-path behavior only. Runtime, provider, data-source, payment and database claims require evidence from the relevant controlled or deployed environment. When such an environment is unavailable, mark the corresponding property UNKNOWN.

## 7. Stage exit criteria

- A customer can review, modify and approve a plan tied to a specific assessment and recommendation set.
- Only the authorized customer/role can approve a plan.
- Approved tasks have explicit owners, dates, dependencies, status, effort/cost where known and result measures.
- Progress and blockers can be tracked with audit history.
- No consequential external action occurs merely because a plan is approved.
- Controlled end-to-end tests cover draft, review, approval, rejection, re-approval and task progress.

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

Do not implement autonomous execution as a side effect of plan approval. Do not invent resource owners, task budgets or role privileges. External integrations and execution adapters require a separately approved scope, security assessment and explicit per-action consent.

## 10. References

- [Approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [Project Map](../../../architecture_map/project_map.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Independent service access — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
