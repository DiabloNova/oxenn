# OXENN — Dashboard Page Templates

**Product basis:** `docs/frontend/00-PRODUCT-UNDERSTANDING.md`  
**Authoritative architecture:** https://github.com/DiabloNova/oxenn_documents/blob/main/product_architecture.md  
**Branch:** `feat/architecture-driven-dashboard`  
**Status:** Page-template design specification. Page-level component specifications and implementation are subsequent steps.

## 1. Dashboard experience principles

1. Organize navigation around the nine product domains and the user's improvement cycle, not the legacy collection of standalone SEO/AI tools.
2. Keep the active organization, workspace, product, market, geography, and language context visible where relevant.
3. Every page starts with a clear purpose, current scope, and the user's next meaningful action.
4. Prefer evidence-led content over decorative scores and generic AI recommendations.
5. Every data-bearing page supports explicit source, time, confidence, freshness, and availability context.
6. Separate observed, estimated, hypothetical, and illustrative content.
7. Make the next step traceable: findings lead to evidence, evidence to decisions, decisions to plans, and execution to outcomes.
8. Reuse the existing authenticated dashboard shell, locale routing, theme provider, and responsive navigation foundations. Evolve them incrementally; do not create a competing shell.
9. Design Persian RTL and English LTR as native compositions. Do not rely on mechanically reversing an English layout.
10. No new backend, database, provider, or integration connection is part of this design phase.

## 2. Global dashboard frame

### Persistent application frame

- **Primary navigation:** collapsible desktop sidebar; accessible mobile drawer.
- **Workspace context:** organization/workspace selector.
- **Product context:** current product selector, visible on product-scoped pages.
- **Market context:** geographic market and language selector where the page supports market comparisons.
- **Top bar:** contextual breadcrumb/page location, global search/command access (only if existing behavior is preserved), notifications, help, theme, language, and account menu.
- **Main content:** responsive, readable max-width canvas with page-specific content.
- **Assistant entry point:** persistent but non-obstructive contextual AI Copilot entry.
- **System state:** truthful connection/availability state only. Do not display “all systems operational”, “synced just now”, or a green live indicator without evidence.

### Page header template

Every domain page uses a consistent header:
- Breadcrumb.
- Page title and one-sentence purpose.
- Product/workspace scope when applicable.
- Status/freshness context where relevant.
- One primary action and no more than two secondary actions.
- Optional tabs or sub-navigation for closely related views.

### Standard content states

Each page template must account for:
- Initial/loading state.
- First-use/empty state with an actionable next step.
- Partial data state with explicit missing dimensions.
- Error/failed state with safe recovery and retained user input where possible.
- Permission-restricted state.
- Stale data state.
- Illustrative preview state for frontend fixtures.
- Completed state with evidence and next action.

## 3. Information architecture and navigation

### Workspace
- Overview
- Product Intelligence Profile
- Products & Services

### Assessments
- Digital Product Assessment
  - Assessment Overview
  - SEO Assessment
  - AEO Assessment
  - GEO Assessment
  - Technical & Digital Infrastructure
  - Digital Performance Baseline & Digital Presence Benchmark

### Market Intelligence
- Product Value & Competitiveness
  - Competitive Landscape
  - Product Comparison
  - Differentiation & Value Proposition
  - Findings & Root Causes
- Geo-Market Intelligence

### Evidence & Decisions
- Product Evidence Graph
- Findings & Opportunities
- Simulation & ROI Lab

### Execution
- Strategic Roadmap
- Initiatives & Projects
- Task Board
- Approvals & Decisions
- Execution History

### Improvement
- Continuous Improvement
- Baseline vs Target vs Actual
- Outcome History

### Collaboration
- Expert Network
- AI Copilot

### Workspace management
- Reports
- Data Sources & Integrations (management surface only; no new connection work in this task)
- Activity & Notifications
- Workspace & Product Settings
- Members, Roles & Permissions (existing management behavior only)

Navigation labels and groupings must be localized in Persian and English. Avoid adding a route for every filter or tab; use page-level tabs where views belong to the same user job.

## 4. Page template specifications

### P01 — Workspace Overview

**Purpose:** Give the user a reliable, high-level view of product position and the improvement cycle.

**Primary question:** Where are we now, what needs attention, and what is the next valuable action?

