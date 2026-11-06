# Component Design — Product Intelligence Profile and Product Catalog

**Pages covered:** P02 Product Intelligence Profile; P03 Products & Services

## P02 — Product Intelligence Profile

### Composition
`ProfileHeader → ProfileReadiness → ProfileSectionNav → ProfileSection → FieldEvidenceInspector → ProfileVersionHistory → AIInterpretationReview`

### Components
- **ProfileHeader:** product name, type/category, official digital properties, profile state, current version. Actions: edit profile, view history.
- **ProfileReadiness:** required/optional fields grouped by completeness and validation. Never invent a percentage; show counts and missing field names.
- **ProfileSectionNav:** Identity; Business Context; Value Proposition; Audience; Markets & Languages; Objectives & Constraints; Competitors; Data & Evidence.
- **ProfileSection:** typed fields with source label, validation state, and edit affordance. Distinguish user-provided, imported, inferred, and confirmed data.
- **FieldEvidenceInspector:** source URL/reference, timestamp, scope, confidence, freshness, and reviewer notes.
- **ProfileVersionHistory:** chronological versions and field-level changes; read-only unless existing version controls support editing.
- **AIInterpretationReview:** proposed interpretation with supporting evidence and explicit accept/reject/edit actions. No silent persistence or approval.

### States and behavior
- First-use profile: explain what information enables better analysis and allow progressive completion.
- Partial profile: show what is missing and which workflows are affected.
- Invalid/conflicting field: preserve both source claims and request review.
- AI proposal: clearly separate from canonical profile data.
- Access restricted: read-only or hidden editing controls based on existing authorization.

## P03 — Products & Services

### Composition
`CatalogHeader → CatalogFilters → ProductCatalogTable/ProductCardGrid → ProductDetailPanel → AddProductForm`

- **CatalogFilters:** search, type, category, market, status, owner; filters are local UI state unless existing route behavior supports URL state.
- **ProductCatalogTable/ProductCardGrid:** product/service identity, category, markets, profile state, latest assessment only when available.
- **ProductDetailPanel:** summary, linked services/sub-products, markets, latest verified activity.
- **AddProductForm:** progressive form for product identity and business context; client validation must mirror existing domain validation, not create new backend assumptions.
- **EmptyCatalogState:** explains first product creation and links to supported onboarding.

## Shared rules
- Product scope must remain explicit.
- No seeded example may appear as a user's real product.
- Support keyboard table navigation, labelled inputs, error summaries, and mobile card layout.
- Persian and English field labels must preserve mixed Latin/Persian product names.
