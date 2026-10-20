# Brand Name Non-Persian Character Warning and Digital Twin Context

**Status:** IMPLEMENTED — CI VERIFIED  
**Date:** 2026-10-20  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Branch:** `fix/llm-mention-unicode-fa-en`  
**Pull request:** [#90](https://github.com/DiabloNova/oxenn/pull/90)

## Goal

Keep brand-name validation deliberately minimal: detect whether at least one character is outside the accepted Persian letters, Persian digits, whitespace, Persian ZWNJ, and Persian combining marks. Do not inspect words, translate terms, or decide whether the brand name is good or bad.

## Behavior

- When a non-Persian character is present, the UI warns that at least one non-Persian character (letter or symbol) exists.
- The user can edit the name or explicitly confirm it as entered. Analysis is blocked until a currently flagged name is confirmed or the name is corrected.
- If the user corrects the name, the current official name is used, but the fact that a warning was previously shown is retained.
- The API carries the warning history and user decision into the brand-analysis prompt.
- The LLM is required to consider the history when building the brand digital twin, including whether prior spellings, transliterations, pronunciation, alternate forms, or identity questions need follow-up.
- The LLM must not infer an actual comprehension failure from the warning alone and must distinguish confirmed information from hypotheses and unknowns.
- The official brand name is never automatically rewritten. No alias or translation is generated.

## Unicode mention-matching fix

The separate mention-matching correction uses a normalized matching view and maps matches back to original source offsets. Displayed segments are sliced from the original response, so normalization does not rewrite text that is shown to the user.

## Scope

- `src/components/features/analytics/brand-name-quality.ts`
- `src/components/features/analytics/LlmAnalyticsPanel.tsx`
- `src/components/features/analytics/mention-matcher.ts`
- `src/app/api/v1/analytics/llm/route.ts`
- `tests/ui/features/analytics/brand-name-quality.test.ts`
- `tests/ui/features/analytics/LlmAnalyticsPanel.test.tsx`
- `tests/ui/features/analytics/mention-matcher.test.ts`
- `tests/unit/api/v1/analytics/llm.test.ts`
- `scripts/database/build-reference-matrix.ts`
- `src/lib/docsIndex.ts` (generated documentation index)
- `docs/database/reference-matrix.md` (generated database reference matrix)

No database schema or migration changes are included. The warning history is request-scoped in the current analytics flow; this task does not claim permanent workspace-level persistence. If the product later needs the history to survive across separate sessions, that should be designed explicitly as part of Digital Twin metadata rather than silently assumed here.

## Verification

| Check | Status |
|---|---|
| Character detector regression tests (Persian hamza and combining marks) | Passed in CI |
| API warning-gate tests (missing metadata, rejected decision, confirmed, corrected) | Passed in CI |
| UI warning-gate test and request-history tests | Passed in CI |
| Mention matcher regression tests | Passed in CI |
| Reference-matrix generator and generated matrix | `pnpm run docs:matrix` passed; generated-file drift check passed |
| Generated documentation index | Generated-file drift check passed |
| Typecheck, lint, build | Passed in CI |
| Manual browser verification | Not performed; automated UI regression tests passed |

## Completion criteria

Do not merge until CI passes, the generated tracked files are synchronized, and the warning is verified for both user decisions: corrected name and confirmed-as-entered name.
