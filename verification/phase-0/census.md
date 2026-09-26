# Task J-006: Import-Graph & Dead-Code Census Report

**Repository Context:** DiabloNova/oxenn @ main
**Branch:** `verification/j006-census`
**Execution Date:** 2025-09-26

---

## Executive Summary & Summary Counts

- **USED Modules:** 26
- **DEAD Modules:** 19
- **AMBIGUOUS Modules:** 0

*(Total items analyzed: 45)*

---

## 1. Target Items Verdict & Import Evidence

Below is the classification of all target modules specified in Task J-006.

| Target Module | Verdict | Importers Count | Inbound Importers / Evidence Lines |
|---|---|---|---|
| `database/schema/brand.ts` | **DEAD** | 0 | None. (Note: Only mentioned in markdown/docs strings in `src/lib/docsData.ts` and `src/lib/docsIndex.ts`). |
| `database/schema/keyword.ts` | **DEAD** | 0 | None. |
| `database/schema/page.ts` | **DEAD** | 0 | None. |
| `database/schema/topic.ts` | **DEAD** | 0 | None. |
| `database/schema/website.ts` | **DEAD** | 0 | None. |
| `database/schema/diagnostic.ts` | **DEAD** | 0 | None. |
| `database/schema/aeo-content-intelligence.ts` | **DEAD** | 0 | None. |
| `database/schema/ai-visibility-audit.ts` | **DEAD** | 0 | None. |
| `database/schema/brand-intelligence.ts` | **DEAD** | 0 | None. |
| `database/schema/citation-intelligence.ts` | **DEAD** | 0 | None. |
| `database/schema/competitive-seo-finding.ts` | **DEAD** | 0 | None. |
| `database/schema/api-keys.ts` | **DEAD** | 0 | None. (Note: SQL table `api_keys` is queried via raw SQL in `src/features/public-api/repositories/api-key-repository.ts`, but this Drizzle module is not imported anywhere). |
| `database/schema/admin/index.ts` | **DEAD** | 0 | None. |
| `components/live-analytics/CanvasRenderer.ts` | **USED** | 1 | `components/live-analytics/LiveAnalyticsGraph.tsx:6`: `import { CanvasRenderer } from "./CanvasRenderer";` |
| `components/live-analytics/DataAdapter.ts` | **USED** | 1 | `components/live-analytics/LiveAnalyticsGraph.tsx:4`: `import { LiveDataAdapter, IDataAdapter } from "./DataAdapter";` |
| `components/live-analytics/GraphEngine.ts` | **USED** | 2 | `components/live-analytics/CanvasRenderer.ts:2`: `import { GraphEngine, Point2D } from "./GraphEngine";`<br>`components/live-analytics/LiveAnalyticsGraph.tsx:5`: `import { GraphEngine } from "./GraphEngine";` |
| `components/live-analytics/Legend.tsx` | **USED** | 1 | `components/live-analytics/LiveAnalyticsGraph.tsx:7`: `import { Legend } from "./Legend";` |
| `components/live-analytics/LiveAnalyticsGraph.tsx` | **DEAD** | 0 | None. |
| `components/live-analytics/Tooltip.tsx` | **USED** | 1 | `components/live-analytics/LiveAnalyticsGraph.tsx:8`: `import { Tooltip } from "./Tooltip";` |
| `components/live-analytics/animation.ts` | **USED** | 1 | `components/live-analytics/DataAdapter.ts:2`: `import { noise1D } from "./animation";` |
| `components/live-analytics/types.ts` | **USED** | 6 | `components/live-analytics/CanvasRenderer.ts:1`: `import { MetricSeries } from "./types";`<br>`components/live-analytics/DataAdapter.ts:1`: `import { MetricSeries } from "./types";`<br>`components/live-analytics/GraphEngine.ts:1`: `import { MetricSeries } from "./types";`<br>`components/live-analytics/Legend.tsx:2`: `import { LegendItem } from "./types";`<br>`components/live-analytics/LiveAnalyticsGraph.tsx:9`: `import { MetricSeries, TooltipState, LegendItem } from "./types";`<br>`components/live-analytics/Tooltip.tsx:2`: `import { TooltipState } from "./types";` |
| `components/navigation/FloatingSidebar.tsx` | **USED** | 1 | `src/app/[locale]/layout.tsx:7`: `import FloatingSidebar from "../../../components/navigation/FloatingSidebar";` |
| `components/ui/button.tsx` | **DEAD** | 0 | None. |
| `lib/utils.ts` | **USED** | 1 | `components/ui/button.tsx:4`: `import { cn } from '../../lib/utils'` |
| `src/services/analytics/index.ts` | **DEAD** | 0 | None. |
| `src/services/api/client.ts` | **DEAD** | 0 | None. |
| `src/services/crawler/crawler-orchestrator.ts` | **USED** | 2 | `src/app/api/v1/crawler/start/route.ts:4`: `import { CrawlerOrchestrator } from "@/services/crawler/crawler-orchestrator";`<br>`tests/services/crawler/web-crawler.test.ts:12`: `import { CrawlerOrchestrator } from "../../../src/services/crawler/crawler-orchestrator";` |
| `src/services/crawler/link-discovery.ts` | **USED** | 2 | `src/services/crawler/crawler-orchestrator.ts:3`: `import { extractSeedLinks } from "./link-discovery";`<br>`tests/services/crawler/web-crawler.test.ts:11`: `import { extractSeedLinks } from "../../../src/services/crawler/link-discovery";` |
| `src/services/crawler/web-crawler.ts` | **USED** | 2 | `src/services/crawler/crawler-orchestrator.ts:2`: `import { fetchAndExtractText } from "./web-crawler";`<br>`tests/services/crawler/web-crawler.test.ts:10`: `import { normalizePersianText, fetchAndExtractText } from "../../../src/services/crawler/web-crawler";` |
| `src/services/ingestion/document-ingestion.ts` | **USED** | 4 | `src/app/actions/ingestion.ts:4`: `import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";`<br>`src/app/api/v1/ingest/document/route.ts:3`: `import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";`<br>`src/services/crawler/crawler-orchestrator.ts:4`: `import { DocumentIngestionService } from "../ingestion/document-ingestion";`<br>`tests/services/ingestion/document-ingestion.test.ts:7`: `import { DocumentIngestionService } from "../../../src/services/ingestion/document-ingestion";` |
| `src/services/intelligence/index.ts` | **DEAD** | 0 | None. |
| `src/services/knowledge-graph/graph-store.ts` | **USED** | 2 | `src/services/ingestion/document-ingestion.ts:11`: `import { GraphStoreService } from "../knowledge-graph/graph-store";`<br>`tests/services/knowledge-graph/graph-store.test.ts:7`: `import { GraphStoreService } from "../../../src/services/knowledge-graph/graph-store";` |
| `src/services/knowledge-graph/vector-store.ts` | **USED** | 6 | `src/services/ingestion/document-ingestion.ts:9`: `import { VectorStoreService } from "../knowledge-graph/vector-store";`<br>`src/services/rag/context-retrieval.ts:6`: `import { VectorStoreService } from "../knowledge-graph/vector-store";`<br>`tests/features/ai-intelligence/vector-store.test.ts:6`: `import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";`<br>`tests/services/crawler/web-crawler.test.ts:14`: `import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";`<br>`tests/services/ingestion/document-ingestion.test.ts:251`: `import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";`<br>`tests/services/rag/query-service.test.ts:7`: `import { VectorStoreService } from "../../../src/services/knowledge-graph/vector-store";` |
| `src/services/rag/context-retrieval.ts` | **USED** | 2 | `src/services/rag/query-service.ts:8`: `import { retrieveRelevantContext, RetrievedChunk } from "./context-retrieval";`<br>`tests/services/rag/query-service.test.ts:4`: `import { retrieveRelevantContext } from "../../../src/services/rag/context-retrieval";` |
| `src/services/rag/query-service.ts` | **USED** | 3 | `src/app/actions/query.ts:4`: `import { answerQuestion } from "@/services/rag/query-service";`<br>`src/app/api/v1/rag/query/route.ts:3`: `import { answerQuestion } from "@/services/rag/query-service";`<br>`tests/services/rag/query-service.test.ts:5`: `import { answerQuestion } from "../../../src/services/rag/query-service";` |
| `src/services/storage/index.ts` | **DEAD** | 0 | None. |
| `src/lib/audit-engine/builder.ts` | **USED** | 2 | `src/app/api/v1/audit/engine/route.ts:3`: `import { executeAudit } from "@/lib/audit-engine/builder";`<br>`tests/services/audit-engine/engine.test.ts:10`: `import { executeAudit } from "../../../src/lib/audit-engine/builder";` |
| `src/lib/audit-engine/crawler.ts` | **USED** | 1 | `src/lib/audit-engine/builder.ts:3`: `import { secureCrawl } from "./crawler";` |
| `src/lib/audit-engine/extractor.ts` | **USED** | 1 | `src/lib/audit-engine/builder.ts:4`: `import { extractSignals } from "./extractor";` |
| `src/lib/audit-engine/logger.ts` | **USED** | 4 | `src/lib/audit-engine/builder.ts:9`: `import { AuditLogger } from "./logger";`<br>`src/lib/audit-engine/crawler.ts:3`: `import { AuditLogger } from "./logger";`<br>`src/lib/audit-engine/extractor.ts:4`: `import { AuditLogger } from "./logger";`<br>`tests/services/audit-engine/engine.test.ts:11`: `import { AuditLogger } from "../../../src/lib/audit-engine/logger";` |
| `src/lib/audit-engine/normalizer.ts` | **USED** | 2 | `src/lib/audit-engine/builder.ts:6`: `import { normalizeFeatures } from "./normalizer";`<br>`tests/services/audit-engine/engine.test.ts:9`: `import { normalizeFeatures } from "../../../src/lib/audit-engine/normalizer";` |
| `src/lib/audit-engine/recommendations.ts` | **USED** | 1 | `src/lib/audit-engine/builder.ts:8`: `import { generateRecommendations, simulateAiVisibility } from "./recommendations";` |
| `src/lib/audit-engine/scorer.ts` | **USED** | 2 | `src/lib/audit-engine/builder.ts:7`: `import { calculateScores } from "./scorer";`<br>`tests/services/audit-engine/engine.test.ts:8`: `import { calculateScores } from "../../../src/lib/audit-engine/scorer";` |
| `src/lib/audit-engine/seo-extractor.ts` | **USED** | 2 | `src/lib/audit-engine/builder.ts:5`: `import { extractSeoSignals } from "./seo-extractor";`<br>`tests/services/audit-engine/seo-extractor.test.ts:8`: `import { extractSeoSignals } from "../../../src/lib/audit-engine/seo-extractor";` |
| `src/lib/audit-engine/url-validator.ts` | **USED** | 5 | `src/lib/audit-engine/builder.ts:2`: `import { normalizeUrl, isSafeUrl } from "./url-validator";`<br>`src/lib/audit-engine/crawler.ts:2`: `import { normalizeUrl, isSafeUrl } from "./url-validator";`<br>`src/lib/audit-engine/extractor.ts:3`: `import { isSafeUrl } from "./url-validator";`<br>`src/lib/audit-engine/seo-extractor.ts:23`: `import { normalizeUrl, isSafeUrl } from "./url-validator";`<br>`tests/services/audit-engine/engine.test.ts:7`: `import { normalizeUrl, isSafeUrl } from "../../../src/lib/audit-engine/url-validator";` |

