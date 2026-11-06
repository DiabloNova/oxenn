# Component Design — Geo-Market Intelligence

**Page covered:** P15 Geo-Market Intelligence

## Composition
`MarketScopeHeader → GeographyHierarchy → MarketOverview → LocalCompetitorPanel → RegionalDigitalPresence → LanguageConsistencyPanel → MarketComparison → OpportunityRiskList`

## Components
- **MarketScopeHeader:** product, selected country/region/city, target audience, language, measurement window.
- **GeographyHierarchy:** navigable country → region → city hierarchy. A map is optional and never the only navigation method.
- **MarketOverview:** market context facts with source, time, methodology, and coverage. Unknown demand metrics remain unavailable.
- **LocalCompetitorPanel:** local competitor set, relationship type, selection rationale, and evidence.
- **RegionalDigitalPresence:** SEO/AEO/GEO observations scoped to the selected market and language.
- **LanguageConsistencyPanel:** product/entity/message consistency across language variants, with source comparisons.
- **MarketComparison:** comparable market matrix with explicit normalization and comparability notes.
- **OpportunityRiskList:** market entry/expansion hypotheses with supporting evidence, confidence, risk, and dependencies.

## Interactions
- Change geography and language without losing product context.
- Compare two or more markets only when the measures are comparable.
- Open a regional finding and navigate to its source evidence.
- Add an opportunity to a proposed scenario or initiative only where supported.

## States and rules
- No target markets defined: guide the user to profile setup.
- Market evidence missing: show unknown, not zero.
- Partial geographic coverage: mark unobserved regions explicitly.
- Illustrative market examples must be labelled and must not look like sourced market intelligence.
- Avoid implying legal/regulatory assessment unless a verified source and method exist.

## Accessibility
- Geography hierarchy supports keyboard tree navigation.
- Map markers have text list alternatives.
- Charts identify geography and time period in accessible labels.
- RTL layout uses logical properties; region names are not directionally reversed.
