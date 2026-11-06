# Stage 06 — Geo-Market and Digital Shelf Intelligence

## Metadata
- **Stage ID:** RM-06
- **Horizon:** Long-term expansion
- **Status:** proposed
- **Prerequisites:** RM-05; stable product/evidence model and validated customer demand

## Objective

Extend product assessment from a small set of online pages to a geography-aware view of where the product is visible, available, priced, represented and distributed.

## Customer and business value

A manufacturer or seller can identify regions and channels where product demand, visibility or availability appear misaligned. It can prioritize areas where distribution, stock, listing quality or local marketing may be limiting commercial performance.

## Scope

- City/region/territory dimensions for competitor, price, availability and distribution signals.
- Digital shelf/listing quality across supported marketplaces and seller channels.
- Regional consistency and presence monitoring.
- Maps/territory summaries where evidence is sufficient.
- Opportunity prioritization and evidence coverage.

## Detailed execution

1. Select one vertical and define the geographic resolution that its data can reliably support.
2. Define standardized location identifiers, source geography, capture time and confidence; distinguish a seller address from a product's delivery/service coverage.
3. Establish source adapters for approved marketplace, public listing, distributor and customer-supplied feeds. Record API/terms restrictions and refresh cadence.
4. Normalize listing identity to canonical product/SKU, seller, location, price/unit, stock/availability, delivery terms and listing attributes.
5. Detect inconsistent product names/specifications/images/claims across channels and regions.
6. Build regional competitor and substitute maps from verified seller/listing/product observations; do not infer total market share from a partial listing sample.
7. Ingest stock, retail/POS or distribution exports only when provided under customer authorization and appropriate data handling.
8. Calculate coverage and freshness alongside every regional score; explicitly show where no reliable source exists.
9. Build filters and maps for territory, source, date, competitor and customer segment.
10. Generate recommended regions/channels for manual validation before any campaign or distribution change.
11. Measure regional outcomes after approved interventions, including sales/availability only where the customer supplies reliable data.

## Target files and modules

- Acquisition adapters under `src/features/acquisition/**`.
- Product and evidence domains introduced in RM-01–RM-03.
- Proposed modules: `src/features/geo-market-intelligence/**` and `src/features/digital-shelf/**`.
- Proposed dashboard areas: `src/app/[locale]/dashboard/market/**` and `src/app/[locale]/dashboard/products/[productId]/digital-shelf/**`.
- Existing visualization and reporting components only after verifying their accessibility and evidence contracts.

## Data, security and operational considerations

Location data can reveal commercial strategy. Restrict it by tenant and role, minimize sensitive store/customer detail, preserve source permissions and avoid exposing one distributor's feed to another tenant. Use time-bounded observations and cost-aware refresh schedules.

## Testing and acceptance

- Regional comparison requires consistent location, time and unit basis.
- No map or metric implies full market coverage when only sample sources are available.
- Listing-to-SKU matching has reviewed precision.
- Customer-provided distribution data stays tenant-isolated.
- Stale or missing data is visible.
- Regional interventions can be tied to a comparable outcome period.

## Parallelization

Digital shelf adapters and geo normalization can be separate workstreams after canonical product identity and location contracts are fixed. Mapping/visualization can proceed in parallel against a stable API. Avoid separate definitions of city, region or seller territory in different modules.

## Success indicators

Regional source coverage, listing consistency, price/stock freshness, competitor-match accuracy, actionable distribution gaps and improvement in customer-measured regional availability/conversion.

## Risks and open decisions

The availability and legality of geographic data sources varies by marketplace and region. Avoid expensive continuous collection before customers demonstrate willingness to pay for it.
