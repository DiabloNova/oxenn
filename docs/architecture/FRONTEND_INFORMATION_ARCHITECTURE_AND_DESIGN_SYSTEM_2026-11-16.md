---
visibility: internal
---

# OXENN — Frontend Information Architecture & Design System
## Stage 2: Architecture and UX specification

**Status:** Stage 2 specification completed; implementation is not part of this document  
**Repository:** DiabloNova/oxenn  
**Working branch:** redesign/frontend-inventory-2026-11-16  
**Stage 2 base commit:** fff174b5c5ab3fb9ee718f9230be0b0963ce3129  
**Main snapshot reviewed:** b56517bc436a8cd03ef75bfac8adbf43c8567753  
**Product architecture authority:** DiabloNova/oxenn_documents/product_architecture.md, main snapshot reviewed at 31ad499e65cc51c9436cf58f2a97b265ee868e38  
**Related project task:** TASK-94

---

## 1. Purpose, scope, and decision status

Stage 1 mapped the existing 59 localized page routes, shell/layout ownership, navigation sources, UI foundations, and the boundaries between frontend presentation and application services. Stage 2 turns that inventory into a coherent information architecture, navigation model, shell plan, route disposition, URL compatibility strategy, and design-system contract.

This is a **design and architecture specification**, not a code migration. The decisions below are the recommended target baseline for subsequent implementation planning. They do not claim that the target pages or capabilities already exist.

### Included

1. Public website information architecture and sitemap.
2. Authenticated Workspace navigation based on the nine approved product domains.
3. Separate public product documentation and legacy engineering documentation experiences.
4. Account and authentication route architecture.
5. One disposition decision for every existing localized page route.
6. Component, shell, provider, and navigation dependency map.
7. URL, locale, redirect, and compatibility rules.
8. Design-system foundations and component behavior requirements.
9. Product truth, evidence, authorization, entitlement, and execution-governance rules.
10. Implementation waves, acceptance criteria, and validation matrix.

### Excluded

- Replacing page components or writing UI implementation code.
- Editing route handlers, Server Actions, business services, database schemas, migrations, or provider integrations.
- Changing authentication, entitlement, billing, or authorization behavior.
- Deleting existing components, generated files, or legacy routes.
- Deployments, pull requests, or merges.

### Existing parallel work that must remain isolated

| Work item | Current ownership | Stage 2 boundary |
|---|---|---|
| TASK-21 — architecture-driven dashboard | Dashboard page templates, page-level component design, and centralized dashboard assembly | This document defines the product IA and route disposition only. It does not take over the dashboard implementation claim or edit dashboard UI paths. |
| TASK-77 — public homepage | Approved Signal Atlas direction and public homepage implementation | This document defines the public-site architecture and design constraints. It does not edit the homepage, header, footer, or TASK-77 branch. |
| TASK-93 — documentation registry | Canonical ID, generated registry, public documentation route, and legacy documentation API/UI migration | This document preserves the public-docs versus engineering-docs separation. It does not change the docs generator, docs API, docs index, content registry, or TASK-93 branch. |

Integration links from the navigation to these areas should be implemented only after the owning work is available and reviewed. No active task is superseded by this specification.

---

## 2. Governing product model

The frontend must represent the approved OXENN product, not merely the set of tools that happen to have pages in the current repository.

### 2.1 Nine product domains

| # | Product domain | User-facing responsibility | Primary information objects |
|---:|---|---|---|
| 1 | Product Intelligence Profile | Describe the customer’s existing Offer, business context, intended audience, markets, goals, constraints, and target state | Customer Offer, versioned PIP, profile history, data gaps |
| 2 | Digital Product Assessment | Assess digital presence and digital performance across search and AI-answer experiences | Assessment, SEO/AEO/GEO evidence, baseline, findings |
| 3 | Product Value & Competitiveness | Assess product value, customer fit, pricing, competition, differentiation, and root causes | Competitor, comparison, value proposition, gap |
| 4 | Geo-Market Intelligence | Evaluate a product in relevant markets and geographic contexts | Market, geography, category, channel, local competitor |
| 5 | Product Evidence Graph | Connect Offers, entities, sources, observations, claims, assessments, findings, recommendations, decisions, and outcomes | Evidence item, entity, relationship, provenance |
| 6 | Simulation & ROI Lab | Explore scenarios and estimate possible effects before resources are committed | Scenario, assumption, model, estimate, comparison |
| 7 | Expert Network | Connect customers to qualified human expertise where specialist review or execution is needed | Expert profile, engagement, review, approval |
| 8 | Planning & Execution Engine | Turn findings and decisions into prioritized, governed improvement programs | Recommendation, plan, task, approval, execution |
| 9 | Continuous Improvement Loop | Measure outcomes over time and feed verified results into the next cycle | KPI, outcome, measurement, history, reassessment |

These nine domains are the primary product architecture for the Workspace. They are not nine mandatory steps that every customer must complete before using a standalone service. Some domains may be delivered in stages and may remain unavailable in the MVP until their underlying contracts and implementation are ready.

### 2.2 Product concepts that the interface must never conflate

- **Customer Offer:** an existing physical product, digital product, or service belonging to the customer and being assessed.
- **Product Intelligence Profile (PIP):** a versioned description of the Offer and its target conditions. It is not the current-state baseline or a benchmark.
- **Current-state baseline:** a dated record of what is observed or known at a particular time.
- **Benchmark:** a context-specific comparison basis that must account for Offer nature, category, market, geography, price range, maturity, and available evidence.
- **OXENN service/SKU:** a service the customer selects from OXENN, such as SEO, AEO, GEO, or Product Assessment & Improvement.
- **Plan/subscription, entitlement, quota, usage ledger, bundle, and service run:** commercial and execution records belonging to OXENN’s service-delivery model, not attributes of the customer’s Offer.

**Social Commerce is a seller/channel dimension, not an Offer nature.** A social-commerce seller may offer a physical product, digital product, or service. The first-release Offer model must preserve those three Offer types and allow multiple sales channels.

### 2.3 Independent-service rule

SEO, AEO, and GEO must remain independently selectable and usable after registration and authentication. A customer may add another service later without repurchasing an already entitled service. The Digital Visibility Suite is an optional bundle, never a prerequisite. Product Assessment & Improvement is a broader optional service, not a prerequisite for standalone SEO, AEO, or GEO. AI Infrastructure is a separate product line and roadmap.

The UI must therefore distinguish:

1. **My Offers** — the customer’s products/services being assessed.
2. **Product Assessment & Improvement** — the broader assessment and improvement journey.
3. **OXENN Service Catalog** — the services the customer can activate or purchase.
4. **My Access and Usage** — the customer’s entitlements, quotas, consumption, and service history.

