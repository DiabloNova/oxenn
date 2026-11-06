# PR #113 — Phase 0 Baseline and Documentation Link Guards

**Status:** SUCCESS — verification passed in CI run [#607](https://github.com/DiabloNova/oxenn/actions/runs/42088444363).  
**Date:** 2026-11-05  
**Branch:** `mvp/phase-0-scope-baseline`  
**PR:** [#113](https://github.com/DiabloNova/oxenn/pull/113)  
**Verified implementation commit:** `97ba159c2f73536b42e3aad2d7f31c440254a586`

## Scope

Implement only the two documentation-quality suggestions raised during PR review:

1. Keep the Phase 0 schema and RLS counts consistent with the canonical repository artifacts.
2. Detect broken relative links and repository-path references in the Phase 0 baseline and its project index.

## Changes

- Added `scripts/docs/verify-phase-0-baseline.mjs`. It reads the schema declarations, latest Drizzle snapshot, migration journal and SQL files, generated tenant-table list, and `0005_force_rls.sql`. It compares table sets rather than relying only on hard-coded totals, then verifies the matching numeric claims in the Phase 0 baseline.
- The same script checks relative links and Markdown heading anchors in `docs/project/README.md` and `docs/project/MVP_PHASE_0_SCOPE_BASELINE.md`, confirms that the project index links to the baseline, and checks inline repository paths referenced by the baseline.
- Added one read-only verification step to the existing Build and Test CI job. The check does not connect to a database, execute migrations, write generated files, or alter runtime behavior.

## Verification

CI run [#607](https://github.com/DiabloNova/oxenn/actions/runs/42088444363) completed successfully:

- Build and Test — success.
- Unit Tests — success.
- Isolation Suite — success.
- The new Phase 0 baseline and documentation-link verification step — success.
- Typecheck, lint, existing tenant/RLS checks, Drizzle migration check, production build, reference-matrix generation, and generated-file drift check — success.

The final checked-in reconciliation remains 70 schema tables and 51 policy-bearing tenant tables; the runtime list and RLS migration sets match the latest snapshot.

## Boundaries

No application/runtime logic, schema declaration, migration, database, environment configuration, Phase 1 work, or Production resource was changed. The PR remains open; this task did not merge it.
