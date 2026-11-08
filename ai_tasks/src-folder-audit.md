
# src Folder Audit

- **Repository:** DiabloNova/oxenn
- **Branch:** docs/product-roadmap-baseline-2026-11
- **Audited tree commit:** c38a3e75802ec11f19c2c5aee4cd2dd932848912
- **Audit date:** 2026-11-07
- **Scope:** Complete recursive contents of src/ only
- **Inventory:** 346 tracked files (345 text/source files and one binary icon asset); complete Git tree, not truncated.
- **Method:** Retrieved every tracked blob, performed static review of critical execution paths and cross-reference scans across the complete source corpus. No build, test, lint, database, migration, deployment, or production operation was run.

## 1. Executive summary

The source tree contains a mix of substantial, well-structured foundations and product paths that are still mock/demo implementations. The most consequential issues concern the legacy audit engine's SSRF protection, privileged database access, tenant-table enforcement, PostgreSQL repository read paths, sample-data mutation, crawler resource limits, and missing database functions required by the crawl worker.

The newer acquisition fetch stack and safe-site-crawler have materially stronger SSRF and response-budget controls than the older audit engine. Those protections are not consistently used by every route.

## 2. Findings

### SRC-001 — Legacy authenticated audit engine has an incomplete SSRF boundary
- **Severity:** P1 — security
- **Confidence:** Confirmed.
- **Evidence:**
  - src/app/api/v1/audit/engine/route.ts:14-45 accepts a caller-supplied URL and invokes the legacy executeAudit path for an authenticated workspace request.
  - src/lib/audit-engine/url-validator.ts:13-61 checks URL syntax, selected host strings and direct IP patterns, but does not resolve the hostname and pin the connection to validated public addresses.
  - src/lib/audit-engine/crawler.ts:32-100 uses ordinary fetch; redirect checks reuse the same hostname-only validator rather than DNS-pinned fetching.
  - src/lib/audit-engine/extractor.ts:31-80 and src/lib/audit-engine/seo-extractor.ts:45-80 use default redirect-following fetches for robots/sitemap resources, without validating each redirect destination. The sitemap response is read with res.text() without a response-size ceiling.
  - In crawler.ts, the request timeout is cleared after response headers arrive, before the body stream is fully consumed; the body-read loop therefore has no equivalent end-to-end deadline.
- **Impact:** A signed-in user can supply a hostname whose DNS answer changes to a private address, or a public URL that redirects to an internal destination, and cause the application server to make a request outside the intended public-web boundary. Slow or oversized sitemap/body responses can also hold resources beyond the apparent header timeout.
- **Recommended direction:** Route every user-controlled fetch through the DNS-pinned safeFetch/fetchPublicUrl implementation, revalidate every redirect hop, enforce allowed ports/content types and total body/time budgets, and remove the legacy fetch path or make it delegate to the hardened crawler.
- **Cross-check:** The newer src/services/crawler/safe-site-crawler.ts and acquisition safe-fetcher.ts already implement stronger DNS/redirect/body controls; the legacy /audit/engine route does not use them.

### SRC-002 — Privileged database path registry is metadata, not an enforced allowlist
- **Severity:** P1 — security boundary
- **Confidence:** Confirmed.
- **Evidence:** src/core/database/privileged-paths.ts defines callerModule and allowedTables for each privileged purpose. TenantContextManager.runWithSystemContext in src/core/database/tenant-context/index.ts:181-215 checks only that the purpose key exists, then obtains a system client; it does not verify the calling module or restrict SQL to the purpose's allowedTables. connectSystemClient in src/features/admin/infrastructure/persistence/postgres/index.ts:89-108 only checks that the current context is system mode.
- **Impact:** Any server-side module able to call runWithSystemContext can select a registered purpose and issue queries against tables outside the purpose's declared scope. The registry therefore does not provide the least-privilege boundary its shape implies.
- **Recommended direction:** Enforce caller identity and table-level capabilities at the privileged query boundary, or replace generic system SQL access with narrowly scoped repository methods. Do not treat TypeScript purpose tags as runtime authorization.

