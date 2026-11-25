# Project Operation and Optimization Scope Mapping

**Status:** Stage 3 inventory and domain mapping — documented; runtime linkage is not implemented or verified.  
**Baseline:** `main` at `4105d7af7371fcd7dd70e85a08991af883181332`; this branch contains the Stage 3 documentation commits and no application-code divergence from that baseline.  
**Related contract:** [Optimization Scope and Operation Run Contract](./OPTIMIZATION_SCOPE_CONTRACT.md)  
**Authority:** DOC-99 Stage 3 / TASK-106 owner-approved domain direction.

This document maps the operation and result shapes that actually exist in the repository. It deliberately distinguishes Project-scoped work from Brand-scoped intelligence, infrastructure jobs, source ingestion, and derived outputs. A name that sounds like an operation is not enough to make a record an OperationRun.

## 1. Decisions

1. **Project remains the existing `websites` entity.** A Workspace (`organizations`) may own multiple Websites; each Website is one Project. Pages remain children of Websites. Do not introduce a parallel `projects` table.
2. **OperationRun v1 is for operations that have a verified Project target.** Every such run has one Website and exactly one immutable Optimization Scope. Do not invent a Page or Website target for Brand-only operations.
3. **Brand is a separate domain root.** Prompt research, brand visibility measurement, entity/knowledge-graph analysis, and brand profile intelligence remain Brand/Workspace scoped unless a consumer explicitly accepts a managed Website or Page as its target.
4. **Keep capability-specific records.** A shared run identity must connect existing durable execution and result records; it must not erase their specialized payloads, provider details, worker leases, state machines, or provenance.
5. **Do not treat retries as new runs.** A Crawl Job's attempts, provider fallbacks, heartbeats, and lease recoveries are details of that accepted crawl execution.
6. **Do not treat schedules, caches, snapshots, evidence, or reports as interchangeable with runs.** Each has a separate lifecycle and purpose.
7. **Preserve document identity.** `documentId` is a server-owned source-document identity used by document replacement and provenance logic. It is not an OperationRun ID, Page ID, or Project ID.
8. **No schema, migration, runtime, database, provider, or UI changes are authorized by this mapping.** Existing persistence inconsistencies below must be reconciled before linking their outputs to a shared run.

## 2. Classification rules

| Classification | Meaning |
|---|---|
| Project-scoped operation | Has a specific managed Website/Project target. Eligible for the Project OperationRun + Optimization Scope contract. |
| Brand-scoped operation | Targets a Brand, Prompt, entity, or AI visibility context without a verified Website/Page target. No Website Optimization Scope is assigned. |
| Execution detail | A feature-specific worker/job record that performs or tracks part of an operation. It is not automatically a second OperationRun. |
| Definition / schedule | Configuration that describes future or recurring work. It is not an execution. |
| Result / evidence | Data produced by an execution. It must retain source provenance and be attributable to the appropriate run or domain aggregate. |
| Infrastructure / transient | Queue, cache, local in-memory job, or implementation detail. It is not a durable business operation. |
| Not implemented as durable operation | A synchronous request or UI flow that returns a result but does not create a reliable durable execution record. |

## 3. Project-scoped operation mapping

