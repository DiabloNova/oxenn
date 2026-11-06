# Stage 04 — Shared Improvement Plan and Human-Approved Execution

## Metadata
- **Stage ID:** RM-04
- **Horizon:** Short-term MVP
- **Status:** proposed
- **Prerequisites:** RM-02 and RM-03; stable product profile, evidence and assessment contracts

## Objective

Convert findings from Digital Product Assessment and Product Value & Competitiveness Assessment into one prioritized plan with clear actions, cost/time estimates, dependencies, responsible parties and measurable outcomes.

## Customer and business value

The customer receives a practical, costed set of next steps rather than disconnected reports. The plan can include digital tasks, internal customer tasks and expert-delivered physical-world tasks, while keeping execution under customer control.

## Scope

- Consolidated action backlog for one product.
- Evidence, priority, expected effect, effort, cost range, duration and dependencies per action.
- AI-assisted action drafting and human review.
- Customer approval before execution or external side effects.
- Manual task completion and evidence upload for the MVP.
- Outcome measurement against a baseline.

**Non-goals:** unrestricted autonomous actions, automatic publication or purchase, supplier contact without permission, or guaranteed ROI.

## Detailed execution

1. Define a common Action/Plan domain model. Each action references the source finding/evidence and the originating assessment/run.
2. Separate observed problem, hypothesis, recommendation, customer decision, execution task and measured outcome as distinct states/entities.
3. Define a versioned priority rubric using impact, confidence, cost, urgency, dependencies and feasibility. Do not convert uncalibrated AI guesses into objective priority scores.
4. Normalize cost and duration into ranges; include currency, estimate date, assumptions, tax/service inclusion, data source and confidence.
5. Build dependency and resource-conflict handling so that actions requiring a product change cannot be marked complete before their prerequisite tests/approval.
6. Generate a draft plan using bounded AI assistance grounded in evidence. Require deterministic schema validation and human review before showing it as a proposal.
7. Let the customer accept, reject, defer or edit each action and record the decision and rationale.
8. Introduce explicit execution modes: customer-managed, Oxenn AI-assisted and Oxenn expert-assisted. The MVP can track manual work without pretending that the platform performed it.
9. Add task assignment, due date, owner, status, attachments, comments and audit history.
10. Require separate permissions and per-action approval for content publication, site edits, account connections, payments, supplier outreach or any external side effect.
11. Capture actual effort/cost and outcome after completion, then compare with the original estimate.
12. Preserve an immutable plan version so changes do not rewrite historical approved scope.

## Target files and modules

**Existing patterns to inspect:**
- `src/core/events/**`, event bus and job orchestration only where useful.
- Existing recommendation/diagnostic services under `src/services/diagnostic-engine/**`.
- Existing AI intelligence recommendations under `src/features/ai-intelligence/**`.
- Current auth/tenant/audit-log infrastructure.
- Existing task/job schemas only if their semantics fit the product plan.

**Proposed new paths if required:**
- `src/features/improvement-planning/domain/**`
- `src/features/improvement-planning/application/**`
- `src/features/improvement-planning/infrastructure/**`
- `src/app/[locale]/dashboard/plans/**`
- `src/app/[locale]/dashboard/products/[productId]/plan/**`

## Data, approvals and safety

Every action is tenant-owned, versioned, attributable and linked to source evidence. AI must not approve or execute its own recommendations. Customer approval must include action scope, target, cost limit and time window. External APIs use least-privilege credentials and idempotency keys.

## Testing and acceptance

- Findings from both assessments can be converted to actions without losing provenance.
- Plan versions remain immutable and decisions are auditable.
- Cross-tenant task/action access is denied.
- Rejected/deferred actions do not execute.
- External side effects cannot run without the relevant approval.
- Partial failure, retry, cancellation and compensation paths are tested.
- Estimated costs and actual costs are displayed separately.

## Parallelization

Plan UX, deterministic priority rubric and domain contract can be researched in parallel. The shared Action/Plan schema and workflow state machine require one owner. AI action drafting may be developed separately only against the approved versioned action schema.

## Success indicators

Rate of proposals accepted, time from assessment to approved plan, percentage of actions completed, estimate-to-actual cost variance, plan abandonment and customer-reported usefulness.

## Risks and open decisions

Decide whether the initial plan is product-scoped or customer/workspace-wide. Start product-scoped for MVP unless real customer workflows require cross-product dependencies.