### SRC-003 — Runtime tenant-query detection omits five tenant-owned junction tables
- **Severity:** P2 — tenant-isolation defense in depth
- **Confidence:** Confirmed; no direct cross-tenant exploit was demonstrated in the callsites reviewed.
- **Evidence:** src/core/database/tenant-tables.generated.ts omits pages_keywords, pages_topics, pages_entities, keywords_topics, and topics_entities. isQueryTenantScoped in src/core/database/tenant-context/index.ts derives its decision from that generated list, and PostgresClient.query uses that decision to determine whether a tenant context is mandatory.
- **Impact:** Raw SQL referencing one of these tables is not recognized by the generic tenant-query guard. The database audit DB-001 also established that these organization-owned tables lack RLS policies. The repository consumers located in this source audit currently use tenant context and explicit organization predicates, so this finding records an incomplete generic enforcement boundary rather than a proven exploit through a current endpoint.
- **Recommended direction:** Maintain a tenant-owned-table inventory independently of the policy-bearing-table list; fail closed for every tenant-owned table and require RLS coverage before a table can be treated as global.
- **Cross-references:** DB-001, DOC-001, SCR-001.

### SRC-004 — PostgreSQL repository reads discard database rows and rely on process-local maps
- **Severity:** P1 — data correctness and persistence
- **Confidence:** Confirmed.
- **Evidence:**
  - src/features/ai-intelligence/repositories/index.ts:1990-2075 (WebsiteRepository) issues PostgreSQL reads but returns matches from the module-level in-memory db.websites map rather than mapping res.rows.
  - The PageRepository read methods around :2075-2155 follow the same pattern: execute SQL, then return the process-local map.
  - PostgresDiagnosticFindingRepository around :2880-2977 similarly does not hydrate returned database rows.
  - BrandRepository around :538-620 is entirely backed by the in-memory db.brands map; it does not read or write the PostgreSQL brands table.
- **Impact:** Existing persisted websites/pages/findings are invisible after a cold process or on another serverless instance. Callers can conclude that a tenant has no data and seed duplicate or synthetic records. Upsert operations can also retain an existing database ID while the in-memory map stores a newly generated, different ID. Brand state disappears when the process-local map is lost.
- **Recommended direction:** Map database result rows into domain entities and make PostgreSQL the source of truth. Keep in-memory repositories behind an explicit test/demo adapter, not as an unconditional production fallback.

### SRC-005 — Tenant-facing SEO/AEO/brand/citation actions create demo records as if they were tenant data
- **Severity:** P1 — product data integrity
- **Confidence:** Confirmed.
- **Evidence:**
  - src/app/actions/technical-seo.ts:168-264 creates the fixed secure-site.com website and sample pages when repository reads appear empty, feeds them through createMockPageSeoSignals, and persists diagnostic findings. The helper at :18-100 sets isMeasured: true on values that are explicitly generated as mock signals.
  - src/app/actions/aeo-content-intelligence.ts seeds sample pages; src/features/ai-intelligence/services/aeo-content-intelligence-service.ts constructs fixed sample page text (including the Rasha Gostar identity) and reports static confidence/provenance rather than analyzing fetched page content with a live model.
  - src/app/actions/brand-intelligence.ts creates the sample brand Rasha Gostar and fixed brand associations when a tenant has no in-memory brand.
  - src/app/actions/citation-intelligence.ts seeds fixed source domains and citation occurrences such as Wikipedia and a sample competitor.
  - src/app/actions/site-architecture.ts constructs sample pages and a synthetic link instead of deriving the graph from a real crawl.