| Candidate operation type | Existing execution / entry point | Existing result and provenance path | Project / Page binding today | Scope v1 decision | Mapping status |
|---|---|---|---|---|---|
| `website_discovery` | `POST /api/v1/crawl` → `CrawlOrchestrator.submit/execute` → `crawl_jobs` | `crawl_results` belongs to `crawl_jobs`; the normalized provider result contains crawled documents | Request and `CrawlRequest` contain Tenant + URL, not `websiteId` or Page IDs. This path does not materialize the result as canonical `pages` records. | `whole_website` only after the submitted URL has been resolved to the active Workspace's managed Website. | **First integration candidate.** The durable job exists, but Project ownership and canonical Page materialization are not wired. |
| `site_architecture_analysis` | `SiteArchitectureAnalyzerService.analyzeArchitecture(organizationId, websiteId, input)` | Returns findings and crawl-depth metrics; findings use `websiteId` in the domain type | The service receives a Website ID and a Page array, but it does not prove that every Page belongs to that Website or that the array is the complete eligible Page inventory. | `whole_website` when the caller supplies the verified complete Page inventory. Do not infer this from an arbitrary Page array. | **Project-aware domain service; persistence and input validation are blockers.** |
| `aeo_page_analysis` | `AeoContentIntelligenceService.executeAnalysis(organizationId, pageId)` | Intended `AeoAnalysis` plus Page-associated FAQ opportunities and KG alignments | Explicit Page ID; the Page's Website is available through the Page model, but the run does not currently retain a Project/Scope identity. | `single_page` for the current service. A future batch operation may use `selected_pages` only after it validates and freezes the complete unique Page set. | **Strongest existing single-page fit; persistence contract mismatch must be resolved first.** |
| `technical_audit` | `POST /api/v1/optimization/technical` accepts `url` and `pagesToAnalyze` | `technical_audits` stores summary scores, issues, and metrics | Raw URL and Workspace only; no Website or Page IDs. `pagesToAnalyze` is a processing budget, not a declared Optimization Scope. | Initially `whole_website` only after URL → managed Website resolution. Partial processing belongs in the resolved target manifest, not a narrower scope. | **Not yet Project-bound or durably represented as a run.** |
| `premium_audit` | `POST /api/v1/audit/premium` accepts `url` and `depth` | `premium_audits` stores a completed summary | Raw URL and Workspace only; no Website or Page IDs. Depth is a work limit, not a Scope declaration. | Initially `whole_website` only after URL → managed Website resolution. Page-specific modes require Page IDs, not URL-only inference. | **Not yet Project-bound; route persistence SQL also disagrees with canonical schema.** |
| `competitive_analysis` | `POST /api/v1/analysis/competitive` accepts `userUrl` plus external `competitorUrls` | `competitive_analyses` stores comparison, gap, advantage, and opportunity payloads | User URL is not resolved to a Website ID. Competitor URLs are external benchmark inputs, not Pages belonging to the customer's Project. | `whole_website` for the customer's managed Website after resolution. Competitor URLs remain external comparison context and must never be inserted into the customer's Page target set. | **Conditional Project candidate; no durable execution record or Project link today.** |
| `monitoring_check` | `monitoring_configs` describes a Website and `targetUrl`; snapshots refer to a config and a Crawl Job | `crawl_snapshots` and `monitoring_alerts` | Config has `websiteId`; it does not declare whether `targetUrl` means the root website, one registered Page, or a custom monitored URL. A Crawl Job does not carry the config ID. | **Unresolved.** Derive `whole_website` or `single_page` only from an explicit, validated monitoring-target contract. Never guess from `targetUrl`. | **Schedule/configuration and output models exist; an end-to-end scheduled OperationRun is not established.** |

### Scope-specific conclusions

- `whole_website` is the natural initial-discovery scope. Crawl limits, time budgets, and the actual number of Pages fetched do not silently narrow the user's authorized scope; actual work belongs in the resolved target manifest.
- `single_page` is directly represented by the AEO page-analysis service's Page ID input.
- `selected_pages` is a valid v1 contract mode, but the inspected end-to-end operation paths do not yet demonstrate a durable multi-Page run that freezes, validates, and processes a selected Page set as one scope. Do not claim this mode is implemented merely because the domain contract defines it.
- A URL is not a Page identity. URL-only endpoints must resolve the URL to a managed Website/Page under the authenticated Workspace before they can create a Project-scoped run.

## 4. Brand-scoped operations — keep outside Project Scope v1

| Operation / capability | Existing execution or source records | Related outputs | Why no Website Scope is assigned |
|---|---|---|---|
| `prompt_execution` | `prompt_definitions` is a reusable Brand-linked definition; `prompt_schedules` is a recurring definition; `prompt_executions` is the actual prompt/model execution | `position_observations` records evidence tied to `source_execution_id` | The prompt is linked to a Brand and its resolved text/variables/model, not to a managed Website or Page. A prompt that happens to mention a URL does not become Page-scoped. |
| `brand_visibility_audit` | `AIVisibilityAuditEngine.executeAudit(organizationId, brandId)`; intended aggregate in `ai_visibility_audits` with child `audit_prompts` | Audit prompt responses/analysis and evidence summary | The target is a Brand. No Website or Page target is part of the service contract. |
| `brand_observation` | `ObservationService.processObservation` uses a Prompt and AI Engine | `ai_observations`, `brand_mentions`, and `citations` conceptually represent captured observations and extracted evidence | These are Brand/Prompt observation records, not a generic Website operation. The current repository path uses in-memory Maps rather than proving durable writes to the corresponding canonical tables. |
| `aeo_brand_insight` | `POST /api/v1/audit/aeo-insight` accepts a brand/entity name and reads KG/embedding context | Returns recommendations in the response; no corresponding durable run/result record is established by this route | It is Brand/Entity-oriented and does not identify a managed Website or Page. |
| Brand intelligence / recommendations | Services consume Brand, Entity, AI observation, and competitor context | Brand associations, recommendation observations, visibility scores, and related records | These are Brand-level intelligence and derived records; they should not be assigned a Website Scope unless a specific consumer is redesigned to target a Project. |

