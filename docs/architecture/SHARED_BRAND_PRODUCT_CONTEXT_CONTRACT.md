# Shared Brand & Product Context Contract

**Status:** Normative cross-dashboard contract  
**Owner-facing source:** Brand page (`/dashboard/brand`)  
**Canonical domain:** Workspace → Brand → Offer → versioned Product Intelligence Profile (PIP) → approved Evidence/Documents  
**Scope:** All 17 dashboard pages and all 13 integrated capabilities

## 1. Mandatory rule

The Brand page is the customer's one-time intake and ongoing maintenance point for reusable business context. Customers provide brand identity, products/services, audience, value proposition, markets, competitors, channels, brand voice, constraints and supporting documents there. Every authorized dashboard capability consumes the relevant current context through this shared contract. A customer must not be asked to re-enter the same reusable facts in SEO, AEO, GEO, Content Studio, reports, planning or another tool.

A tool may ask for a genuinely task-specific input, or for a shared field that is missing, ambiguous, stale, unreviewed or strictly required for that task. When a shared field needs correction, the canonical destination is Brand—not a second competing form in the tool. This rule applies to the entire dashboard, not only AEO Content.

## 2. Reuse existing domain concepts; do not create a parallel profile

- Workspace is the shared customer operating context and tenant boundary. SEO, AEO and GEO remain independently entitled services inside the same Workspace.
- Brand represents the customer's business/brand identity.
- Offer is the customer's physical product, digital product or service. Offer nature is exactly `physical`, `digital` or `service`; sales channels remain separate and may be multiple.
- PIP is the canonical, versioned representation of reusable business and Offer context. It is distinct from observed baseline, benchmark, OXENN service SKU, subscription and entitlement.
- Evidence/Document retains source, permission, purpose, review state and traceability. Extracted text is not automatically an approved PIP fact.

Do not create a second SharedContext/BrandProfile/ProductProfile store or parallel intelligence engine if canonical Workspace/Brand/Offer/PIP records can own this responsibility. Any schema extension requires prior reconciliation of schema, repositories, ownership registry, RLS and migration history.

## 3. Separate three layers

### 3.1 Shared business context — maintained in Brand

Reusable facts include seller/organization identity; Brand and Offer identity, nature and description; value proposition, benefits, features and differentiating claims; audience, needs, use cases and buying barriers; target markets, geographies, languages and channels; pricing/business model when supplied; customer-identified competitors; brand voice, terminology and approved claims; objectives, constraints, approved documents and evidence references. The profile may be partial; missing fields remain explicit.

### 3.2 Task-specific inputs — owned by the tool/run

Examples: URL/page to crawl, prompt/query set, date range, provider/model, crawl scope, report period, content format/brief, channel, current editing instruction, comparison cohort or remediation selection. These are not copied into PIP unless the customer explicitly saves a reusable preference. A task-specific input must not trigger re-entry of unrelated Brand/PIP fields.

### 3.3 Derived observations and outputs — owned by the capability

Crawls, search observations, AI responses, citations, entity matches, content analyses, findings, scores, drafts, recommendations, reports and execution outcomes remain domain-specific records. They reference the Workspace, Brand, Offer and exact PIP version used where relevant. They never overwrite customer-confirmed profile facts without an explicit review/acceptance flow.

## 4. Context resolution and logical envelope

Every data access and execution path resolves context server-side:
1. Authenticate the user and derive tenant/Workspace from trusted session and membership. Never trust client-supplied tenant identity.
2. Resolve the active Brand in that Workspace.
3. Resolve the relevant Offer when the task is Offer-specific.
4. If one eligible record exists, use it; if multiple plausible Brands/Offers exist, require explicit selection and preserve the selection. Never guess or create duplicates.
5. Load the current approved PIP version and only the bounded fields/evidence required for the task.
6. Enforce service entitlement, permissions and source authorization separately. Context availability does not grant an SKU or external-source access.

The logical context envelope includes, as applicable: `workspaceId`, `brandId`, `offerId`, `profileId`, immutable `profileVersionId` or context snapshot reference, profile completeness/lifecycle state, requested field set and field state, provenance/evidence references, approval state, freshness and resolution time. These are contract concepts; map them onto canonical repository types rather than blindly adding duplicate columns.

