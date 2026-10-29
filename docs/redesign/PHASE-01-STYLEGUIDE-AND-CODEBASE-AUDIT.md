# Phase 01 — Existing Product & Design-System Audit

**Product:** Oxenn / Seorchable  
**Repository:** DiabloNova/oxenn  
**Branch:** `redesign/oxenn-world-class-experience`  
**Audit scope:** Existing homepage, shared navigation, theme/locale provider, typography configuration, tokens, marketing components, and the supplied Product UI Styleguide image.  
**Status:** Source inspection completed for the files listed below. No production UI code was changed in this phase.

## 1. Design brief grounded in the request

Redesign the Oxenn public homepage and its shared visual language, using the uploaded Product UI Styleguide as the primary visual reference and reusing the repository's real components and code wherever they are fit for purpose. The target is a production-oriented bilingual website (Persian RTL / English LTR), with an intentionally designed light theme and a compatible dark theme. The immediate outcome of this phase is a verified baseline and explicit design constraints; it is not the implementation or a claim that a Superdesign canvas draft already exists.

### Reference image: observable design traits

- Portrait style-guide board on a very light white/grey surface with a restrained peach tint toward the upper-right.
- Large, heavy black editorial display typography.
- Saturated orange-to-red primary token; the orange is the dominant action accent.
- A neutral scale from near-black charcoal through cool greys to white.
- Rounded controls with carefully layered, soft shadows and fine outlines.
- Component examples include buttons, inputs, chips, a toggle, search field, segmented control/tab-like elements, and cards.
- Fine vertical layout guides and a measured spacing scale communicate a system rather than isolated decoration.
- The reference uses selected dark surfaces as contrast, not a full-page dark canvas.
- The reference is a style guide, not a finished Oxenn homepage; it does not specify the final homepage copy, information architecture, product data, or actual CTA destination.

## 2. Repository facts inspected

| Area | Source evidence | Audit finding |
|---|---|---|
| Framework and scripts | `package.json` | Next.js 16.4.2, React 19, TypeScript, Tailwind CSS v4. Scripts include lint, typecheck, test, and build. |
| Homepage entry | `src/app/[locale]/page.tsx` | A large client-side page containing the marketing story, stateful dashboard-preview tabs, section refs, and many product-module claims. This is the main page to decompose carefully. |
| Locale layout | `src/app/[locale]/layout.tsx` | Sets initial HTML `lang` and `dir` from the route segment. It mounts AuthProvider, ThemeProvider, FloatingSidebar, and GlobalNavigationControls. |
| Theme and language | `src/components/ThemeProvider.tsx` | Persists theme/language to localStorage. The language setter changes document attributes and context state but does not navigate the locale URL; this can make rendered page copy disagree with the active locale segment. |
| Design tokens | `src/styles/tokens.css`, `src/app/globals.css` | Existing semantic tokens already cover color, spacing, radius, shadows, motion, and light mode. Base/root defaults are described as dark slate with sky-blue and orange accents; the reference instead leads with a light neutral canvas and orange-red primary. |
| Font setup | `src/config/fonts.ts` | Local YekanBakh (body), Peyda (Persian display), and BoxFace (English title) are configured. Preserve these until local files, glyph coverage, rendering, weights, and licensing are verified; do not introduce an Arabic-only face. |
| Marketing header | `src/components/marketing/LandingHeader.tsx` | Existing sticky header, menu drawer, theme/language controls, solution/platform links, and logo are reusable starting points. It currently has a broad menu/navigation pattern rather than the requested compact icon-first floating nav. |
| Marketing footer | `src/components/marketing/LandingFooter.tsx` | Existing grouped footer and product links are available, but destination validity and claims need route-by-route verification. |
| Workspace sidebar | `src/components/navigation/FloatingSidebar.tsx` | Conditionally renders on dashboard/settings/profile routes; uses a bottom floating dock and workspace-specific links. Keep workspace navigation distinct from the marketing nav redesign. |
| Global controls | `src/components/navigation/GlobalNavigationControls.tsx` | Adds back and back-to-top floating controls. These can collide with future fixed/mobile navigation and must be considered in the shared shell audit. |
| Demo/lead panel | `src/components/marketing/HeroAccessCard.tsx` | Existing demo/access form is available for reuse only after verifying its submit path, error/success behavior, and actual availability. |
| Audit component | `src/components/features/audit/FreeAuditPanel.tsx` | Existing audit UI should be inspected for its real API/service contract before it is surfaced as a homepage conversion promise. |
| Product metadata | `src/config/site.ts` | Site identity currently names `seorchable.ir`; confirm naming and logo treatment before applying an Oxenn wordmark or replacing brand assets. |

## 3. Existing strengths worth preserving

1. The project already has semantic design tokens, light/dark theme hooks, locale-aware route layout, local Persian fonts, shared marketing header/footer, and a recognizable icon set.
2. The homepage already includes product-oriented content and visualization components; the redesign should reorganize and improve them rather than create decorative mock product screens in isolation.
3. Existing reusable components can reduce duplication if their responsibilities and states are verified before extraction.
4. Reduced-motion CSS tokens are present in the token layer; component-level animation behavior still needs inspection.
5. The codebase already has established test and build commands, so the redesign can be gated by repository-native checks.

## 4. Verified gaps and design-system drift

