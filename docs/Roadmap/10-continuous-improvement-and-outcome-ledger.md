# Stage 10 — Continuous Improvement Loop and Outcome Ledger

## Metadata
- **Stage ID:** RM-10
- **Horizon:** Long-term platform expansion
- **Status:** proposed
- **Prerequisites:** RM-02 through RM-09; repeat assessments and completed interventions with outcome data

## Objective

Turn completed assessments and approved interventions into a continuous, measurable learning loop for each customer product without rewriting history or overstating causality.

## Customer and business value

Customers can see what changed, what it cost, what improved, what did not improve and what should happen next. Oxenn can improve its recommendations using validated outcomes rather than generated report volume.

## Scope

- Scheduled and event-triggered reassessment.
- Versioned baseline and benchmark history.
- Intervention and outcome ledger.
- Comparable before/after analysis.
- Recommendations based on repeat signals and calibrated evidence.
- Customer-controlled monitoring cadence and budgets.

## Detailed execution

1. Define the outcome ledger record: initial baseline, accepted intervention, action owner, start/end, actual cost, target metric, measurement method, observed result and limitations.
2. Preserve immutable assessment snapshots and scoring/model versions. A new run creates a new version rather than overwriting old data.
3. Allow customers to define monitoring cadence, source access, budget ceilings and notification preferences.
4. Schedule only supported, authorized data collection tasks with idempotency and bounded retry.
5. Detect material changes in digital representation, competitor offers, listing availability, complaint patterns or other supported signals.
6. Trigger a reassessment only when its cost/benefit and confidence justify it; avoid noisy alerts and uncontrolled provider usage.
7. Compare outcomes only when source, time window, sample and measurement method are sufficiently compatible.
8. Use controlled tests, matched comparisons or other valid approaches when causal attribution is needed. Otherwise label changes as observed associations.
9. Update recommendation confidence using actual success/failure evidence and keep customer-specific data isolated.
10. Allow customers to correct false facts and dispute interpretations.
11. Build periodic reports that show actions taken, spend, outcome, remaining uncertainty and next-best options.
12. Add privacy-preserving aggregate learnings only under an explicit and lawful data-use policy; default to no cross-customer training/redistribution without authorization.

## Target files and modules

- Assessment/report history modules from RM-02/RM-03.
- Action/outcome contracts from RM-04.
- Job scheduling and tenant quota infrastructure after baseline verification.
- Proposed module: `src/features/continuous-improvement/**`.
- Proposed UI: `src/app/[locale]/dashboard/products/[productId]/progress/**`.
- Existing observability and cost-control services where appropriate.

## Data and governance rules

Maintain provenance, retention and correction controls. Never mix mock/demo evidence into live outcome history. Do not infer causal effect from a simple before/after change when seasonality, campaigns, distribution or other factors could explain the result.

## Testing and acceptance

- Historical snapshots are immutable.
- Reassessment cadence respects tenant permissions and budgets.
- Repeated jobs are idempotent and do not duplicate billable work.
- Non-comparable runs are labelled and cannot produce misleading deltas.
- Customer data corrections and deletion requests propagate to derived records under policy.
- Outcome metrics preserve their method, sample and confidence.

## Parallelization

Outcome-ledger design, monitoring-cadence UX and job-cost analysis can be developed in parallel after the data contract is approved. Scheduler integration and assessment versioning should have one owner. Recommendation learning cannot proceed before outcome quality gates exist.

## Success indicators

Repeat assessment rate, action completion, verified outcome coverage, recommendation calibration, false-alert rate, cost per monitored product and customer retention.

## Risks and open decisions

Do not pursue autonomous continuous monitoring for every source at launch. Start with a small set of high-value changes and customer-selected cadence.
