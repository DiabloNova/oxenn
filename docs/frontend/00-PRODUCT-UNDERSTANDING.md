# OXENN — Product Understanding for Dashboard Design

**Source of truth:** [Product Architecture](https://github.com/DiabloNova/oxenn_documents/blob/main/product_architecture.md)  
**Repository:** https://github.com/DiabloNova/oxenn  
**Branch:** `feat/architecture-driven-dashboard`  
**Status:** Product interpretation for frontend design; not a backend/API change proposal.

## 1. Product definition

OXENN (Seorchable) is a **Product & Market Improvement Intelligence Platform**. It helps a person or organization understand a product's current digital presence and market position, identify evidence-backed gaps and root causes, evaluate improvement options, prioritize and execute approved actions, and measure actual outcomes over time.

The product is not a collection of unrelated SEO, AEO, GEO, analytics, AI-tool, and reporting screens. Its user experience must communicate one connected operating system:

`Product context → Evidence and market data → Assessment → Diagnosis → Scenarios and economic evaluation → Prioritized decisions → Approved execution → Outcome measurement → Updated product intelligence`

The primary product promise is to connect intelligence to decisions, decisions to execution, and execution to measurable outcomes.

## 2. Nine primary product domains

### 2.1 Product Intelligence Profile

The canonical, contextual record for the product being assessed. It includes product identity, organization, products and services, business model, value proposition, audiences, customer segments, markets, languages, objectives, constraints, known competitors, data sources, historical assessments, and evidence quality.

UX implications:
- Make the profile the context anchor for every major assessment and recommendation.
- Show profile completeness, validation state, last change, and source/provenance context without inventing completion percentages.
- Separate confirmed facts, user-provided inputs, AI interpretations, assumptions, and missing information.
- Support profile version history and corrections as concepts in the information architecture.
- Make product and market scope visible wherever users switch context.

### 2.2 Digital Product Assessment

Evaluates a product's digital health, visibility, discoverability, accessibility, and representation across traditional search and AI-powered information environments.

Assessment dimensions:
- SEO: technical health, crawlability/indexability, architecture, content, metadata, structured data, performance, search-intent coverage, authority signals, and organic visibility.
- AEO: question coverage, answer clarity, information structure, extractability, entity consistency, credibility, topical authority, and intent alignment.
- GEO: brand/product representation in generative answers, entity recognition, citations, source visibility, factual consistency, intent coverage, geography, and language.
- Technical/digital infrastructure: rendering, performance, security-related indicators, schema, content delivery, integration quality, and data availability.

UX implications:
- Let users select product, website/digital property, geography, language, assessment scope, and time context.
- Distinguish assessment baseline, findings, evidence, severity, impact, confidence, freshness, coverage, recommendations, and history.
- Show missing/unavailable measurements as unknown or unavailable, never as zero.
- Keep SEO, AEO, and GEO as related assessment lenses rather than treating them as the whole product.

### 2.3 Product Value & Competitiveness

Evaluates actual product value, positioning, differentiation, and competitive strength beyond digital visibility.

Assessment dimensions:
- Direct and indirect competitors, alternatives, and substitutes.
- Product/service feature and specification comparison.
- Price/value, quality evidence, packaging, availability, distribution, service, reviews, complaints, and target audience.
- Differentiation, value proposition, underserved needs, market niches, and root causes of weak performance.

UX implications:
- Make comparison dimensions explicit and context-dependent.
- Expose missing or incomparable information.
- Separate verified facts, third-party claims, hypotheses, and inferred causes.
- Connect competitive findings to evidence and potential improvement options.

### 2.4 Geo-Market Intelligence

Evaluates the product in defined geographic markets. Supports country, region, city, local market, and other meaningful geographic segments.

UX implications:
- Geography, language, and market segment must remain explicit filters/context, not incidental metadata.
- Do not collapse materially different regional results into a universal market score.
- Show local competitors, regional visibility, customer needs, market opportunities, and risks with scope and provenance.
- Map views are optional representations; never make a map the only way to understand the data.

### 2.5 Product Evidence Graph

The shared evidence and relationship model connecting organizations, products, markets, competitors, claims, sources, observations, metrics, findings, gaps, recommendations, scenarios, decisions, initiatives, tasks, execution records, and outcomes.

UX implications:
- Treat the graph as a traceability and exploration experience, not merely a decorative network visualization.
- Allow users to move from a claim/finding to supporting or contradicting evidence, its source, collection time, scope, methodology, confidence, and related actions.
- Provide both a readable list/table and a graph exploration view.
- Make provenance and relationship type understandable.

### 2.6 Simulation & ROI Lab

Models possible effects and economic implications before significant resources are committed.

UX implications:
- Scenario setup must expose initial conditions, proposed changes, assumptions, dependencies, cost, resources, time horizon, benefits, risks, and uncertainty.
- Separate measured baseline, user assumptions, historical references, model estimates, and predicted outcomes.
- Compare scenarios across value, cost, speed, risk, and strategic fit.
- Never present simulated outcomes as guaranteed or observed results.

### 2.7 Expert Network

Connects intelligence findings to qualified human expertise and professional review or execution.

UX implications:
- Expert profiles should communicate verified skills, specialization, relevant experience, market/industry fit, and review status only when supported.
- Distinguish AI-generated, expert-reviewed, human-approved, expert-executed, and independently verified work.
- Matching, engagement, assignment, and consultation states must be clear.
- Do not fabricate experts, credentials, availability, or endorsements in sample UI.

### 2.8 Planning & Execution Engine

Converts objectives and evidence-backed opportunities into prioritized initiatives, projects, milestones, tasks, assignments, approvals, and controlled execution.

UX implications:
- Make the reasoning behind prioritization visible: expected impact, effort, cost, evidence confidence, strategic fit, dependencies, risk, time-to-impact, and reversibility.
- Show ownership, dependencies, required resources, approvals, schedule, execution state, failures, recovery, and verification.
- Distinguish task completion from verified outcome achievement.
- Human, AI-assisted, and hybrid execution must be visually distinct.
- Approval must precede commitments or external side effects.

### 2.9 Continuous Improvement Loop

Measures the effects of executed actions against baselines and targets, learns from verified outcomes, updates product intelligence, and reprioritizes future work.

UX implications:
- Compare baseline, target, current, expected, and actual outcome values.
- Show measurement windows, data freshness, methodology, and uncertainty.
- Explain what changed, whether the intended effect occurred, and what should happen next.
- Avoid presenting correlation as proven causation.

## 3. Cross-cutting workspace capabilities

These capabilities support all nine domains and should be consistently available:

- **AI Copilot and conversation:** contextual questions, explanations, challenges to findings, scenario exploration, plan changes, progress review, and discussion of unexpected outcomes. A conversation is not itself an approval or execution authorization.
- **Reporting and visualization:** evidence-backed product, digital, competitive, geographic, scenario, roadmap, execution, and outcome reporting.
- **Data-source and integration management:** connection state, authorization scope, source provenance, data freshness, and failure status. The current task does not authorize adding or connecting any integrations.
- **Organization and workspace management:** organizations, workspaces, products, users, roles, permissions, collaboration, history, and activity.
- **Identity, access, and governance:** permissions, approvals, audit history, versions, provenance, and controlled execution.

## 4. End-to-end user mental model

1. Establish or select a product and its business context.
2. Define target markets, audiences, languages, and objectives.
3. Establish the digital and market baseline.
4. Explore findings, competitors, and evidence.
5. Diagnose gaps and likely root causes.
6. Explore alternative improvement scenarios and economic implications.
7. Choose and approve a prioritized roadmap.
8. Coordinate AI and human execution.
9. Verify results and measure outcomes.
10. Update the profile and begin the next improvement cycle.

The dashboard should always help the user answer: **Where are we now? What evidence supports that? What is preventing progress? What should we do next? What changed after execution?**

## 5. Vocabulary and conceptual boundaries

Use these terms consistently:
- **Product Intelligence Profile:** canonical product/business context; it supersedes the earlier Digital Twin label as the primary product representation in the revised strategy.
- **Digital Performance Baseline:** measured current digital state.
- **Digital Presence Benchmark:** context-specific reference model for comparison.
- **Finding:** an observed or derived issue/opportunity tied to evidence.
- **Hypothesis:** a possible explanation that is not yet verified.
- **Scenario:** a modelled possible intervention and its estimated consequences.
- **Initiative / task:** approved or proposed units of planned work.
- **Execution result:** what happened while carrying out a task.
- **Outcome:** measured effect after execution; not synonymous with task completion.

The Product Architecture's nine domains are the dashboard's organizing model. The Digital Twin concept may inform current/target-state comparisons, but it is not the primary navigation or organizing architecture.

## 6. Evidence and product-truth rules

Every interface must preserve these distinctions:
- Observed facts vs third-party claims.
- User-provided information vs AI interpretation.
- Verified conclusions vs hypotheses.
- Measured values vs estimates and predictions.
- Live data vs illustrative/demo fixtures.
- Task completion vs outcome verification.
- Available data vs missing, stale, unavailable, or failed data.

Any sample dataset used during frontend-only work must be visibly labelled as illustrative. Do not invent live metrics, citations, competitors, expert identities, integrations, market share, results, or operational statuses.

## 7. Scope boundaries for this dashboard work

In scope:
- Product understanding and information architecture.
- Page templates and page-level UX specifications.
- Reusable component design and page assembly.
- Frontend-only implementation in the existing application architecture.
- Local illustrative fixtures where clearly labelled.
- UI tests and visual QA where an execution environment is available.

Out of scope:
- Backend, API, database, migration, infrastructure, authentication, or authorization architecture changes.
- Connecting new data providers, external services, AI providers, project-management tools, or other integrations.
- Deployment, production changes, merge to `main`, or PR creation unless separately requested.

Preserve existing Next.js App Router, React, TypeScript, Tailwind CSS v4, locale/theme infrastructure, auth shell, and existing project conventions. Do not create a parallel application shell or replace the technical architecture.

## 8. Source reconciliation

- The current product architecture document in `oxenn_documents/product_architecture.md` is the governing source for the dashboard's nine-domain model.
- The November 6 Product Strategy v2 document clarifies terminology and the two service pillars; these can coexist with the nine-domain product architecture.
- The earlier MVP-only decision (Technical SEO Audit and AI Visibility Audit) predates the revised product architecture and is not the dashboard's organizing scope for this task.
- The existing repository's current route inventory and design audits are evidence about implementation, not a reason to revert to the old product model.