**Template:**
1. Header with workspace/product context and period.
2. Product readiness/context strip: profile completeness and data availability, only if measured.
3. Current-state summary: digital performance, competitiveness, and market coverage, with explicit unknowns.
4. Improvement-cycle panel: current stage from baseline through measurement.
5. Priority findings/opportunities with evidence/confidence and impact.
6. Roadmap progress and blocked/awaiting-approval items.
7. Recent verified outcomes and baseline changes.
8. Contextual AI Copilot prompt suggestions.

**Primary actions:** Complete/validate product profile; start an assessment; review top finding; open roadmap.

**Avoid:** unsupported global score, fabricated trends, false live status, or mixing task completion with business outcomes.

### P02 — Product Intelligence Profile

**Purpose:** Establish the canonical context shared by all analysis and planning.

**Template:**
1. Product identity header (name, category, brand, official digital properties).
2. Profile completeness and validation status with missing-field explanation.
3. Sections/tabs: Identity; Business Model & Value Proposition; Audience & Customer Segments; Markets & Languages; Objectives & Constraints; Competitors; Data & Evidence.
4. Source/provenance and confidence indicators for each important field.
5. Version history and change summary.
6. AI-suggested interpretations in a reviewable area, never silently committed.

**Primary actions:** Add/edit product information; validate an AI interpretation; inspect history.

**Avoid:** treating inferred facts as confirmed or implying profile setup is mandatory for unrelated browsing.

### P03 — Products & Services

**Purpose:** Manage multiple products, services, sub-products, and their relationship to the organization.

**Template:**
1. Page header with add-product action.
2. Search and filters by status, category, market, and owner.
3. Product/service list or cards with name, category, scope, profile readiness, and latest assessment date when available.
4. Product detail side panel or route navigation.
5. Empty state explaining how to add the first product.

**Primary actions:** Add product/service; open profile; compare selected products.

**Avoid:** showing seeded entities as customer-owned real products.

### P04 — Digital Product Assessment Overview

**Purpose:** Consolidate digital health and visibility across SEO, AEO, GEO, and technical foundations.

**Template:**
1. Header with product, digital property, geography, language, and assessment period.
2. Assessment coverage panel showing completed, partial, unavailable, and not-assessed dimensions.
3. Digital Performance Baseline with measurement timestamp and source quality.
4. Dimension cards for SEO, AEO, GEO, and technical infrastructure.
5. Findings list grouped by severity/impact and confidence.
6. Assessment history and comparison controls.
7. Recommendations linked to findings and evidence.

**Primary actions:** Configure assessment scope; inspect findings; compare assessment runs.

**Avoid:** presenting an aggregate score when coverage or source quality makes it misleading.

### P05 — SEO Assessment

**Purpose:** Explain traditional search performance and the technical/content factors influencing it.

**Template:**
1. Scope and source summary.
2. Technical health and crawl/index coverage.
3. Search-intent and keyword coverage.
4. Content quality/architecture and internal linking.
5. Metadata and structured data.
6. Authority/backlink signals where sourced.
7. Findings with affected URLs, evidence, severity, and suggested action.
8. Historical trend and comparison.

**Primary actions:** Inspect finding/URL; review recommended remediation; compare runs.

**Avoid:** invented search volumes, rankings, backlinks, or crawl observations.

### P06 — AEO Assessment

**Purpose:** Evaluate whether product information answers relevant user questions clearly and credibly.

**Template:**
1. Question/intent coverage and scope.
2. Answer clarity and extractability.
3. Entity and structured-information consistency.
4. Source credibility and topical authority evidence.
5. Gaps by audience, question category, and language.
6. Findings with source excerpts and provenance.
7. Assessment history.

**Primary actions:** Explore uncovered questions; inspect evidence; prioritize a content/information gap.

**Avoid:** implying a question was queried against an external engine unless it was actually executed.

### P07 — GEO Assessment

**Purpose:** Evaluate product/brand representation, discovery, citation, and recommendation in generative AI environments.

**Template:**
1. Selected AI surface/model, locale, geography, prompts, and run window (only if actually recorded).
2. Representation accuracy and coverage.
3. Citation/source visibility and source quality.
4. Competitor comparison in equivalent prompts.
5. Incorrect, missing, or outdated claims.
6. Findings with raw observable response evidence and timestamps.
7. Historical comparison.

**Primary actions:** Inspect an observation; compare equivalent prompt runs; create a finding.

**Avoid:** claiming hidden model reasoning, unsupported provider access, or unobserved citations.

### P08 — Technical & Digital Infrastructure Assessment