- **Impact:** Empty workspaces can receive records and metrics that look like actual tenant SEO/AEO/brand/citation observations. In the technical SEO path, the records are saved through repository write methods; because the corresponding read methods ignore database rows (SRC-004), subsequent processes can repeat the seeding or overwrite existing page data with fixtures.
- **Recommended direction:** Remove automatic demo seeding from production actions. If sample mode is needed, expose it as an explicit, visibly labelled demo tenant/fixture mode that cannot write to real tenant tables. Never mark synthetic signals as measured.

### SRC-006 — Several audit/analysis endpoints return synthetic scores without disclosing mock mode
- **Severity:** P2 — product integrity
- **Confidence:** Confirmed.
- **Evidence:**
  - The landing-page FreeAuditPanel calls src/services/auditService.ts, which simulates progress with timers, chooses a score with Math.random, returns a fixed page count, and emits Firecrawl/Gemini-style progress messages without making those provider calls.
  - src/app/api/v1/analysis/competitive/route.ts validates that submitted URLs are public but does not fetch competitor page content; scores are derived from URL strings and the resulting analysis is persisted. analysisDepth is passed into a prompt but does not cause a crawl.
  - src/app/api/v1/optimization/technical/route.ts scrapes one URL, but reports pagesAnalyzed from the requested pagesToAnalyze value and generates performance metrics with Math.random; the response does not expose a mock-mode indicator.
  - src/app/api/v1/analytics/summary/route.ts returns hardcoded summary values rather than tenant aggregates.
  - src/app/api/v1/audit/premium/route.ts uses fixed industry/top-competitor comparison values (68 and 88) regardless of actual competitor measurements.
- **Impact:** Authenticated users can receive synthetic rankings, page counts, benchmark values and performance metrics as if they were measurements. The competitive analysis is particularly misleading because it stores URL-derived pseudo-scores without crawling either the user's site or competitor content.
- **Recommended direction:** Either implement evidence-backed measurement or explicitly return mode: demo and prevent synthetic results from being stored as production observations. Keep measured fields separate from heuristic estimates.
- **Positive validation:** The competitive route's URL preflight is concurrent and uses a shared bounded deadline; the earlier serial per-URL preflight concern from PR #114 is not present in the current source. The remaining issue is that the subsequent competitive scores are synthetic.

### SRC-007 — AI provider selection silently defaults to mock execution
- **Severity:** P2 — AI feature correctness
- **Confidence:** Confirmed.
- **Evidence:**
  - src/services/ai/ai-visibility-provider.ts supports Gemini and Mock providers; an omitted provider type resolves to the mock provider.
  - src/features/ai-intelligence/services/ai-visibility-audit-engine.ts accepts an optional provider type, while src/app/actions/ai-visibility-audit.ts calls the engine without supplying one. The normal action path therefore uses the mock provider even when a Gemini key is configured.
  - src/services/ai/llm-client.ts returns MockLLMClient whenever the Google API key is absent, without restricting that fallback to development/test environments.
  - src/features/ai-intelligence/services/prompt-intelligence-service.ts routes only Google models to Gemini and routes every other provider to Mock; the current model catalog does not provide live adapters for the other advertised model families.
- **Impact:** AI visibility audits can be stored as completed mock audits by default. A missing production key can silently turn multiple AI workflows into canned responses rather than failing closed. Model-comparison requests for non-Google models do not execute those providers.
- **Recommended direction:** Require an explicit provider selection, fail closed in production when a provider is unavailable, persist provider/model provenance and isMock, and implement/verify each provider adapter before exposing it as selectable.

### SRC-008 — Ingestion fallbacks persist incompatible embeddings and fabricated graph/sentiment data
- **Severity:** P2 — RAG and knowledge-data correctness
- **Confidence:** Confirmed.
- **Evidence:**
  - src/services/ai/embed-client.ts silently returns a synthetic 768-dimensional vector when the embedding provider is missing or fails; the fallback values are clustered around approximately 0.01.
  - src/services/ai/query-embedding.ts uses a different synthetic fallback whose first dimension is approximately 0.8–0.95, with the remaining dimensions around 0.01–0.02. These are not compatible fallback spaces for document embeddings versus query embeddings.
  - src/services/ai/graph-extraction.ts returns a fixed set of sample entities when no API key is available; src/services/ai/sentiment-analysis.ts returns a positive default sentiment.
  - src/services/ingestion/document-ingestion.ts persists the embedding, graph entities and sentiment metadata produced by these helpers.
