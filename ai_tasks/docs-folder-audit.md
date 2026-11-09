# Documentation Folder Audit

- Repository: `DiabloNova/oxenn`
- Branch: `docs/product-roadmap-baseline-2026-11`
- Audited product baseline: `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42` (2026-11-06)
- Documentation branch revision reviewed: `86c8e5d1629df4050d661acad7a90de978be77f6`
- Scope: tracked `docs/` directory only
- Method: complete recursive Git tree inventory, review of current documentation indexes, governance contracts, product/security/API/architecture docs, baseline findings, Roadmap stages, selected historical audits and implementation reports, and cross-document consistency checks. No application source or live service was inspected as part of this phase.

## 1. Inventory and review boundary

The recursive Git tree was complete (`truncated: false`) and contained **104 tracked files in 31 directories** under `docs/`. This consists of 103 Markdown/text documents and one ZIP archive:

- `docs/oxenn-fixes-v1.1.zip` — 18,639 bytes. The GitHub file interface returned no readable text representation for this binary archive, so its internal contents were not inspected.
- The remaining 103 files are text/Markdown documentation. The current indexes, active governance specifications, Baseline Plan, Roadmap, product/security/API summaries, database documentation, and representative historical audits/task records received substantive review. Large historical records were treated as point-in-time evidence rather than current implementation contracts.

Top-level documentation areas:

| Area | Principal content |
|---|---|
| `Baseline plan/` | Global baseline issue index and BL-001–BL-010 |
| `Roadmap/` | RM-00 release gate and proposed stages RM-01–RM-11 |
| `architecture/` | System, database, feature, routing, caching and observability specifications |
| `database/` | Canonical data contract and generated reference matrix |
| `product/`, `user-guides/`, `services/`, `api/` | Product, user, service and API summaries |
| `security/` | Security model, RBAC and privileged database-path documentation |
| `project/` | MVP phases, old roadmaps, audits and task execution records |
| `redesign/`, `tasks_reports/` | Design direction, route/site-map audits and point-in-time implementation reports |
| `REPOSITORY_CONTEXT.md` | Dated repository orientation snapshot |

No existing document in `docs/` was modified during this audit.

## 2. Findings

### DOC-001 — Ownership scope and RLS / migration verification must remain independent

**Priority: P2 — canonical data-contract and generated-reporting consistency.**
**Confidence: High.**
**Related finding: DB-001 (the original schema defect has since been remediated in the checked-in source and migration history).**

The original DOC-001 observation was accurate for the earlier documentation baseline: the five organization-owned junction tables (`pages_keywords`, `pages_topics`, `pages_entities`, `keywords_topics`, and `topics_entities`) were classified as Global because tenant RLS policies were missing. That specific current-state claim is superseded by the repository's later DB-001 remediation and must not be repeated as the present state.

Revalidation against the current `main` snapshot shows that all five tables are organization-owned, declare tenant policies, and are represented as Tenant-Scoped in the current Reference Matrix. The canonical Drizzle declarations include the tenant policy helper, migration `0014_db_001_join_table_rls.sql` adds ENABLE / FORCE and the four operation policies, and migration `0015_db_001_composite_tenant_fks.sql` adds tenant-consistent composite foreign keys. Both migrations are present in the active journal. The current generated ownership inventory also includes all five tables.

The remaining architectural issue is the contract between ownership and security evidence. Ownership must be derived from the canonical domain/schema contract (`organizations`, `organization_id`, and `tenant_id`), not from whether a policy happens to exist. A missing policy is a protection defect on a Tenant-Owned table; it is never evidence that the table is Global. The Reference Matrix must also distinguish declared policy objects, complete tenant-policy coverage, checked-in ENABLE / FORCE migration coverage, and actual runtime enforcement.

**Impact:** without this separation, a future missing policy could again cause a tenant-owned table to be represented as Global, and static documentation could be mistaken for proof of runtime enforcement.

**Required disposition:** keep one canonical ownership classifier shared by tenant-table verification, migration verification, and matrix generation; require a rationale for any approved Global exception with tenant ownership markers; generate separate ownership, policy, migration, and runtime-verification fields; add regression tests proving that tenant-owned tables remain Tenant-Owned when policy coverage is absent. Runtime status must remain explicitly unverified unless established by the PostgreSQL isolation suite.

