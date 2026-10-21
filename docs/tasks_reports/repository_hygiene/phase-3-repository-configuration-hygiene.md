# Phase 3 — Repository and Configuration Hygiene

**Status:** INCOMPLETE — VERIFICATION PENDING  
**Date:** 2026-10-21  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Remediation source:** [Audit.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/Audit.md), [README-FIXES.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/README-FIXES.md)  
**Branch:** `fix/audit-remediation-p3`  
**Base commit:** `641b1fcb18a62e520a463b546240239b952836c2`

## Objective and scope

Execute only Phase 3 of the Oxenn audit remediation plan: M6, M7, M9, L1, L2 and L4. Preserve the main-branch behavior outside the authorized hygiene/configuration work. No dependency manifest or lockfile edits, database schema changes, new migrations, changes to `env-check.ts`, or Phase 4 tasks are included.

## Changes

- Update `.env.example` with the documented authenticator connection and pool variables, `EMAIL_PROVIDER`, `APP_MODE`, and a safe default `VERIFICATION_PROBE_ACTIVE=0`. The latter is a test/verification-only escape hatch in `src/core/database/tenant-context/index.ts`; it must remain disabled outside isolated probes.
- Correct `components.json`'s CSS path to `src/app/globals.css`; add the kit's `src/lib/utils.ts` helper.
- Relocate the only live root component, `FloatingSidebar.tsx`, to `src/components/navigation/`. Use the configured `@/` aliases for the component's three internal imports and the layout import so the move does not break module resolution.
- Remove the orphan root `components/` and `lib/` files after checking the audit's consumer analysis: the old live-analytics tree and root button are not part of the `src/` component tree.
- Delete the explicitly listed stale schema copy, scratch file, one-off tenant edit script, and seven tracked Phase 0 logs.
- Move the two useful ad-hoc inventory scripts from the repository root to `scripts/dev-tools/` without changing their bodies.
- Add a final newline to `database/drizzle/0004_abandoned_black_crow.sql`; SQL statement content remains unchanged.
- Raise TypeScript `target` from `ES2017` to `ES2022`.
- Add the CI lint ratchet `pnpm lint --max-warnings=218`.
- Add this task report as required by `AGENTS.md`.

## Explicitly preserved

- `package.json` and `pnpm-lock.yaml` are unchanged.
- No database schema, migration journal/snapshot, runtime database code, `env-check.ts`, or generated file was intentionally changed.
- `src/lib/docsIndex.ts`, `src/core/database/tenant-tables.generated.ts`, and `docs/database/reference-matrix.md` must remain byte-for-byte unchanged.
- No Phase 4 environment validation, test-db seeding, security-header work, dependency migration, or database guard work was included.

## Verification ledger

| Item | Evidence / procedure | Result |
|---|---|---|
| Branch base | GitHub main at `641b1fcb18a62e520a463b546240239b952836c2`; new branch created from main | verified |
| Audit scope | Phase 3 and deletion/move list in `Audit.md` and `README-FIXES.md` inspected | verified |
| Environment names | Direct inspection of authenticator configuration and `VERIFICATION_PROBE_ACTIVE` use in `src/core/database/tenant-context/index.ts` | verified |
| FloatingSidebar import paths | Direct inspection of the component and layout; moved-file imports converted to configured aliases | verified by source review |
| Migration semantics | Original statement inspected; only the final newline is added | verified by content inspection; `drizzle-kit check` pending |
| Dev-tool script relocation | New blobs match both original script SHAs; only their paths change | verified |
| Orphan root tree references | Audit consumer findings inspected; a fresh full-repository reference scan was not available | not verified pending typecheck/build |
| Frozen install | `pnpm install --frozen-lockfile` | not verified locally; no local checkout/dependency install was available |
| Typecheck | `pnpm typecheck` | pending CI |
| Lint ratchet | `pnpm lint --max-warnings=218` | pending CI |
| Unit and UI tests | `pnpm test:unit`, `pnpm test:ui` | pending CI |
| Production build | `pnpm build` | pending CI |
| Database and generated checks | `npx drizzle-kit check`, `pnpm db:verify-rls-migrations`, `pnpm tsx scripts/database/verify-tenant-tables.ts`, `pnpm run docs:matrix`, and generated-files drift check | pending CI/local verification |
| CI workflow | [CI workflow](https://github.com/DiabloNova/oxenn/blob/main/.github/workflows/ci.yml) | pending pull-request run |
| Visual verification | Persian/English × light/dark screenshots for routes where FloatingSidebar renders | not verified; no running browser/app was available in this execution environment |
| Final diff scope | Review the branch compare; confirm generated-file paths are unchanged | pending final compare |

## Known limits and unresolved items

The execution environment could read and write repository files through the GitHub API, but could not create a local clone because DNS resolution for `github.com` failed. Consequently, no local pnpm commands or browser screenshots are claimed. CI must be green on the final commit; the generated-file drift gate must show no changes to the three protected generated files. The report must be updated with actual CI/compare outcomes before Phase 3 can be described as complete.

**Current assessment:** source edits are prepared within Phase 3. Required command execution, the complete generated-file gate, and the four visual states remain unverified.

**Counts:** 6 verified, 0 failed, 10 not verified, 0 not applicable, 0 exception of 16 reported verification items.
