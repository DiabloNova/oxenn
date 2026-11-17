# PR #146 — Dashboard and UI remediation

## Scope

This report records the frontend and dashboard work performed after refreshing PR #146 from `main` at commit `46d0e80d34fb432457e9d89781acd88d9ad96ac3`.

## Changes

- Removed optimistic global language state during route changes. The route locale remains authoritative until Next.js commits the destination; a cancelled navigation no longer leaves a stale language preference.
- Kept document theme classes synchronized with the active theme through a layout effect, including external preference changes.
- Stored chat message timestamps as ISO values and format them at render time using the active UI locale.
- Normalized Persian search text for Arabic Yeh/Kaf variants, NFC composition, whitespace, and ZWNJ.
- Corrected the Persian language-switch label and strengthened logout, theme, and owner-defined page tests.
- Restored `/dashboard/audits` and `/dashboard/audits/[id]` using tenant-scoped records from `premium_audits`; the detail route reads URL, score, grade, metrics, findings, and recommendations from the stored record rather than query-string or mock values.
- Added bounded search and pagination to the audit list. The detail query is scoped by both `organization_id` and the UUID record ID.
- Moved the existing Product Review placeholder to `/dashboard/product-review` and updated its navigation link so it no longer collides with the audit history routes.

## Validation

- `git diff --check` passed before publication.
- Added a unit test for tenant-scoped audit list/detail queries and malformed UUID rejection.
- Added/updated focused UI tests for language navigation, theme synchronization, Persian navigation search, logout action invocation, and owner-defined list assertions.
- Local Vitest/TypeScript execution was not available: the pinned dependency installation was terminated by the remote sandbox before `node_modules/.bin/vitest` or `tsc` became available. GitHub Actions on the updated PR branch is the required final test authority.

## Remaining considerations

- Product Review remains the previously specified owner-defined placeholder; its detailed behavior and verified data source were not invented.
- No audit records are fabricated. Empty states are shown when the tenant has no saved reports.
