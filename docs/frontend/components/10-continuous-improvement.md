# Component Design — Continuous Improvement Loop

**Page covered:** P24 Continuous Improvement

## Composition
`ImprovementCycleHeader → MeasurementWindowSelector → BaselineTargetActualComparison → OutcomeBreakdown → UnexpectedEffectsPanel → LearningRecordList → NextCyclePriorities`

## Components
- **ImprovementCycleHeader:** cycle identifier, current stage, product/market scope, start date, next measurement date if defined.
- **MeasurementWindowSelector:** comparable observation periods and methodology.
- **BaselineTargetActualComparison:** baseline, target, expected, current, and actual values with source/time/confidence.
- **OutcomeBreakdown:** results by domain, market, initiative, and objective.
- **UnexpectedEffectsPanel:** negative, neutral, positive, and unanticipated results.
- **LearningRecordList:** what was expected, what happened, evidence, uncertainty, and how future assumptions changed.
- **NextCyclePriorities:** remaining gaps and candidate next actions with explicit priority rationale.

## Behavior
- Reassessment starts only through an existing authorized workflow.
- A result is marked verified only when its measurement and evidence requirements are satisfied.
- Preserve previous baselines and scenario assumptions for comparison.
- Do not automatically infer causality from temporal association.

## States
- No completed initiatives: explain that outcome measurement becomes available after execution.
- Outcome not measurable: display unavailable with reason.
- Insufficient comparison window: do not show directional claims.
- Illustrative preview: persistent label and no implied real history.

## Accessibility
- Every chart has a table or text alternative.
- Comparisons label the period and unit.
- Positive/negative outcomes are not distinguished by color alone.