- **Impact:** With no provider key, RAG similarity compares vectors from incompatible synthetic distributions. If embedding generation fails transiently during ingestion, mock vectors can be mixed with real vectors without a provenance marker. Sample entities and positive sentiment can be written into a tenant's knowledge graph and document metadata.
- **Recommended direction:** Do not persist mock embeddings/entities/sentiment in production. Use one versioned embedding implementation for both ingestion and query, store model/provider provenance, and fail or explicitly quarantine data when embedding generation fails.

### SRC-009 — Crawl jobs have no aggregate response-byte budget and can crawl external domains
- **Severity:** P1 — resource-abuse and crawl-scope control
- **Confidence:** Confirmed.
- **Evidence:**
  - src/features/acquisition/domain/policy.ts permits global ceilings up to 1,000 pages, 25 MB per response, 16 concurrent requests and 30 minutes.
  - src/features/acquisition/infrastructure/providers/http-crawl-provider.ts increments bytesProcessed but does not stop when an aggregate per-job byte budget is exceeded. safe-fetcher.ts enforces maxResponseBytes per response, not for the accumulated job.
  - linksFromHtml collects HTTP(S) links without requiring the same host/origin, and the subsequent queue processing can fetch any public linked host. The initial URL is validated, but the crawl is not restricted to that site.
  - src/app/api/v1/crawl/route.ts accepts caller-supplied policy values; the route does not clamp page count, aggregate bytes or concurrency to a subscription allowance.
- **Impact:** At the permitted maxima, a job can accumulate a very large volume of page bodies in memory (the per-response cap is not a total cap), and a crawl of one website can expand into unrelated public domains. This creates resource/cost exposure and violates the expected site boundary for many crawl use cases.
- **Recommended direction:** Add a strict total-byte budget, total request/page/time budget, per-plan caps and same-origin/explicit allowlist policy. Check aggregate limits before retaining each body and cancel outstanding requests when a job fails.

### SRC-010 — Subscription quotas are declared but not consumed by the main runtime paths
- **Severity:** P2 — billing and cost control
- **Confidence:** Confirmed by callsite scan.
- **Evidence:** src/features/billing/domain/plans.ts defines limits such as maxCrawlJobsPerDay, maxObservationsPerMonth, monthlyTokenLimit, maxBrands and maxPrompts. SubscriptionService.getQuotaUsage and consumeCredits exist, but the source tree contains no callsites that consume credits or increment the corresponding usage counters. The crawl route uses subscription data mainly to constrain redirects and the premium audit route checks canRunPremiumAudit; neither enforces the daily crawl-job or token/observation budgets. BudgetService is process-local and its checkAndReserve method does not create a reservation. The public API quota middleware also has no route consumers (see SRC-021).
- **Impact:** The plan catalog overstates enforced limits. Users can exceed the declared daily crawl/AI usage ceilings, exposing the service to unmetered provider cost and undermining plan entitlements.
- **Recommended direction:** Implement atomic durable usage reservations/consumption at the operation boundary and test concurrency, rollover, failure rollback and plan changes. Until then, label limits as non-enforced rather than presenting them as active quotas.

