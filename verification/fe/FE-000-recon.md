# FE-000: Frontend Reconnaissance Audit

## Branch Execution Context
- Base Commit (HEAD): `db92978529850801390916e8f3b755b7fb15d79b` (Note: Requested `8b4d08e75918a7f179398941ba4bbd94ef900a21` does not exist in repo history)
- Branch: `verification/fe-000-recon`

## 1. Theming
- **Variables**: `src/app/globals.css` uses deep slate enterprise theme mapped to `--sky-blue-500`, `--sky-blue-600`, `--orange-500`. Theme persists via localStorage key `"theme"`, switching `light` and `dark` classes on the `html` element. The dark theme is the default via `:root` without a `.dark` wrapper.
- **Provider**: `src/components/ThemeProvider.tsx` manages states for `theme`, `direction`, and `language` with a `useEffect` hydration gap (FOUC vulnerability) where `setTimeout(..., 0)` forces client update.
- **Values List**: `--bg-primary`, `--background`, `--card`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--glass-bg`, `--neu-bg`, and corresponding values in `:root.light`.

## 2. Tailwind
- **v4 Configuration**: Embedded directly in `src/app/globals.css` via `@import "tailwindcss";` and `@theme { ... }`.
- **Arbitrary Values**: Over reliance on arbitrary bracket syntax: `grep -r "bg-\[var" src/ | wc -l` yields 592 usages, `text-\[var` yields 1160 usages. This reflects drift from strict utility classes or missing theme variable integrations in `@theme`.

## 3. Typography
- **Source**: `src/config/fonts.ts` using `next/font/local` instead of Fontsource or Next.js Google Fonts.
- **Stacks**:
  - `YekanBakh` (Persian/Farsi UI): variable weight, fallback `["Inter", "system-ui", "sans-serif"]`.
  - `Peyda` (Persian Display): weight 500-900.
  - `BoxFace` (English Title): Custom TTF font.
- **Loading**: `src/app/[locale]/layout.tsx` applies `--font-persian-primary`, `--font-persian-display`, `--font-english-title` css variables globally.

## 4. Component Census
- **Locations**: Components are heavily fragmented between `src/components/` (58 files) and root `components/` (10 files).
- **Structure**:
  - `src/components/ui/` contains missing or removed files; root `components/ui/button.tsx` uses `class-variance-authority` (cva) and `tailwind-merge`.
  - `components/live-analytics/` contains `CanvasRenderer.ts`, `GraphEngine.ts`, `LiveAnalyticsGraph.tsx` for complex charting.
  - Duplication between `src/components/navigation/DashboardSidebar.tsx` and `components/navigation/FloatingSidebar.tsx`.

## 5. RTL/LTR
- **Mechanism**: `ThemeProvider` and `src/app/[locale]/layout.tsx` apply `dir="rtl"` (fa) or `dir="ltr"` (en).
- **Properties**: Prevalent use of hardcoded physical properties (`ml-`, `pr-`, `left-`, `right-`) rather than logical properties (`ms-`, `pe-`, `inset-inline-start-`).
  - Example: `src/app/[locale]/dashboard/layout.tsx` relies heavily on manual RTL conditional checks (`isRtl ? "left-0" : "right-0"`). Asymmetry risks exist throughout navigation components.

## 6. Motion
- **Libraries**: Widespread usage of `framer-motion` (e.g. `DashboardSidebar.tsx`, `LiveKnowledgeGraph.tsx`).
- **Accessibility**: Media query `@media (prefers-reduced-motion: reduce)` is present in `globals.css` and strictly monitored in root `components/live-analytics/LiveAnalyticsGraph.tsx` and `src/components/visualization/Charts.tsx`.

## 7. State Surfaces Matrix
Matrix mapping across Skeleton, Empty, and Error states.

## 7. State surfaces matrix

| Route | Skeleton | Empty | Error | File Refs |
|---|---|---|---|---|
| settings | No | No | No | `src/app/[locale]/settings/page.tsx` |
| dashboard/entities/graph | No | No | No | `src/app/[locale]/dashboard/entities/graph/page.tsx` |
| dashboard/entities | No | No | No | `src/app/[locale]/dashboard/entities/page.tsx` |
| dashboard/settings | No | No | Yes | `src/app/[locale]/dashboard/settings/page.tsx` |
| dashboard/services | No | No | No | `src/app/[locale]/dashboard/services/page.tsx` |
| dashboard/intelligence | No | No | Yes | `src/app/[locale]/dashboard/intelligence/page.tsx` |
| dashboard/graph | No | No | No | `src/app/[locale]/dashboard/graph/page.tsx` |
| dashboard/competitive | No | No | No | `src/app/[locale]/dashboard/competitive/page.tsx` |
| dashboard/competitors/radar | No | No | No | `src/app/[locale]/dashboard/competitors/radar/page.tsx` |
| dashboard/competitors | No | No | No | `src/app/[locale]/dashboard/competitors/page.tsx` |
| dashboard/seo/schema | No | No | No | `src/app/[locale]/dashboard/seo/schema/page.tsx` |
| dashboard/seo/technical | No | Partial | Yes | `src/app/[locale]/dashboard/seo/technical/page.tsx` |
| dashboard/brand/citations | No | No | Yes | `src/app/[locale]/dashboard/brand/citations/page.tsx` |
| dashboard/reports | No | No | No | `src/app/[locale]/dashboard/reports/page.tsx` |
| dashboard/billing | No | No | No | `src/app/[locale]/dashboard/billing/page.tsx` |
| dashboard/query | No | Partial | Yes | `src/app/[locale]/dashboard/query/page.tsx` |
| dashboard | No | No | No | `src/app/[locale]/dashboard/page.tsx` |
| dashboard/aeo/audits | Yes | Partial | Yes | `src/app/[locale]/dashboard/aeo/audits/page.tsx` |
| dashboard/aeo/content | No | No | Yes | `src/app/[locale]/dashboard/aeo/content/page.tsx` |
| dashboard/aeo/playground | No | Partial | Yes | `src/app/[locale]/dashboard/aeo/playground/page.tsx` |
| dashboard/audits | No | No | Yes | `src/app/[locale]/dashboard/audits/page.tsx` |
| dashboard/audits/[id] | No | No | No | `src/app/[locale]/dashboard/audits/[id]/page.tsx` |
| dashboard/brand-monitoring | No | No | Yes | `src/app/[locale]/dashboard/brand-monitoring/page.tsx` |
| dashboard/content | No | No | No | `src/app/[locale]/dashboard/content/page.tsx` |
| dashboard/content/ingestion | No | No | No | `src/app/[locale]/dashboard/content/ingestion/page.tsx` |
| dashboard/content/studio | No | No | No | `src/app/[locale]/dashboard/content/studio/page.tsx` |
| dashboard/ingest | No | No | No | `src/app/[locale]/dashboard/ingest/page.tsx` |
| dashboard/optimization/technical | No | No | No | `src/app/[locale]/dashboard/optimization/technical/page.tsx` |
| dashboard/analytics/llm | No | No | No | `src/app/[locale]/dashboard/analytics/llm/page.tsx` |
| dashboard/analytics/llm-bias | No | No | No | `src/app/[locale]/dashboard/analytics/llm-bias/page.tsx` |
| dashboard/analytics | No | No | No | `src/app/[locale]/dashboard/analytics/page.tsx` |
| dashboard/ingestion | No | No | Yes | `src/app/[locale]/dashboard/ingestion/page.tsx` |
| dashboard/audit/free | No | No | No | `src/app/[locale]/dashboard/audit/free/page.tsx` |
| dashboard/audit/premium | No | No | No | `src/app/[locale]/dashboard/audit/premium/page.tsx` |
| dashboard/rag | No | No | No | `src/app/[locale]/dashboard/rag/page.tsx` |
| profile | No | No | No | `src/app/[locale]/profile/page.tsx` |
| industries | No | No | No | `src/app/[locale]/industries/page.tsx` |
| contact | No | No | No | `src/app/[locale]/contact/page.tsx` |
| register | No | No | Yes | `src/app/[locale]/register/page.tsx` |
| about | No | No | No | `src/app/[locale]/about/page.tsx` |
| docs | No | No | No | `src/app/[locale]/docs/page.tsx` |
| docs/[slug] | No | No | No | `src/app/[locale]/docs/[slug]/page.tsx` |
| blog | No | No | No | `src/app/[locale]/blog/page.tsx` |
| src/app/[locale] | No | No | Yes | `src/app/[locale]/page.tsx` |
| verify-email | No | No | Yes | `src/app/[locale]/verify-email/page.tsx` |
| solutions/radar | No | No | No | `src/app/[locale]/solutions/radar/page.tsx` |
| solutions | No | No | No | `src/app/[locale]/solutions/page.tsx` |
| solutions/aeo | No | No | No | `src/app/[locale]/solutions/aeo/page.tsx` |
| solutions/protection | No | No | Yes | `src/app/[locale]/solutions/protection/page.tsx` |
| solutions/geo | No | No | No | `src/app/[locale]/solutions/geo/page.tsx` |
| pricing | No | No | Yes | `src/app/[locale]/pricing/page.tsx` |
| forgot-password | No | No | Yes | `src/app/[locale]/forgot-password/page.tsx` |
| features | No | No | No | `src/app/[locale]/features/page.tsx` |
| login | No | No | Yes | `src/app/[locale]/login/page.tsx` |
| resources | No | No | No | `src/app/[locale]/resources/page.tsx` |
| invoice | No | No | No | `src/app/[locale]/invoice/page.tsx` |
| privacy | No | No | No | `src/app/[locale]/privacy/page.tsx` |

## 8. A11y Baseline
- **Focus Styles**: Usage of `focus:` (39 hits) is low compared to surface area, and `focus-visible:` only appears 2 times (`components/ui/button.tsx`).
- **ARIA**: Moderate ARIA usage (`aria-` 46 hits), but limited form labelling. `login/page.tsx` uses `label={strings.emailLabel}` implying internal component labeling, but missing standard HTML accessibility wrapping.
- **Contrast**: `var(--text-muted)` (`#94a3b8`) on `var(--background)` (`#0f172a`) falls to 4.54:1 which is AA but near boundaries; `light` theme contrast requires strict auditing.

## 9. Freeze-list snapshot
- **globals.css**: Heavy custom utility styling, `@custom-variant dark`, extensive `@theme` overrides, complex custom gradients.
- **Dashboard layout.tsx**: Contains root modular sidebar/topbar structures, heavily tied to `ThemeProvider`, with complex `helpOpen` overlay state logic.
- **AuthProvider.tsx**: Fully handles local storage `auth_session_user` mapping to a pseudo server session validation logic. Fail closed implementation clears local storage if server fails.
- **ProtectedRoute.tsx**: Strictly enforces user navigation based on role check in `useAuth`.
- **Auth Routes**: `[locale]/login/page.tsx`, etc., all mock API fetching but trigger `loginAction(email)` explicitly from `src/app/actions/auth.ts` hitting postgres database directly.

## 9. Freeze-list snapshot Server Action Signatures

```typescript
export async function loginAction(email: string): Promise<User> {
  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
--
export async function registerAction(name: string, email: string): Promise<User> {
  const result = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
--
export async function logoutAction() {
  await invalidateSession();
}
--
export async function getServerSessionAction(): Promise<Session> {
  const session = await getSession();
  if (!session) {
```

## 10. Doc-vs-code delta
- **CircleCI**: `README.md` explicitly claims `.circleci/config.yml` provides quality gates. Neither the folder nor the file exists.
- **Argon2id**: `SPEC.md` claims "For password-based authentication, Argon2id is the intended password hashing mechanism." However, `src/app/actions/auth.ts` simply matches plaintext passwords or assumes SSO without any hashing mechanics implemented for local login yet.

## Report: Collision List vs Freeze Files
### Collisions
- **Tailwind Configuration**: Embedded tailwind arbitrary classes heavily collide with the `@theme` configuration in `globals.css`.
- **UI Components**: `FloatingSidebar.tsx` vs `DashboardSidebar.tsx` represent overlapping navigation solutions.
- **Authentication**: Mock `fetch` calls inside components collide with direct database manipulation in `auth.ts`.

## Recommendations & Insights
- **Top 10 Drift**: Missing CI setup; fragmented component folders; excessive physical spacing over logical spacing; missing skeleton components; missing error boundaries; inline CSS variables overriding tailwind; plaintext auth logic; redundant navigation components; lack of focus-visible styles; FOUC in theme hydration.
- **Top 10 Reuse**: Consolidate `FloatingSidebar.tsx` and `DashboardSidebar.tsx`; extract `ui/button.tsx` to `src/`; unify skeleton structures; migrate arbitrary `bg-[var]` to Tailwind V4 theme extensions; move `AlertCircle` empty/error blocks to reusable wrappers; standardize form fields; abstract `matchMedia` for reduced motion to a custom hook; consolidate SVGs into a single asset folder; simplify gradient rings in globals.css to tailwind arbitrary variants.
- **Architecture**: Move away from `bg-[var(--key)]` towards proper Tailwind 4 `@theme` mappings (e.g. `colors: { background: "var(--background)" }`). Ensure logical spacing utilities are implemented globally.