## 5. Provenance, versioning and invalidation

Material fields distinguish customer-provided/confirmed values, imported/extracted values awaiting review, direct observations, third-party claims, AI-inferred estimates/hypotheses and target-state goals. Preserve source/evidence, actor, timestamps, confidence, freshness, review state and profile version where applicable. AI inference or extraction must never silently replace a confirmed fact. Conflicts remain reviewable.

Material edits create a new immutable PIP version. Each analysis/run/report pins the exact profile version or snapshot it consumed. A later edit never rewrites historical artifacts; dependent current analyses may become stale and require their own re-analysis workflow. Read-only dashboard requests must not create demo brands, sample Offers, synthetic evidence or analyses as side effects.

## 6. Missing, partial, ambiguous and stale behavior

- Missing: preserve page/components; identify the exact missing field or task input. Link to Brand only for a shared fact.
- Partial: proceed with valid available fields when the task permits; disclose omitted dimensions and never invent values.
- Ambiguous: ask the user to select an existing Brand/Offer.
- Stale: show the PIP version/last update and mark dependent results stale; do not call them current.
- Unreviewed: extracted/inferred data is not an approved fact; request review only when material to the current task.
- Restricted/unavailable: distinguish access denial, missing entitlement, disconnected source and system failure from empty data.

A comprehensive PIP is not a universal prerequisite for standalone SEO/AEO/GEO. Each independent service uses its own minimum required shared fields plus task-specific inputs, permissions, entitlement and quota. A workflow that genuinely needs a more complete profile, such as optional comprehensive Product Assessment, may request those fields and explain why.

## 7. Consumer mapping — 17 primary pages

| Page | Shared context consumed | Task-specific inputs remain separate |
|---|---|---|
| Brand | Owns Brand/Offer/PIP intake, review, correction and versions | Field edits, uploads, explicit record selection |
| AEO | Brand/Offer identity, approved claims, audience, value proposition, markets/languages, evidence | Prompt set, provider/model, period, run options |
| SEO | Brand/Offer identity, domains/channels, target market/language | Domain authorization, crawl scope, search source, period |
| GEO | Brand/Offer identity, claims, audience, differentiators, markets/languages, evidence | Target pages, prompt set, provider/surface, run options |
| Quick Audit | Matching authorized Website and relevant Brand context | URL, scope, consent, run options |
| SEO user reports | Brand/Website and market context | Search property, period, filters |
| Periodic reports | Context of selected underlying service | Schedule, period, recipients, delivery authorization |
| AI answer reports | Brand/Offer identity and approved claims | Provider/model, prompt sample, period |
| Prompt query reports | Relevant Brand/Offer and audience | Executed prompts, provider, locale, time window |
| Content Studio | Brand voice, terminology, approved claims, Offer, audience, value proposition, evidence | Source URL/text, format, brief, channel, length, editing instruction |
| Prompt Research | Brand/Offer identity, audience, differentiators, terminology | Prompt set, provider/model, locale, schedule |
| Planning | Selected Brand/Offer, approved goals, constraints, findings/evidence | Initiative, owner, due date, budget, action approval |
| Marketing | Workspace identity and context needed to explain service fit | SKU choice, entitlement, quota, purchase/activation/billing |
| SEO technical improvement | Website, Brand and target market | URL set, issue filters, remediation scope |
| Site health/Premium Audit | Authorized Website and Brand context | Crawl permission, depth, schedule, filters |
| Technical issues | Brand/Website and originating finding links | Status, severity, assignee, remediation workflow |
| Product Review | Full relevant Offer/PIP, target market, customer needs, value proposition, evidence | Assessment scope, cohort, criteria, evaluation period |

## 8. Consumer mapping — 13 integrated capabilities