### DOC-002 — Database security specifications describe incompatible or obsolete RLS coverage

**Priority: P2 — security architecture documentation inconsistency.**  
**Confidence: High for the document mismatches; runtime behavior is not inferred.**  
**Related finding: DB-001.**

The database/security documentation does not currently express one consistent contract:

- [Tenant Context Specification](../docs/architecture/database/tenant-context-spec.md) says exactly 12 tables are strictly isolated by RLS. The current Drizzle snapshot contains 70 tables, including 56 tenant-owned tables with declared RLS policies; the 12-table list is obsolete.
- [Database Reconciliation Report](../docs/architecture/database/reconciliation-report.md) is a historical report that uses an older 51/19 split and classifies all 19 tables without policies as Global/System Context. That historical grouping includes junction tables whose tenant ownership and RLS coverage have since been corrected in the canonical schema and migrations 0014 / 0015; it must not be treated as the current state.
- [Security README](../docs/security/README.md), [Architecture README](../docs/architecture/README.md), [MVP Phase 0](../docs/project/MVP_PHASE_0_SCOPE_BASELINE.md) and [MVP Phase 1](../docs/project/MVP_PHASE_1_SECURITY_TENANT_ISOLATION.md) state that the 51-policy set matches the tenant-scoped table set and is fully covered.
- [Feature Architecture](../docs/architecture/features/ARCHITECTURE.md) contains an illustrative policy using `app.current_organization_id`, whereas the canonical policies and current database contract use `app.current_tenant_id`.

The current snapshot contains 56 tenant-owned tables and all 56 declare tenant RLS policies; the active migration journal statically enables and forces RLS for those 56 tables. This does not prove that the migrations have been applied to production or that runtime enforcement has been independently verified there. The five junction tables that were the original DB-001 counterexample now have four tenant policies each and are included in migrations 0014 / 0015.

**Required disposition:** publish one current RLS contract with distinct counts for (a) tenant-owned tables, (b) tables with policies declared, (c) tables enabled/forced in the migration chain and (d) tables verified against a disposable live PostgreSQL instance. Mark the 12-table and 2024/19-table descriptions as superseded historical material, and update examples to use the canonical tenant setting. Do not claim production RLS state from repository documentation alone.

### DOC-003 — The route specification declares a superseded roadmap location as its supreme source of truth

**Priority: P2 — architecture and documentation governance.**  
**Confidence: High.**

[docs/architecture/SITEMAP_AND_ROUTE_SPECIFICATION.md](../docs/architecture/SITEMAP_AND_ROUTE_SPECIFICATION.md) is labelled an “Authoritative Specification” and declares the files under `docs/roadmap/` to be the supreme source of truth:

- `docs/roadmap/TASKS.md`
- `docs/roadmap/EXECUTION_ROADMAP.md`
- `docs/roadmap/PRODUCT_EVOLUTION_ROADMAP.md`

That declaration conflicts with the newer [docs/README.md](../docs/README.md), which explicitly makes `docs/Baseline plan/` and `docs/Roadmap/` the current authorities and places project-era materials under `docs/project/`. The exact path `docs/roadmap/` is not present in the current tracked tree. The older roadmap documents are under `docs/project/roadmap/`, where [docs/project/README.md](../docs/project/README.md) describes them as historical point-in-time material.

There are related stale path descriptions: [Migration Strategy](../docs/architecture/database/migration-strategy.md) depicts historical migrations under `database/migrations/`, but the archived migration set is actually under `database/archive/migrations-legacy/`.

**Impact:** a contributor following the route specification may use a non-existent path or revive an old roadmap as the governing product/engineering plan. This conflicts with the newer Baseline Plan / Roadmap gate and with BL-008, which already records historical roadmap/architecture conflicts.

**Required disposition:** either clearly mark the route specification as historical/superseded or rebase it on the current documentation hierarchy. Correct stale path references when that document is next revised. This is a documentation-only finding; no route or redirect implementation was changed.

### DOC-004 — Crawl acquisition documentation claims stored-procedure behavior not present in the active migration chain

**Priority: P2 — implementation-contract mismatch.**  
**Confidence: High for the mismatch between the document and checked-in active migrations; application replacement remains unverified.**  
**Related finding: DB-004.**

