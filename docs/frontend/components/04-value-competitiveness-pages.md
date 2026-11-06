# Component Design — Product Value & Competitiveness

**Pages covered:** P10 Product Value & Competitiveness Overview; P11 Competitive Landscape; P12 Product Comparison; P13 Differentiation & Value Proposition; P14 Findings & Root-Cause Diagnosis

## Shared components
- **MarketCompetitorScope:** selected product, category, market, geography, channel, and competitor set.
- **CompetitorEvidenceCard:** competitor identity, direct/indirect/substitute relation, source, observed date, coverage, confidence.
- **ComparisonDimensionGroup:** grouped comparable attributes with explicit units and definitions.
- **EvidenceCell:** value/claim, source, date, confidence, comparability flag, missing-data state.
- **RootCauseHypothesis:** proposed cause, supporting evidence, contradicting evidence, confidence, validation status.
- **OpportunityCard:** customer need, product gap, potential value, feasibility, risk, evidence, and linked scenario.
- **ValuePropositionCanvas:** target audience, problem/need, product promise, differentiators, proof points, and unresolved claims.

## P10 — Product Value overview
`MarketCompetitorScope → CompetitorCoverage → ValuePositionSummary → CustomerSignalPanel → DifferentiationSummary → FindingsAndOpportunities`
- Separate digital visibility from product value/competitiveness.
- Quality claims require appropriate evidence; online imagery or sentiment alone is insufficient.

## P11 — Competitive Landscape
`MarketCompetitorScope → CompetitorSetRationale → CompetitorTable → CompetitorProfileDrawer → PositioningMap/Table → ChangeHistory`
- Selection rationale must be inspectable.
- Do not show market share or rank unless measured from a disclosed source.

## P12 — Product Comparison
`ComparisonSelector → ComparisonDimensionGroup[] → EvidenceCell[] → MissingDataSummary → DifferentiationOpportunityList`
- Show units and method per dimension.
- Never fill missing competitor values with estimates without an explicit estimate label.

## P13 — Differentiation & Value Proposition
`ValuePropositionCanvas → AudienceNeedMap → CompetitorPositionContrast → ProofPointList → DifferentiationHypothesisList`
- Make evidence gaps visible.
- User edits and AI suggestions must remain distinct.

## P14 — Findings & Root-Cause Diagnosis
`FindingsFilterBar → FindingsQueue → FindingDetail → RootCauseHypothesis[] → EvidenceForAgainst → LinkedActions`
- A finding is not automatically a verified root cause.
- Allow users to challenge or validate hypotheses; preserve the evidence trail.

## Responsive/accessibility
- Wide comparison tables become labelled stacked dimension groups on mobile.
- Competitor colors are not the sole way to identify a series.
- Evidence drawers have focus management and escape-to-close behavior.
- All claims and values expose text equivalents and provenance.
