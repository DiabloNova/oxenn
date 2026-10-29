# Phase 01 — Product and Design Audit

**Project:** Oxenn / اوژن  
**Repository:** https://github.com/DiabloNova/oxenn  
**Baseline branch:** `main`  
**Execution branch:** `redesign/oxenn-world-class-experience`  
**Audit date:** 2026-10-29  
**Status:** Initial audit complete; implementation has not yet begun.

## 1. Objective

Establish a verified baseline for a full experience redesign. Preserve useful behavior and existing integrations, identify structural constraints, and keep repository reality separate from the sitemap's intended future state.

## 2. Verified implementation map

- Framework: Next.js App Router, React 19, TypeScript, Tailwind CSS v4.
- Public homepage: `src/app/[locale]/page.tsx`.
- Locale shell: `src/app/[locale]/layout.tsx`.
- Shared styling/tokens: `src/app/globals.css` and `src/styles/tokens.css`.
- Theme and language context: `src/components/ThemeProvider.tsx`.
- Marketing building blocks include `LandingHeader`, `LandingFooter`, `HeroAccessCard`, `FreeAuditPanel`, `RadialPolarGraph`, and `LiveKnowledgeGraph`.
- The homepage is a large client component that contains multiple product-story sections, dashboard-preview state, and scroll targets. The redesign should first extract reusable section/page components and avoid growing this file further.
- The locale layout sets the initial document `lang` and `dir` from the route locale. The current ThemeProvider language setter changes document attributes and localStorage but does not itself navigate the locale segment. Route-rendered copy can therefore diverge from the visible language state unless the route is changed as part of the language-switch flow.
- `FloatingSidebar` and `GlobalNavigationControls` are mounted in the locale layout; the marketing homepage also renders its own `LandingHeader`. Their combined visibility, overlap, transitions, and keyboard behavior need a focused verification pass.
- The existing CSS maps an English font fallback including Inter, while locale-specific font variables are configured separately. Inspect the actual font config and local font assets before changing typography; do not replace the Persian face with an Arabic-only font.

## 3. Sitemap and status reconciliation

The supplied sitemap describes **106 page nodes** across 12 modules, with headline totals of **35 Live, 42 In Dev, and 29 Planned**. The companion's module-summary roll-up instead adds to **38 Live, 42 In Dev, and 26 Planned**. The register/status roadmap and module summary must be reconciled before estimating page completion.

The sitemap is a product specification, not proof that every listed page or integration exists in production. For each route, compare:
1. Register status against the current repository route tree.
2. Intended route against the actual route and aliases.
3. Intended data dependency against actual service/API behavior.
4. Intended role/tenant permission against server-side authorization.
5. Page CTA against the actual destination and current readiness.

## 4. Product truth and trust constraints

- Treat UI previews as illustrative unless backed by verified live responses.
- Do not invent production metrics, customer logos, certifications, integrations, completed analyses, or AI-provider results.
- In the existing project context, the primary database has been described as an internal simulator rather than a live production database. Re-confirm this before connecting homepage visuals to any data source or implying production persistence.
- Preserve tenant isolation, server-side authorization, auth anti-enumeration behavior, SSRF controls, and existing backend contracts.
- Audit all CTAs for real routes and current product availability.

## 5. Primary user journeys to protect

1. New user: homepage → registration → email verification → onboarding → twin generation/readiness → dashboard.
2. Returning user: login → dashboard → visibility/gap review → prioritized plan.
3. AI-assisted work: chat/conversation → useful finding → proposed plan task (only where supported).
4. Billing: plan/credits overview → subscription/payment step → confirmed return state.
5. Workspace team: invitation → acceptance → correctly scoped workspace.

## 6. Risks and mitigations

| Risk | Mitigation / acceptance evidence |
|---|---|
| Locale label changes without URL/content change | Route-aware language switch; test `/fa` ↔ `/en` on home and nested routes. |
| Duplicate/competing floating navigation | One agreed navigation hierarchy; mobile and keyboard walkthrough. |
| Sitemap status mismatch | Single register-based route audit before commitments; document every discrepancy. |
| Prototype data presented as live | Mark illustrative data visibly and isolate it from production service contracts. |
| Large homepage component becomes harder to maintain | Split semantic sections and reusable product previews without unrelated refactors. |
| RTL becomes a mirrored English page | Design Persian copy, typography, spacing, alignment, and responsive behavior as a first-class experience. |
| Motion damages access or performance | Respect `prefers-reduced-motion`; animate transform/opacity; avoid scroll hijacking. |

## 7. Commands and quality gates

Project scripts include:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Run a clean baseline and capture the current result before the implementation phase. After each meaningful change, re-run targeted tests; at the release gate run all four commands and test locale/theme/navigation journeys manually.

## 8. Phase 01 exit criteria

- [x] Repository and homepage entry point identified.
- [x] Shared theme, locale, navigation, and marketing components identified.
- [x] The locale switching and global-navigation risks recorded.
- [x] Sitemap total/module-summary discrepancy recorded.
- [ ] Complete 106-row route-to-code/status reconciliation.
- [ ] Baseline automated checks recorded on the execution branch.
- [ ] Production data/provider capabilities verified before live claims are designed.

**Important:** this is the initial audit deliverable, not a claim that every route, service, or production integration has already been tested.
