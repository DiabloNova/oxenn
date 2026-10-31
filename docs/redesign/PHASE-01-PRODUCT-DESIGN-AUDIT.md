# Phase 01 — Product and Design Audit

**Project:** Oxenn / اوژن  
**Repository:** https://github.com/DiabloNova/oxenn  
**Baseline branch:** `main`  
**Execution branch:** `redesign/oxenn-world-class-experience`  
**Audit date:** 2026-10-29  
**Status:** Repository/source inspection completed for the first audit pass. Route-by-route reconciliation and executable baseline checks remain open.

## 1. Scope and method

This audit checks the existing repository entry points, shared styles, locale/theme/navigation architecture, and homepage composition against the requested product direction and the newly uploaded **Product UI Styleguide** image. Repository statements below are grounded in files inspected on the execution branch, which was created from `main`. This is not a claim that the site was run locally or visually tested in a browser.

The Superdesign CLI preflight was attempted twice but timed out both times. Per its operating guidance, no further retries or substitute commands were attempted. Therefore this pass does not claim to have initialized a Superdesign project or modified a Superdesign canvas. The uploaded styleguide is treated as a design reference for this audit.

## 2. Verified implementation map

- **Framework:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4; dependencies and scripts are defined in `package.json`.
- **Homepage entry:** `src/app/[locale]/page.tsx`.
- **Locale shell:** `src/app/[locale]/layout.tsx`.
- **Global styling:** `src/app/globals.css` and `src/styles/tokens.css`.
- **Theme/language state:** `src/components/ThemeProvider.tsx`.
- **Font setup:** `src/config/fonts.ts`, using local YekanBakh FaNum files for primary Persian UI, Peyda for Persian display, and BoxFace for English titles. Confirm font licensing and actual glyph/weight rendering before changing them; do not replace the existing Persian fonts without evidence that the new pairing is better.
- **Existing marketing components imported by the homepage:** `LandingHeader`, `LandingFooter`, `HeroAccessCard`, `FreeAuditPanel`, `RadialPolarGraph`, and `LiveKnowledgeGraph`.
- **Navigation in the locale layout:** `FloatingSidebar` and `GlobalNavigationControls` are mounted globally. `FloatingSidebar` self-suppresses outside workspace routes, but the global back/top controls can still appear on non-home marketing routes. The homepage separately renders `LandingHeader`.
- **Homepage structure:** the homepage is a large client component with a broad icon import, localized product-module copy, dashboard-preview tab state, and in-page scroll refs. Prefer incremental extraction into meaningful section components rather than adding more logic to this file.

## 3. Findings and implications

### F1 — Language selection can diverge from route-rendered content

The locale segment determines the `locale` read by the homepage and its `isFa` content branches. `ThemeProvider.setLanguage` changes document `lang`/`dir`, local storage, and context state, but does not itself navigate the locale route. This can make the control's language state disagree with the URL and server/route-selected content.

**Design/engineering consequence:** treat locale switching as route navigation between equivalent `/fa` and `/en` paths, preserve relevant nested route/query state where supported, and test a direct visit plus refresh for both languages. Do not implement this only as a visual toggle.

### F2 — The design system has a dark-oriented token base, while the requested flagship starts in light mode

`src/styles/tokens.css` defines a dark slate base under `:root` and overrides surface/text/shadow values under `:root.light`. The uploaded reference is predominantly light, with dark graphite components and orange-to-red emphasis. A visual redesign must establish an intentional light theme as the default and then tune the dark theme as a first-class counterpart; simply inverting existing values is insufficient.

### F3 — Brand colors and visual language currently differ from the uploaded reference

The existing tokens use sky blue (`#38bdf8` / `#0ea5e9`) as the main brand ramp and orange (`#f97316`) as the accent. The uploaded styleguide instead suggests:
- warm white / very pale cool-gray canvas with subtle peach atmospheric tint;
- vivid orange-to-vermilion primary action surfaces;
- graphite-to-charcoal controls and segmented surfaces;
- restrained cool-gray borders and thin alignment/grid marks;
- rounded pill controls and elevated surfaces with soft, carefully limited shadows;
- oversized black editorial typography paired with small, precise UI labels.

**Design consequence:** do not replace tokens until the reference and current components have been compared in the design canvas. Prototype the proposed palette against contrast requirements and the existing Oxenn logo. The image is a style reference, not permission to copy its sample labels such as “Search invoices” into Oxenn.

### F4 — Navigation hierarchy needs consolidation before redesign

`LandingHeader` already contains a floating header, brand mark, menu/drawer, language/theme controls, and marketing links. The locale layout also mounts global navigation controls, and workspace routes have their own floating sidebar. A second competing navigation layer must not be added as part of the redesign.

**Design consequence:** map navigation by route class (marketing vs workspace), define one primary header for the marketing experience, and retain workspace navigation where needed. Test keyboard focus, touch target size, escape-to-close, accessible names, and reduced-motion behavior.

### F5 — The homepage copy contains claims that require product verification

The homepage's product-module descriptions include terms such as “real-time,” “daily,” “guarantee,” and statements about impressions, referral traffic, model repositories, or citation share. The source file alone does not prove that each data source or measurement is available in production.

**Design consequence:** before retaining any claim, trace it to a working implementation and data source. If a product preview is conceptual, label it visibly as illustrative. Do not present static sample values, simulated graphs, or mocked dashboard tabs as live measurements.

