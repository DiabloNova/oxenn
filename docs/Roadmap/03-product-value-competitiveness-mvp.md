# Stage 03 — Product Value and Competitiveness Assessment MVP

## Metadata
- **Stage ID:** RM-03
- **Horizon:** Short-term MVP
- **Status:** proposed
- **Prerequisites:** RM-00 and RM-01; approved pilot vertical; product profile and evidence registry available

## Objective

Assess why a product wins or loses against direct and substitute alternatives in its actual target market, using comparable and traceable information rather than generic competitor lists.

## Customer and business value

A product owner can understand its relative position on price, specifications, availability, presentation, customer experience and documented quality/distribution signals. The output should identify improvement opportunities and missing evidence, not just produce a comparison chart.

## Scope

- Direct and substitute product discovery for one selected category/vertical.
- Comparison by target geography, audience and use case.
- Comparison of product attributes, price, packages, availability and distribution evidence where accessible.
- Customer review/complaint analysis with source and sample disclosure.
- Customer-provided returns, defect, warranty and service data where consented.
- Evidence-based issue hypotheses and improvement opportunities.

**Non-goals:** asserting laboratory-grade quality from images/reviews, claiming complete market share from public listings, or treating missing public information as proof of competitor weakness.

## Detailed execution

1. Define category taxonomy, matching attributes, substitute rules and disambiguation rules for the chosen vertical.
2. Determine the market and geography for each assessment: city/region, sales territory, target audience, channels and relevant time window.
3. Discover competitor candidates from permitted sources, customer inputs and validated product identifiers; classify direct, indirect and substitute options.
4. Normalize product names, SKU/model, package size, technical specifications, price, currency/unit, offers, delivery cost, availability and source date.
5. Define comparability rules. Do not compare unlike pack sizes, variants or tax/price bases without normalization and an explicit explanation.
6. Ingest reviews, comments, complaints and Q&A only from sources and methods permitted by law/platform terms. Preserve original text references and deduplicate repeated/reposted evidence.
7. Ingest customer-provided internal signals such as returns, complaints, warranty claims, sales and stock exports with consent, minimization and a defined retention policy.
8. Build issue categories relevant to the vertical: quality, usability, packaging, delivery, service, availability, value perception and product-information mismatch.
9. Produce an evidence map: each claim, signal and competitor comparison links to sources, date, geography, sample, method and confidence.
10. Present customer-facing comparisons with “observed / customer-supplied / estimate / hypothesis / missing data” labels.
11. Generate opportunity candidates and identify what additional field/lab evidence is needed before physical-quality claims are made.

## Target files and modules

**Existing modules to verify/reuse:**
- `src/features/ai-intelligence/services/competitive-*.ts`
- `src/features/ai-intelligence/services/competitor-discovery-service.ts`
- Existing data-acquisition and safe crawling modules under `src/features/acquisition/**`.
- Existing product/brand/competitor repositories after BL-004.
- Current dashboard/report patterns under `src/app/[locale]/dashboard/**`.

**Proposed new paths if required:**
- `src/features/product-competitiveness/domain/**`
- `src/features/product-competitiveness/application/**`
- `src/features/product-competitiveness/infrastructure/**`
- `src/app/[locale]/dashboard/products/[productId]/competitiveness/**`

## Evidence and privacy constraints

Customer-provided data may include commercially sensitive and personal information. Minimize imported fields, record purpose/consent, isolate tenant data, restrict staff access and provide retention/deletion controls. Public review sampling must disclose source and methodology; do not present it as a complete census.

## Testing and acceptance

- Product matching handles variants, pack size, duplicate names and ambiguous products.
- Price comparisons use consistent units and time/region basis.
- Review analysis includes source, sample size, date and confidence.
- No physical quality rating is generated without the defined supporting evidence type.
- Missing/blocked source data is represented as a coverage limitation.
- Customer internal data is inaccessible to another tenant.
- A reviewer can trace every material comparison to its source evidence.

## Parallelization

Vertical taxonomy, evidence-source inventory and UI prototype can proceed separately. Data normalization, matching logic and scoring share contracts and should be integrated by one owner. Customer-data import and public-source acquisition may be separate workstreams after privacy and evidence contracts are frozen.

## Success indicators

Percentage of assessed products with sufficient comparable evidence, competitor-match precision on a reviewed sample, evidence completeness, issues confirmed by customers, customer acceptance of opportunities and time/cost per product assessment.

## Risks and open decisions

Public data coverage varies by category and region. The pilot must choose the narrowest vertical with sufficient sources and customer access. For physical quality and packaging, determine which claims require qualified experts, laboratory results or field tests.
