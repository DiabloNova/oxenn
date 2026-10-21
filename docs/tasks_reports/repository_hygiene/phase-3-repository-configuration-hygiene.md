# Phase 3 — Repository and Configuration Hygiene

**Status:** INCOMPLETE — VERIFICATION PENDING  
**Date:** 2026-10-21  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Remediation source:** [Audit.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/Audit.md), [README-FIXES.md](https://github.com/DiabloNova/oxenn-remediation-kit/blob/main/README-FIXES.md)  
**Branch:** `fix/audit-remediation-p3`  
**Base commit:** `641b1fcb18a62e520a463b546240239b952836c2`

## Objective and scope

Execute only Phase 3 of the Oxenn audit remediation plan: M6, M7, M9, L1, L2 and L4. Preserve the main-branch behavior outside the authorized hygiene/configuration work. No dependency manifest or lockfile edits, database schema changes, new migrations, or Phase 4 tasks are included. The CLI fallback in `scripts/env-check.ts` was adjusted narrowly so an explicit mode argument wins, then `APP_MODE`, then `dev`.

## Changes

- Update `.env.example` with the documented authenticator connection and pool variables, `EMAIL_PROVIDER`, `APP_MODE`, and a safe default `VERIFICATION_PROBE_ACTIVE=0`. The latter is a test/verification-only escape hatch in `src/core/database/tenant-context/index.ts`; it must remain disabled outside isolated probes.
- Correct `components.json`'s CSS path to `src/app/globals.css`; add the kit's `src/lib/utils.ts` helper.
- Relocate the only live root component, `FloatingSidebar.tsx`, to `src/components/navigation/`. Use the configured `@/` aliases for the component's three internal imports and the layout import so the move does not break module resolution.
- Remove the orphan root `components/` and `lib/` files after checking the audit's consumer analysis: the old live-analytics tree and root button are not part of the `src/` component tree.
- Delete the explicitly listed stale schema copy, scratch file, one-off tenant edit script, and seven tracked Phase 0 logs.
- Move the two useful ad-hoc inventory scripts from the repository root to `scripts/dev-tools/` without changing their bodies.
- Add a final newline to `database/drizzle/0004_abandoned_black_crow.sql`; SQL statement content remains unchanged.
- Raise TypeScript `target` from `ES2017` to `ES2022`.
- Make the `scripts/env-check.ts` CLI honor `APP_MODE` when no explicit mode argument is supplied; an explicit argument retains precedence.
- Add the CI lint ratchet `pnpm lint --max-warnings=218`.
- Add this task report as required by `AGENTS.md`.

## Explicitly preserved

- `package.json`, `pnpm-lock.yaml`, database schema, migration journal/snapshots, and runtime database code remain unchanged.
- `src/core/database/tenant-tables.generated.ts` and `docs/database/reference-matrix.md` remain byte-for-byte unchanged.
- `src/lib/docsIndex.ts` contains the generator-derived entry for this required task report. This is expected because `scripts/generate-docs-data.ts` indexes Markdown files beneath `docs/`; the generated entry is caused by the report addition, not by the `FloatingSidebar` move. No generator source change was made.
- No Phase 4 environment validation, test-db seeding, security-header work, dependency migration, or database guard work was included.

## Verification ledger

| Item | Evidence / procedure | Result |
|---|---|---|
| Branch base | GitHub main at `641b1fcb18a62e520a463b546240239b952836c2`; branch was created from that commit | verified |
| Audit scope | Phase 3 and its deletion/move checklist in `Audit.md` and `README-FIXES.md` inspected | verified |
| Environment names | Direct source inspection of authenticator pool configuration and the `VERIFICATION_PROBE_ACTIVE` guard in `src/core/database/tenant-context/index.ts`; example default is `0`. The `APP_MODE` CLI fallback was corrected to honor the advertised setting. | code change verified; behavior still requires CI/test confirmation |
| FloatingSidebar import paths | Component internals and layout import use configured `@/` aliases; CI Typecheck and production Build succeeded | verified |
| Deletion list | Branch tree confirms stale schema copy, scratch file, update script, seven listed logs, and orphan root component/lib files are absent | verified |
| Dev-tool script relocation | Moved script blobs have the exact original SHAs; only paths changed | verified |
| Migration 0004 content | SQL statement is unchanged; branch blob has the required trailing newline | verified by content inspection; standalone `drizzle-kit check` remains separate |
| Report-generated index behavior | Generator reads Markdown files under `docs/`; CI produced the task report's entry in `src/lib/docsIndex.ts` | verified |
| Frozen install | CI step `pnpm install --frozen-lockfile` succeeded in Unit Tests and Build/Test jobs | verified |
| Typecheck | CI step `pnpm typecheck` succeeded | verified |
| Lint ratchet | CI step `pnpm lint --max-warnings=218` succeeded | verified |
| Unit and UI tests | CI steps `pnpm test:unit` and `pnpm test:ui` succeeded | verified |
| Production build | CI `Build` step succeeded | verified |
| Tenant table / RLS gates | CI steps `verify-tenant-tables.ts` and `db:verify-rls-migrations` succeeded | verified |
| Reference-matrix generation | CI `Build Reference Matrix` succeeded; `tenant-tables.generated.ts` and `reference-matrix.md` remain unchanged | verified |
| Initial generated-files drift gate | First run failed only because the required report's generated `docsIndex` entry had not yet been committed; the job log names only `src/lib/docsIndex.ts` in the diff | failed on initial commit; cause corrected below |
| Final generated-files drift gate | Second CI run passed `git diff --exit-code src/lib/docsIndex.ts src/core/database/tenant-tables.generated.ts docs/database/reference-matrix.md` after the matching report entry was committed | verified |
| Drizzle chain check | `npx drizzle-kit check` is not part of the current CI workflow and was not run locally | not verified; local checkout unavailable |
| Visual verification | Persian/English × light/dark screenshots of the route(s) where `FloatingSidebar` renders | not verified; no running browser/app was available in this execution environment |
| Final branch diff | GitHub compare confirms the branch is two commits ahead of `main`, with only Phase 3 paths plus the report-derived `docsIndex` entry; generated tenant-table and reference-matrix blobs match main | verified |

## Known limits and unresolved items

The GitHub API was available, but a local clone could not be created because DNS resolution for `github.com` failed. No local pnpm command or UI screenshot is claimed. The `APP_MODE` CLI fallback was corrected after review, and `.env.example` now explicitly states that production must use a dedicated least-privilege authenticator role; the local example retains the same local PostgreSQL credentials for developer usability. The first CI run's generated-files drift failure was traced to the new required task report: `scripts/generate-docs-data.ts` indexes Markdown files beneath `docs/`. The report's matching generated `docsIndex` entry was committed without changing the generator, and the second CI run passed the full drift check. `src/core/database/tenant-tables.generated.ts` and `docs/database/reference-matrix.md` remain byte-for-byte unchanged; the `FloatingSidebar` move did not affect them or create the `docsIndex` entry.

The latest complete CI run is green: frozen install, audit gates, typecheck, lint ratchet, unit tests, UI tests, production build, tenant-table alignment, RLS coverage, reference-matrix generation, generated-file drift, and Isolation Suite all passed. However, a standalone `drizzle-kit check` and the required four-state visual screenshots remain unverified, so the task is not being marked fully complete and this PR must remain Draft until those limits are resolved or explicitly accepted by the project owner.

**Current assessment:** Phase 3 implementation is committed and the final CI workflow passed. Independent migration-chain verification and four-state UI visual verification remain unresolved.

**Counts:** 17 verified, 1 failed, 2 not verified, 0 not applicable, 0 exception of 20 reported verification items.