The user interface may show availability and guide the customer, but server-side authorization and entitlement checks remain authoritative. Hiding a link does not enforce access.

### 2.4 Product-truth rules

The following distinctions must be visible in relevant pages and reports:

- User-provided information versus direct observation.
- First-party observation versus third-party claim.
- Evidence versus estimate, hypothesis, or simulation.
- Current state versus target state.
- Complete versus partial, failed, or unavailable results.
- LIVE, MOCK, HYBRID, UNKNOWN, PARTIAL, and FAILED execution states where relevant.

**UNKNOWN is not ZERO.** Missing information must not become a fabricated observation, a zero score, or a false negative. Confidence, provenance, time, scope, method, and limitations should be visible at the evidence or metric level.

No page may use illustrative charts, mock results, or simulated scores as if they were live customer data. A simulated result must remain visibly labeled as simulated.

---

## 3. Target product surfaces

The product should be organized around four user-facing surfaces. Each surface has one shell, one navigation model, and a clear responsibility boundary.

### 3.1 Surface A — Public website

**Purpose:** explain the product, help visitors understand service choices, establish trust, and lead to registration or a relevant contact path.

**Recommended public sitemap**

| Navigation group | Route | Purpose |
|---|---|---|
| Home | / | Product positioning, customer value, principal journeys, evidence-based claims, and clear entry points |
| Product | /features | Overview of the Product & Market Improvement platform and its nine domains |
| Services | /services | Public catalog separating independent services from optional bundles and the broader assessment offering |
| Services | /services/seo | Standalone SEO service: scope, required inputs, outputs, and access path |
| Services | /services/aeo | Standalone AEO service: scope, required inputs, outputs, and access path |
| Services | /services/geo | Standalone GEO service: scope, required inputs, outputs, and access path |
| Services | /services/product-assessment | Optional Product Assessment & Improvement offering and its staged journey |
| Solutions | /solutions | Customer problems and outcome-oriented use cases, without duplicating the service catalog |
| Solutions | /solutions/protection | Brand protection capability/use case; do not present it as a separate paid SKU unless the service catalog explicitly supports it |
| Solutions | /solutions/radar | Competitor intelligence and market-comparison use case |
| Industries | /industries | Customer segments and industry contexts; do not hard-code a launch cohort before it is approved |
| Pricing | /pricing | Independent service plans, optional bundle terms, and Product Assessment & Improvement terms only where approved and current |
| Resources | /resources | Learning materials, guides, and other verified resources |
| Blog | /blog | Editorial content; case studies and benchmarks only when real, approved content exists |
| Product documentation | /public-docs | Canonical public product guidance in Persian and English |
| Company | /about | Company and product context |
| Contact | /contact | Contact and enterprise inquiry path |
| Legal | /privacy | Privacy information |
| Legal | /terms | Proposed route only if an approved Terms of Service document exists; do not link a placeholder |

The existing /features route should become the primary product-overview destination. A second, competing “Platform” overview route is not required.

**Header navigation model**

- Product
- Services
- Solutions
- Industries
- Resources
- Documentation
- Pricing
- Sign in
- Start / Register

Documentation should point first to /public-docs. The legacy /docs route should remain available as developer/engineering documentation and may be linked under a developer-specific resource entry; it must not be silently repurposed as public product documentation.

The header should not contain dashboard-only quick actions. The mobile drawer must be the same public navigation model as the desktop header, not a second independently authored sitemap.

**Footer navigation model**

- Product: product overview and verified domain summaries.
- Services: SEO, AEO, GEO, optional Digital Visibility Suite, Product Assessment & Improvement.
- Resources: public documentation, resources, blog, and verified learning materials.
- Company: About and Contact.
- Legal: Privacy and approved legal documents.

Remove or relabel links such as “Careers,” “Changelog,” “Case Studies,” or “Industry Benchmarks” when they currently point to unrelated generic routes. A label must not imply a dedicated page or capability that does not exist.

### 3.2 Surface B — Authenticated Workspace

**Purpose:** give a registered customer one shared Workspace in which they can manage Offers, run independent services, assess products, review evidence, make decisions, and track improvements.

The Workspace is the customer-facing context and membership boundary. A separate Workspace must not be forced for every service SKU.

**Recommended primary navigation**

| Group | Navigation item | Product domain / responsibility |
|---|---|---|
| Workspace | Overview | Cross-cutting summary, recent activity, current Offer/assessment context |
| Product | Offers & Profiles | Product Intelligence Profile |
| Assess | Assessments | Digital Product Assessment and Product Value & Competitiveness |
| Intelligence | Market & Competitors | Product Value & Competitiveness |
| Intelligence | Geo-Market Intelligence | Geo-Market Intelligence |
| Intelligence | Evidence Graph | Product Evidence Graph |
| Improve | Simulation & ROI | Simulation & ROI Lab |
| Improve | Experts | Expert Network |
| Improve | Plans & Execution | Planning & Execution Engine |
| Improve | Outcomes | Continuous Improvement Loop |
| Services | Service Catalog | Independent OXENN services and optional bundles |
| Services | SEO / AEO / GEO workspaces | Independent service workbenches, shown according to product readiness and access |
| Workspace tools | Reports & Analytics | Cross-cutting reporting and visualization |
| Workspace tools | AI Copilot / Query | Cross-cutting interaction and intelligence assistance |
| Manage | Billing & Usage | Service plans, entitlements, quotas, consumption, invoices |
| Manage | Workspace Settings | Workspace profile, membership, and preferences |

Do not expose a navigation destination solely because a route file exists. A route must have a defined user purpose, supported capability, authorization boundary, and truthful state before it becomes a primary menu item.

**Proposed domain route families**

The following are target route candidates, not routes already implemented:

- Offers & Profiles: /dashboard/offers and /dashboard/offers/[offerId].
- Assessments: retain /dashboard/audits as the compatibility entry; a future /dashboard/assessments alias may be introduced only with an explicit migration plan.
- Geo-Market Intelligence: /dashboard/geo-markets.
- Evidence: retain the current entities and citations routes as the first compatibility surface; a unified /dashboard/evidence family may be introduced after page-level parity is established.
- Simulation & ROI: /dashboard/simulations.
- Expert Network: /dashboard/experts.
- Planning & Execution: /dashboard/plans.
- Continuous Improvement: /dashboard/outcomes.
- Public-to-workspace service activation remains under /dashboard/services, with service-specific workbenches nested below it as those flows are validated.

Expert Network, Simulation & ROI, Planning & Execution, and Outcomes should not appear as active tools or produce live-result claims until their required data contracts and capabilities exist. If a future-facing preview is approved, it must be clearly labeled as planned/preview and must not imply that an operational workflow is available.

