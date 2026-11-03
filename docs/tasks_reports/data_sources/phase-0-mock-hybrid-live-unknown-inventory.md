# Phase 0 — Mock / Hybrid / Live / Unknown Data-Source Inventory

**Status:** COMPLETE — source-level inventory recorded; runtime connectivity is not verified  
**Repository:** DiabloNova/oxenn  
**Base:** main at c748bc5610ebd2c26f4268bd93b68ab9a4541b6b  
**Date:** 2026-11-03  
**Scope:** Read-only inspection plus this report only. No application behavior, schema, migrations, environment, CI, or UI changes.

## 1. Executive result

Oxenn contains four materially different data-source states:

- **Mock:** seeded/in-memory repositories, deterministic AI outputs, fixed dashboard/admin analytics, explicit crawler demo modes, and mock fallback values.
- **Hybrid:** real crawls or database operations combined with synthetic scoring, mock AI extraction, or fallback/default values.
- **Live-capable:** concrete adapters exist for PostgreSQL/pgvector, Gemini, Google embeddings, Firecrawl, and direct HTTP retrieval.
- **Unknown:** production connectivity, credential validity, real use of several named AI models, Redis, email delivery, and operational background execution are not established.

**Critical database conclusion:** this inspection does not establish a persistent production/main PostgreSQL connection. Drizzle schema/migrations, pg pools, SQL repositories, .env.example variable names, the internal simulator, and ephemeral CI PostgreSQL are not proof of production connectivity.

No production Live integration is confirmed by this source-level Phase 0. “Live-capable” means code can attempt a real call if selected and configured; it does not mean the call currently succeeds.

## 2. Classification definitions

| Label | Meaning |
|---|---|
| Mock | Seeded, fixed, deterministic, synthetic, or in-memory data replaces the intended external/authoritative source. |
| Hybrid | Real external/database operations are combined with synthetic values, in-memory persistence, or fallback behavior. |
| Live-capable | A concrete network/database adapter and runtime selection path exist; deployment health remains unverified. |
| Unknown | Source evidence does not establish runtime selection, credential validity, connectivity, or data provenance. |

A dependency, model name, API-key variable, UI label, or documentation statement alone is not evidence of Live behavior.

## 3. Mock sources

### M-01 — AI Visibility Audit default provider
- Files: src/services/ai/ai-visibility-provider.ts; src/features/ai-intelligence/services/ai-visibility-audit-engine.ts; src/app/actions/ai-visibility-audit.ts
- Evidence: AIVisibilityProviderRegistry selects MockAIVisibilityProvider unless providerType is explicitly "gemini" and GOOGLE_AI_API_KEY is present. The ordinary server action calls executeAudit without providerType, so it uses the Mock default.
- Classification: **Mock — default audit path.**
- Impact: a successful audit action does not prove ChatGPT, Claude, Gemini, or Perplexity was queried.

### M-02 — AI-intelligence in-memory repository
- File: src/features/ai-intelligence/repositories/index.ts
- Evidence: defines InMemoryDatabase with Map/array stores, seeds an Acme organization/brand/engines/prompts/entities, and exports a global db singleton. BrandRepository reads/writes db.brands directly.
- Classification: **Mock** for repositories that directly use db; **Hybrid at module level** because other classes in this module issue SQL through PostgresClient.
- Important: do not classify the entire module as PostgreSQL-backed just because it imports PostgresClient. Persistence is repository-class-specific.

### M-03 — Admin mock database and admin analytics
- Files: src/features/admin/infrastructure/mock-db.ts; src/features/admin/analytics/index.ts
- Evidence: AdminMockDatabase seeds example tenants, users, flags, and provider configurations in Maps. AdminAnalyticsEngine reads this store and returns fixed operational figures such as queue health, crawler success, provider latency, and storage usage.
- Classification: **Mock.**
- Impact: seeded provider records and admin metrics are not proof of actual provider health, tenant counts, or operating costs.

