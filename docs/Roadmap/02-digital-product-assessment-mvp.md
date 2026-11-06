# Stage 02 — Digital Product Assessment MVP

## Metadata
- **Stage ID:** RM-02
- **Horizon:** Short-term MVP
- **Status:** proposed
- **Prerequisites:** RM-00 and RM-01; BL-001, BL-002 and BL-004 verified

## Objective

Deliver a truthful, evidence-backed assessment of where and how a product is represented and discovered digitally. The first release should combine a live technical/digital footprint assessment with a bounded, explicitly identified AI visibility observation.

## Customer and business value

A seller or manufacturer can see whether the product's own site, third-party pages, marketplace listings and supported AI answer surfaces present accurate, discoverable and persuasive product information—and receive a prioritized improvement plan.

## Scope

- Own/authorized website acquisition and technical SEO.
- Product information consistency across approved third-party sources.
- Product listing/content quality for a small supported set of marketplace/social sources.
- Buyer-intent prompt panel and named AI provider/surface observations.
- Digital Performance Baseline and context-specific Digital Presence Benchmark.
- Evidence-based recommendations and report history.

**Non-goals for the first release:** universal monitoring of every social network/AI product, guaranteed ranking/AI recommendation changes, autonomous publishing, or scraping that violates platform terms.

## Detailed execution

1. Select one pilot vertical and define the product attributes, audience, purchase questions and source types that matter for it.
2. Create a source inventory per product: official site/pages, authorized marketplace listings, review pages, social storefront/profile and customer-provided exports.
3. Reuse the safe acquisition pipeline for URLs. Each target and redirect must pass the existing SSRF/DNS/IP/size/time policy. Sources that cannot be fetched lawfully or safely are marked unavailable and can be reviewed manually.
4. Integrate Technical SEO analysis with persisted crawl jobs, real page snapshots and findings. Each score must point to exact fetched evidence and analyzer version.
5. Build product-page consistency checks: name, attributes, price, availability, imagery metadata, claims and canonical identifiers across the sources actually observed.
6. Define a versioned buyer-intent prompt set per category, locale and question intent. Store the exact prompt set used.
7. Require explicit provider and exact target surface. Record whether a result came from a raw model API or a public answer/search product; do not conflate them.
8. Store raw/normalized response evidence, model/provider/surface, timestamp, locale, execution status, citations and usage/cost. Do not silently substitute mock responses.
9. Calculate deterministic visibility/coverage metrics from successful observations only. Show coverage, unavailable checks, uncertainty and score version.
10. Build a report that compares current measurements to a defined benchmark cohort/standard. Keep measured baseline distinct from the benchmark target and from recommendations.
11. Generate prioritized actions with evidence links and expected outcome hypotheses. A recommendation is not a measured result.
12. Add repeat assessment and compatible before/after comparisons.

## Target files and modules

**Existing modules to verify/reuse after baseline:**
- `src/features/acquisition/**` — safe fetch, crawl jobs and normalized observations.
- `src/services/technical-seo-analyzer.ts` and associated deterministic analyzer modules.
- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`
- `src/services/ai/ai-visibility-provider.ts`
- Current report/repository contracts after BL-004.
- Current Technical SEO and AEO/AI Visibility routes and actions under `src/app/**`.

**Proposed new paths if no suitable modules exist:**
- `src/features/product-assessment/domain/**`
- `src/features/product-assessment/application/**`
- `src/features/product-assessment/infrastructure/**`
- `src/app/[locale]/dashboard/products/[productId]/digital-assessment/**`

## Data and evidence rules

Persist each acquisition and response as a versioned observation. Distinguish observed, customer-supplied, estimated, inferred and simulated values. Preserve source URL, time, geography, locale, sample/coverage and methodology. Avoid claiming that a single API's output represents every public ChatGPT/Gemini/Perplexity surface.

## Security and operational constraints

Use approved credentials and platform APIs/terms. Rate-limit by tenant and provider, enforce cost budgets, apply idempotency and bounded retries, redact secrets and sensitive data, and preserve user authorization to assess domains/accounts.

## Testing and acceptance

- Live audit reports use actual fetched observations; demo/test provider paths are visibly distinct.
- Missing provider, crawler timeout, blocked redirect, rate limit and partial source coverage cannot produce a misleading complete report.
- Every metric links to source evidence and analyzer/scoring version.
- Product data is tenant-isolated and durable.
- Two runs can be compared only when their source/prompt/scoring versions are compatible.
- Persian and English prompt/report rendering is validated.

## Parallelization

Technical acquisition, prompt-set design and report UX can be developed as workstreams once shared evidence and scoring contracts are approved. Do not parallelize provider registry, execution engine and audit action changes without one integration owner.

## Success indicators

Onboarding-to-first-assessment completion, successful source coverage, evidence traceability, report time/cost, repeat assessment rate, recommended-action acceptance and observed digital improvement after interventions.

## Risks and open decisions

Validate available AI provider surfaces and social/marketplace access before promising coverage. Decide how to benchmark a product where no comparable peer cohort exists; provide a transparent minimum reference rather than fabricating a universal score.
