# Workspace Quick-Action Dock — Implementation Report

**Implementation branch:** `feat/workspace-quick-action-dock`  
**Parent change:** PR #98 (`fix/language-toggle-route-sync`), merged into `main` before this branch was synchronized.  
**Safety invariant:** All dock changes are isolated from `main`. The locale-routing fix and the pre-existing `systeminformation@5.33.16` security override/lockfile resolution remain intact.

## Delivered behavior

- Four quick actions only: AI Model Playground (`/dashboard/aeo/playground`), Reports & Analytics Explorer (`/dashboard/analytics/llm-bias`), Content Studio (`/dashboard/content/studio`), and sign out.
- The three navigation actions reuse the existing canonical dashboard destinations and are prefixed by the active `fa` or `en` locale.
- Sign out is an action, not a link, and requires explicit confirmation. Errors are surfaced and the action is disabled while sign-out is in progress.
- The dock appears only on supported locale-prefixed workspace routes. Existing route-transition hiding, the 300 ms settle window, and the bounded 10-second navigation recovery are preserved.
- Desktop uses a compact matte-glass icon dock. Hover opens it after one second; leaving early cancels the timer. Click and keyboard activation remain available. Labels appear as hover/focus tooltips, not persistent labels.
- Mobile uses a subdued bottom-right trigger and a two-step activation: first tap arms it and announces a localized hint; a second tap within three seconds opens the dock. The activation expires after three seconds.
- The expanded dock supports Escape, outside-pointer dismissal, explicit close, localized routes, focus-visible styles, 44 px action targets, and reduced-motion preference.
- Keyboard activation moves focus into the first quick action; Escape and explicit close restore focus after the trigger remounts. Pointer-outside dismissal does not steal focus.
- Desktop hover is pointer-only; focusing the trigger does not schedule an unexpected open.
- Sign-out cannot be dismissed while its request is in flight; failures remain visible in the confirmation panel for retry.
- On mobile, the sign-out confirmation panel is positioned opposite the global navigation controls to avoid covering them.
- The global navigation controls are raised on mobile to avoid overlap with the bottom-right trigger.

## Automated verification

**GitHub Actions CI run #523:** [Success](https://github.com/DiabloNova/oxenn/actions/runs/40907779787)  
**Previously tested source SHA:** `9e4efb471f9d7a7aed389a70100798cb6538517c` (pre-remediation; does not verify the current head).

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

PR #98 has been merged into `main`; this branch is synchronized directly with `main`. The PR remains open pending post-remediation CI, review-thread verification, and manual visual QA. This remediation does not merge the PR.