### SRC-011 — Tenant transactions remain open while handlers perform network and AI work
- **Severity:** P2 — database capacity and reliability
- **Confidence:** Confirmed.
- **Evidence:** TenantContextManager.runWithTenantContext begins a transaction and holds the leased client for the entire callback (src/core/database/tenant-context/index.ts:255-343). The callback includes external operations in several paths: src/app/api/v1/ingest/document/route.ts invokes the multi-chunk ingestion pipeline; src/app/api/v1/audit/premium/route.ts crawls a site and calls the LLM; src/app/api/v1/audit/engine/route.ts fetches the submitted website; and src/app/api/v1/analysis/competitive/route.ts calls an LLM before completing its work.
- **Impact:** Slow websites or AI-provider latency hold database connections and open transactions for the duration of network work. Concurrent requests can exhaust the pool and create long-lived transactions even when the database itself is healthy.
- **Recommended direction:** Separate external fetch/AI computation from short database transactions. Open a tenant transaction only for the scoped reads/writes that require it, and persist intermediate state through short, explicit transactions.

### SRC-012 — Text/ingestion endpoints do not enforce server-side payload and result limits
- **Severity:** P2 — resource exhaustion
- **Confidence:** Confirmed.
- **Evidence:** src/app/api/v1/ingest/document/route.ts and src/app/actions/ingestion.ts accept text with a minimum length but no maximum; metadata is an unrestricted record. src/app/api/v1/ai/chunk/route.ts and /ai/sentiment/route.ts accept unbounded text, and chunk size has no upper ceiling. src/app/api/v1/rag/query/route.ts and src/app/actions/query.ts accept a positive result limit without a maximum. The ingestion page's 5 MB file check is client-side and is not a substitute for server-side validation.
- **Impact:** Direct API/server-action callers can submit oversized text/metadata, request huge chunks or ask RAG to retrieve an excessive number of rows, increasing memory, CPU, provider spend and database load.
- **Recommended direction:** Enforce request-body, text, metadata, chunk-size, overlap and retrieval-limit ceilings in shared server schemas; add per-tenant concurrency and cost budgets.

### SRC-013 — Public free-audit endpoint has no authentication or rate limit
- **Severity:** P2 — external cost-abuse surface
- **Confidence:** Confirmed.
- **File / evidence:** src/app/api/v1/audit/free/route.ts accepts a URL and calls Firecrawl when configured, but does not invoke session/API-key authorization or a rate limiter.
- **Impact:** Anyone who can reach the endpoint can repeatedly trigger third-party crawl operations against arbitrary URLs and consume the application's provider quota. The landing-page component currently uses a local mock service instead, so the public endpoint is not even the backend for that UI flow.
- **Recommended direction:** Apply anonymous per-IP and global rate limits, URL/size/time budgets and abuse monitoring, or require an authenticated/free-tier quota before invoking paid providers. Surface mock mode explicitly.

### SRC-014 — Audit endpoints can return success when persistence fails; legacy audit IDs do not match stored row IDs
- **Severity:** P2 — audit-history reliability
- **Confidence:** Confirmed.
- **Evidence:** src/app/api/v1/audit/engine/route.ts catches/logs persistence errors and still returns the audit result as successful. Its builder returns the supplied auditId (src/lib/audit-engine/builder.ts:18-70), while the database insert creates a different random UUID for the row. src/app/api/v1/audit/premium/route.ts also catches persistence failure without failing the successful response.
- **Impact:** A client can receive a successful audit response even though no durable record exists. In the legacy route, the returned audit identifier is not the identifier of the stored row, preventing reliable follow-up lookup by that ID.
- **Recommended direction:** Use one ID from request through result and insert; fail the operation or return an explicit persisted: false state when storage fails. Do not report durable success before the write is confirmed.