---

## 2. Export Check: `database/schema/index.ts`

**Question:** Does `database/schema/index.ts` re-export `./api-keys` (or any sibling module)?

**Answer:** **No.** `database/schema/index.ts` defines and exports all tables inline directly within the single monolithic file. It contains zero `export ... from` statements re-exporting `./api-keys` or any sibling modules.

**Representative Quote of Export Lines in `database/schema/index.ts`:**
```ts
// database/schema/index.ts contains inline table declarations such as:
export const organizations = pgTable("organizations", { ... });
export const users = pgTable("users", { ... });
export const adminUsers = pgTable("admin_users", { ... });
export const brands = pgTable("brands", { ... });
export const aiVisibilityAudits = pgTable("ai_visibility_audits", { ... });
// No `export * from "./api-keys";` or `export * from "./brand";` exists in index.ts.
```

---

## 3. Environment Variable Consumers

Below is the list of consumers (file:line) for each environment variable audited:

| Environment Variable | Consumers (File : Line : Snippet) |
|---|---|
| `DATA_SOURCE` | `.env.example:8`: `DATA_SOURCE=db` (No TS code consumer) |
| `UPSTASH_REDIS_REST_URL` | `.env.example:4`: `UPSTASH_REDIS_REST_URL=` (No TS code consumer) |
| `UPSTASH_REDIS_REST_TOKEN` | `.env.example:5`: `UPSTASH_REDIS_REST_TOKEN=` (No TS code consumer) |
| `STAGING_MIGRATION_DATABASE_URL` | `.env.example:3`: `STAGING_MIGRATION_DATABASE_URL=` (No TS code consumer) |
| `MIGRATION_DATABASE_URL` | `.env.example:2`: `MIGRATION_DATABASE_URL=` (No TS code consumer) |
| `SESSION_SECRET` | `src/services/auth/session.ts:18`: `const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");`<br>`src/services/auth/session.ts:28`: `return crypto.createHmac("sha256", SESSION_SECRET)...` |
| `INNGEST_*` | none |
| `NEXT_PUBLIC_*` | `src/config/env.ts:4`: `NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.brandintelligence.ai"`<br>`src/config/env.ts:5`: `NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"`<br>`src/core/config/index.ts:22`: `isIranMarketLocalised: process.env.NEXT_PUBLIC_IRAN_MARKET_LOCALISED === "true" || true`<br>`src/services/api/client.ts:19`: `const url = \`\${env.NEXT_PUBLIC_API_URL}\${path}\`;` |