**Purpose:** Present technical conditions affecting accessibility, reliability, performance, and discoverability.

**Template:**
1. Digital property and assessment scope.
2. Rendering, crawl access, indexability, performance, security indicators, schema, and delivery dimensions.
3. Availability/coverage per check.
4. Evidence-backed technical findings and affected assets.
5. Risk/impact and dependencies.
6. Historical changes.

**Primary actions:** Inspect a technical finding; review evidence; add to an improvement initiative.

**Avoid:** security certification claims or unrun scanner results.

### P09 — Digital Baseline & Benchmark

**Purpose:** Compare measured digital performance with a context-specific reference and show the gap.

**Template:**
1. Baseline definition: product, property, market, language, time.
2. Benchmark definition and reference cohort/method.
3. Side-by-side baseline vs benchmark dimensions.
4. Gap magnitude, direction, confidence, and evidence coverage.
5. Largest actionable gaps.
6. Version history and methodology.

**Primary actions:** Inspect gap; change benchmark scope; turn a validated gap into a proposed initiative.

**Avoid:** universal industry averages without a disclosed source and comparable cohort.

### P10 — Product Value & Competitiveness Overview

**Purpose:** Explain how the product competes on customer value, product attributes, positioning, and market performance.

**Template:**
1. Product and market context.
2. Competitor/alternative coverage and selection rationale.
3. Value proposition and differentiation summary.
4. Comparison dimensions and evidence coverage.
5. Customer signals: reviews, complaints, service, availability, quality evidence.
6. Findings, root-cause hypotheses, and opportunities.
7. Related scenarios and roadmap initiatives.

**Primary actions:** Add/review competitor; open comparison; investigate a finding.

**Avoid:** treating online sentiment or imagery as verified physical quality.

### P11 — Competitive Landscape

**Purpose:** Explore direct/indirect competitors and substitute solutions in a defined market.

**Template:**
1. Market/geography and competitor-set controls.
2. Competitor landscape table/list with relationship type and selection evidence.
3. Competitor profile summary.
4. Positioning and value-proposition comparison.
5. Evidence coverage and missing data.
6. Change/history view.

**Primary actions:** Review competitor; adjust comparison set; open product comparison.

**Avoid:** unsupported market share, rankings, or competitor claims.

### P12 — Product Comparison

**Purpose:** Compare the product with selected competitors across meaningful attributes.

**Template:**
1. Product/competitor selector.
2. Comparison matrix grouped by features/specifications, price/value, packaging, quality evidence, availability, distribution, service, reviews, and digital presence.
3. Source and comparability markers per cell.
4. Differentiation opportunities.
5. Export/share report action only if existing capability supports it.

**Primary actions:** Select comparison set; inspect evidence; identify a differentiator.

**Avoid:** silently filling missing competitor values or comparing non-equivalent products.

### P13 — Differentiation & Value Proposition

**Purpose:** Assess clarity, relevance, distinctiveness, and evidence behind the product's value proposition.

**Template:**
1. Current value proposition statement and validation status.
2. Target audience/problem/value mapping.
3. Competitor positioning contrast.
4. Strengths, weak differentiation, underserved needs, and market niches.
5. Supporting/contradicting evidence.
6. Improvement hypotheses and confidence.

**Primary actions:** Edit/validate value proposition; review supporting evidence; propose a test.

### P14 — Findings & Root-Cause Diagnosis

**Purpose:** Move from symptoms to evidence-backed explanations and actionable opportunities.

**Template:**
1. Unified findings queue with domain, product, market, severity, impact, confidence, and state filters.
2. Finding detail: observation, affected scope, evidence, source, date, methodology, confidence.
3. Root-cause hypotheses with supporting/contradicting evidence.
4. Business impact and dependencies.
5. Related recommendations, scenarios, and initiatives.
6. Review/validation history.

**Primary actions:** Validate or challenge hypothesis; inspect evidence; create a proposed action.

**Avoid:** presenting a causal hypothesis as a verified root cause.

### P15 — Geo-Market Intelligence

**Purpose:** Compare the product's digital and competitive position across geographic markets.

**Template:**
1. Geography hierarchy and target-market selector.
2. Market overview: demand/context data only where sourced.
3. Local competitor set and selection rationale.
4. Regional digital presence and visibility.
5. Language-specific content/entity consistency.
6. Local customer needs, risks, and opportunities.
7. Side-by-side market comparison and expansion hypotheses.

