# Component Design — Digital Product Assessment

**Pages covered:** P04 Assessment Overview; P05 SEO; P06 AEO; P07 GEO; P08 Technical & Digital Infrastructure; P09 Baseline & Benchmark

## Shared assessment components

- **AssessmentScopeBar:** product, digital property, geography, language, time window, assessment run. Displays selected scope and whether the run is comparable.
- **AssessmentCoverage:** dimension coverage states: assessed, partial, unavailable, not assessed, failed. Never infer zero from missing coverage.
- **BaselineMetric:** measured value, unit, timestamp, source, methodology, comparison, confidence, freshness.
- **FindingList:** severity, impact, confidence, status, affected scope, evidence count; supports filters and sort.
- **FindingDetail:** observation, affected URL/entity, source evidence, collection time, method, severity, confidence, hypothesis, recommendation.
- **AssessmentHistory:** run list with status and scope comparison guard.
- **SourceEvidenceDrawer:** provenance, citations, source type, sample size, and limitations.
- **RecommendationLink:** connects a finding to a proposed initiative without implying execution.

## P04 — Assessment Overview composition
`AssessmentScopeBar → AssessmentCoverage → DigitalBaselineSummary → DimensionOverviewGrid → FindingList → AssessmentHistory`

Dimension cards link to SEO, AEO, GEO, and technical assessment pages. The overview must not create an unsupported composite score.

## P05 — SEO Assessment composition
`AssessmentScopeBar → TechnicalHealthPanel → CrawlIndexCoverage → SearchIntentCoverage → ContentArchitecturePanel → MetadataSchemaPanel → AuthoritySignalsPanel → FindingList`
- Show URL/page-level evidence only when a source actually returned it.
- Search volumes, rankings, backlinks, and trends require provenance and measurement window.

## P06 — AEO Assessment composition
`AssessmentScopeBar → QuestionCoverageMatrix → AnswerQualityPanel → ExtractabilityPanel → EntityConsistencyPanel → CredibilityEvidencePanel → FindingList`
- Question examples must be identified as sampled, user-provided, generated, or actually executed.
- Do not imply external query execution from a static question list.

## P07 — GEO Assessment composition
`AssessmentScopeBar → SurfaceRunMetadata → RepresentationAccuracyPanel → CitationVisibilityPanel → CompetitorResponseComparison → ObservationTranscript → FindingList`
- Record model/surface, prompt, locale, geography, timestamp, and observable response.
- Do not claim access to hidden model reasoning.

## P08 — Technical & Digital Infrastructure composition
`AssessmentScopeBar → InfrastructureCoverage → RenderingAndCrawlPanel → PerformancePanel → SecuritySignalsPanel → SchemaDeliveryPanel → TechnicalFindingList`
- Distinguish passive observation from active security testing.
- Never display certification or scan results that were not executed.

## P09 — Baseline & Benchmark composition
`BaselineDefinition → BenchmarkDefinition → BaselineBenchmarkMatrix → GapMagnitudePanel → GapEvidenceCoverage → MethodologyInspector`
- Each comparison dimension shows baseline, reference, gap, direction, and confidence.
- Cohort/source/methodology must be disclosed; incomparable values remain incomparable.

## Shared states and accessibility
- Loading, no assessments, partial coverage, stale source, failed run, permission-limited, and illustrative fixture states.
- Use table/list alternatives for dense matrices; charts need accessible summaries and keyboard-readable data.
- All scope filters are labelled and announced when changed.
- Avoid false precision; confidence, severity, and impact remain separate fields.
