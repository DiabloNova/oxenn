# Stage 08 — Scenario Simulation and ROI Lab

## Metadata
- **Stage ID:** RM-08
- **Horizon:** Long-term expansion
- **Status:** proposed
- **Prerequisites:** RM-04 and RM-07; reliable baseline, intervention and actual-cost/outcome records

## Objective

Evaluate alternative product, packaging, price, supplier, marketing, channel and distribution changes before the customer commits resources, with explicit assumptions, ranges and uncertainty.

## Customer and business value

The customer can compare the likely cost, benefit, risk, break-even and payback of alternative remedies and select an action based on evidence rather than intuition alone.

## Scope

- Versioned scenario inputs and model assumptions.
- Baseline and alternative intervention comparisons.
- Cost/benefit ranges, sensitivity and break-even.
- Historical calibration from measured outcomes.
- Scenario review and approval.

**Non-goals:** guaranteed revenue forecasts, causal claims without appropriate design, or autonomous procurement/financial commitment.

## Detailed execution

1. Define a scenario schema: baseline conditions, intervention(s), constraints, time horizon, geography, affected SKUs/channels, cost items and success metrics.
2. Separate known customer inputs, externally observed values, assumptions, estimates and model-derived predictions.
3. Build vertical-specific calculation modules for simple auditable cases first (e.g. packaging loss reduction, price/unit economics, campaign cost, distribution expansion).
4. Include implementation cost, recurring cost, one-time cost, internal labor, partner fees, taxes/currency/date and likely operational disruption.
5. Model outcomes as ranges or scenarios (conservative/base/upside) with confidence and sensitivity to key inputs.
6. Calculate break-even and payback only when the underlying inputs support the calculation; explain excluded costs.
7. Compare multiple mutually exclusive and combined interventions while exposing dependencies and double counting.
8. Add Monte Carlo or more advanced simulation only when input distributions have enough defensible evidence; otherwise prefer transparent deterministic sensitivity analysis.
9. Calibrate model parameters against customer-reported and independently validated outcome records.
10. Track prediction versus actual outcome to evaluate error and drift by vertical.
11. Present simulations as decision support, not promises. Require customer approval for the chosen plan.
12. Retain the exact model version, input snapshot and assumptions used for every proposal.

## Target files and modules

- Plan/action/outcome contracts from RM-04.
- Root-cause and field evidence from RM-07.
- Proposed module: `src/features/scenario-simulation/**`.
- Proposed UI: `src/app/[locale]/dashboard/products/[productId]/scenarios/**`.
- Shared finance/cost normalization utilities only if already validated; avoid duplicating billing and cost-control logic.

## Data, financial and operational controls

Currency and inflation make estimates time-sensitive in Iran. Store original currency, conversion basis/rate/date where used, price observation date and scenario horizon. Restrict customer financial inputs by role. Do not use one customer's confidential margin, cost or sales data to train another customer's model without explicit lawful permission.

## Testing and acceptance

- Calculations are deterministic for identical versioned inputs.
- Unit, boundary, sensitivity and property-based tests cover formulas.
- Missing or stale inputs reduce confidence and are clearly displayed.
- Double-counting and mutually exclusive interventions are handled.
- Prediction errors are measured against actual outcomes.
- No scenario is presented as guaranteed ROI.

## Parallelization

Independent vertical calculation modules can be developed in parallel after the shared scenario schema and validation rules are fixed. Model calibration, output explanations and financial UI must use the same model version and cannot be independently redefined.

## Success indicators

Prediction error by scenario type, customer acceptance rate, actual-versus-estimated cost, break-even accuracy, realized savings/benefits and decision time compared with manual analysis.

## Risks and open decisions

Begin with small auditable calculators. Complex causal or probabilistic models should be added only when sufficient historical outcome data and qualified domain review exist.
