# Component Design — Simulation & ROI Lab

**Page covered:** P17 Simulation & ROI Lab

## Composition
`ScenarioWorkspace → ScenarioLibrary + ScenarioBuilder → AssumptionEditor → CostResourcePanel → ImpactUncertaintyPanel → ScenarioComparison → ScenarioReviewSummary`

## Components
- **ScenarioLibrary:** saved scenarios, status, owner, product/market scope, last modified, and source baseline.
- **ScenarioBuilder:** intervention selection and ordered change definition.
- **AssumptionEditor:** assumption statement, value/range, source, owner, confidence, and sensitivity.
- **DependencyEditor:** prerequisites, sequencing, constraints, and shared resources.
- **CostResourcePanel:** estimated monetary cost, effort, roles, time horizon, and cost basis.
- **ImpactUncertaintyPanel:** potential benefit, risk/downside, uncertainty range, and model/method description.
- **ScenarioComparison:** side-by-side value, cost, risk, time, feasibility, and strategic alignment.
- **ScenarioReviewSummary:** assumptions, missing inputs, limitations, and proposed next step.

## Behavior
- Editing an assumption updates the scenario preview only; it does not execute an intervention.
- Scenario versions preserve their inputs and provenance.
- ROI and break-even values appear only when required inputs and formulas are defined.
- A scenario can be submitted for human review; approval is separate from simulation.

## States and safeguards
- Insufficient baseline: explain missing inputs and disable unsupported derived outputs.
- Incomplete assumptions: show ranges or unknowns rather than false precision.
- Illustrative scenario: persistent illustrative label on every output.
- Failed simulation: retain inputs and show a recoverable error.
- Never present a prediction as an observed result or guarantee.