[Feature Architecture — Crawl Acquisition](../docs/architecture/features/CRAWL_ACQUISITION.md) describes dispatcher claim and expired-lease recovery as narrow `SECURITY DEFINER` functions. The archived [historical crawl migration](../database/archive/migrations-legacy/0004_crawl_acquisition.sql) defines `claim_crawl_jobs`, `recover_expired_crawl_jobs` and `complete_crawl_job_if_lease_owner`. However, static inspection of the active migration chain `database/drizzle/0000`–`0013` found no corresponding function definitions. The archive README itself says that legacy migration files are historical records and must not be executed.

This is the same unresolved provenance mismatch captured as DB-004. Application code could implement equivalent transactional logic, but that is not established by the documentation or by the database directory alone.

**Required disposition:** during the later source/call-site audit, verify the actual dispatcher and worker transaction flow. Then update the architecture document to name the real active implementation and its security boundary, or record an explicit missing implementation if no replacement exists. Do not reintroduce archived SQL based only on this document.

### DOC-005 — Product and user documentation overstate “Implemented” status without an evidence-level distinction

**Priority: P1 — customer-trust and MVP-readiness risk.**  
**Confidence: High that the documentation claims are broad; individual feature readiness must be verified against code.**  
**Related findings: BL-001, BL-002, BL-003 and BL-004.**

[docs/README.md](../docs/README.md) opens by saying the documentation “accurately reflects the implemented state of the repository.” [Product Documentation](../docs/product/README.md) marks a broad catalogue—including Technical SEO, AI Visibility, Competitor Discovery, Knowledge Graph, Document Intelligence, Content Studio, AI Prompt Intelligence, Competitive Radar, Citation Intelligence, Brand Intelligence, AEO Content and RAG—as `Implemented`. [User Guides](../docs/user-guides/README.md) similarly labels dashboard KPIs, analysis workflows, workspace management and invoice/payment flows as implemented.

That status vocabulary collapses at least three distinct statements:

1. A route or code module exists.
2. A feature path has passed automated tests against its intended dependencies.
3. A real customer workflow is production-connected, persistent, authorized, evidence-backed and available with its required provider/credentials.

The first two do not establish the third. The current Baseline Plan already records P1 defects relevant to customer trust: BL-001 synthetic Technical SEO observations, BL-002 silent AI Visibility mock fallback, BL-003 fictional/default brand identity and BL-004 process-local repository fallbacks. [MVP Phase 0](../docs/project/MVP_PHASE_0_SCOPE_BASELINE.md) itself acknowledges that product documentation can overstate readiness relative to the audit and says product status labels require implementation-level evidence.

**Required disposition:** define the status dictionary in product, API, user-guide and service docs so it distinguishes code-present, partially verified, live-provider connected, durable/persistent, release-ready and planned. Reconcile each customer-facing “Implemented” claim after the relevant BL findings and the later source-level route/service audit are complete. Do not relabel an entire product catalogue as operational simply because its modules exist.

### DOC-006 — The current product Roadmap does not yet turn the Digital Twin concept into an explicit product/architecture contract

**Priority: P2 — product-scope decision; not a confirmed code defect.**  
**Confidence: High that the concept appears in earlier design material but is not explicitly specified in the current staged Roadmap.**

The October 29 [Site-map and Information Architecture Audit](../docs/tasks_reports/front_end_reports/site-map-information-architecture-audit.md) explicitly defines a Digital Benchmark Twin (DBT), a Digital Twin Gap Analyzer (DTGA), comparison of real-world data with the twin, gap analysis, and planned dashboard destinations for twin sources, comparison, gaps, planning, execution and AI-model discussion. [Phase 02 Creative Direction](../docs/redesign/PHASE-02-CREATIVE-DIRECTION.md) also uses “Oxenn’s Living Digital Twin” as its design concept.

The new [Roadmap](../docs/Roadmap/INDEX.md) contains adjacent building blocks: digital product assessment (RM-02), product/competitiveness assessment (RM-03), human-approved improvement planning (RM-04), scenario/ROI analysis (RM-08), and continuous outcomes (RM-10). However, the current Roadmap does not define a canonical Digital Twin model or explicitly specify the real-state versus target/twin-state representation, gap calculation contract, target-state evolution, user–AI dialogue around the plan, or the lifecycle linking twin updates to approved execution and measured outcomes.

