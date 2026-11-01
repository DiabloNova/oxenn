# PR #98 — Language routing and workspace navigation flash

**Status:** IMPLEMENTED — automated checks passed on source commit `ebe2e470a8a2f78c7e85df3da5216826799fd0db`; manual visual verification of the protected Vercel preview remains unavailable.

**Scope:** `fix/language-toggle-route-sync` (PR #98). This task covers the floating-navigation flash during route transitions, all navigation initiators associated with that dock, and the contract for unprefixed application paths.

## Invariant

A single persistent `FloatingSidebar` instance is mounted in `src/app/[locale]/layout.tsx`. It renders only on segment-matched workspace routes (`/{fa|en}/{dashboard|settings|profile}`) and remains able to observe navigation starts across route boundaries. Locale routing recognizes only configured prefixes (`en`, `fa`); other non-static application paths normalize under the default locale (`fa`). Language changes preserve query and hash state.

## Implementation

- Kept one `FloatingSidebar` instance in the persistent localized root layout and removed duplicate mounts from the dashboard, profile, and settings pages. This preserves transition state while Next.js changes between those routes and avoids duplicate docks.
- Made the dock route guard segment-aware. An unrelated path that merely contains `dashboard`, `profile`, or `settings` does not display it.
- Added a shared `oxenn:navigation-start` event. The dock detects ordinary same-origin anchor navigation at the document capture phase and receives explicit signals from dashboard sidebar/topbar route calls, global back/home navigation, and `ThemeProvider.setLanguage`.
- The dock hides at navigation start, remains hidden for 300 ms after the pathname changes so it does not overlay the destination's settling/loading frame, and has a 10-second recovery if navigation starts but the pathname never changes. Back/forward changes that affect only query/hash clear the pending state rather than leaving the dock hidden.
- Updated `ThemeProvider.setLanguage` to add the locale prefix when a client-side path is unprefixed, even if the selected language already matches the active language; query and hash remain intact.
- Updated `src/proxy.ts` so only `fa` and `en` count as locale prefixes. Unprefixed human routes such as `/app`, `/faq`, and `/apiary` are normalized under `/fa`; actual `/api`, `/_next`, `/_vercel`, and file-like requests remain bypassed.
- Added regression cases for locale insertion, query/hash preservation, ordinary short slugs, `/apiary`, immediate dock hiding, post-path settle delay, and recovery when navigation never commits.

## Verification

- [GitHub Actions — source commit `ebe2e470`](https://github.com/DiabloNova/oxenn/actions/runs/40762190455): **Build and Test: success; Unit Tests: success; Isolation Suite: success.**
- Unit Tests: **243 passed**, 1 todo, 1 skipped test file. The proxy routing suite passed **30 tests**.
- UI Tests: **15 passed** across 3 files; `tests/ui/language-routing.test.tsx` passed **10 tests**, including route-transition hide/restore and stalled-navigation recovery.
- Typecheck, Lint, tenant schema alignment, RLS migration coverage, Drizzle migration chain, production Build, Build Reference Matrix, and generated tracked-file/no-drift verification all passed on the source commit.
- The user manually confirmed that language switching and the light/dark background/theme change work correctly. I could not independently verify the transition visually because the Vercel preview redirected browser inspection to deployment authentication. I did not create a public/shareable access bypass.

## Review findings and earlier corrected CI attempts

- Gitar/Cubic's duplicate-navigation concern was valid at the earlier commit. The duplicate `router.push` path was removed; `ThemeProvider` owns locale replacement and preserves query/hash.
- Cubic's unprefixed-path finding was valid at the earlier implementation. The provider now adds the locale prefix, and the Proxy consistently normalizes unprefixed human paths.
- Two interim CI failures were corrected before the verified source commit: generated `src/lib/docsIndex.ts` drift after introducing this report, and a duplicate test import introduced while iterating on the UI regression. The final source commit passed the full required CI jobs.
- The Cubic duplicate-navigation thread is the only outstanding review thread; it will be replied to and resolved with the verified fix.

## Known limitation

The final route logic is covered by automated tests, but the real-browser check of the dock's clickability during a white transition frame remains not verified because authenticated Preview access was unavailable.

**Counts:** verified: 4 (all required CI jobs; 243 unit tests; 15 UI tests; 30 Proxy route tests, including no-prefix cases); failed: 2 (interim generated-index drift and duplicate-import typecheck failures, both corrected); not verified: 1 (manual visual/clickability verification on the protected Vercel preview); not applicable: 0.