### F6 — Existing components should be reused after behavior and fit are checked

Current candidates for reuse include `LandingHeader`, `LandingFooter`, `HeroAccessCard`, `FreeAuditPanel`, `RadialPolarGraph`, and `LiveKnowledgeGraph`. This inventory is not a recommendation to preserve every component unchanged. Inspect source, props, data dependencies, responsive behavior, accessibility, and theme compatibility before selecting each component for the new design.

## 4. Uploaded styleguide — source-derived design requirements

The uploaded portrait image is a **Product UI Styleguide**, not an Oxenn page mockup. Its relevant visual language can be adapted into Oxenn as follows:

| Reference trait | Oxenn application | Audit caution |
|---|---|---|
| Orange/vermilion primary token | Main CTA and key active states | Verify contrast in both themes |
| Graphite and charcoal component surfaces | Selected segmented controls, dark data panels, compact controls | Avoid making the light experience feel dark |
| Cool gray and off-white surfaces | Cards, input fields, content canvas | Maintain readable borders and text |
| Rounded pills and large soft radii | Search, chips, segmented controls, compact switches | Use a consistent radius scale rather than rounding everything equally |
| Soft elevation and subtle depth | Floating navigation and selected product panels | Avoid low-contrast “neumorphic” controls |
| Fine vertical grid and alignment marks | Optional background structure in hero/product visualization | Decorative only; must not impair legibility |
| Large editorial typography | Hero headline and section statements | Validate separate Persian and English line breaks |
| Spacing and component token labels | A real documented design-token system | Do not copy the reference's malformed/inconsistent sample labels or spacing sequence |

The image does not establish an exact font family, usable source colors, brand logo, or interaction behavior. Those must be determined from the actual Oxenn assets and deliberate design tests.

## 5. Sitemap and status reconciliation

The supplied sitemap describes **106 page nodes** across 12 modules, with headline totals of **35 Live, 42 In Dev, and 29 Planned**. The companion module-summary roll-up instead adds to **38 Live, 42 In Dev, and 26 Planned**. The register/status roadmap and module summary must be reconciled before estimates or completion claims are trusted.

The sitemap is a product specification, not proof that every listed page or integration exists. Each route still needs comparison against:
1. Current route tree and aliases.
2. Register status and actual implementation.
3. Data dependency and service/API behavior.
4. Role/tenant access rules enforced server-side.
5. CTA destination and current readiness.

## 6. Product truth and security constraints

- Treat UI previews as illustrative unless backed by verified live responses.
- Do not invent production metrics, customer logos, certifications, integrations, completed analyses, or AI-provider results.
- The project context has previously described the primary database as an internal simulator rather than a connected production database. Re-confirm this before implying live persistence.
- Preserve tenant isolation, server-side authorization, auth anti-enumeration behavior, SSRF protections, and existing backend contracts.
- Do not change backend contracts merely to make the homepage preview easier.
- Confirm every CTA's actual route and availability before using it as the primary conversion action.

## 7. Primary journeys to protect

1. New user: homepage → registration → email verification → onboarding → twin generation/readiness → dashboard.
2. Returning user: login → dashboard → visibility/gap review → prioritized plan.
3. AI-assisted work: conversation → useful finding → proposed plan task, only where supported.
4. Billing: plan/credits overview → subscription/payment step → confirmed return state.
5. Workspace team: invitation → acceptance → correctly scoped workspace.
6. Locale/theme: direct entry to `/fa` or `/en` → change theme/language → navigate to a nested route → refresh and retain coherent route, content, and preference.

## 8. Quality gates and commands

Scripts declared by the repository include:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

These scripts have been identified from `package.json`, but **were not executed in this audit pass**. Capture their baseline results before production code changes. After implementation, run targeted tests and all four release gates, plus manual checks for locale, theme, navigation, mobile overflow, keyboard behavior, and reduced motion.

## 9. Phase 01 exit criteria

- [x] Homepage, locale shell, styling tokens, theme provider, font configuration, and existing marketing/navigation components identified.
- [x] Uploaded Product UI Styleguide translated into source-derived visual requirements.
- [x] Language switching, navigation hierarchy, dark-oriented token base, and product-claim risks recorded.
- [x] Sitemap total/module-summary discrepancy recorded.
- [ ] Complete the 106-row route-to-code/status reconciliation.
- [ ] Run and record lint, typecheck, tests, and build baseline.
- [ ] Verify font asset licenses and rendering, actual CTA routes, provider/data capabilities, and which dashboard previews are simulated.
- [ ] Initialize/reuse the Superdesign project and import the actual reference image when its CLI is available; this was blocked because both CLI preflight attempts timed out.
- [ ] Approve the audited design constraints before modifying production homepage components.

**Conclusion:** the repository has reusable foundations, but the homepage currently combines multiple navigation layers, a large client-side page, a dark-oriented token base, and marketing claims that need evidence checks. The uploaded styleguide provides a strong direction—light editorial canvas, orange/vermilion action color, graphite controls, rounded geometry, and restrained elevation—but it must be adapted to Oxenn's actual assets and accessible product behavior rather than copied literally.

**Scope boundary:** this is a documented first-pass audit. No production homepage code was changed, no local build/test result is claimed, and no Superdesign canvas was created in this pass.