This may be an intentional product reframing from the older DBT/DTGA language to assessment-and-improvement stages. The documents do not record that decision. Therefore, this finding is an unresolved product/architecture alignment question, not proof that the feature is absent from code.

**Required disposition:** decide whether DBT/DTGA and the user–AI planning dialogue remain first-class Oxenn product capabilities. If yes, add their domain model, evidence/target-state semantics, gap metrics, dialogue/approval model and staged acceptance criteria to the authoritative Roadmap/architecture documents. If not, record the product decision and mark the older IA/design proposal as superseded. This needs product-owner approval; no feature scope is inferred or added by this audit.

### DOC-007 — Privileged database path documentation still uses legacy tenant tables and older path names

**Priority: P2 — security-sensitive documentation drift.**  
**Confidence: High that the documented table vocabulary differs from the canonical schema; current call-site behavior requires source verification.**

[Privileged Database Paths](../docs/security/privileged-paths.md) lists tables such as `tenants`, `tenant_users` and `tenant_invitations`, and references older paths such as `src/app/actions/auth.ts` and `src/app/actions/workspace.ts`. The canonical database schema currently uses `organizations`, `organization_members` and `organization_invitations`. The [Repository Context](../docs/REPOSITORY_CONTEXT.md) says the code registry is audit metadata rather than an enforced SQL/table allowlist; it also says `organization_members.role` is the authoritative workspace role source.

The table/path names in the privileged-path document therefore need a direct reconciliation with the current registry and its callers. Because this document describes privileged system-context access, outdated table names or caller descriptions could make a reviewer believe that access is limited or accounted for when the actual SQL paths differ.

**Required disposition:** later compare this document table-by-table and purpose-by-purpose with `src/core/database/privileged-paths.ts`, all `runWithSystemContext` call sites and the SQL they execute. Only then update its allow-path descriptions. Do not treat the documented `allowedTables` metadata as an SQL security boundary.

### DOC-008 — Workspace RBAC and platform-administrator RBAC are not clearly separated in the security documentation

**Priority: P3 — authorization-model ambiguity.**  
**Confidence: High for the differing documented role sets; whether this is a genuine model conflict requires code review.**

[Security Model](../docs/security/SECURITY_MODEL.md) describes three roles: `SuperAdmin`, `WorkspaceAdmin` and `Viewer`. [RBAC Model](../docs/security/RBAC_MODEL.md) describes seven platform-administrator roles: Super Admin, Platform Admin, Security Auditor, Operations, Finance, Support and Read-Only Observer. The canonical schema/context also describes `organization_members.role` as the workspace role authority.

These may represent two distinct authorization domains—customer workspace membership and internal platform operations—but the README and role specifications do not clearly state that separation, the mapping between contexts, or which actions belong to which model.

**Required disposition:** document workspace RBAC and platform-admin RBAC as separate bounded contexts, including role authorities, scope, permission evaluation and prohibited cross-context escalation. Confirm the actual implementation in the later authentication/authorization audit.

### DOC-009 — API documentation formats one route as a source filename rather than an HTTP endpoint

**Priority: P3 — API-documentation correctness.**  
**Confidence: High for the malformed route notation; existence and contract of the route remain unverified in this docs-only phase.**

[API Documentation](../docs/api/README.md) lists the LLM Analytics endpoint as `/api/v1/analytics/llm/route.ts`. The `route.ts` suffix is a Next.js file-system implementation name, not part of the normal HTTP request path. The document should show the public endpoint path and list the source file separately, after the route has been verified against the current application tree.

The same API README marks the listed APIs as “Implemented” and “verified and functional.” Those specific endpoint claims remain subject to the route/action audit; DOC-005 applies to this broader status assertion.

## 3. Historical material and records that must not be used as current implementation authority

The following documents are valuable historical evidence but contain old baselines, plans or repository state. Their preservation is not itself a defect:

