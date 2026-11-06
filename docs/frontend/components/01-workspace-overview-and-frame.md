# Component Design — Workspace Overview and Application Frame

**Pages covered:** P01 Workspace Overview  
**Depends on:** `01-DASHBOARD-PAGE-TEMPLATES.md`  
**Status:** Component specification; no production UI code in this file.

## Page composition

`DashboardFrame → PageHeader → WorkspaceContextBar → ProductPulse → ImprovementCycle → PriorityFindings → RoadmapSnapshot → RecentOutcomes → CopilotEntry`

## Components

### WorkspaceContextBar
- Purpose: expose organization/workspace, selected product, market, geography, locale, and measurement period.
- Inputs: current context identifiers and display labels; available options; scope capabilities.
- Interactions: change only the selected context; preserve it across compatible routes.
- States: no product selected, single product, multiple products, unavailable market data, permission-limited context.
- Rules: never invent workspace or product choices. Hide selectors that are not applicable to the current page.

### ProductPulse
- Purpose: summarize current digital, competitive, and market state without collapsing unknowns.
- Inputs: metric value, unit, direction, comparison window, evidence coverage, freshness, source count, availability state.
- States: measured, partial, unavailable, stale, illustrative.
- Rules: do not calculate or display an aggregate score unless the method and coverage justify it.

### ImprovementCycle
- Purpose: show the current lifecycle stage and traceable transition to the next stage.
- Stages: profile → baseline → diagnosis → simulation → decision → execution → outcome → reassessment.
- Inputs: stage, completion evidence, blocked reason, next action.
- Rules: stage progress must come from actual state; a static illustrative sequence must be labelled.

### PriorityFindings
- Purpose: show actionable findings ordered by explicit business relevance.
- Inputs: finding title, domain, impact, severity, confidence, status, evidence count, market scope.
- Interactions: open finding, filter by domain, create a proposed action where permitted.
- Rules: display confidence and severity separately.

### RoadmapSnapshot
- Purpose: summarize approved, proposed, blocked, and in-progress initiatives.
- Inputs: initiative status, owner, due date, priority rationale, dependency summary.
- Rules: proposed work must not look committed.

### RecentOutcomes
- Purpose: show measured effects after execution.
- Inputs: baseline, target, actual, measurement window, methodology, source, confidence.
- Rules: do not infer causality or equate task completion with outcome achievement.

### CopilotEntry
- Purpose: start a context-aware conversation from the current workspace/product/page.
- Inputs: authorized context descriptor and suggested prompts.
- Rules: suggestions and chat messages do not approve plans or authorize external actions.

## Responsive and accessibility
- Desktop: two-column analytical layout with a clear primary reading path.
- Tablet/mobile: stack sections; keep priority findings and next action near the top.
- All cards have semantic headings; actions are keyboard reachable; chart summaries have text alternatives.
- Persian RTL uses logical alignment and locale-native number/date formatting.

## Fixture policy
Any sample metrics, initiatives, findings, or outcomes must carry an explicit “Illustrative preview” state. Do not show fake sync timestamps or all-systems-operational status.
