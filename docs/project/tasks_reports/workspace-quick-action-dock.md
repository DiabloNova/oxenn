# Workspace Quick-Action Dock — Implementation Report

**Implementation branch:** `feat/workspace-quick-action-dock`  
**Parent change:** PR #98 (`fix/language-toggle-route-sync`), head `283efb616203ccd20f8b3a0d22cf7a23679da262`  
**Safety invariant:** All dock changes are isolated from `main`. The locale-routing fix and the pre-existing `systeminformation@5.33.16` security override/lockfile resolution remain intact.

## Delivered behavior

- Four quick actions only: AI Model Playground (`/dashboard/aeo/playground`), Reports & Analytics Explorer (`/dashboard/analytics/llm-bias`), Content Studio (`/dashboard/content/studio`), and sign out.
- The three navigation actions reuse the existing canonical dashboard destinations and are prefixed by the active `fa` or `en` locale.
- Sign out is an action, not a link, and requires explicit confirmation. Errors are surfaced and the action is disabled while sign-out is in progress.
- The dock appears only on supported locale-prefixed workspace routes. Existing route-transition hiding, the 300 ms settle window, and the bounded 10-second navigation recovery are preserved.
- Desktop uses a compact matte-glass icon dock. Hover opens it after one second; leaving early cancels the timer. Click and keyboard activation remain available. Labels appear as hover/focus tooltips, not persistent labels.
- Mobile uses a subdued bottom-right trigger and a two-step activation: first tap arms it and announces a localized hint; a second tap within three seconds opens the dock. The activation expires after three seconds.
- The expanded dock supports Escape, outside-pointer dismissal, explicit close, localized routes, focus-visible styles, 44 px action targets, and reduced-motion preference.
- The global navigation controls are raised on mobile to avoid overlap with the bottom-right trigger.

## Automated verification

**GitHub Actions CI run #523:** [Success](https://github.com/DiabloNova/oxenn/actions/runs/40907779787)  
**Tested source SHA:** `9e4efb471f9d7a7aed389a70100798cb6538517c`

All required jobs and gates passed:
- Dependency audit gate and audit-gate regression tests.
- Typecheck and lint.
- Tenant schema alignment, RLS migration coverage, and Drizzle migration chain.
- Production build, Build Reference Matrix, and generated tracked-file no-drift check.
- Unit tests, UI tests (including seven dock-interaction cases), and the isolation suite.

The first implementation run exposed three legacy UI assertions that expected an expanded dock after navigation; they were corrected to assert the intended collapsed-trigger restoration. A new lint warning from unstable callbacks was also fixed with stable callbacks and effect dependencies. CI was rerun after those corrections and passed.

## Remaining manual verification

A human visual check against the Vercel preview on both desktop and mobile has not been confirmed from this workflow. Verify hover timing, touch activation, tooltips, RTL/LTR alignment, overlap with the bottom controls, and reduced-motion behavior in the preview before marking visual QA complete.

## Review and merge safety

The dock PR is intended to be stacked on PR #98 (base `fix/language-toggle-route-sync`), **not directly on `main`**, to avoid duplicating PR #98 changes in the diff. It remains a draft until visual QA/review is complete. Neither PR is merged by this task.