**Primary actions:** Select market; inspect regional gap; compare markets.

**Avoid:** flattening regional differences or inventing local demand statistics.

### P16 — Product Evidence Graph

**Purpose:** Explore the traceable relationships between products, markets, claims, sources, observations, findings, decisions, and outcomes.

**Template:**
1. Graph/list toggle and entity-type filters.
2. Searchable entity/source list.
3. Interactive graph canvas with relationship legend.
4. Selected-node inspector: description, type, scope, provenance, confidence, freshness.
5. Evidence panel with supporting/contradicting sources.
6. Related findings, recommendations, decisions, tasks, and outcomes.
7. Accessible non-canvas representation.

**Primary actions:** Open node; follow relationship; inspect source; filter graph.

**Avoid:** a graph that cannot be understood without interaction or keyboard alternatives.

### P17 — Simulation & ROI Lab

**Purpose:** Compare hypothetical improvement strategies before committing resources.

**Template:**
1. Scenario list and create-scenario action.
2. Scenario builder: baseline, interventions, assumptions, dependencies.
3. Cost/resource/time inputs.
4. Benefit and risk estimates with uncertainty ranges.
5. ROI, break-even, expected-value, and downside panels when inputs support them.
6. Side-by-side scenario comparison.
7. Assumption provenance and scenario version history.

**Primary actions:** Create scenario; edit assumptions; compare; submit a proposal for review.

**Avoid:** guaranteed ROI, false precision, or presenting estimates as measured outcomes.

### P18 — Expert Network

**Purpose:** Find and coordinate qualified human expertise for review, consultation, or execution.

**Template:**
1. Search/filter by specialization, industry, market, language, and availability (only if supported).
2. Expert profile cards with verified credentials/skills and provenance.
3. Match rationale against the selected finding or initiative.
4. Engagement/consultation details and status.
5. Expert review and work history with approval boundaries.

**Primary actions:** View expert; request consultation; assign approved work where the capability exists.

**Avoid:** fabricated people, ratings, credentials, availability, or engagement states.

### P19 — Strategic Roadmap

**Purpose:** Present the prioritized sequence of improvement initiatives aligned to objectives.

**Template:**
1. Objective and target context.
2. Roadmap timeline/board with initiative status.
3. Prioritization rationale and impact/effort/cost/risk dimensions.
4. Dependencies, resource conflicts, milestones, and ownership.
5. Proposed vs approved vs scheduled initiatives.
6. Progress and verified outcome indicators.

**Primary actions:** Review initiative; adjust priority; approve or request review when authorized.

**Avoid:** showing unapproved proposals as committed work.

### P20 — Initiatives & Projects

**Purpose:** Group related tasks into coherent improvement programs.

**Template:**
1. Initiative list with objective, owner, status, priority, and target.
2. Initiative detail: rationale, findings/evidence, scenario, cost/time, milestones, dependencies.
3. Workstream and resource allocation.
4. Decision/approval history.
5. Related outcomes.

**Primary actions:** Create initiative; review dependencies; inspect linked findings.

### P21 — Task Board & Execution

**Purpose:** Coordinate the actual work required by approved initiatives.

**Template:**
1. Board/list/timeline views.
2. Task lifecycle: Proposed → Prioritized → Approved → Scheduled → In Progress → Completed / Failed → Verified.
3. Owner, execution mode (AI/human/hybrid), dependencies, due date, effort, status.
4. Approval gate and audit history.
5. Execution evidence, error/retry/recovery, and verification.
6. Outcome link and post-action measurement.

**Primary actions:** Open task; assign owner; review approval; record execution result only when authorized.

**Avoid:** treating "completed" as proof of success or implying external execution without an integration.

### P22 — Approvals & Decisions

**Purpose:** Give users control over consequential plans and external actions.

**Template:**
1. Pending approvals grouped by initiative/task/action.
2. Decision detail: what will happen, who/what is affected, cost, risks, permissions, reversibility.
3. Supporting evidence and scenario assumptions.
4. Approve/reject/request-changes actions with reason.
5. Immutable decision history and actor/time context.

**Primary actions:** Review decision; approve/reject when the user has permission.

**Avoid:** executing anything simply because a conversational assistant suggested it.

### P23 — Execution History

**Purpose:** Provide a traceable record of task execution and its observed result.

**Template:**
1. Filterable execution history.
2. Task, execution mode, actor, start/end time, status.
3. Inputs, outputs, evidence, errors, retries, and approvals.
4. Verification and linked outcome.
5. Audit/provenance detail.

