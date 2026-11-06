# Component Design — Planning & Execution Engine

**Pages covered:** P19 Strategic Roadmap; P20 Initiatives & Projects; P21 Task Board & Execution; P22 Approvals & Decisions; P23 Execution History

## Shared components
- **ObjectiveContext:** objective, target, baseline, owner, market/product scope.
- **PriorityRationale:** impact, effort, cost, evidence confidence, strategic fit, dependencies, risk, time-to-impact, reversibility.
- **DependencyGraph/List:** prerequisite and resource-conflict representation with list alternative.
- **InitiativeCard:** objective, status, owner, priority, milestone, cost/time estimate, evidence links.
- **TaskLifecycleBadge:** Proposed → Prioritized → Approved → Scheduled → In Progress → Completed / Failed → Verified.
- **ExecutionModeBadge:** AI-assisted, human, or hybrid; never imply an execution agent ran when it did not.
- **ApprovalDecisionPanel:** action, affected resources, cost/risk, reversibility, permission, supporting evidence, decision/reason/actor/time.
- **ExecutionEvidencePanel:** inputs, outputs, errors, retries, logs/observations, verification, and outcome reference.

## P19 — Strategic Roadmap
`ObjectiveContext → RoadmapTimeline/Board → InitiativeCard[] → PriorityRationale → DependencyGraph/List → MilestoneInspector`
- Separate proposed, approved, scheduled, active, blocked, completed, and verified work.

## P20 — Initiatives & Projects
`InitiativeList → InitiativeDetail → MilestoneList → WorkstreamPanel → ResourceSummary → DecisionHistory → OutcomeLinks`
- Initiative detail traces back to findings/evidence and forward to tasks/outcomes.

## P21 — Task Board & Execution
`TaskViewSwitcher → TaskFilters → TaskBoard/List → TaskDetail → TaskLifecycle → ExecutionEvidencePanel`
- Drag/drop must not bypass authorization, dependency, or approval checks.
- "Completed" and "Verified" are distinct terminal states.

## P22 — Approvals & Decisions
`ApprovalQueue → ApprovalDecisionPanel → EvidenceAndAssumptions → DecisionComposer → ImmutableDecisionHistory`
- Approve/reject actions are permission-gated and require a reason where policy requires it.
- No AI-generated suggestion may silently become an approval.

## P23 — Execution History
`ExecutionFilters → ExecutionTimeline/Table → ExecutionDetail → ExecutionEvidencePanel → VerificationSummary → LinkedOutcome`
- Display exact status and error/recovery history.
- No green success indicator without actual verification.

## Cross-page rules
- The task state machine is displayed consistently across all views.
- Proposed work is not presented as committed work.
- Execution status is not outcome success.
- AI/human/hybrid execution mode is explicit.
- Cost, time, and impact values show whether they are measured or estimated.
- No external action is performed by the frontend design itself.