### M-04 — Prompt operations console
- File: src/features/admin/prompt-management/index.ts
- Evidence: PromptOperationsConsole stores templates and experiments in Maps/arrays and seeds example model experiment results.
- Classification: **Mock / in-memory.**
- Impact: seeded model names, sample size, visibility score, citation rate, and costs are not verified provider observations.

### M-05 — LLM client selection
- File: src/services/ai/llm-client.ts
- Evidence: getLLMClient returns MockLLMClient in tests or when GOOGLE_AI_API_KEY is absent; otherwise it returns GeminiLLMClient. MockLLMClient returns canned Persian responses and sentiment examples.
- Classification: **Mock** in test/no-key mode; **Live-capable** in configured non-test mode. Deployment selection is **Unknown**.

### M-06 — AEO synthetic content and provenance
- File: src/features/ai-intelligence/services/aeo-content-intelligence-service.ts
- Evidence: absent page content is supplemented with fixed sample company/service/FAQ text; missing entity results use a fallback entity list; provenance defaults to "Google Gemini via Mock", a fixed model version, and fixed latency.
- Classification: **Mock / deterministic heuristic analysis** for these paths.
- Impact: an AEO score may not represent crawled page content or a real Gemini response.

### M-07 — Legacy crawler mock mode
- Files: src/services/crawler/web-crawler.ts; src/services/crawler/link-discovery.ts; src/app/api/v1/crawler/start/route.ts
- Evidence: helpers return fixed mock article text/links when USE_MOCK_CRAWLER=true or the URL contains mock.com; otherwise they perform direct HTTP requests.
- Classification: **Mode-dependent Mock or Live-capable HTTP.**
- Boundary: this legacy crawler is separate from the newer acquisition provider router.

### M-08 — Competitive analysis
- File: src/app/api/v1/analysis/competitive/route.ts
- Evidence: optional Firecrawl scraping is attempted when the key appears configured, but comparison scores, win probability, strengths/weaknesses, and head-to-head values are generated by deterministic URL-seeded pseudo-random logic. Scrape failure explicitly falls back to simulated data.
- Classification: **Hybrid** when scraping succeeds; predominantly **Mock** without Firecrawl.
- Impact: a real crawl does not make generated competitor scores real measurements.

### M-09 — Technical SEO analysis
- File: src/app/api/v1/optimization/technical/route.ts
- Evidence: optional Firecrawl scrape feeds a few heuristics, but weighted category scores include fixed baselines. Missing key activates URL-keyword simulation; scrape failure continues with default/simulated state.
- Classification: **Hybrid** with a real scrape; **Mock/heuristic** without it.
- Impact: this is not a full measured browser/lab audit.

### M-10 — Knowledge graph demo fallback
- File: src/app/api/v1/knowledge-graph/query/route.ts
- Evidence: route includes a mock-demo fallback that marks output with mock=true and source="mock-demo-fallback".
- Classification: **Hybrid** when repository graph data is available; **Mock** when demo nodes/edges are returned.
- Impact: consumers must preserve/check provenance markers.

### M-11 — Fixed analytics summary
- File: src/services/analytics/index.ts
- Evidence: getSummaryMetrics returns literal share-of-model-voice, sentiment, citation, and alert values.
- Classification: **Mock.**
- Impact: not tenant-specific production analytics.

### M-12 — Deterministic embedding fallback
- File: src/services/ai/embed-client.ts
- Evidence: generateDeterministicMockEmbedding creates a synthetic 768-dimensional vector. generateEmbedding uses it in tests/no-key mode and after an embedding call fails.
- Classification: **Hybrid** when a real embedding attempt can fall back; **Mock** in test/no-key mode.
- Impact: storing a mock vector in PostgreSQL does not make it a real semantic embedding.

### M-13 — Graph extraction fallback
- File: src/services/ai/graph-extraction.ts
- Evidence: without Gemini, extraction returns hard-coded entity/relationship graphs for selected keywords and a fixed default graph.
- Classification: **Mock** on non-Gemini path; **Live-capable** on Gemini path.