**Primary actions:** Inspect execution; review failure; compare result to intended outcome.

### P24 — Continuous Improvement

**Purpose:** Show whether the platform's interventions are improving product and market performance over time.

**Template:**
1. Current improvement cycle and measurement window.
2. Baseline vs target vs current vs expected vs actual comparisons.
3. Outcomes by product, domain, market, and initiative.
4. Verified positive/negative/unexpected effects.
5. Learning notes and revised estimates.
6. Remaining gaps and next cycle priorities.

**Primary actions:** Start reassessment; inspect outcome; reprioritize next actions.

**Avoid:** claiming causation where only correlation is observed.

### P25 — Reports

**Purpose:** Let users explore and share evidence-backed summaries across the product lifecycle.

**Template:**
1. Report library with domain, product, market, date, and status filters.
2. Report preview with scope, methodology, source coverage, and limitations.
3. Findings, evidence, assumptions, recommendations, and decision summary.
4. Export/share controls only where implemented.
5. Version and access history.

**Primary actions:** Open report; generate a supported report; share/export only if existing behavior supports it.

### P26 — Data Sources & Integrations

**Purpose:** Explain where the product's information comes from and the status/permissions of each source.

**Template:**
1. Source inventory grouped by type.
2. Source owner, authorization scope, connection state, last successful collection, freshness.
3. Data coverage and quality.
4. Failure/reauthorization state.
5. Provenance links into findings and reports.

**Primary actions:** Inspect source; review permission; manage an existing connection.

**Scope note:** Design-only in this task. Do not add, authorize, or connect any provider or service.

### P27 — Activity, Notifications & Workspace Settings

**Purpose:** Manage collaboration and workspace-level preferences without obscuring the product workflow.

**Template:**
- Activity: chronological product/workspace events with actor, object, and provenance.
- Notifications: grouped by approval needed, assessment finished, execution failed, outcome measured, and general updates.
- Settings: workspace identity, members, roles, preferences, locale/theme, and security options supported by existing code.

**Primary actions:** Open related item; manage notification preference; review workspace settings.

**Avoid:** creating new identity, role, or integration mechanisms.

## 5. Cross-page patterns

- Product selector and market selector retain context when navigating within a product journey.
- Finding detail is a reusable route/panel pattern linking evidence, root cause, scenario, initiative, task, and outcome.
- Source/provenance inspector is available anywhere a material claim or metric appears.
- Baseline/benchmark/target/current/actual comparisons use consistent labels and semantics.
- Approval actions are visually distinct from ordinary navigation or suggestions.
- Data availability, freshness, confidence, and illustrative status are explicit.
- Empty states explain how to reach first value without implying unavailable features are live.

## 6. Visual direction and existing foundation

The repository contains existing Next.js 16 App Router, React 19, TypeScript, Tailwind v4, locale/theme providers, an authenticated dashboard layout, navigation components, local Persian font assets, and design-token foundations. Reuse and refine these rather than creating a second shell.

Prior redesign artifacts describe a clean editorial enterprise direction (Signal Atlas): strong typography, spacious layouts, restrained warm vermilion action color, neutral surfaces, subtle depth, and clear evidence visualization. Existing FE-000/FE-001 work also documents bilingual RTL/LTR and dark/light foundations. The final dashboard token decisions must reconcile those artifacts with current `src/styles/tokens.css` and `src/app/globals.css`; do not replace global tokens speculatively in this page-template phase.

## 7. Acceptance criteria for page templates

- All nine product domains have clear page destinations and a coherent relationship to the operating cycle.
- Cross-cutting capabilities are represented without becoming a disconnected tool catalog.
- Every page has purpose, scope/context, content hierarchy, primary actions, and product-truth cautions.
- All pages include relevant empty, loading, partial, error, stale, permission, and illustrative states.
- Navigation is localized and works with existing `/[locale]/dashboard` route conventions.
- No page implies unimplemented backend or external-service capability.
- The existing dashboard shell and technical architecture remain the intended foundation.
- Component-level specifications are intentionally deferred until the page templates are reviewed as a coherent information architecture.

## 8. Next design stage

The next stage is to create a separate component specification for each page template. Components must be designed as independent, reusable pieces with explicit props/data contracts, states, accessibility behavior, responsive behavior, and provenance/status treatment. Only after page-level component specifications are complete should the dashboard pages be assembled and integrated into the existing shell.
