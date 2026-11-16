# Frontend Rebuild — Stage 1 Inventory & Baseline

**Status:** Stage 1 completed (inventory and dependency mapping only)  
**Repository:** `DiabloNova/oxenn`  
**Audit branch:** `redesign/frontend-inventory-2026-11-16`  
**Base branch:** `docs/documentation-registry-contract-2026-11-15`  
**Base commit:** `0d8bff95aa4c8c8b5492d0b7767f79e1b9b84848`  
**Main at audit start:** `b56517bc436a8cd03ef75bfac8adbf43c8567753`

## 1. Scope and method

This stage establishes a source-controlled baseline before any frontend redesign. It inventories App Router pages, shared components, navigation definitions, global layouts/providers, styling and localization foundations, frontend tests, and the boundaries between UI code and application services.

The audit used the complete Git tree at the base commit (1,498 tree entries; 1,106 file blobs; not truncated), followed by source inspection of layout, navigation, route, authentication, localization, documentation, styling, package and UI-test entry points. Route targets were checked against the actual localized App Router page files. Legacy documentation slugs were checked against the generated `DOCS_INDEX`.

**Out of scope by design:** no page redesign, source-code deletion, component refactor, API/database changes, test modifications, deployment, pull request, or merge was performed. This report is the only intended change in this stage.

## 2. Repository inventory

| Area | Observed count | Notes |
|---|---:|---|
| Localized App Router page files | 59 | 34 dashboard pages; 25 non-dashboard pages |
| Localized route layouts | 4 | Includes locale root and dashboard/docs nested layouts |
| API route handlers | 23 | Under `src/app/api/`; not frontend deletion candidates |
| Server action modules | 13 | Under `src/app/actions/`; preserve their contracts |
| Shared/UI components | 62 | `src/components/` |
| Feature modules | 104 | `src/features/` |
| Service modules | 55 | `src/services/` |
| Core modules | 12 | `src/core/` |
| Library modules | 19 | `src/lib/` |
| Configuration modules | 7 | `src/config/` |
| UI test files | 5 | Under `tests/ui/` |
| Unit-test files | 93 | Under `tests/unit/` |
| Markdown documents under docs | 90 | Includes public documentation inputs |

The counts are a source-tree inventory, not a statement that every file is actively used or that every route has passed runtime testing.

## 3. Route inventory

All page files are locale-prefixed through `src/app/[locale]`; supported locales are `fa` and `en`, with Persian as the default locale.

### 3.1 Public website and commercial pages

- `/`
- `/about`
- `/blog`
- `/contact`
- `/features`
- `/industries`
- `/pricing`
- `/privacy`
- `/resources`
- `/solutions`
- `/solutions/aeo`
- `/solutions/geo`
- `/solutions/protection`
- `/solutions/radar`

### 3.2 Documentation and design-system pages

- `/docs` — legacy engineering-documentation viewer
- `/docs/[slug]` — legacy slug-based document viewer
- `/public-docs` — newer public product-documentation page
- `/design-system/tokens` — design-system token page

