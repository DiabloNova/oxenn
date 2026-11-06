# OXENN — Dashboard Assembly Plan

**Branch:** `feat/architecture-driven-dashboard`  
**Status:** Assembly plan only. Production dashboard code has not been modified.

## 1. Assembly objective

Integrate the approved architecture-driven page designs into one coherent dashboard experience. The dashboard must feel like one product operating environment rather than a set of unrelated tools.

## 2. Existing application foundations to preserve

Repository inspection confirms:
- Next.js 16 App Router with locale segment `src/app/[locale]`.
- Dashboard route family under `src/app/[locale]/dashboard`.
- Active dashboard layout at `src/app/[locale]/dashboard/layout.tsx`, currently using `ProtectedRoute`, `ThemeProvider`, `DashboardSidebar`, and `DashboardTopbar`.
- Existing locale-aware page routing and Persian/English direction support.
- Existing light/dark theme provider and CSS token foundations.
- Existing local Persian font assets and font configuration.
- Existing React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide, and Recharts dependencies.

The repository also contains `src/components/DashboardShell.tsx`, an alternate shell implementation. Do not mount a second shell or duplicate navigation. Before changing navigation, inspect the active import graph and determine which sidebar/topbar implementation is actually rendered.

## 3. Proposed frontend organization

The final folder layout must follow the repository's established conventions after inspecting current ownership and imports. The following is a logical target, not permission to create duplicate abstractions:

```text
src/
  app/[locale]/dashboard/
    page.tsx
    profile/
    assessment/
    competitiveness/
    markets/
    evidence/
    simulations/
    experts/
    execution/
    improvement/
    reports/
    settings/
  components/
    dashboard/
      frame/
      navigation/
      context/
      shared/
    features/
      product-profile/
      digital-assessment/
      competitiveness/
      geo-market/
      evidence-graph/
      simulation/
      expert-network/
      planning-execution/
      continuous-improvement/
      copilot/
```

Do not mechanically create all proposed paths if existing routes already cover a user job. Prefer safe route evolution and avoid breaking current URLs without an explicit migration plan.

## 4. Integration order

### A. Shared application frame
- Keep the existing authenticated dashboard route boundary.
- Consolidate the sidebar/topbar/navigation behavior into the currently active implementation.
- Add product and market context only where the current page requires it.
- Keep locale/theme/account/help controls consistent.
- Remove or replace any hard-coded "all systems operational" and "synced just now" claims unless backed by actual state.
- Ensure mobile drawer, collapsed navigation, focus behavior, and RTL placement remain correct.

### B. Shared page primitives
- PageHeader and Breadcrumb.
- Workspace/Product/Market context controls.
- Status, freshness, confidence, and illustrative-state labels.
- Evidence/provenance inspector.
- Finding summary/detail.
- Empty/loading/partial/error/permission/stale states.
- Accessible chart and table wrappers.

### C. Domain page composition
Integrate one domain at a time in the order of the product operating cycle:
1. Workspace Overview and Product Intelligence Profile.
2. Digital Product Assessment.
3. Product Value & Competitiveness.
4. Geo-Market Intelligence.
5. Product Evidence Graph.
6. Simulation & ROI Lab.
7. Expert Network.
8. Planning & Execution Engine.
9. Continuous Improvement Loop.
10. Cross-cutting reports, activity, settings, and AI Copilot.

Each page must consume its page-level component specifications. Components remain independently testable and reusable; avoid a single giant page component.

### D. Navigation integration
- Use the nine product domains as the top-level mental model.
- Keep cross-cutting capabilities grouped separately.
- Keep product context and market context visible in the shell when applicable.
- Localize labels and descriptions in Persian and English.
- Retain legacy routes only where they are still needed; avoid presenting legacy tool links as the new product taxonomy.

## 5. Data and capability presentation

This implementation phase must not connect new APIs, data providers, AI providers, or third-party services.

- Use typed frontend fixtures only when needed to demonstrate layouts and interactions.
- Label every fixture-driven metric, chart, finding, competitor, expert, scenario, task, and outcome as illustrative.
- Never imply that an assessment was run, a provider is connected, a task executed, or an outcome verified when that did not happen.
- Keep component props/data contracts explicit so future API integration can be separately authorized.
- Do not modify server actions, route handlers, database schema, migrations, or tenant authorization.

## 6. Quality gates

Before implementation:
- Inspect current working tree and active branch in a real repository checkout.
- Inspect applicable nested `AGENTS.md` instructions and all relevant existing frontend components/routes.
- Capture the current lint, typecheck, unit/UI test, and build baseline where the local environment permits.

After each integration slice:
- Run targeted component/page tests.
- Run lint and typecheck.
- Verify direct route entry and refresh.
- Verify Persian RTL and English LTR.
- Verify light and dark themes.
- Verify desktop, tablet, and mobile layouts.
- Verify keyboard navigation, focus visibility, accessible names, reduced motion, and chart alternatives.
- Verify empty, partial, error, stale, permission, and illustrative states.
- Review the diff to ensure no backend, database, infrastructure, or integration changes occurred.

Final gates:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Do not claim a gate passed unless it was actually executed and its result observed.

## 7. Current blockers and execution constraints

- The GitHub branch and design documents are available remotely, but a local checkout and working-tree status are not available in this chat execution environment.
- The repository does not contain a tracked `.sdlc/project.yaml`; the Codex-SDLC runtime cannot be initialized from repository evidence in this session.
- Forge search returned no matching fragments in the connected workspace.
- Product Design's own workflow is not supported in standard ChatGPT chat; use Work mode for its visual design workflow.
- ForgeMind's bundled runner requires its plugin-local shell runtime, which is not exposed in this session.
- No Vercel deployment or Composio integration action is appropriate under the user's explicit no-deployment/no-new-integration boundary.
- Sitelemetry is not required to define or assemble the local dashboard UI; no public-site audit was requested.

These constraints do not change the product design or authorize substituting a different architecture. They mean visual prototype review and executable local verification must occur in a supported Work/Codex environment before claiming the dashboard implementation is complete.
