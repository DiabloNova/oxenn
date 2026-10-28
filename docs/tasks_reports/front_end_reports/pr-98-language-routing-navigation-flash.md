# PR #98 — Language routing and workspace navigation flash

**Status:** INCOMPLETE — transition-aware dock hiding and route normalization committed for CI; live visual verification is blocked by Vercel deployment protection.

**Scope:** `fix/language-toggle-route-sync` (PR #98). This task covers the floating-navigation flash during route changes and the route contract for unprefixed application paths.

## Invariant

The floating workspace dock must be owned by workspace route branches and must not remain mounted as a sibling of every localized page. Locale routing recognizes only configured locales (`en`, `fa`), normalizes unprefixed application paths under the default locale (`fa`), and preserves query/hash state when the language control changes routes.

## Implementation

- Removed `FloatingSidebar` from persistent `src/app/[locale]/layout.tsx` and mounted it under the dashboard layout and standalone profile/settings pages where it is intended. This keeps it out of unrelated marketing-route loading states.
- Made the dock route check segment-aware for `/{fa|en}/{dashboard|settings|profile}`. It now hides immediately when an internal route change starts (anchor clicks, dashboard sidebar/topbar router calls, global back/home controls, and language changes) and reappears only if the committed destination remains a workspace route.
- Updated `ThemeProvider.setLanguage` to add a locale prefix when the current path is unprefixed, including when the chosen language already matches the active language; query and hash are preserved.
- Made the Proxy treat only `en` and `fa` as locale prefixes. Other non-static application paths, including short slugs such as `/app` and `/faq`, normalize under `/fa`. Tightened infrastructure matcher boundaries.
- Added unit/UI regressions for ambiguous first path segments, `/apiary`, locale insertion, query/hash preservation, and immediate dock hiding/restoration during a workspace route transition.

## Verification

- Previous PR-head checks were green for Build and Test, Unit Tests, and Isolation Suite at `b09972163d0cb0baf3c09ee183372ba7dfbe1c83`; those results do not verify this patch.
- On implementation commit `e4af71d3af5ee819af2e0d4bf065b18cef1af4f3`, Unit Tests (including UI tests), Isolation Suite, Typecheck, Lint, and the production Build passed. The aggregate CI failed only because adding this report caused the generated `src/lib/docsIndex.ts` metadata check to detect drift; the expected generated entry is included in this follow-up.
- Follow-up CI at commit `7407c79162fd3639f9dbbd2abb402424c866bd96`: Build and Test, Unit Tests, and Isolation Suite completed successfully. This new transition-aware change has fresh CI pending.
- Attempted browser inspection on the Vercel preview, but deployment protection redirected the session to Vercel login; no temporary public access link was created. Visual clickability across the four locale/theme combinations is therefore still unverified.

## Negative paths covered

- Unsupported locale-looking segments are not mistaken for configured locales.
- Short ordinary slugs (`/app`, `/faq`) receive the default locale prefix instead of being treated as invalid locales.
- `/apiary` is not treated as the `/api` infrastructure route. Actual API, Next/Vercel internal, and file-like paths remain bypassed.
- Language switching preserves query/hash state and avoids a second `router.push`.

## Known limitations

The previous follow-up CI is green. Update this report with the new transition-aware commit's CI results; live visual transition evidence requires authenticated preview access.

**Counts:** verified: 1 (previous route-normalization follow-up CI); failed: 1 (generated-index freshness on the earlier implementation commit, corrected in a follow-up); not verified: 2 (CI for this transition-aware patch, authenticated live visual/clickability checks); not applicable: 0.