**Decision:** Do not add a nullable/fake Website ID to these records merely to make them fit the Project run table. If the product later needs durable cross-cutting run identity for Brand-only operations, define that as a separate domain decision; it is outside the current Project-scoped contract.

## 5. Supporting workflows and non-run records

| Existing item | Correct classification | Required treatment |
|---|---|---|
| `prompt_schedules` | Schedule definition | Each actual scheduled prompt execution remains a distinct `prompt_executions` record. Do not represent the schedule row as a run. |
| `monitoring_configs` | Monitoring definition/configuration | Each actual check must have a distinct execution identity; the current model does not fully establish this lifecycle. |
| `crawl_jobs.attempts`, leases, heartbeats, provider fallback | Execution details / worker attempts | Keep under the same accepted Crawl Job / future OperationRun. They are not separate user-requested runs. |
| `crawl_cache` | Tenant-scoped cache | Never use a cache entry as a run or as authoritative evidence of a fresh execution. |
| `crawl_results`, `crawl_snapshots`, `monitoring_alerts` | Results / monitoring evidence | Preserve their feature-specific detail and connect through the producing run/config with enforced ownership. |
| `position_observations`, `citations`, `brand_mentions`, `citation_occurrences`, `recommendation_observations` | Observation/evidence outputs | Keep their exact source execution or Brand/Observation parent; do not turn them into runs. |
| `diagnostic_findings`, `faq_opportunities`, `kg_alignments`, `historical_metrics`, `visibility_scores`, `recommendations` | Findings, opportunities, metric snapshots, and derived outputs | Attribute them to their generating operation where that operation is Project-scoped; preserve domain-specific identity and deduplication semantics. |
| `DocumentIngestionService` and `document_embeddings` | Supporting ingestion and evidence storage | Preserve `documentId` as the stable source-document identity. It is distinct from OperationRun, Website, and Page. Link ingestion to a Project run only when it is actually a step of that run and its source context is known. |
| `src/services/jobs` | Generic in-memory job abstraction | Not the canonical durable OperationRun source. Its repository is Map-backed and cannot establish persistent operation identity. |
| Legacy `CrawlerOrchestrator.runCrawlerCampaign` | Synchronous crawl-and-ingest workflow without a durable campaign record | Do not create a second durable run abstraction for this legacy path until its intended role relative to `/api/v1/crawl` is decided. |
| Dashboard Reports page | UI placeholder / sample schedule data | No durable report-generation operation or report result contract is established. Future reports should cite their source run IDs and evidence; multi-Project reports should use a parent workflow with Project-scoped child runs. |

## 6. Canonical persistence mismatches blocking safe linkage

These are observed disagreements between canonical declarations in `database/schema/index.ts` and SQL used by the corresponding repositories/routes. A shared `operation_run_id` would not repair them. The actual physical database has not been inspected, so these are canonical-schema/repository conflicts, not claims about live database state.

| Area | Canonical schema expects | Repository / route expects | Consequence before OperationRun linkage |
|---|---|---|---|
| AEO analysis | `aeo_analyses` uses tenant/url/target-keyword and aggregate score columns | `AeoContentIntelligenceRepository` reads/writes organization/page IDs, component analyses, scoring/analyzer versions, and provenance | The intended Page-level analysis cannot be treated as durably persisted until the schema/repository contract is reconciled. |
| AEO child outputs | `faq_opportunities` and `kg_alignments` reference `aeo_analysis_id` and use analysis-centric columns | Repository SQL uses Page IDs and a different set of question/alignment columns | Page-level evidence and child results do not have one proven canonical relationship. |
| Diagnostic findings | `diagnostic_findings` declares domain/finding-type/description/recommendation fields | Repository SQL uses Website ID, category, code, affected resource, explanation, and related versioning fields | Site-architecture findings cannot be assumed to persist under the declared canonical table. |
| AI visibility audit | `ai_visibility_audits` declares target brand/domain and dimension score columns | `AIVisibilityAuditRepository` expects Brand ID, metrics, prompts coverage, evidence summary, scoring and analyzer versions | Brand audit persistence is not aligned; some repository failures are caught and fall back to memory. |
| Audit prompt records | `audit_prompts` declares prompt text/category/weight and Audit ID | Repository expects target entity, locale, status, response, analysis, and lifecycle fields | Child prompt execution/evidence persistence is not established. |
| Premium audit | `premium_audits` declares created-at and report payload columns | The premium audit route also inserts updated-at, created-by, updated-by, and version columns not present in the canonical declaration | The route catches save failures and can still return a response; durable persistence must be independently reconciled. |

