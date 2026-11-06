# Component Design — Product Evidence Graph

**Page covered:** P16 Product Evidence Graph

## Composition
`EvidenceGraphHeader → GraphFilters → GraphAndListWorkspace → GraphCanvas + EntityList → SelectedEntityInspector → ProvenanceTimeline → RelatedWorkPanel`

## Components
- **GraphFilters:** entity type, relationship type, product, market, date range, confidence, source.
- **GraphCanvas:** interactive node-edge visualization with pan/zoom, selection, and relationship highlighting.
- **EntityList:** searchable accessible alternative to the canvas; displays the same graph entities and relationships.
- **RelationshipLegend:** explains edge semantics such as supports, contradicts, belongs-to, competes-with, contributes-to, and produces.
- **SelectedEntityInspector:** selected entity/claim/observation details, scope, status, confidence, and linked records.
- **ProvenanceTimeline:** source, collection time, transformation/method, and subsequent validation events.
- **RelatedWorkPanel:** linked findings, recommendations, scenarios, decisions, initiatives, tasks, executions, and outcomes.
- **GraphEmptyState:** explains how evidence is added through supported product workflows without suggesting new connectors are already configured.

## Interactions
- Select a node to inspect it; select an edge to inspect the relationship and its evidence.
- Navigate from a finding to supporting and contradicting evidence.
- Preserve filter state when switching between graph and list.
- Provide zoom reset, keyboard node navigation, and an accessible selected-node summary.

## Integrity rules
- A graph visualization is not proof of source validity.
- Distinguish source facts, third-party claims, inferred relationships, and hypotheses.
- Never fabricate nodes, citations, edge weights, or timestamps.
- Large graphs require progressive rendering and a bounded initial view; do not silently omit entities without indicating filters/limits.