### SRC-015 — Crawl dispatcher depends on SQL functions absent from the active migration chain
- **Severity:** P1 — crawl execution blocker on fresh databases
- **Confidence:** Confirmed by source-to-database cross-check.
- **Evidence:** src/features/acquisition/infrastructure/persistence/postgres/dispatcher-repository.ts calls public.claim_crawl_jobs, public.recover_expired_crawl_jobs and public.complete_crawl_job_if_lease_owner. The database audit found these functions only in archived legacy migration material, not in the active migrations 0000–0013.
- **Impact:** A database built solely from the active migration chain does not provide the functions the worker needs to claim/recover/complete jobs. Crawl jobs can be enqueued but the worker's dispatcher path will fail on a fresh schema unless those functions were installed out of band.
- **Recommended direction:** Restore the required functions in a reviewed active migration or replace the repository with supported SQL/Drizzle operations. Add a fresh-database integration test that starts a worker and proves claim, lease recovery and completion.
- **Cross-reference:** DB-004 / DOC-004.

### SRC-016 — Workspace invitation links cannot be completed through the application UI
- **Severity:** P2 — onboarding correctness
- **Confidence:** Confirmed.
- **Evidence:** src/app/actions/workspace.ts sends invitation links to /en/accept-invite?token=..., but the complete src/app/[locale]/ route tree contains no accept-invite/page.tsx. The action's email send is fire-and-forget and returns success before delivery is confirmed. In acceptInvitationAction, the expired-invitation branch updates the row to expired and then throws; because the action runs inside runWithSystemContext, the enclosing transaction rolls back that update.
- **Impact:** Recipients follow a link to a missing page. If email delivery fails, the inviter still sees success and, when a provider is configured, the token is not returned as a fallback. Expired invitations can remain pending in the database after the attempted status update.
- **Recommended direction:** Add a localized acceptance page wired to the server action, await and handle delivery outcome, normalize invitation emails, and commit expiry state before returning an expired result.

### SRC-017 — Workspace role changes can remove or demote the final workspace administrator
- **Severity:** P2 — workspace recoverability
- **Confidence:** Confirmed.
- **Evidence:** updateMemberRoleAction and removeMemberAction in src/app/actions/workspace.ts authorize the acting administrator and then update/delete the target membership, but do not count remaining workspace_admin members or protect the final administrator.
- **Impact:** A workspace can be left without a workspace administrator, preventing normal administration and potentially requiring platform-level intervention.
- **Recommended direction:** Enforce a transactional invariant that at least one active workspace administrator remains, with explicit handling for self-demotion/removal and concurrent admin changes.

### SRC-018 — Email verification is hard-disabled in application code
- **Severity:** P2 — identity assurance policy
- **Confidence:** Confirmed; whether this violates the approved product policy should be explicitly decided.
- **Evidence:** src/app/actions/auth.ts defines REQUIRE_EMAIL_VERIFICATION = false; login checks the flag before rejecting unverified accounts, so the verification email flow does not gate access.
- **Impact:** Accounts can authenticate without proving control of the email address, despite the registration/verification flow sending verification links. This also permits accidental or malicious reservation of another person's email address.
- **Recommended direction:** Make verification policy environment/product configurable with a secure production default, and test registration, resend, expiry and login-before-verification behavior.

### SRC-019 — Prompt scheduling and scheduled monitoring do not execute their advertised work
- **Severity:** P2 — background automation completeness
- **Confidence:** Confirmed by source callsite scan.
- **Evidence:** PromptIntelligenceService.schedulePrompt persists a cron expression and schedule metadata, but no source module reads due prompt schedules or dispatches them. src/lib/inngest/functions.ts registers an hourly scheduledMonitoring cron that only logs a message and returns success; it does not load monitoring configurations, crawl sites or create snapshots/alerts. The generic InMemoryJobQueue.enqueue also removes queued items after a timeout without invoking its executor and has no runtime consumers.
- **Impact:** A saved prompt schedule does not run on schedule, and the hourly monitoring function reports success without performing monitoring. Users can mistake persisted configuration or a successful cron invocation for an active automation.
- **Recommended direction:** Implement durable schedule dispatch and execution, or hide/label these controls as unavailable until a real worker is registered and observable.

