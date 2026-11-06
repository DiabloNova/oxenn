# Stage 11 — International Market and Product Expansion

## Metadata
- **Stage ID:** RM-11
- **Horizon:** Long-term, post-Iran validation
- **Status:** proposed
- **Prerequisites:** RM-05 and repeated successful customer outcomes in Iran; market-specific legal, data and commercial validation

## Objective

Expand Oxenn beyond Iran only after the core product, economics and evidence model are proven, adapting the offering to each market instead of translating the Iranian product unchanged.

## Customer and business value

The platform can serve product brands and sellers in additional countries with relevant local data, languages, marketplaces, AI answer surfaces, price/currency conventions and expert networks.

## Scope

- Market selection and local buyer validation.
- Local source/provider integrations.
- Localization and currency/tax support.
- Country-specific evidence and benchmark models.
- Legal, privacy, platform and data-residency review.
- Local execution partners where needed.

## Detailed execution

1. Select a candidate country using buyer demand, competitive intensity, data availability, service cost, willingness-to-pay and legal feasibility.
2. Interview target buyers and secure paid design partners before committing engineering capacity.
3. Map local marketplaces, social channels, search engines, AI answer surfaces, price sources, reviews and regulatory/quality data.
4. Validate which source integrations are permitted and reliable; do not port scraping or data-retention assumptions from Iran without review.
5. Define locale, language, currency, timezone, address, geography and unit-of-measure support without hard-coded country-specific assumptions.
6. Create local benchmark cohorts and scoring rules based on relevant market conditions.
7. Qualify local experts, laboratories and field-service partners where the model requires physical validation.
8. Review privacy, consumer, advertising, competition, product safety, data export/residency and payment obligations with qualified local advisors.
9. Adapt packaging/pricing and customer support to local willingness-to-pay and cost-to-serve.
10. Run limited paid pilots, compare with the Iran baseline and document which workflows transfer versus require redesign.
11. Roll out one market at a time with market-specific monitoring, support and rollback.
12. Keep unsupported countries/markets disabled rather than presenting global coverage that does not exist.

## Target files and modules

- Localization and routing infrastructure: `src/app/[locale]/**` and shared locale configuration.
- Product/source/evidence adapters from RM-01–RM-10.
- Currency, market and locale-aware domain modules (add only after requirements are known).
- Country-specific integration/benchmark packages, preferably isolated behind adapter contracts.
- Legal, privacy, retention and security documentation for each supported market.

## Data, security and operations

Apply market-specific data-processing rules, location, retention, transfer and access requirements. Keep customer tenancy isolated across all regions. A single global DB is not assumed; deployment/data residency topology must follow validated legal and operational requirements.

## Testing and acceptance

- A new market has its own validated source/provider matrix and coverage statement.
- Locale/currency/timezone and geography behavior is correct in supported flows.
- No unsupported integration is exposed as active.
- Market-specific privacy/security and operational checks are signed off.
- Paid pilots establish customer value and cost-to-serve before broad release.

## Parallelization

Market research for multiple candidate countries can run in parallel. A selected-country data/legal validation and product adaptation should be one scoped workstream. Do not begin multiple country integrations concurrently before architecture and partner capacity are proven.

## Success indicators

Paid conversion and retention in each market, assessment coverage, data acquisition reliability, outcome improvements, customer support cost and gross margin after local data/expert costs.

## Risks and open decisions

Internationalization is not synonymous with interface translation. Local data access, AI availability, legal obligations, customer expectations and execution partners can fundamentally change the offer. Expand only on evidence.