### M-14 — Sentiment fallback
- File: src/services/ai/sentiment-analysis.ts
- Evidence: uses getLLMClient; mock branch parses canned output and has a fixed neutral backup when parsing fails. Gemini branch uses structured generation.
- Classification: **Mock** in test/no-key mode; **Live-capable** in Gemini mode; parse backup is synthetic.

### M-15 — In-memory cache, jobs, events, browser storage
- Files: src/services/cache/store.ts; src/services/jobs/repository.ts; src/core/events/index.ts; src/services/storage/index.ts
- Evidence: cache and job repositories use Maps; EventBus keeps subscribers in a Map; storage uses browser localStorage.
- Classification: **Mock / process-local / browser-local.**
- Impact: these are not durable shared Redis, database-backed job persistence, or cross-instance event infrastructure.

### M-16 — Email senders
- File: src/services/email/adapters.ts
- Evidence: development uses DevEmailSender (logs a simulated email); tests use CaptureEmailSender; production selects ProductionEmailSender, whose send() throws "EMAIL_PROVIDER not implemented yet" even if the variable is present.
- Classification: **Mock** in dev/tests; **not implemented / Unknown** for production delivery.

## 4. Hybrid and live-capable paths

### H-01 — New acquisition crawler
- Files: src/features/acquisition/application/orchestrator.ts; src/features/acquisition/application/provider-router.ts; src/features/acquisition/infrastructure/providers/http-crawl-provider.ts; src/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider.ts
- Evidence: defaultRouter uses internal HTTP only when FIRECRAWL_API_KEY is absent; when present it orders Firecrawl before internal HTTP. ProviderRouter falls back only when the CrawlError classification permits it. Internal HTTP fetches/parses real pages; Firecrawl uses the external SDK.
- Classification: **Hybrid / Live-capable**. Key validity and successful runtime selection are **Unknown**. Key presence only selects an adapter; it does not prove a successful request.

### H-02 — Document ingestion pipeline
- Files: src/services/ingestion/document-ingestion.ts; src/services/ai/embed-client.ts; src/services/ai/sentiment-analysis.ts; src/services/ai/graph-extraction.ts; src/services/knowledge-graph/vector-store.ts; src/services/knowledge-graph/graph-store.ts
- Evidence: chunks documents, generates embeddings, runs sentiment/graph extraction, then writes vectors/entities/relationships through PostgreSQL query adapters. AI stages may be mock-backed while storage is SQL-backed.
- Classification: **Hybrid.**
- Impact: storage provenance and model-output provenance are independent and must not be conflated.

### H-03 — Dashboard summary
- File: src/services/dashboard-home/index.ts
- Evidence: queries PostgreSQL for recent premium audits, catches query failures and falls back to an empty result; some metric values use defaults when fields are absent.
- Classification: **Hybrid / fallback display path.**
- Impact: successful rendering does not prove displayed metrics came from persistent rows.

### H-04 — LLM analytics simulation
- File: src/app/api/v1/analytics/llm/route.ts
- Evidence: asks the selected LLM client to simulate ChatGPT/Claude responses and generate share-of-voice/sentiment values.
- Classification: **Hybrid** when Gemini generates the simulation; **Mock** when MockLLM is selected.
- Impact: even a real Gemini call is simulating other LLMs, not directly querying them.

### H-05 — Admin PostgreSQL adapter with mock hooks
- File: src/features/admin/infrastructure/persistence/postgres/index.ts
- Evidence: PostgresClient creates pg.Pool instances from DATABASE_URL and AUTHENTICATOR_DATABASE_URL and executes SQL. PostgresTenantRepository also exposes a static Map plus seed()/getRawStore() helpers, while the inspected CRUD path issues SQL through its executor.
- Classification: **Live-capable SQL adapter with mock/test hooks.**
- Important: a Map helper alone is not proof of automatic runtime fallback to that Map.

## 5. Live-capable adapter inventory