### SRC-020 — Prompt execution returns a stale running object after recording failure
- **Severity:** P2 — execution-state correctness
- **Confidence:** Confirmed.
- **Evidence:** In src/features/ai-intelligence/services/prompt-intelligence-service.ts:250-350, the catch path calls transitionExecutionStatus(..., "failed", ...) but ignores the returned updated execution and returns the earlier persisted object whose status is still running. The same service also treats fixed Rasha aliases as aliases for every brand during position analysis.
- **Impact:** A failed provider call can be persisted as failed in storage while the caller receives running, leaving UI state/spinners inconsistent. The hardcoded alias can attribute mentions of Rasha Gostar to unrelated customer brands and inflate their visibility metrics.
- **Recommended direction:** Return the updated failed execution, use brand-specific verified aliases only, and reject unknown model names instead of silently substituting the first catalog entry.

### SRC-021 — API-key settings and public API middleware are not connected to a usable API-key flow
- **Severity:** P2 — product integration
- **Confidence:** Confirmed by source callsite scan.
- **Evidence:** src/app/[locale]/dashboard/settings/page.tsx displays a hardcoded sc_live value and its save handler only waits locally before showing success. ApiService in src/features/public-api/services/api-service.ts generates keys with a different seo_ prefix. No server action creates/revokes keys, and no route in the source tree calls withPublicApi; the API-key middleware/quota path therefore protects no endpoint.
- **Impact:** The settings screen presents a non-functional credential as an API key, while the actual API-key service and quota middleware are not exposed through the application. Users cannot reliably create, rotate, revoke or use the advertised key from the UI.
- **Recommended direction:** Wire authenticated create/list/revoke actions to the repository, use one documented key format, and wrap actual public API routes with the API-key middleware and durable quota enforcement.

### SRC-022 — Invoice page reports payment success without processing or verifying a payment
- **Severity:** P1 — financial UX / payment integrity
- **Confidence:** Confirmed.
- **Evidence:** src/app/[locale]/invoice/page.tsx contains static invoice/payment details; its payment handler only waits with a local timer and changes client state to a success screen. It does not call a payment gateway, verify a bank/crypto transaction, create a server-side payment record or reconcile subscription state.
- **Impact:** A user can be shown a successful payment confirmation without any payment being received or verified. Static bank/wallet details and a client-only success state must not be treated as a production payment flow.
- **Recommended direction:** Disable real-payment wording and success state until a verified payment provider/webhook flow exists. Never activate a subscription based only on client state or a submitted transaction reference.

### SRC-023 — Default brand identifier is incompatible with the UUID validation used to start an AEO audit
- **Severity:** P2 — first-run AEO workflow
- **Confidence:** Confirmed.
- **Evidence:** getBrandsAction in src/app/actions/ai-visibility-audit.ts creates a default ID in the form brand-<random> when no brand exists. The same module's audit input schema requires brandId to be a UUID, and src/app/[locale]/dashboard/aeo/audits/page.tsx selects the returned default brand and submits that ID to createAndRunAuditAction.
- **Impact:** On a fresh process/tenant without an in-memory brand created by another page, the default brand selected by the UI fails server-side UUID validation before the audit can run. The brand repository is also process-local (SRC-004), so relying on a brand created on another serverless instance is not reliable.
- **Recommended direction:** Generate a real UUID and persist the brand through the database-backed repository before exposing it to the UI; validate the brand belongs to the active tenant.

### SRC-024 — The previously defined Digital Twin capability has no implementation in src/
- **Severity:** P2 — product-scope gap, not a runtime defect
- **Confidence:** Confirmed by source search.
- **Evidence:** The complete source search found no Digital Twin domain/service/action, actual-versus-target state model, gap calculation, plan lifecycle, execution state or user-AI execution conversation. The only source hit is a static documentation-index snippet, not executable product code.
- **Impact:** The source currently implements adjacent SEO/AEO/competitive assessment capabilities but not the Digital Twin workflow described in the project's product scope. This should be treated as an explicit scope/roadmap decision rather than assumed to be delivered by the existing audit modules.
- **Recommended direction:** Define the domain model, source-of-truth data contracts, gap metric, plan approval/execution lifecycle and conversation state as a separate architecture workstream before claiming this capability is implemented.