### A. Reference style vs current theme
The supplied image's hierarchy is light-first: white/off-white canvas, orange-red primary, charcoal typography, fine cool-grey borders, and soft selective elevation. Current root token defaults and homepage treatments use dark slate, sky blue, cyan/orange gradients, glowing orbs, grid backdrops, and glass panels. This is a genuine design-direction change, not just a token tweak.

**Decision for the next design phase:** define a new light-first marketing theme while preserving semantic token names and an accessible dark companion. Keep semantic status colors independent from the brand accent. Do not delete existing dark tokens until all product routes and their consumers are mapped.

### B. Navigation overlap and competing patterns
The locale layout mounts global controls on all localized routes, while the marketing header also has its own menu, language/theme controls, and drawer. FloatingSidebar is route-conditional, but GlobalNavigationControls is not. Audit actual route visibility, z-index, mobile collision, keyboard focus, and redundant controls before consolidating the marketing header.

### C. Locale source-of-truth mismatch
The route segment determines the page's initial locale and HTML direction, but ThemeProvider's `setLanguage` changes the root attributes and localStorage without changing the route. Since the homepage copy uses the route parameter, this can produce a mismatch between displayed copy and document language/direction. Language switching must navigate to the equivalent locale route and preserve a meaningful route when that equivalent exists.

### D. Product-truth and copy risks
The homepage describes real-time monitoring, named AI systems, citation share, authority scoring, and other sophisticated outcomes. Source inspection of the homepage alone does not prove those capabilities are backed by live production data. Every claim and dashboard metric must be mapped to a service/API contract; unsupported examples must be visibly labeled illustrative and must never be represented as live.

### E. Typography and brand identity
YekanBakh and Peyda are configured locally for Persian, which is a promising baseline. The current font comments refer to another product name, and English titles use a local BoxFace font with Impact fallback. Verify actual font files, weights, glyph coverage, license, and visual rendering before deciding whether to retain or replace any face. Do not assume Vazirmatn is installed merely because it is a candidate.

### F. Component structure and maintainability
The homepage page component includes many imports, a large module array, multiple refs, and visual sections. Plan a targeted extraction into meaningful section components and product-preview components only after identifying real shared ownership. Avoid an unrelated rewrite or a new design-system dependency unless the current primitives cannot meet the requirements.

## 5. Proposed mapping from reference image to Oxenn

| Style-guide element | Oxenn application |
|---|---|
| Orange-red primary swatch | Primary CTA, selected navigation state, key action emphasis; use contrast-tested text and hover states. |
| Charcoal-to-cool-grey type scale | Editorial headline, body copy, metadata, disabled states; preserve clear contrast across both themes. |
| White/grey surfaces with subtle peach atmosphere | Light-first marketing canvas with a restrained peach ambient area behind the Twin visual, not a full-page gradient. |
| Soft rounded buttons and inputs | Shared button, input, search, chip, and segmented-control variants, using semantic tokens. |
| Dark capsule/control examples | Limited high-contrast controls and dark-theme components, not default styling for every card. |
| Fine vertical grid and spacing ruler | Consistent container, spacing, baseline, and responsive grid rules; decorative guides should not ship unless they improve comprehension. |
| Soft elevation and thin outlines | Elevation reserved for interactive/raised surfaces; avoid heavy shadows on every section. |

## 6. Risks and controls

| Risk | Required control |
|---|---|
| Replacing tokens breaks dashboard/admin screens | Inventory token consumers and theme classes; scope marketing theme changes and verify sibling routes. |
| Redesign implies unavailable product functionality | Trace CTA, metrics, and module claims to actual handlers/API/data; label concept-only data. |
| Language switch produces inconsistent URL/copy/direction | Route-aware locale navigation; test direct entry, refresh, and equivalent nested routes. |
| Several fixed nav controls overlap on mobile | Establish one marketing navigation owner; test 320px, 375px, tablet, and desktop widths. |
| New visual style regresses Persian typography | Inspect actual font assets and test Persian/Latin mixed strings and responsive wrapping. |
| Motion reduces accessibility/performance | Use existing motion primitives where appropriate; honor reduced motion and keep essential content static/readable. |

## 7. Required next checks before implementation

- Complete route-to-code audit for the sitemap's 106 entries and reconcile the status-summary discrepancy already recorded in the initial audit.
- Inspect actual content/behavior of the header, drawer, demo panel, free audit, product preview visualizations, and footer links.
- Verify whether a repository-level `DESIGN.md`, `UX-CONTRACT.md`, or equivalent exists on the authoritative default branch; current branch path checks found no `DESIGN.md`, `UX-CONTRACT.md`, or Superdesign init/resume files at the checked locations.
- Run baseline `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in a checkout that has the dependencies and required environment configured; results have not been run or verified during this remote-source audit.
- Initialize Superdesign against the actual repository and read its six generated context artifacts before requesting design generation. The required Superdesign CLI preflight timed out twice in this environment; no Superdesign project/draft or generated context files are claimed.
- After the style direction is approved, prepare the design-system spec and responsive bilingual homepage compositions in Superdesign, then review before production implementation.

## 8. Phase 01 status

**Completed in this audit:** source-level inspection of key homepage/theme/navigation/font files; comparison against the uploaded styleguide; identification of locale, navigation, product-truth, typography, and token drift risks; and a proposed mapping to Oxenn.

**Not yet completed:** automated Superdesign repository initialization; complete 106-route reconciliation; browser rendering inspection; baseline test/build run; validation of every CTA/data claim; and production implementation.

This document records observed evidence and unresolved work. It does not claim the UI has been redesigned or deployed.