| System | Source evidence | Status |
|---|---|---|
| PostgreSQL via pg | src/features/admin/infrastructure/persistence/postgres/index.ts creates pools and executes parameterized SQL. | **Live-capable; production connection UNKNOWN.** |
| Drizzle monitoring repositories | src/features/monitoring/repositories/monitoring-config-repository.ts and crawl-snapshot-repository.ts execute Drizzle reads/writes using tenant DB client or global.pgClient. | **Live-capable; global client registration/runtime UNKNOWN.** |
| Acquisition job/cache/result repositories | src/features/acquisition/infrastructure/persistence/postgres/* used by acquisition orchestrator. | **Live-capable; target DB UNKNOWN.** |
| Public API key repository | src/features/public-api/repositories/api-key-repository.ts issues SQL through PostgresClient. | **Live-capable; target DB UNKNOWN.** |
| Google Gemini | src/services/ai/llm-client.ts creates Google provider only when GOOGLE_AI_API_KEY exists. | **Live-capable; key validity and production use UNKNOWN.** |
| Google embeddings | src/services/ai/embed-client.ts calls text-embedding-004 through Google provider. | **Live-capable with mock fallback; runtime use UNKNOWN.** |
| Firecrawl | src/lib/firecrawl.ts and acquisition Firecrawl provider. | **Live-capable; key validity/service availability UNKNOWN.** |
| Direct HTTP crawl | acquisition HttpCrawlProvider and legacy crawler helpers. | **Live-capable; successful external fetches not run in this audit.** |
| Temporary CI PostgreSQL | .github/workflows/ci.yml provisions temporary PostgreSQL/pgvector for isolation tests, per repository context. | **Live database in CI test scope only; not production evidence.** |

## 6. Unknown / not established

| Item | Evidence / gap | Status |
|---|---|---|
| Persistent production/main PostgreSQL | Repository context says source inspection does not establish a persistent production DB; no production connectivity check was performed here. | **UNKNOWN / NOT VERIFIED; treat as not connected until confirmed.** |
| Runtime credential validity | .env.example documents names only; secret values were not read or exposed. | **UNKNOWN** for DATABASE_URL, AUTHENTICATOR_DATABASE_URL, GOOGLE_AI_API_KEY, FIRECRAWL_API_KEY, and others. |
| Direct OpenAI integration | OpenAI model names appear in seeded admin data; inspected runtime AI client constructs Google Gemini only. | **Not established.** |
| Direct Anthropic/Claude integration | Claude appears in seeded data and simulation prompts; no concrete Anthropic adapter was established in inspected runtime paths. | **Not established.** |
| Direct ChatGPT/Perplexity execution | Names appear in mock engine records and simulation descriptions; no concrete live adapters established in inspected paths. | **Not established.** |
| Redis/Upstash | UPSTASH variables exist in .env.example; inspected cache is InMemoryCacheStore and no Redis adapter was established. | **Not established.** |
| Real production email | ProductionEmailSender throws and initializes no real sender SDK. | **Not implemented.** |
| Inngest operational execution | Inngest client exists; functions include hello-world and a scheduled-monitoring placeholder that only logs. No deployed execution verified. | **Partial / operational status unknown.** |
| Neo4j or dedicated graph database | Knowledge-graph docs mention future integration; GraphStoreService writes PostgreSQL tables. | **Not established.** |
| Wikidata live entity resolver | Architecture/contracts reference Wikidata; inspected pipeline interface does not establish a live resolver. | **Unknown / not established.** |
| External API target | .env.example includes NEXT_PUBLIC_API_URL and src/services/api/client.ts uses generic fetch; no successful request was made. | **Unknown.** |
| Production observability/provider health | No production telemetry or health endpoint was queried. | **Unknown.** |

## 7. Data provenance rules derived from the inventory

- A row stored in PostgreSQL can still contain Mock-derived output.
- A successful website crawl followed by synthetic scoring is Hybrid, not fully Live.
- A real Gemini call that simulates ChatGPT/Claude is not a direct ChatGPT/Claude observation.
- A mock embedding stored in a real vector table remains mock-derived.
- In-memory Maps are not durable shared persistence.
- Fallback/default values must retain provenance and must not be presented as measured facts.
- Provider selection, credential presence, successful request, response provenance, and persistence are separate facts.

## 8. Contradictions and out-of-scope findings

### 8.1 Repository context snapshot is behind current main
- docs/REPOSITORY_CONTEXT.md records a 2026-11-02 snapshot at commit 1517034c... and 1,125 tree entries.
- Actual main inspected here resolves to c748bc5610ebd2c26f4268bd93b68ab9a4541b6b (2026-11-03), with 1,129 entries and truncated=false.
- Impact: the context file remains useful for constraints, but its snapshot metadata/tree count is historical.
- Action: recorded only; no context update made in Phase 0.

### 8.2 Legacy API identity headers
- src/app/api/v1/crawler/start/route.ts, src/app/api/v1/analysis/competitive/route.ts, src/app/api/v1/optimization/technical/route.ts, and src/app/api/v1/analytics/llm/route.ts derive tenant/user identity from request headers.
- Newer src/app/api/v1/crawl/route.ts derives identity from a real session.
- Impact: inconsistent identity provenance can affect tenant association for these operations.
- Action: out of scope; no route/auth changes made.

### 8.3 Architecture documentation vs runtime selection
- docs/architecture/features/DEPENDENCY_INJECTION.md describes a global mocked persistent store, while src/core/container/index.ts registers PostgreSQL repositories.
- docs/architecture/features/AI_VISIBILITY_ENGINE_ARCHITECTURE.md documents Mock and Gemini providers, but the ordinary server action omits the provider selector and therefore uses the Mock default.
- Action: inventory finding only; no documentation synchronization or code changes made.

## 9. Coverage and verification

- Read root AGENTS.md and docs/REPOSITORY_CONTEXT.md.
- Read relevant service/architecture documentation under docs/.
- Inspected package.json and .env.example.
- Inspected the recursive main tree: **1,129 entries, not truncated**; 554 paths under src/.
- Directly inspected implementation files across AI providers, embeddings, sentiment, graph extraction, acquisition routing/providers/orchestrator, crawler helpers/routes, AI repositories, admin persistence/mock DB, email, cache/jobs/events/storage, analytics, monitoring, vector/graph storage, dashboard aggregation, and relevant API routes/actions.

| Check | Result |
|---|---|
| main branch and commit | **PASS** — c748bc5610ebd2c26f4268bd93b68ab9a4541b6b |
| Recursive repository tree | **PASS** — 1,129 entries; truncated=false |
| Root operating contract/context docs | **PASS** |
| Direct source inspection | **PASS** for the files enumerated above |
| Production DB/provider connectivity | **NOT VERIFIED** |
| Tests/build/lint | **NOT RUN** — documentation-only Phase 0 |
| Application/schema/migration/env/CI/UI changes | **NONE** |

This is a source-level inventory, not an operational health check. Any module or deployment-only integration not established by the evidence above remains Unknown.

## 10. Phase 0 handoff

Phase 0 establishes the inventory and provenance vocabulary only. It does not authorize provider refactoring or runtime changes.

A later phase should define a single source contract that records:
- source ID/category (database, AI model, crawler, cache, queue, email, graph, analytics);
- mode (Mock/Hybrid/Live/Unknown);
- selected adapter and selection condition;
- exact caller/consumer and tenant boundary;
- persistence target and durability;
- fallback eligibility and provenance;
- provider/model/version and request/correlation identifiers;
- runtime evidence timestamp and verification status;
- whether a value is measured, simulated, heuristic, seeded, cached, or defaulted.

No registry, global provider switch, owner-only status page, or runtime integration dashboard was implemented in Phase 0. Those require separate authorization and a later phase.

## 11. Git/change summary

- Branch: audit/phase-0-data-source-inventory-2026-11-03
- Base: main at c748bc5610ebd2c26f4268bd93b68ab9a4541b6b
- Report: docs/tasks_reports/data_sources/phase-0-mock-hybrid-live-unknown-inventory.md
- Application source changes: none
- Database/schema/migration changes: none
- Environment/CI/UI/auth/provider behavior changes: none
- Tests/build/lint: not run
- PR: not created
- Merge: not performed