### 3.3 Surface C — Documentation

Two separate documentation experiences are required.

| Experience | Route | Audience and responsibility |
|---|---|---|
| Public product docs | /[locale]/public-docs | Customer-facing product concepts, getting started, workflows, service guidance, and approved user instructions |
| Engineering/developer docs | /[locale]/docs and /[locale]/docs/[slug] | API/developer and engineering material, with its existing registry/API compatibility contract |

The public documentation route must continue to read the fixed, allowlisted bilingual sources through its approved static-generation model. It must not be merged into the legacy engineering DOCS_INDEX. The legacy docs viewer must continue to resolve canonical document identities and preserve its existing compatibility rules as governed by the documentation registry contract and TASK-93.

The public product documentation should have a lightweight documentation shell, clear locale switching, search/table-of-contents where supported, and a return-to-product path. The engineering docs can keep their own categorized sidebar and search. Do not force both experiences into one sidebar or one content index.

### 3.4 Surface D — Account and access

**Purpose:** allow users to register, verify email, sign in, recover access, and manage their personal account without inheriting the full marketing or Workspace navigation.

Recommended account shell:
- Brand identity and locale switch.
- Focused page title and progress/state.
- Minimal links to sign in/register/recovery.
- Clear return path to the public website.
- No Workspace quick-action dock and no marketing mega-menu.

The profile route is personal account information. The top-level /settings route should remain account-level preferences. /dashboard/settings remains Workspace-level settings. Billing and service usage belong to the Workspace. The legacy /invoice route should be treated as a compatibility entry to Workspace Billing after the invoice view exists there; do not redirect it before the target view and permissions are ready.

---

## 4. Complete disposition of existing routes

The repository snapshot contains 59 localized page routes: 14 public marketing routes, 4 documentation/design-system routes, 7 account/billing routes, and 34 dashboard routes.

Disposition vocabulary:

- **REDESIGN:** preserve the route and responsibility, but redesign its page/shell to match the target IA.
- **KEEP:** preserve the route and current capability; improve consistency inside its target surface.
- **MERGE:** consolidate the user experience into a canonical page or workbench. Keep a compatible old URL until parity is verified.
- **REDIRECT:** the current page is a duplicate or empty alias. Redirect only after the target page exists, preserves required context, and passes route tests.
- **INTERNAL_ONLY:** preserve for engineering/internal use, but exclude it from the public sitemap and public navigation.

These are architectural decisions. Redirects and route deletions are not to be applied in Stage 2.

### 4.1 Public marketing routes (14)

| Existing route | Decision | Target purpose / compatibility |
|---|---|---|
| / | REDESIGN | Public homepage; Signal Atlas work remains owned by TASK-77 |
| /about | KEEP | Company context in the shared marketing shell |
| /blog | KEEP | Editorial content; do not imply case studies/benchmarks until populated |
| /contact | KEEP | Contact and enterprise inquiry path |
| /features | REDESIGN | Canonical product overview, mapped to the nine product domains |
| /industries | KEEP | Industry and customer-segment overview |
| /pricing | REDESIGN | Separate service SKUs, optional bundle, and broader Product Assessment & Improvement; only approved pricing/terms may be shown |
| /privacy | KEEP | Privacy/legal information |
| /resources | KEEP | Verified learning and resource index |
| /solutions | REDESIGN | Use-case overview distinct from product-domain and service catalogs |
| /solutions/aeo | MERGE | Move the primary service explanation to proposed /services/aeo; preserve the legacy URL or redirect after content and analytics parity |
| /solutions/geo | MERGE | Move the primary service explanation to proposed /services/geo; preserve the legacy URL or redirect after content and analytics parity |
| /solutions/protection | KEEP | Retain as a capability/use-case page; do not infer a distinct commercial SKU |
| /solutions/radar | KEEP | Retain as competitor-intelligence use case aligned to Product Value & Competitiveness |

### 4.2 Documentation and design-system routes (4)

| Existing route | Decision | Target purpose / compatibility |
|---|---|---|
| /docs | KEEP / INTERNAL_ONLY | Legacy engineering/developer docs; do not repurpose |
| /docs/[slug] | KEEP / INTERNAL_ONLY | Preserve canonical document selection and legacy selector compatibility |
| /public-docs | KEEP | Primary public product documentation destination |
| /design-system/tokens | INTERNAL_ONLY | Design-system reference; not a public marketing destination |

### 4.3 Account and billing routes (7)

| Existing route | Decision | Target purpose / compatibility |
|---|---|---|
| /forgot-password | KEEP | Account recovery in the minimal account shell |
| /invoice | MERGE | Eventually belongs to Workspace Billing > Invoices; keep current route until the destination view and auth behavior exist |
| /login | KEEP | Authentication entry |
| /profile | KEEP | Personal account profile |
| /register | KEEP | Registration entry; retain the email-verification journey |
| /settings | KEEP | Personal account preferences; distinguish from Workspace settings |
| /verify-email | KEEP | Email verification and resend/status flow |

### 4.4 Workspace/dashboard routes (34)

