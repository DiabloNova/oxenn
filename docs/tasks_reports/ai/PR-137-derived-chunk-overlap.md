# PR #137 — Derived Chunk Overlap Remediation

**Date:** 2026-11-13  
**Repository:** `DiabloNova/oxenn`  
**Branch:** `review/058-src-012`  
**Pull request:** [#137](https://github.com/DiabloNova/oxenn/pull/137)  
**Review finding:** [discussion_r4564611228](https://github.com/DiabloNova/oxenn/pull/137#discussion_r4564611228)

## Objective and invariant

Ensure an omitted overlap for custom chunk sizes remains proportional to the chunk size, preserves room for new content and the joining separator, and does not cause near-duplicate chunks or wasteful embedding/storage operations. Preserve the existing 4,000-character chunk / 1,000-character overlap default.

## Root cause

`getDefaultChunkOverlap` previously returned `min(1,000, maxChunkSize - 4)`. For chunk sizes up to 1,004, this left only three characters for new content in subsequent chunks after reserving overlap and a separator.

## Implementation

- Changed the derived overlap to the minimum of the existing 1,000-character cap, 25% of `maxChunkSize` (floored), and `max(0, maxChunkSize - 4)`.
- Kept explicit-overlap validation and the existing chunk-count, chunk-size, and Unicode handling unchanged.
- Added contract coverage for sizes 3, 100, 500, 1,000, and 4,000 across the chunk request schema, ingestion schema, and `validateChunkingOptions`.
- Added a long-document chunker regression test for a 20,000-character document at size 500.
- Updated the API route regression expectation to the proportional default (25 for size 100).

## Files changed

- `src/services/ai/resource-limits.ts`
- `tests/unit/services/ai/resource-limits.test.ts`
- `tests/unit/services/ai/text-chunker.test.ts`
- `tests/unit/app/api/v1/ai/chunk/route.test.ts`

## Verification

**PASS** — GitHub Actions CI run [43459997175](https://github.com/DiabloNova/oxenn/actions/runs/43459997175), on commit `50e4dfca737e1f9f6e551803abcda86e1b7688e6`: 

- Unit Tests
- Isolation Suite
- Build and Test, including Typecheck, Lint, Build, Build Reference Matrix, and Verify generated tracked files (no drift)
- Migration-chain, tenant-table/schema, RLS-coverage, RLS-documentation, baseline, and documentation-link checks

The first CI run identified one stale test assertion that still expected 96 for a 100-character chunk. The assertion was corrected to 25 in the follow-up commit; the subsequent CI run passed all three required jobs.

## Negative and boundary coverage

- Minimum size 3 produces overlap 0.
- Small custom sizes produce 25% overlap rather than nearly-full overlap.
- The default 4,000 / 1,000 configuration is unchanged.
- A long custom-size document stays within the configured chunk length and far below the 2,048 chunk cap.
- Existing invalid explicit-overlap validation remains covered.

## Remaining issues

No remaining issue identified for this finding. No database, provider, UI, or unrelated behavior was modified.