**Guardrail:** Resolve each schema/repository conflict as its own evidence-backed task, inspect migration history and compatibility requirements, and obtain separate authorization before any schema or migration change. Do not add OperationRun foreign keys to an unverified result-table shape.

## 7. Initial Project Operation registry proposal

Only the following types are evidenced strongly enough to enter the initial Project-scoped registry, subject to the stated readiness gates:

| Operation type | v1 allowed Scope | Gate before implementation |
|---|---|---|
| `website_discovery` | `whole_website` | Resolve URL to an active Website owned by the authenticated Workspace; persist/resolve canonical Page inventory and target manifest. |
| `site_architecture_analysis` | `whole_website` | Load the authoritative Website Page inventory server-side; prove every Page matches the run's Workspace and Website; reconcile findings persistence. |
| `aeo_page_analysis` | `single_page` | Validate the Page belongs to the run's Workspace and Website; reconcile AEO analysis and child-output schema contracts. |
| `technical_audit` | `whole_website` initially | Resolve URL to Website; define actual processed Page manifest. Do not infer page scopes from URL strings. |
| `premium_audit` | `whole_website` initially | Resolve URL to Website; reconcile report persistence and identify the exact difference from technical audit. |
| `competitive_analysis` | `whole_website` for the customer's site | Resolve `userUrl` to Website; keep competitor URLs as external comparison inputs. |

The following must **not** be registered as Project-scoped operation types until their contracts are clarified: `monitoring_check` (target semantics and schedule-to-run lifecycle), Brand prompt execution, Brand visibility audit, Brand/Entity insight, generic document ingestion, report generation, and any SEO/GEO label without a verified execution path and Project target.

The `selected_pages` scope remains part of the domain contract, but no current operation is declared batch-ready for it. A later batch Page analysis may use one run with a frozen unique Page target set and per-Page child outputs; it must not fake that behavior by making several unrelated runs look like one.

## 8. Safe implementation order

1. **Freeze this mapping and the Project-vs-Brand boundary.** No new abstraction should be introduced from names alone.
2. **Reconcile canonical schema and Repository/route drift** for AEO, diagnostic findings, Brand visibility audits, and premium audit persistence. Establish which historical schema/migration shape is authoritative before proposing DDL.
3. **Finalize the operation type registry and Scope compatibility** using the confirmed Project-scoped types above. Explicitly settle the `monitoring_configs.targetUrl` semantics and whether premium/technical audits are distinct capabilities.
4. **Verify the relational ownership prerequisites**: Website/Workspace and Page/Workspace/Website composite keys, and safe non-cascading history behavior. RLS and the existing five junction-table composite FKs do not prove every Project relationship.
5. **Implement the shared OperationRun and scope-page persistence** only after the table set, constraints, and migration preflight have been separately approved.
6. **Integrate one vertical at a time**, beginning with website discovery/Crawl Job; next the validated Page-based AEO and site-architecture paths; then URL-based audit and competitive analysis; monitoring only after its target semantics are explicit.
7. **Keep specialized state machines and attempts beneath the shared identity.** Define a single source of truth for user-facing run status so a generic run status and a child status cannot drift. Crawl attempts/leases remain worker execution details.
8. **Add result attribution** directly to the run or through a strictly enforced durable parent chain. Never accept a caller-supplied Project or Scope that conflicts with the run.
9. **Test positive and negative ownership paths** using only the disposable isolated PostgreSQL environment. Include cross-Workspace, cross-Website Page, deleted target, mismatched monitoring config/Crawl Job, empty/duplicate selected Page set, and retry-versus-rerun cases.
10. **Keep Brand-only operations, ingestion identity, and multi-Project report orchestration separate** until their own domain contracts are approved.

## 9. Verification boundary

This mapping was produced by read-only inspection of the current branch's code and canonical schema, with the current branch compared against `main`. It does not prove live database state or runtime success.

- No Workspace or Platform Admin database was connected or changed.
- No schema, migration, snapshot, journal, generated inventory, code, test, or UI file was changed.
- No new Git branch or pull request was created.
- No tests were run; this deliverable is architecture documentation only.
- The Platform Admin data plane remains separate from the Workspace domain and is not part of Project OperationRun.

**Completion state:** Operation/Scope classification and safe sequencing are documented. Persistence reconciliation, OperationRun schema/runtime implementation, and positive/negative integration verification remain open under Stage 3.