| Existing route | Decision | Target purpose / compatibility |
|---|---|---|
| /dashboard | REDESIGN | Workspace Overview; maintain this stable entry URL |
| /dashboard/aeo/audits | KEEP / REDESIGN | AEO service workbench and run history; keep as legacy service route if a nested service URL is later introduced |
| /dashboard/aeo/content | KEEP | AEO content-intelligence capability; distinguish content readiness from observed answer visibility |
| /dashboard/aeo/playground | KEEP / INTERNAL_ONLY until verified | Advanced AI playground; keep out of primary navigation until its capabilities and data state are verified |
| /dashboard/analytics | REDESIGN | Analytics and reporting hub |
| /dashboard/analytics/llm | KEEP | Specialized LLM/AI visibility analytics view |
| /dashboard/analytics/llm-bias | MERGE | Move into the analytics/reporting experience as a tab or detail view; preserve deep link until parity |
| /dashboard/audit/free | MERGE | Assessment/service entry with explicit authentication and server entitlement; do not treat “free” as anonymous |
| /dashboard/audit/premium | MERGE | Same assessment entry with a separately enforced premium entitlement; UI labels or query parameters do not grant access |
| /dashboard/audits | KEEP / REDESIGN | Canonical list of assessments and service runs; use the user-facing term “Assessments” where appropriate |
| /dashboard/audits/[id] | KEEP / REDESIGN | Assessment detail and evidence-backed findings; preserve the dynamic identifier and access checks |
| /dashboard/billing | KEEP / REDESIGN | Workspace billing, service entitlements, quota/usage, and invoice history |
| /dashboard/brand-monitoring | KEEP | Brand/evidence monitoring; map to Evidence and Continuous Improvement without claiming a full monitoring service beyond verified capability |
| /dashboard/brand/citations | KEEP | Citation/evidence explorer within Product Evidence Graph |
| /dashboard/competitive | KEEP / REDESIGN | Main Product Value & Competitiveness assessment view |
| /dashboard/competitors | REDIRECT after parity | Current page is a minimal stub; target /dashboard/competitive only after the target handles its expected context |
| /dashboard/competitors/radar | KEEP | Competitor radar as a secondary view of market/competitor intelligence |
| /dashboard/content | KEEP | Content Studio entry and content workspace |
| /dashboard/content/ingestion | MERGE | Duplicate/minimal ingestion entry; consolidate into /dashboard/ingestion after required behavior is present |
| /dashboard/content/studio | REDIRECT after parity | Duplicate/minimal Content Studio route; target /dashboard/content |
| /dashboard/entities | KEEP | Entity and product-context exploration; map to PIP/Evidence as page templates are defined |
| /dashboard/entities/graph | KEEP / REDESIGN | Product Evidence Graph view |
| /dashboard/graph | REDIRECT after parity | Current minimal stub; target /dashboard/entities/graph |
| /dashboard/ingest | REDIRECT after parity | Current minimal stub; target /dashboard/ingestion |
| /dashboard/ingestion | KEEP | Canonical current source/content ingestion form; future placement may be under Evidence/Data Sources |
| /dashboard/intelligence | KEEP / REDESIGN | Product/brand intelligence overview; preserve as an input to the PIP design owned by TASK-21 |
| /dashboard/optimization/technical | MERGE | Consolidate with /dashboard/seo/technical after component and behavior parity; retain a compatibility redirect |
| /dashboard/query | KEEP | AI Copilot/query workspace as a cross-cutting capability; it is not a substitute for a complete RAG or reasoning domain |
| /dashboard/rag | REDIRECT only after verification | Current minimal stub; redirect to /dashboard/query only if the user intent and functionality are equivalent, otherwise keep hidden until designed |
| /dashboard/reports | KEEP / REDESIGN | Cross-cutting reports and visualizations |
| /dashboard/seo/schema | KEEP | SEO service schema/metadata capability |
| /dashboard/seo/technical | KEEP | Canonical technical SEO workbench and action boundary |
| /dashboard/services | KEEP / REDESIGN | OXENN Service Catalog; separate from customer Offers and PIP |
| /dashboard/settings | KEEP | Workspace settings and membership/preferences, separate from personal /settings |

### 4.5 Important route-inventory notes

1. The route tree has multiple minimal dashboard stubs (including competitors, graph, ingest, and rag). A small page file is not evidence that its product function should be deleted. Hide unimplemented destinations from primary navigation and preserve compatibility until the destination is validated.
2. Content ingestion has three entry paths: /dashboard/ingestion, /dashboard/content/ingestion, and /dashboard/ingest. The large ingestion page should be treated as the current canonical behavior; duplicate stubs should not be redirected until its complete function and authorization have been checked.
3. Technical SEO appears under both /dashboard/seo/technical and /dashboard/optimization/technical. Consolidate the presentation around the SEO service workbench while preserving action behavior and old links.
4. Free and premium assessment routes must not be treated as anonymous or as independent entitlements based on a UI selection. Authentication and entitlement must be enforced on the server for every execution route/action.
5. No existing route may be removed simply because it is not in the primary menu. Detail pages, secondary workflows, and compatibility paths remain valid routes.

---

## 5. Centralized navigation and interaction model

The navigation data should be centralized by surface, not repeated within individual pages or hand-copied into header/sidebar/footer components.

### 5.1 Recommended navigation configuration boundaries

Use one typed navigation configuration with separate surface definitions, or separate typed modules under a common configuration directory:

- Public navigation: header, mobile drawer, footer groups.
- Workspace navigation: product-domain groups, service catalog entries, and contextual secondary routes.
- Documentation navigation: public-docs and engineering-docs each own their information model.
- Account navigation: minimal, task-focused actions.

Every entry should define a stable key, localized label, route, surface, optional parent/group, intended visibility, and an optional capability/entitlement display hint. These UI hints are not authorization. Server-side handlers must independently enforce access.

### 5.2 Route-aware active state

- Exact route match for leaf pages.
- Explicit parent match for nested routes.
- Dynamic identifiers should activate their owning section.
- Query parameters may control tabs/filters but must not create duplicate menu identities.
- Redirect and alias routes must resolve to a clear canonical item.
- The current locale must be retained when moving between pages.

### 5.3 Global controls

- The marketing header owns one public menu trigger and one public mobile drawer.
- The Workspace shell owns its sidebar, mobile navigation, workspace search, help entry, and service quick actions.
- A workspace quick-action dock must not appear on public pages, account flows, or documentation pages.
- Generic back navigation should not compete with the breadcrumb or browser history. Use breadcrumbs and explicit “back to list” links where the destination is known.
- Scroll-to-top may be a small utility on long public pages; it is not a substitute for route navigation.

---

## 6. Shell architecture and component ownership

### 6.1 Recommended App Router organization

Keep one locale-aware root layout and use route groups for surface-specific nested layouts. Route groups organize code without becoming URL segments.