### SRC-025 — English routes still receive Persian-only metadata and Persian font assignments
- **Severity:** P3 — localization/SEO consistency
- **Confidence:** Confirmed.
- **Evidence:** src/app/[locale]/layout.tsx exports static Persian title/description metadata for every locale and applies the Persian primary/display font variables to both fa and en routes. src/config/fonts.ts defines the current Persian font setup; there is no locale-specific English font assignment in the layout.
- **Impact:** English pages can publish Persian title/description metadata to search/social previews and render Latin content using the Persian font stack. ThemeProvider correctly treats the route locale as authoritative, so the issue is specifically metadata and font assignment, not locale-state synchronization.
- **Recommended direction:** Generate metadata per locale and assign the intended Latin/Persian font stacks by locale. Coordinate font changes with the separately recorded font-source/licensing task; no font assets were moved or changed in this audit.

### SRC-026 — Citation share percentages are calculated before the action seeds its sample data
- **Severity:** P3 — dashboard metric correctness
- **Confidence:** Confirmed.
- **Evidence:** src/app/actions/citation-intelligence.ts calculates brandShare, competitorShare and otherShare from the initial occurrence set, then seeds sample sources/occurrences when the set is empty and reloads occurrences without recalculating those percentages.
- **Impact:** On the first dashboard load, the returned occurrence list can contain seeded data while the displayed share percentages still reflect the pre-seed empty set (0% brand, 0% competitor, 100% other).
- **Recommended direction:** Compute all derived metrics from the final loaded occurrence set, and do not mix sample records with production tenant measurements.

## 3. Cross-folder dependencies and follow-up checks

1. **Database/RLS:** DB-001 and SCR-001 are now confirmed at the runtime query-guard layer; resolve tenant ownership and RLS coverage as one security boundary.
2. **Crawl dispatcher:** DB-004 is confirmed by the application repository's hard dependency on the three archived-only SQL functions. Do not run migrations or create these functions as part of this audit.
3. **Repository persistence:** Reconcile the central Drizzle schema with WebsiteRepository, PageRepository, DiagnosticFindingRepository and BrandRepository; verify that row mapping, primary keys and tenant predicates agree.
4. **Product truthfulness:** Reconcile DOC-005 and the roadmap maturity labels against the mock/synthetic paths listed in SRC-005 through SRC-008 and SRC-021 through SRC-023.
5. **Digital Twin:** Treat SRC-024 as a product architecture decision; do not infer an implementation from SEO/AEO analysis modules.
6. **Fonts/localization:** Cross-reference FNT-001/FNT-002 and the recorded font-source requirement. No font asset or loader change is authorized by this audit.
7. **Competitive preflight:** The current concurrent bounded preflight resolves the previous serial-timeout concern; the outstanding defect is the lack of evidence-backed competitive scoring.

## 4. Prior audit correction

The earlier SCR-004 statement that ordinary crawl execution failures were not persisted was too strong. The src/features/acquisition/application/orchestrator.ts:230-276 catch path marks non-cancellation failures as failed through the dispatcher and publishes crawl.failed before rethrowing. The empty catch in scripts/crawl-worker.ts therefore remains a P3 worker-log/observability gap, not a confirmed missing job-state transition. The scripts report has been corrected accordingly.

## 5. Not executed / limitations

- No unit/integration/e2e test, build, lint, typecheck, worker, shell script, SQL query, database connection, migration, deployment, browser test or provider call was run.
- No file under src/ was changed.
- No database schema, migration, CI workflow, package configuration, public asset, font or deployment setting was changed.
- The audit is static and scoped to the complete src/ tree at the recorded commit. Items depending on external provider configuration, production role grants or out-of-band database functions remain subject to environment verification.
