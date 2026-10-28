# PR #98 — Language routing and workspace navigation flash

**Status:** INCOMPLETE — patch committed for CI; live visual transition verification remains pending.

**Scope:** `fix/language-toggle-route-sync` (PR #98). This task covers the floating-navigation flash during route changes and the route contract for unprefixed application paths.

## Invariant

The floating workspace dock must be owned by workspace route branches and must not remain mounted as a sibling of every localized page. Locale routing recognizes only configured locales (`en`, `fa`), normalizes unprefixed application paths under the default locale (`fa`), and preserves query/hash state when the language control changes routes.

## Implementation

- Removed `FloatingSidebar` from persistent `src/app/[locale]/layout.tsx` and mounted it under the dashboard layout and standalone profile/settings pages where it is intended. This keeps it out of unrelated marketing-route loading states.
- Made the dock route check segment-aware for `/{fa|en}/{dashboard|settings|profile}`.
- Updated `ThemeProvider.setLanguage` to add a locale prefix when the current path is unprefixed, including when the chosen language already matches the active language; query and hash are preserved.
- Made the Proxy treat only `en` and `fa` as locale prefixes. Other non-static application paths, including short slugs such as `/app` and `/faq`, normalize under `/fa`. Tightened infrastructure matcher boundaries.
- Added unit/UI regressions for ambiguous first path segments, `/apiary`, locale insertion, and query/hash preservation.

## Verification

- Previous PR-head checks were green for Build and Test, Unit Tests, and Isolation Suite at `b09972163d0cb0baf3c09ee183372ba7dfbe1c83`; those results do not verify this patch.
- New unit/UI test results: pending on this commit.
- Four-way rendered visual review (English/Persian × light/dark), including a clickability check during navigation transitions: pending.

## Negative paths covered

- Unsupported locale-looking segments are not mistaken for configured locales.
- Short ordinary slugs (`/app`, `/faq`) receive the default locale prefix instead of being treated as invalid locales.
- `/apiary` is not treated as the `/api` infrastructure route. Actual API, Next/Vercel internal, and file-like paths remain bypassed.
- Language switching preserves query/hash state and avoids a second `router.push`.

## Known limitations

Update this report with actual post-commit CI results and live visual transition evidence before marking the task complete.

**Counts:** verified: 0; failed: 0; not verified: 3 (post-patch CI, live transition/clickability, four locale/theme visual combinations); not applicable: 0.