| Proposed route group | URL responsibility | Layout responsibility |
|---|---|---|
| (marketing) | Existing public routes such as /, /features, /solutions, /resources | One LandingHeader, one LandingFooter, public navigation |
| (workspace) | Existing /dashboard/* routes | Protected Workspace shell, DashboardSidebar, DashboardTopbar, Workspace quick actions |
| (account) | /login, /register, /verify-email, /forgot-password, /profile, /settings, and compatible account routes | Minimal account shell and account-specific navigation |
| (product-docs) | /public-docs | Public product documentation shell |
| (engineering-docs) | /docs and /docs/[slug] | Existing engineering documentation shell and registry-aware navigation |

The locale root remains responsible for the HTML document, route locale, language direction, fonts, global CSS, and shared theme state. Group layouts wrap only their surface. Do not create multiple root layouts for these surfaces: switching between different root layouts can trigger full-page reloads and complicate shared state.

A conceptual target tree is:

- src/app/[locale]/layout.tsx
- src/app/[locale]/(marketing)/...
- src/app/[locale]/(workspace)/dashboard/...
- src/app/[locale]/(account)/...
- src/app/[locale]/(product-docs)/public-docs/...
- src/app/[locale]/(engineering-docs)/docs/...

This is an organizational proposal. Existing URLs remain unchanged because the group names are not part of the route path. Actual path movement must be performed only after confirming there are no route collisions.

### 6.2 Root providers and authorization

- ThemeProvider remains shared at the locale boundary because language, direction, theme, and locale-preserving navigation affect all surfaces.
- AuthProvider may later be scoped to account and Workspace groups if its remaining public-page consumers are removed or redesigned. Do not move it before checking every consumer, including pricing and any sign-in-aware public CTA.
- ProtectedRoute may control the Workspace UI experience, but it is not the security boundary.
- Every Route Handler, Server Action, and data-access operation must authenticate and authorize the current request, verify Workspace/resource scope, and enforce the service entitlement/quota where applicable.
- UI menu visibility, a route group, a layout, or a client-side session object does not authorize a service operation.

### 6.3 Component dependency map

| Existing component/module | Current responsibility | Target ownership / action |
|---|---|---|
| src/app/[locale]/layout.tsx | Locale document, providers, global FloatingSidebar and GlobalNavigationControls | Keep as locale/provider boundary; move surface-specific navigation out of the root |
| ThemeProvider | Language, direction, theme, locale-aware navigation | Keep shared; preserve RTL/LTR and preference behavior |
| AuthProvider | Client session state and login/register/logout context | Retain during migration; consider scoping to account/Workspace after consumer review |
| FloatingSidebar | Global three-item workspace quick-action dock | Move into Workspace shell or redesign as Workspace-only control |
| GlobalNavigationControls | Generic back and scroll-to-top utilities | Keep only the utility behavior needed per surface; avoid generic back competing with breadcrumbs |
| LandingHeader | Public nav, dropdowns, theme/locale controls, and AppSidebar drawer | One public header backed by public navigation config |
| LandingFooter | Independent six-group sitemap | One public footer using the same public navigation source |
| AppSidebar | Second hard-coded public/product/workspace menu | Retire only after all page-level consumers are removed and route/link parity is tested |
| DashboardSidebar | Workspace navigation renderer | Keep and bind to the canonical Workspace navigation configuration |
| DashboardTopbar | Workspace top bar and menu/help entry | Keep as Workspace-only shell component |
| dashboardNavigation.ts | Current dashboard navigation tree | Reconcile to the nine-domain IA; do not add unimplemented routes as active menu items |
| DashboardLayout | ProtectedRoute, workspace shell, sidebar state, topbar, help drawer, and footer/status row | Keep as Workspace shell; verify operational/status text is evidence-driven |
| dashboard/intelligence/layout.tsx | Intelligence breadcrumb | Keep only if page-level information architecture still needs a distinct sub-section; otherwise use shared breadcrumb convention |
| docs/layout.tsx | Engineering docs search, category navigation, and viewer shell | Keep for legacy engineering docs; align with registry contract/TASK-93 |
| public-docs/page.tsx + MarkdownContent | Bilingual public product docs route and safe Markdown rendering | Keep as separate product-docs experience |
| marketing components | Current page-specific marketing sections | Recompose through the shared marketing layout; do not copy header/footer into each page |
| feature components (audit, analytics, content, graph, ingestion, optimization) | Reusable domain/UI panels | Preserve as candidates for page templates; confirm all consumers before removal |
| src/app/actions/* | Server Action entry points | Preserve contracts; every action must enforce auth, authorization, entitlement, and input validation server-side |
| src/app/api/* | API route handlers | Outside the frontend-redesign deletion scope; keep their contracts and security boundaries |
| src/features, src/services, src/core | Domain, service, and infrastructure logic | Preserve; presentation redesign should consume these boundaries, not replace them |
| src/lib/docsIndex.ts / docsContent.ts | Generated docs metadata/content | Generated inputs; do not manually edit or delete |
| src/styles/tokens.css | Existing semantic token definitions | Maintain as canonical design-token source; reconcile themes through deliberate token changes |
| src/app/globals.css | Tailwind import, token mapping, global rules | Keep as CSS entry/mapping layer; avoid introducing a second token source |
| src/config/fonts.ts | Local Persian and display fonts | Preserve Yekan Bakh and Peyda configuration until verified font replacement is explicitly approved |

### 6.4 Design and implementation ownership gates

- TASK-77 owns the public homepage and header/footer implementation boundary. A future implementation task may consume this IA after that work is integrated and reviewed.
- TASK-21 owns dashboard page templates and component-level design/assembly. The Workspace domain templates must be passed into that task or its successor, not implemented independently against this branch.
- TASK-93 owns central docs registry and the public docs route implementation. The /public-docs navigation integration is deferred until the registry/docs route work is stable and the homepage/header owner can safely integrate the link.
- This Stage 2 document may inform all three tasks, but it does not change their claim, branch, scope, or completion state.

---

## 7. URL, locale, and migration compatibility

### 7.1 Preserve public URLs first

A shell or route-group refactor should not change the external URL. Use route groups to reorganize code without changing the URL. New routes should be added only where the product IA requires a genuinely new destination, such as /services or the proposed new product-domain routes.

### 7.2 Redirect policy

1. Do not redirect a route before the destination page exists.
2. Verify page functionality and access rules before redirecting.
3. Preserve dynamic identifiers and relevant query parameters.
4. Preserve locale prefixes; /fa paths must resolve to /fa destinations and /en paths to /en destinations.
5. Avoid redirect chains; old path should resolve directly to the canonical route.
6. Record old-to-new mappings in one compatibility registry/test fixture rather than scattering redirects across page components.
7. Do not use a redirect to hide an unavailable feature or imply that an unsupported capability exists.
8. Keep legacy documentation paths separate and preserve their canonical document selector compatibility.
9. Retain aliases through at least one full validation cycle after a route replacement; any removal needs an explicit deprecation decision.

### 7.3 Proposed route compatibility mapping

| Legacy route family | Candidate canonical destination | Gate |
|---|---|---|
| /solutions/aeo | /services/aeo | Service page, pricing/access semantics, and content parity verified |
| /solutions/geo | /services/geo | Same as above |
| /dashboard/optimization/technical | /dashboard/seo/technical | Shared functionality and deep-link parity verified |
| /dashboard/analytics/llm-bias | Analytics tab/detail under /dashboard/analytics | Filter and report state retained |
| /dashboard/competitors | /dashboard/competitive | Competitive analysis page handles expected context |
| /dashboard/graph | /dashboard/entities/graph | Evidence Graph destination and permission behavior verified |
| /dashboard/ingest | /dashboard/ingestion | Source-ingestion behavior and parameters preserved |
| /dashboard/content/ingestion | /dashboard/ingestion | Form behavior and any query parameters preserved |
| /dashboard/content/studio | /dashboard/content | Content Studio experience is complete at target |
| /dashboard/rag | /dashboard/query only if equivalent | Do not alias if RAG has a distinct product contract |
| /invoice | Workspace Billing invoice view | Invoice history view, authentication, Workspace scope, and permissions exist |

No redirect is required merely because a route is not in the primary navigation. Deep links and secondary workflows should remain valid.

### 7.4 Locale and direction

- Supported locales remain fa and en; Persian remains the default locale.
- The current route locale is authoritative for page content and document direction.
- Locale switching should preserve the current semantic destination, Offer/assessment identifier, filter/tab state, and permitted query parameters.
- Persian pages use RTL; English pages use LTR.
- Use logical CSS properties (start/end, inline/block) rather than left/right assumptions.
- The route locale must not be inferred solely from localStorage when a valid locale is already present in the URL.
- Localized page metadata, title, description, canonical URL, and Open Graph metadata should be set for the corresponding locale.

---

## 8. Design-system specification

The design system should evolve the existing semantic tokens and local fonts. It should not be replaced with an unrelated theme or a new ad hoc collection of component styles.

### 8.1 Visual direction

- Public product pages follow the already approved Signal Atlas light-first direction with an accessible dark companion.
- Workspace pages use the same brand foundation but may use denser information layouts and stronger navigation hierarchy.
- Documentation pages prioritize legibility, stable reading width, navigation clarity, and long-form reading.
- Account pages prioritize focus, trust, and completion of the requested action.
- Blue/sky is the primary brand/action family and orange is the accent family already present in the token system. Status colors must remain semantic and should not be reused as decorative brand accents.
- Prefer restrained surfaces, clear hierarchy, readable charts/tables, and measured use of gradients, shadows, and motion. Decorative effects must never reduce clarity or performance.

The current tokens file comments describe a dark default, whereas the approved public homepage direction is light-first. A future implementation wave should reconcile the semantic token values intentionally rather than hardcoding new colors into components.

### 8.2 Token ownership

| Token family | Existing foundation | Design-system rule |
|---|---|---|
| Brand | --ox-brand-* blue/sky ramp | Preserve a consistent primary action/focus family |
| Accent | --ox-accent-* orange ramp | Use for emphasis, selected secondary actions, and restrained highlights |
| Surfaces | --ox-background, --ox-surface, --ox-surface-raised, --ox-surface-muted | Define light and dark semantic values; never choose raw colors per page |
| Text | --ox-text-primary, --ox-text-secondary, --ox-text-muted, --ox-text-inverse | Maintain readable contrast in both themes |
| Borders | --ox-border and --ox-border-strong | Use consistent surface separation and focus boundaries |
| Status | --ox-success, --ox-warning, --ox-error, --ox-info and matching backgrounds | Status must have semantic meaning and a text/icon indicator, not color alone |
| Typography | --ox-text-xs through --ox-text-4xl and line-height tokens | Use the existing fluid scale and Persian-friendly line heights |
| Spacing | --ox-space-* based on 4/8 rhythm | Use consistent spacing; avoid unrelated one-off spacing scales |
| Radius/elevation | --ox-radius-* and --ox-shadow-* | Establish consistent control, card, overlay, and modal elevation |
| Motion | --ox-motion-* | Respect reduced motion; animate state changes, not decoration alone |

src/styles/tokens.css is the semantic token source. src/app/globals.css should map Tailwind utilities and global behavior to those tokens. Do not duplicate the same semantic color or spacing as new literals in page styles.

### 8.3 Themes

- Light theme is the public first-use/default presentation direction.
- Dark theme remains a first-class supported mode, not a reduced afterthought.
- User preference must persist and remain consistent across all four surfaces.
- Every semantic state, table, chart, modal, tooltip, border, focus indicator, and form control must be checked in both themes.
- System preference may be used where consistent with the approved first-use direction and the user's stored preference.

### 8.4 Typography

- Persian body/UI: current local Yekan Bakh configuration.
- Persian headings/display: current local Peyda configuration.
- English fallback/body: Inter/system stack already configured.
- Preserve readable Persian line-height, punctuation, numeric formatting, mixed-script text, and text alignment.
- Avoid manually setting separate left-to-right alignment on Persian page components.
- Do not ship a new font or replace the local font assets without checking licensing, rendering, layout shifts, and existing page dependencies.

### 8.5 Layout and responsive behavior

Recommended behavior, subject to visual testing:

- Public website: responsive content container, one header/navigation system, one footer, and consistent content widths.
- Workspace desktop: persistent sidebar, compact topbar, primary content region, and optional contextual side panels.
- Workspace tablet: collapsible sidebar and a topbar trigger with clear focus/active state.
- Workspace mobile: one accessible drawer/navigation entry point, clear page title/breadcrumb, and content-first layout. Do not keep duplicate fixed floating menus.
- Documentation: desktop navigation sidebar and mobile drawer; reading column should remain comfortable and not consume the entire viewport width.
- Account: centered/focused form layout with clear completion state and no competing navigation controls.
- Avoid horizontal overflow in Persian RTL, long IDs, tables, graphs, dialogs, and chart tooltips.

### 8.6 Component contract

The first shared component inventory should include:

- PageHeader with title, concise context, breadcrumb, and primary action.
- Button variants with semantic intent, loading, disabled, and destructive states.
- Input, Select, Textarea, Checkbox, Radio, Switch, Date, and file-upload controls with labels and validation.
- Card/Panel with consistent header, content, and action slots.
- StatusChip for verified, incomplete, unknown, simulated, failed, and pending states.
- DataTable with search/filter/sort/pagination/empty/error/loading states.
- EvidenceCard with source, type, observation date, scope, confidence, and limitations.
- MetricCard/Scorecard with unit, time range, baseline, comparison basis, and data status.
- Chart and graph containers with labels, accessible summaries, no fabricated points, and explicit simulation labels.
- Tabs with URL/query state where appropriate.
- Drawer, Dialog, ConfirmationDialog, Toast/Alert, Tooltip, and Command/Search.
- Breadcrumb and route-aware sidebar menu.
- EmptyState, Skeleton, ErrorState, and Retry affordances.
- Approval/Execution stepper for governed user decisions.

Avoid designing these components independently inside each page. Define their behavior, interaction, responsive rules, and RTL behavior before building domain pages.

### 8.7 Accessibility and interaction

- Target WCAG 2.2 AA for contrast, keyboard operation, focus visibility, and semantics.
- All interactive controls must have accessible names.
- Menus and drawers must support keyboard traversal, Escape to close, focus return, and an appropriate focus trap only when modal.
- Use semantic landmarks: header, nav, main, complementary where appropriate, and footer.
- Maintain visible focus in both themes.
- A status must never be communicated using color alone.
- Provide text/table alternatives for dense charts and graphs.
- Respect prefers-reduced-motion and avoid excessive floating/looping movement.
- Ensure touch targets are comfortably operable on mobile.
- Use logical CSS properties and test both fa/RTL and en/LTR.
- Validate zoom, text scaling, long Persian labels, mixed Persian/English text, and form errors.

---

## 9. Product-specific UX contracts

### 9.1 Offer and PIP workflow

1. Customer opens Offers & Profiles.
2. Customer creates or selects an existing Offer.
3. Offer nature is selected from physical, digital, or service.
4. Seller/provider and target-market context are captured.
5. Sales channels are recorded independently; social commerce is a channel/context dimension.
6. PIP is created or updated as a versioned profile.
7. The customer can inspect the profile history and correct user-provided information.
8. A current-state baseline and benchmark remain separate from the PIP.

A customer using a standalone SEO/AEO/GEO service must not be forced through this full Offer/PIP workflow.

### 9.2 Independent service workflow

1. Registered user signs in.
2. User selects one service from the Service Catalog.
3. The service explains required inputs, permissions, expected outputs, and pricing/quota where approved.
4. The server validates identity, Workspace scope, entitlement, quota, provider permission, and request inputs.
5. The service runs and returns a state that distinguishes LIVE, MOCK, HYBRID, UNKNOWN, PARTIAL, or FAILED where relevant.
6. Results, evidence, cost/usage, and service-run history remain attributable to the selected service.

Selecting SEO must not automatically activate AEO/GEO or Product Assessment & Improvement. The optional bundle must list its constituent services and terms before confirmation.

### 9.3 Product Assessment & Improvement workflow

1. Select/create an Offer.
2. Build or update the versioned PIP.
3. Choose the relevant assessment scope; Digital Product Assessment and Product Value & Competitiveness remain distinguishable.
4. Capture evidence, current-state baseline, relevant benchmark, and explicit data gaps.
5. Review findings and root causes with traceable evidence.
6. Use simulation/ROI only when the required models and inputs are available; mark estimates and assumptions.
7. Build a proposed plan and show costs, effort, dependencies, risks, expected effects, and confidence.
8. Require customer approval before governed or external execution.
9. Record task progress, evidence, and result verification.
10. Measure outcomes and update the profile/baseline for a later improvement cycle.

### 9.4 Evidence and decision presentation

Every material finding should answer:
- What was observed or asserted?
- Who/what supplied the information?
- When was it collected?
- Which Offer, market, channel, and scope does it apply to?
- What method was used?
- Is it direct observation, user-provided, third-party claim, estimate, hypothesis, or simulation?
- What is the confidence/freshness/limitation?
- What decision or recommendation does it support?

Show incomplete data explicitly. Do not fill absent evidence with a zero or a fabricated score.

### 9.5 AI Copilot and execution governance

AI Copilot is cross-cutting and should appear as a Workspace-level assistant, not as a substitute for the nine product domains. It should be context-aware and cite the relevant Offer, assessment, evidence, and plan. It must not silently execute external actions. Recommendations, simulation, approval, execution, and verification are separate states.

---

## 10. Implementation waves

Implementation should be incremental by shell and product domain. Do not replace the whole frontend in one broad deletion/refactor.

### Wave 0 — Baseline and compatibility

- Reconfirm current branch/main, active task ownership, and route inventory.
- Preserve all 59 current routes and all currently working service flows.
- Create route/consumer tests and an old-to-new compatibility map.
- Freeze shared component deletion until imports, dynamic references, route ownership, and tests are verified.

### Wave 1 — Shared shell foundations

- Implement the route-group/layout structure while keeping one locale root.
- Remove the global workspace dock from public/account/docs surfaces.
- Consolidate the public header/drawer/footer configuration.
- Consolidate Workspace navigation around the approved nine-domain IA.
- Keep the docs and account surfaces separate.
- Do not change backend APIs, Server Actions, data services, or entitlement enforcement as part of shell work.

### Wave 2 — Public website and service discovery

- Coordinate with TASK-77 before changing homepage/header/footer-owned UI.
- Add the Service Catalog public information architecture and standalone service destinations.
- Clarify optional bundles versus independently selectable services.
- Add public-docs discovery only after TASK-93 route and registry work is stable.
- Replace placeholder footer links only when a verified destination exists.

### Wave 3 — Workspace page templates and domain assembly

- TASK-21's required order governs: define page templates first, design each page's components separately, then assemble the central Workspace.
- Establish Offers/PIP and assessment page templates.
- Reposition current SEO/AEO pages as independent service workbenches.
- Reconcile competitor, market, evidence, analytics, content, and ingestion screens.
- Add new domain routes only as their data contracts, capabilities, and page templates are approved.
- Do not show unimplemented Simulation, Expert Network, Planning, or Outcomes workflows as operational.

### Wave 4 — Route consolidation and legacy redirects

- Merge duplicate pages only after feature and state parity.
- Add redirects for verified duplicate/stub aliases.
- Validate dynamic identifiers, locale prefixes, query state, and old deep links.
- Preserve legacy developer docs separately from public product docs.

### Wave 5 — Account and billing consistency

- Align personal account settings versus Workspace settings.
- Consolidate invoices into Workspace Billing only after the destination view and permissions are ready.
- Revalidate register → verify-email → login, password recovery, session expiry, and logout.
- Verify service-specific entitlements and quotas server-side; UI visibility is not the source of truth.

---

## 11. Acceptance criteria and validation matrix

### 11.1 Architecture acceptance criteria

| ID | Criterion |
|---|---|
| IA-01 | Public marketing, Workspace, product docs, engineering docs, and account surfaces each have a defined shell and navigation model. |
| IA-02 | The Workspace IA is mapped to all nine approved product domains and cross-cutting capabilities. |
| IA-03 | My Offers/PIP is distinct from OXENN Service Catalog, service SKU, bundle, entitlement, quota, and service run. |
| IA-04 | SEO, AEO, and GEO are independently discoverable and usable; bundles remain optional. |
| IA-05 | Standalone services do not require completing a comprehensive PIP or buying unrelated services. |
| IA-06 | All 59 current routes have an explicit disposition and compatibility decision. |
| IA-07 | No route is removed or redirected before destination parity and access rules are verified. |
| IA-08 | /public-docs remains separate from /docs and is the public product-docs destination. |
| IA-09 | All layouts remain locale-aware and preserve fa/RTL and en/LTR. |
| IA-10 | The design system uses current semantic tokens/fonts and a light-first public direction with an accessible dark companion. |
| IA-11 | Evidence, uncertainty, provenance, simulation, and execution states are explicit in the UX contract. |
| IA-12 | No planned or illustrative capability is represented as live/operational. |
| IA-13 | Active TASK-21, TASK-77, and TASK-93 boundaries are respected. |
| IA-14 | Backend/API/security/business-service contracts remain outside frontend-only shell changes. |

### 11.2 Validation matrix for implementation waves

| Area | Required validation |
|---|---|
| Routes | Every current localized URL resolves; dynamic detail routes preserve IDs; redirect map has no loops/chains |
| Navigation | Desktop, mobile, keyboard, active-state, nested-state, locale preservation, and link target checks |
| Shell isolation | Public pages show no Workspace-only dock; Workspace shows one sidebar/topbar; docs and account remain focused |
| Product journeys | Offer/PIP journey and independent SEO/AEO/GEO activation are separately testable |
| Authentication | Registration, email verification, login, logout, expiry, recovery, and unauthorized access behavior |
| Authorization | Direct URL/API/Server Action attempts are checked server-side, including Workspace/resource scope |
| Entitlements | Missing entitlement/quota for one service does not block another service with valid access |
| Truthfulness | LIVE/MOCK/HYBRID/UNKNOWN/PARTIAL/FAILED states; no fabricated scores or “all systems operational” assertions |
| Evidence | Source, scope, date, method, confidence, limitations, and unknown values are represented correctly |
| RTL/LTR | Persian, English, mixed scripts, charts, tables, drawers, forms, focus, and overflow |
| Themes | Light and dark contrast and interaction states |
| Accessibility | Keyboard navigation, focus visibility, labels, semantics, screen-reader names, reduced motion |
| Visual regression | Desktop/tablet/mobile route snapshots for every shell and representative page templates |
| Code quality | UI tests, relevant unit tests, typecheck, lint, production build, and route smoke tests |

No validation is claimed as passed by this specification. The matrix becomes the implementation acceptance plan for the subsequent authorized waves.

---

## 12. Risks and controls

| Risk | Control |
|---|---|
| Designing menus around legacy tool names instead of the approved product model | Use the nine-domain product architecture as the Workspace organizing model |
| Treating SEO/AEO/GEO as an inseparable suite | Separate catalog entries, routes, inputs, entitlements, quotas, and service-run history |
| Confusing customer Offers with services purchased from OXENN | Separate Offer/PIP and Service Catalog views and types |
| Public site and Workspace competing for the same navigation controls | Surface-specific route-group layouts and one navigation source per surface |
| Public product docs mixed with engineering content | Preserve /public-docs and /docs as different experiences and collections |
| Broken bookmarks after route consolidation | Compatibility registry, staged redirects, and deep-link tests |
| UI-only authorization | Server-side revalidation in every action/handler/data boundary |
| Fake operational statuses or illustrative data shown as real | Evidence-backed status and explicit simulated/demo labels |
| Deleting shared components prematurely | Consumer map, dynamic import search, test coverage, and parity gate before deletion |
| Active tasks collide with this work | Respect TASK-21, TASK-77, TASK-93 ownership and integrate only after their work is ready |
| Launch geography/pricing/pilot assumptions become hard-coded | Keep unapproved geography, cohort, currency, and price decisions configurable/undisclosed until confirmed |

---

## 13. Decisions deliberately left open

This architecture does not invent decisions that the approved product specification leaves unresolved:

- First pilot cohort and initial operating geography.
- Primary launch currency and any region-specific pricing.
- Price, billing period, quota, overage, renewal, and optional bundle terms.
- Exact entitlements/accounting scope where a Workspace can contain several Offers.
- Which domain capabilities are genuinely available at MVP launch versus later roadmap.
- Which legal pages (Terms, compliance statements) have approved content.
- Whether any particular competitor/brand-protection capability should become a separately packaged service.
- Final role matrix and approval permissions for each governed execution path.

Until those decisions are made, screens should show configuration/availability as unknown or pending rather than infer defaults.

---

## 14. Final architecture decision

The recommended target is **one locale-aware application root with five nested surface groups and four surface-specific navigation models**:

1. Public marketing website.
2. Authenticated Workspace organized around the nine product domains.
3. Public product documentation.
4. Legacy engineering/developer documentation.
5. Account and access.

The public site should explain the product and independent service choices. The Workspace should manage the customer’s Offers, assessments, intelligence, evidence, decisions, and improvement plans. Product documentation and engineering documentation must remain separate. Account and billing flows should remain focused and correctly protected.

The redesign should rebuild the user-facing shells and navigation while preserving working business capabilities, current API contracts, Server Actions, security boundaries, service modules, generated docs, and valid URLs. It should proceed by verified page templates and domain slices, never by deleting the existing frontend wholesale.

**Stage 2 outcome:** the information architecture, navigation taxonomy, route disposition, shell boundaries, design-system rules, and implementation gates are now specified. The next implementation work must be separately scoped to the active task owners and the user's authorization.

---

## 15. Reference material

### Product authority and decisions

- Product Architecture source: https://github.com/DiabloNova/oxenn_documents/blob/main/product_architecture.md
- Repository Product Architecture: https://github.com/DiabloNova/oxenn/blob/main/docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md
- Owner-approved MVP specification: https://github.com/DiabloNova/oxenn/blob/main/docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md
- Product Documentation index: https://github.com/DiabloNova/oxenn/blob/main/docs/product/README.md
- KNOW-22 — Nine-domain Workspace design rule: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22
- KNOW-25 — Independent SEO/AEO/GEO services with optional bundles: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25
- KNOW-64 — Authenticated access for all services: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64
- KNOW-84 — Separate localized public docs route: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-84
- KNOW-85 — Fixed allowlisted public-doc sources and static generation: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-85
- DOC-67 — Product-to-Engineering Blueprint: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-67

### Repository and active task boundaries

- Stage 1 inventory: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/docs/architecture/FRONTEND_REDESIGN_INVENTORY_2026-11-16.md
- Documentation Registry Contract: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/docs/architecture/DOCUMENTATION_REGISTRY_CONTRACT.md
- TASK-21 — Dashboard design: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/TASK-21
- TASK-77 — Public homepage: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/TASK-77
- TASK-93 — Documentation registry: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/TASK-93
- TASK-94 — Stage 2 IA and Design System: https://app.stele-ai.dev/p/oxenn-59hxc/nodes/TASK-94

### Framework and accessibility references

- Next.js App Router project structure and route groups: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/01-getting-started/02-project-structure.mdx
- Next.js route groups and layout caveats: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/03-api-reference/03-file-conventions/route-groups.mdx
- Next.js internationalization: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/internationalization.mdx
- Next.js data security and server-side authorization: https://github.com/vercel/next.js/blob/v16.4.5/docs/01-app/02-guides/data-security.mdx
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

### Existing design-system sources

- Semantic tokens: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/src/styles/tokens.css
- Global CSS/Tailwind mapping: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/src/app/globals.css
- Local font configuration: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/src/config/fonts.ts
- Locale configuration: https://github.com/DiabloNova/oxenn/blob/redesign/frontend-inventory-2026-11-16/src/config/i18n.ts