### 3.3 Account and billing pages

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/profile`
- `/settings`
- `/invoice`

### 3.4 Authenticated dashboard pages (34)

- `/dashboard`
- `/dashboard/aeo/audits`
- `/dashboard/aeo/content`
- `/dashboard/aeo/playground`
- `/dashboard/analytics`
- `/dashboard/analytics/llm`
- `/dashboard/analytics/llm-bias`
- `/dashboard/audit/free`
- `/dashboard/audit/premium`
- `/dashboard/audits`
- `/dashboard/audits/[id]`
- `/dashboard/billing`
- `/dashboard/brand-monitoring`
- `/dashboard/brand/citations`
- `/dashboard/competitive`
- `/dashboard/competitors`
- `/dashboard/competitors/radar`
- `/dashboard/content`
- `/dashboard/content/ingestion`
- `/dashboard/content/studio`
- `/dashboard/entities`
- `/dashboard/entities/graph`
- `/dashboard/graph`
- `/dashboard/ingest`
- `/dashboard/ingestion`
- `/dashboard/intelligence`
- `/dashboard/optimization/technical`
- `/dashboard/query`
- `/dashboard/rag`
- `/dashboard/reports`
- `/dashboard/seo/schema`
- `/dashboard/seo/technical`
- `/dashboard/services`
- `/dashboard/settings`

## 4. Current navigation and shell architecture

The current UI does not have one authoritative navigation model for the whole product. It has multiple independently-authored navigation surfaces:

1. **Global workspace quick-action dock** — `src/components/navigation/FloatingSidebar.tsx`. It contains a hard-coded set of three workspace shortcuts (AI Playground, analytics, Content Studio). It is mounted by the locale root layout, so it is included across public, docs, account and dashboard routes unless separately hidden by later logic.
2. **Marketing header navigation** — `src/components/marketing/LandingHeader.tsx`. It defines its own Platform and Solutions dropdown items, primary links and utility actions. It also renders an `AppSidebar` drawer for the mobile/global menu.
3. **AppSidebar** — `src/components/navigation/AppSidebar.tsx`. It defines five separate categories and a second set of product, documentation, platform, user and company links. This list is hard-coded separately from the header and dashboard configuration.
4. **Dashboard navigation** — `src/config/dashboardNavigation.ts` is consumed by `DashboardSidebar.tsx`. This is the one observed configuration-driven dashboard menu; it has Workspace, Administration and Support sections, with nested groups for SEO, AEO, content, competitors, brand/citations, entities and analytics.
5. **Marketing footer sitemap** — `src/components/marketing/LandingFooter.tsx`. It independently defines six link groups (Products, Services, Documentation, Resources, Company, Legal).

### 4.1 Confirmed duplicate mounting on public pages

The locale root layout mounts `FloatingSidebar` globally. The marketing header itself mounts an `AppSidebar` drawer. In addition, six public pages — About, Blog, Contact, Features, Resources and Solutions — directly render another `<AppSidebar />` as well as `<LandingHeader />` and `<LandingFooter />`.

Consequently, these six pages have three independently mounted navigation surfaces: the global quick-action dock, the drawer inside the header, and a page-level AppSidebar. The homepage mounts the global dock plus the header's AppSidebar. This is a concrete architecture-level source of competing controls, duplicated menu triggers and inconsistent navigation state.

The dashboard uses a different shell: the locale root still mounts the global quick-action dock, while `src/app/[locale]/dashboard/layout.tsx` mounts `DashboardSidebar` and `DashboardTopbar`. The dashboard layout also owns a separate Help drawer. The public and dashboard shells are therefore not cleanly isolated at the root-layout boundary.

### 4.2 No shared marketing route layout

The inspected public pages import and render the marketing header/footer directly rather than inheriting them from a shared marketing route-group layout. Several of those pages also directly mount AppSidebar. This spreads shell responsibility across page files and makes consistent navigation changes harder to enforce.

### 4.3 Navigation source-of-truth problem

Navigation destinations and labels are repeated across the header, AppSidebar, FloatingSidebar, dashboard navigation config and footer. There is no single route-aware source of truth for public site navigation, nor a clear rule that separates public navigation, authenticated workspace navigation and documentation navigation.

## 5. Concrete navigation and documentation defects

### 5.1 Legacy documentation links do not resolve through the current generated index

The legacy documentation viewer uses `/docs/[slug]` and the generated `DOCS_INDEX`. The inspected AppSidebar and footer contain references to these five distinct legacy slugs:

- `introduction-to-brandgraph`
- `infrastructure-architecture`
- `ai-pipeline-architecture`
- `multi-tenant-isolation`
- `knowledge-graph-design`

None of these slug values is present in the current generated `DOCS_INDEX` (65 indexed metadata entries observed). The route pattern exists, but those menu targets do not match indexed documents and therefore should be treated as broken until resolved against canonical document IDs/paths.

The footer marks these internal `/${locale}/docs/...` URLs as `external: true`; the renderer consequently emits an anchor with `target="_blank"` rather than Next.js internal navigation. This opens local application routes in a new tab and is inconsistent with the actual destination type.

### 5.2 The new public documentation page is not connected to primary navigation

The code has two distinct documentation destinations: the legacy engineering viewer at `/docs` and the newer public product documentation page at `/public-docs`. The inspected LandingHeader links to `/docs`, and AppSidebar also points users to `/docs` and legacy slug routes. The footer's documentation links also use the legacy viewer. No inspected primary-header, AppSidebar or footer link points to `/public-docs`.

This means the new public documentation page exists as a route but is not discoverable through the main navigation. Stage 2 must deliberately define which documentation experience is presented as the public product-docs entry point and how legacy engineering documents remain accessible without confusing users.

### 5.3 Labels and destinations do not always express the same information architecture

Examples found in the footer:
- Careers points to `/about`.
- Changelog & Roadmap points to `/dashboard`.
- Terms of Service and Compliance use the same `/privacy` destination as Privacy Policy.
- Case Studies and Industry Benchmarks both point to `/blog`.
- Multiple product labels point to the same dashboard root.

These links may be intentional placeholders, but they do not provide distinct destinations matching the labels. They should be classified as either intentional aliases, future content placeholders, or routes that need a real target before the next navigation is finalized.

The AppSidebar similarly mixes public marketing destinations, authenticated dashboard tools, and documentation links within its Products & Services category. It repeats several destinations across categories (for example, `/privacy`, `/about`, `/contact` and `/docs`).

### 5.4 Dashboard navigation is more coherent but incomplete relative to the route inventory

The dashboard configuration has explicit groups and the 15 distinct configured route targets inspected all exist in the route tree. However, the route inventory contains 34 dashboard pages, so the menu is not a complete route catalog. This is not necessarily wrong: some routes may be detail pages, alternate workflows or internal routes. Stage 2 must classify route purpose and visibility before deciding which routes deserve a visible navigation item.

## 6. Frontend foundations and dependencies to preserve

### 6.1 Locale, direction and theme

- `src/config/i18n.ts` declares `fa` and `en`, with `fa` as the default.
- `src/app/[locale]/layout.tsx` sets the HTML `lang` and `dir` attributes according to the route locale.
- `ThemeProvider` owns theme, language, direction and locale-preserving navigation behavior.
- `src/config/fonts.ts` loads local Yekan Bakh and Peyda font files.
- Global styling is split between `src/app/globals.css` and `src/styles/tokens.css`; a token system already exists and should be consolidated, not discarded blindly.

The redesign must preserve RTL/LTR correctness, locale-aware URLs, Persian typography, theme persistence and accessible focus behavior.

### 6.2 Authentication and protected workspace

- The locale root wraps pages in `AuthProvider` and `ThemeProvider`.
- `AuthProvider` obtains the authoritative session through server actions and exposes login, register, logout and permission helpers.
- `ProtectedRoute` is applied by the dashboard layout.
- Registration intentionally does not create an authenticated session; verification is represented by its own `/verify-email` page.
- The dashboard layout owns the sidebar state, mobile drawer state, help drawer and shell-level page frame.

Do not delete or replace these flows as part of a visual redesign. Any future shell migration must retain the server-session boundary and verify registration, email verification, login, logout, access control and workspace navigation.

### 6.3 Application and backend boundaries

The App Router also contains 23 API route handlers and 13 server-action modules. Business and integration logic exists outside `src/components` in `src/features`, `src/services`, `src/core`, `src/lib`, schemas and database code. These modules are not presentation-only assets and are explicitly outside a frontend cleanup/deletion scope.

The package build command also runs documentation data generation before Next.js build. Generated documentation files such as `src/lib/docsIndex.ts` and `src/lib/docsContent.ts` must be treated as generated application inputs; they are not safe candidates for manual deletion.

### 6.4 UI libraries and test structure

Observed direct dependencies include Next.js, React, Tailwind CSS, Framer Motion, Lucide, Recharts, XYFlow, Base UI and related utility libraries. The current UI test surface includes five files covering language routing, public docs and selected feature/marketing components. The existing test commands include `test:ui`, `test:unit`, `typecheck`, `lint` and `build`.

Only five dedicated UI test files were found in `tests/ui`; this is a test-inventory observation, not evidence that the UI is untested elsewhere. Stage 2 should establish route-level and navigation-level coverage before replacing shared shells.

## 7. Risk register and recommended disposition

| Priority | Finding | Recommended disposition |
|---|---|---|
| P0 | Multiple navigation surfaces are mounted on the same public pages | Establish one public-site shell and one navigation entry point; remove duplicate mounting only after consumer mapping |
| P0 | Primary navigation exposes legacy docs routes while the new public docs page is undiscoverable | Choose the primary docs destination; preserve explicit paths/aliases for legacy docs |
| P0 | Five distinct legacy documentation slugs are absent from generated index | Replace with canonical, verified document targets; do not invent replacement slugs |
| P1 | Navigation labels and destinations are repeated across independent files | Centralize route-aware navigation data by surface (public, workspace, docs, account) |
| P1 | Six marketing pages own header/footer/sidebar composition directly | Introduce a shared marketing route-group layout after confirming page-specific exceptions |
| P1 | Global quick actions are mounted at the locale root, including routes with separate shells | Scope the workspace dock to authenticated workspace routes or explicitly define its role |
| P1 | 34 dashboard routes versus 15 configured link targets | Classify every route as primary navigation, secondary navigation, detail, internal, deprecated or redirect |
| P2 | Footer destinations reuse unrelated routes and internal links open in new tabs | Replace placeholders or label them honestly; use internal navigation for internal routes |
| P2 | Styling tokens and global CSS are split across two files | Consolidate only after a token/component dependency map and visual baseline exist |

## 8. Recommended target information architecture for Stage 2

The next stage should design the information architecture and shared shells before writing replacement UI code. Recommended product surfaces:

1. **Public website:** homepage, product overview, capabilities, solutions, pricing, resources and company information.
2. **Authenticated workspace:** workspace overview, assessments, analytics, content, competitors, knowledge graph, reports, services and workspace settings.
3. **Public documentation portal:** getting started, product concepts, workflows, integrations and API guidance, with Persian and English as first-class experiences.
4. **Account and access:** register, verify email, login, password recovery, profile, billing and account settings.

Each surface should have one intentional shell and one menu model. Public marketing pages should not inherit a workspace-only quick-action dock. Documentation should have its own information architecture and should be discoverable from the public header/footer. Account screens should remain focused on completing authentication rather than inheriting every marketing and workspace control.

Implementation should proceed incrementally by surface, not by deleting the entire frontend. Retain working business features and API contracts; replace the presentation layer behind verified route and component boundaries. Before deleting any component, confirm its imports, dynamic references, route ownership and test coverage. Keep existing URLs stable where possible; where a URL must change, provide a deliberate redirect or compatibility mapping.

## 9. Stage 2 entry criteria

Before implementation begins, create and approve:
- A final sitemap and navigation taxonomy for the four product surfaces.
- A page-by-page disposition matrix: keep, redesign, merge, redirect or deprecate.
- A component consumer/dependency map, including dynamic imports and shared providers.
- A route compatibility and redirect plan.
- A design-system specification for typography, color, spacing, responsive breakpoints, components and RTL/LTR behavior.
- A preservation checklist for API, server actions, auth, email verification, data access, service modules and generated documentation.
- A validation plan covering desktop/mobile, keyboard accessibility, locale switching, auth journeys, route resolution, UI tests, typecheck, lint and production build.

No source deletion or broad refactor should be approved until these entry criteria are met.

## 10. Audit limitations and verification state

This is a static source and dependency inventory. It did not include a complete manual browser walkthrough of all 59 page routes or an exhaustive runtime verification of every link, viewport and user journey. The documentation slug comparison was performed against the generated index in the audited commit. No build or test suite was run because no application source or behavior was changed during this stage.

**Stage 1 result:** the frontend is sufficiently mapped to proceed to information architecture and design-system planning. The audit does not recommend deleting all frontend files. It recommends rebuilding the user-facing shells and navigation while protecting the existing application and authentication boundaries.