- [Project README](../docs/project/README.md) correctly says project audits, roadmaps and task execution logs are point-in-time historical records.
- [Infrastructure Readiness Audit](../docs/project/audit/INFRA_READINESS_AUDIT.md) is dated August 16, 2024 and describes an earlier schema, migration and service architecture.
- [IRPRP](../docs/project/roadmap/IRPRP.md) declares that its old infrastructure audit is authoritative and that no additional audit is required. This conflicts with the current Baseline Plan gate, but is covered by BL-008 and should be treated as historical, not as a new independent finding.
- [Execution Roadmap](../docs/project/roadmap/EXECUTION_ROADMAP.md), [Product Evolution Roadmap](../docs/project/roadmap/PRODUCT_EVOLUTION_ROADMAP.md) and [Tasks](../docs/project/roadmap/TASKS.md) describe an older Phase 0–19 Seorchable sequence. They are not the current release plan; the current authority is `docs/Roadmap/`.
- [Repository Context](../docs/REPOSITORY_CONTEXT.md) is explicitly a snapshot reviewed 2026-11-02 at commit `1517034c5820fb2215567ad3dff2bf04da30c800`. It contains useful constraints and correctly warns that source, configuration, CI, deployed providers and production state are distinct evidence categories, but it predates the audited November 6 main commit.
- [Regression Baseline — 2026-10-19](../docs/project/audit/REGRESSION-BASELINE-2026-10-19.md) and task/PR reports under `docs/tasks_reports/` record CI and PR states at their stated dates. A historical “open”, “queued”, “pending” or “passed” status does not establish the current PR or branch state.
- [Task 4.0 Execution Log](../docs/project/tasks/TASK4.0_EXECUTION_LOG.md) captures an earlier crawl implementation/verification state. Its contents must not supersede the active migration chain or current source evidence.

The current [Roadmap README](../docs/Roadmap/README.md) and [Roadmap Index](../docs/Roadmap/INDEX.md) provide an explicit execution gate: implementation is blocked until every accepted Baseline Plan finding is verified, a fresh repository-wide audit passes and RM-00 accepts the post-baseline state. This current gate should take precedence over older project task instructions.

## 4. Items deliberately deferred to later audit phases

The following questions require code, generated-artifact or deployment inspection outside the approved `docs/` scope:

1. Verify every “Implemented” feature claim against its actual route, server action/API, service, adapter, persistence behavior, provider configuration and tests.
2. Verify the true HTTP paths and response contracts for every documented API endpoint, including LLM Analytics.
3. Compare `docs/security/privileged-paths.md` with the generated/current privileged-path registry, each `runWithSystemContext` call site and its SQL.
4. Establish whether platform-admin and workspace-member RBAC are implemented as separate, correctly scoped authorization domains.
5. Trace the actual crawler dispatcher/worker flow to determine whether application code replaced the archived `SECURITY DEFINER` stored procedures.
6. Validate all document portal link resolution, route visibility and whether historical/internal planning documents are unintentionally exposed as public docs.
7. Reconcile the product owner’s Digital Twin intent with RM-01–RM-04 and decide whether DBT/DTGA, target-state evolution and user–AI planning dialogue are first-class MVP scope.

No live database was queried, no deployed application was exercised, no API was called, and no browser/visual test was run as part of this phase.

## 5. Audit limits and outcome

- All 104 tracked entries in `docs/` were inventoried from a complete Git tree.
- The current governance indexes and core database, security, API, product, Roadmap and baseline documents received substantive review, along with representative historical project, design and task reports.
- The binary ZIP archive was not decoded.
- Large historical records were used as historical evidence; this report does not claim that every old report's individual implementation statement was re-verified against source.
- No product document, architecture specification, migration, source-code file, PR or issue was edited.
- Only an audit report under `ai_tasks/` and the audit-workspace README link are authorized changes.

**Conclusion:** the `docs/` folder has been inventoried and the current high-impact documentation inconsistencies are recorded. DOC-001 now tracks the residual requirement to keep ownership scope independent from policy, migration, and runtime evidence; its original five-table Global / missing-RLS observation is superseded by the checked-in DB-001 remediation. The remaining high-impact items include obsolete RLS/security specifications (DOC-002) and unverified product-status claims (DOC-005). Historical roadmap conflicts remain cross-referenced to BL-008 rather than duplicated. The next root-level folder has not been inspected; this phase ends here pending explicit approval.