| Capability | Shared-context rule |
|---|---|
| AEO Audits | Resolve Brand/Offer and pin PIP version; prompts/provider remain run-specific. |
| AEO Playground / Prompt Intelligence | Reuse identity and differentiators; prompt definitions/executions remain separate. |
| AEO Content Intelligence | Consume selected Offer, audience, claims, value proposition, language and approved evidence; page URL/content/scope remain task-specific. |
| Competitor Radar | Use Offer category, differentiators, market and customer-identified competitors; observed competitors remain sourced findings until reviewed. |
| Brand Citations | Resolve Brand/Offer identity and aliases; citations remain source observations. |
| Entities Graph | Reuse approved identity, aliases and relationships; inferred matches require evidence/confidence. |
| LLM Response Share & Bias | Scope observations to selected Brand/Offer/market; provider/model/query samples remain observation metadata. |
| Content Ingestion | Attach extraction to Workspace/Brand/Offer; extraction alone never approves or overwrites PIP. |
| Profile | Reuse account/workspace identity; no second Brand/PIP profile. |
| Settings | Manage workspace context preferences/access; do not duplicate Brand/Offer facts. |
| Billing | Use Workspace/SKU entitlement records; PIP never determines billing/access. |
| Help | Use locale and authorized product context only when useful; never expose other tenants. |
| SEO Schema | Reuse approved Brand/Offer names, descriptions, attributes and URLs; generated schema is reviewable before publication. |

## 9. Authorization and bounded retrieval

Every consumer rechecks tenant ownership and authorization at its own server Action/API boundary. Shared context is not broadcast wholesale to every tool or model; retrieve only fields/evidence needed for the declared task. Evidence retains purpose restrictions and permissions. Retrieved documents, website text and provider responses are untrusted data, not instructions. Context payloads must not expose secrets, unrelated personal data or other Offers.

## 10. Acceptance tests

1. Reusable Brand/Offer facts entered once in Brand are available to every authorized consumer without re-entry.
2. A material edit creates a new PIP version; historical runs keep their original version reference.
3. Each tool receives only required shared fields plus its task-specific inputs.
4. Missing shared facts are completed in Brand; no duplicate per-tool profile field is introduced.
5. Multiple Brands/Offers require explicit selection; cross-Workspace access is denied.
6. Partial PIP supports standalone SEO/AEO/GEO when each service's minimum requirements are met.
7. Extraction, inference, seed/sample and stale data cannot masquerade as confirmed current facts.
8. Entitlements, permissions and source authorization are independent of context resolution.
9. Context updates mark dependent current analyses stale without mutating history.
10. All 17 pages and 13 integrated capabilities have consumer mappings and verified/partial/unknown implementation status.
11. Missing context never removes page components; dashboard data-state and empty-component contracts remain in force.

## 11. Execution sequence and current status

- Dashboard Stage 1: include this contract in page/data/API contracts and consumer traceability.
- Dashboard Stage 3: reconcile Workspace/Brand/Offer/PIP/Evidence with the current schema; define context envelope, ownership, version references and tenant constraints. Migrations only if a verified gap exists and a separate migration authorization is granted.
- Dashboard Stage 4: make Brand the one-time intake/review/maintenance workflow; connect ingestion to reviewed profile facts; expose completeness and version history.
- Dashboard Stage 5: pin profile version and purpose-specific field selection to each AI observation.
- Dashboard Stages 6–10: Prompt Research, AEO, GEO, SEO and audits consume shared context without repeated intake while retaining their independent inputs and entitlements.
- Dashboard Stage 11: Content Studio reuses Brand voice, Offer, audience, claims and evidence; AEO Content Intelligence remains in its approved GEO location and shares the same context.
- Dashboard Stages 12–17: reports, planning, marketing, technical tools, Product Review and Account/Agent use the same canonical context according to their consumer mappings.
- Dashboard Stage 18: verify context resolution, versioning, tenant isolation, provenance, stale invalidation, partial profiles and no duplicate intake in both locales/directions.

No stage may create a parallel profile or ask for already available shared fields. Add a field to Brand only when it is a reusable business fact; tool-specific run inputs remain in their domain.

## 12. Current implementation status

The approved product architecture defines PIP as canonical and versioned. The repository baseline recorded that persisted Offer/PIP models were not present in the inspected Workspace schema at that snapshot. Brand form and document-ingestion paths exist, but ingestion alone does not establish a complete, approved, versioned shared context. This contract defines target behavior; it does not claim that all dashboard consumers are already connected or that a live database is connected. Revalidate current code, schema, Actions/APIs, RLS, tests and execution stage before implementation; label each consumer VERIFIED, PARTIAL, INFERRED or UNKNOWN.
