# BL-001 — Technical SEO dashboard reports synthetic crawl observations

## Metadata
- **Global order:** 2
- **Part:** 01 — Data Integrity and Customer Evidence
- **Priority:** P1 — MVP blocking
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Depends on:** BL-004
- **Blocks:** trustworthy Technical SEO reporting and the digital-assessment roadmap stage

## Exact problem

The current `getTechnicalSeoDashboardAction` does not build its report from a live crawl. It selects a hard-coded `secure-site.com` website for the tenant, creates that website if it does not exist, seeds two example pages when the page list is empty, and constructs the SEO observation object with `createMockPageSeoSignals`. The generated object includes fabricated HTTP status, robots/canonical information, sitemap, structured data, internal links and performance values. The performance section sets `isMeasured: true` even though the values are generated in application code.

The action then executes analysis and persists findings derived from those fabricated observations, returning a success-shaped result. A real customer can therefore receive and persist findings that are not observations of their authorized website.

This is not a harmless demo-only presentation: it is implemented inside the server action used by the dashboard and is not guarded by an explicit demo/test mode.

## Evidence

- `src/app/actions/technical-seo.ts:17` defines `createMockPageSeoSignals`.
- `src/app/actions/technical-seo.ts:169-181` looks up and creates the fixed `secure-site.com` website.
- `src/app/actions/technical-seo.ts:187-235` loads pages, inserts two canned pages when empty, then calls the mock signal builder for each page.
- `src/app/actions/technical-seo.ts:58,79,86` embeds the sample domain in sitemap and internal-link evidence.
- `tests/services/audit-engine/technical-seo-analyzer.test.ts` tests analyzer behavior using mock fixtures; it does not establish that the dashboard action obtains live observations.
- The current main CI run is green, but that run does not establish live crawl correctness for this action.

## Root cause

The dashboard action combines onboarding/demo seeding, data acquisition, analysis and persistence in one server-side path. There is no enforced boundary requiring a live crawl observation (or an explicitly labelled demo fixture) before the analyzer can produce a customer report.

## Target files

**Expected implementation targets; confirm exact module boundaries after BL-004 is resolved:**
- `src/app/actions/technical-seo.ts` — remove production use of sample site/page creation and synthetic signal generation.
- `src/features/acquisition/**` — use the existing bounded, SSRF-safe acquisition pipeline and its normalized observation contract.
- `src/features/ai-intelligence/repositories/index.ts` — persistence behavior for websites, pages and findings; coordinated with BL-004.
- Relevant Technical SEO dashboard components under `src/app/[locale]/dashboard/seo/technical/**` and related data hooks/actions — display explicit queued, running, partial, failed and completed states.
- `tests/**` — action-level integration tests and live-provider/crawler contract tests.

## Recommended remediation

1. Establish the canonical user flow: an authenticated user adds and verifies an authorized website/domain; the server creates a durable crawl job with tenant ownership and idempotency.
2. Route all outbound requests through the existing safe-fetch acquisition layer. Revalidate redirects and DNS, apply page/depth/byte/time/concurrency budgets, and persist actual page observations.
3. Create `SeoSignals` only from normalized fetched observations. Mark unknown/unmeasured fields as unavailable; never fill them with representative numbers or set `isMeasured` unless the measurement actually occurred.
4. Run deterministic analyzers against those observations and attach each finding to the exact page/crawl snapshot and analyzer version.
5. Keep demo data behind an explicit test/demo provider and visibly label it. Fail closed in the customer/live path when acquisition is unavailable; return partial/failed status rather than synthetic success.
6. Preserve existing analyzer unit tests, then add action-level integration coverage that asserts no crawl/no report, a successful real fixture-backed crawl, partial crawl, timeout, blocked redirect, retry and tenant-isolation behavior.

This approach reuses the current acquisition/security architecture rather than introducing a second crawler or bypassing existing controls.

## Dependencies and impacts

- **Hard dependency:** BL-004, because durable website/page reads and writes must be authoritative before the action can rely on them.
- The existing safe-fetch/SSRF controls must be preserved; no new direct `fetch` path should be introduced.
- UI states and report persistence may need coordinated changes.
- No production DB changes are implied; any schema change needs a separately reviewed migration plan.

## Parallelization assessment

**Conditionally parallelizable.**
- Analyzer-specific unit tests and report-state UX can be prepared in isolated files.
- The server action and website/page repository changes should not be implemented concurrently until the data-access contract from BL-004 is fixed.
- Acquisition integration can be developed against the existing public interfaces once their contracts are verified.
- Do not assign multiple workers to `technical-seo.ts` or shared repository files simultaneously. Integrate the provider, repository and action work in that order.

## Acceptance criteria

- No customer/live request creates `secure-site.com`, default sample pages or fabricated SEO observations.
- Every displayed measured field is traceable to an actual crawl observation with source URL, timestamp and status.
- Unavailable measurements are shown as unavailable, not imputed.
- Live provider/acquisition failure cannot produce a successful-looking synthetic report.
- Findings persist durably and survive a new process/runtime instance.
- Positive, negative, timeout, redirect/SSRF, partial-result and cross-tenant tests pass.

## Rollback and recovery

Retain old demo fixtures only in an explicit test/demo adapter. If the live acquisition path is unavailable during rollout, disable the customer audit entry point or return an explicit unavailable status; do not restore the synthetic production fallback.

## Verification record

- Source inspection at baseline commit: **verified**.
- Current CI: build, unit, UI and PostgreSQL isolation jobs pass on the baseline commit.
- Local execution in this audit environment: **not run**.
- Implementation and post-fix verification: pending.