---

## 4. Inbound Links for Duplicate Dashboard Route Pairs

Analysis of navigation files (`FloatingSidebar.tsx`, `AppSidebar.tsx`, `DashboardShell.tsx`, `DashboardKpiGrid.tsx`, `RecentAuditsPanel.tsx`, `LandingFooter.tsx`) shows:

| Route Pair | Active Inbound Links / Navigation Consumers |
|---|---|
| `audit` vs `audits` | Primary active route: `/dashboard/audits`<br>- `src/components/features/dashboard-home/RecentAuditsPanel.tsx:48`: `router.push('/${language}/dashboard/audits/...')`<br>- `src/components/features/dashboard-home/DashboardHomeClient.tsx:115`: `router.push('/${language}/dashboard/audits')`<br>- `src/components/features/dashboard-home/VisibilityTrendChart.tsx:106`: `router.push('/${language}/dashboard/audits')`<br>- `src/components/features/dashboard-home/DashboardKpiGrid.tsx:56`: `navigateTo("/dashboard/audits")`<br>*(Note: `/dashboard/audit/free` redirects internally to `/dashboard/audit/premium`)* |
| `ingest` vs `ingestion` | Primary active route: `/dashboard/ingestion`<br>- `src/components/DashboardShell.tsx:136`: `href: "/dashboard/ingestion"`<br>*(No active UI links point to `/dashboard/ingest`)* |
| `competitive` vs `competitors` | Both used in UI:<br>- `src/components/DashboardShell.tsx:145`: `href: "/dashboard/competitive"`<br>- `src/components/features/dashboard-home/DashboardKpiGrid.tsx:152`: `navigateTo("/dashboard/competitors/radar")`<br>- `src/config/dashboardNavigation.ts:135`: `href: "/dashboard/competitors/radar"`<br>- `src/services/dashboard-services/index.ts:177`: `route: "/dashboard/competitors/radar"` |
| `graph` | No active UI navigation links point to `/dashboard/graph`. Active entity graph route is `/dashboard/entities`. |
| `query` vs `rag` | Both used in navigation sidebar:<br>- `src/components/navigation/AppSidebar.tsx:88`: `href: "/dashboard/query"` ("Prompt Intelligence")<br>- `src/components/navigation/AppSidebar.tsx:93`: `href: "/dashboard/rag"` ("Agent Search")<br>- `src/components/DashboardShell.tsx:137`: `href: "/dashboard/query"` ("AI Semantic Discovery")<br>- `src/components/marketing/LandingFooter.tsx:26`: `href: "/${language}/dashboard/query"` |

---

## 5. Artifact Files Created

- `verification/phase-0/import-graph.json`: Raw dependency graph output from Madge.
- `verification/phase-0/census.md`: This comprehensive census report.
