# Brand Name Quality Guidance and Persian Alias Suggestions

**Status: IMPLEMENTED — AUTOMATED VERIFICATION NOT RUN**  
**Date:** 2026-10-20  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Branch:** `feat/brand-name-quality-guidance`

## Goal

Help users review potentially inconsistent brand spellings and, when an English term has a known Persian equivalent, explicitly choose that equivalent as an additional matching alias. The official brand name is never silently rewritten.

## Behavior

- A deterministic local validator flags common Arabic Yeh/Kaf variants in a Persian-script name and selected invisible formatting characters. Persian ZWNJ is deliberately not treated as an error.
- In Persian UI mode, mixed Persian/Latin names without a known term receive an informational note, not a validation error.
- A local dictionary proposes Persian equivalents for recognized terms such as AI, SEO, AEO, GEO, LLM, API, cloud, smart, and tech. Suggestions are deterministic; no model call or external service is needed to generate them.
- The user explicitly confirms a suggestion to add it to the analysis alias list. The official name remains unchanged, and confirmed aliases can be removed before analysis.
- Confirmed aliases are sent to the LLM analytics API and are used for simulated mention analysis and client-side highlighting.
- The warning explicitly says that a spelling signal is not proof that a language model misunderstands the brand. A true model-performance finding requires controlled testing against the relevant model and queries.

## Scope

- `src/components/features/analytics/brand-name-quality.ts`
- `src/components/features/analytics/LlmAnalyticsPanel.tsx`
- `src/components/features/analytics/mention-matcher.ts`
- `src/app/api/v1/analytics/llm/route.ts`
- `tests/ui/features/analytics/brand-name-quality.test.ts`
- `tests/ui/features/analytics/mention-matcher.test.ts`

No database schema, migrations, persistence, dependencies, or CI configuration were changed. Alias choices currently belong to the active analysis UI state and are submitted with that analysis; this implementation does not persist aliases as permanent workspace brand metadata.

## Verification

| Check | Status | Evidence / limitation |
|---|---|---|
| Deterministic validator tests | ADDED, NOT RUN | Covers AI translation, longer terms, token boundaries, mixed scripts, Arabic Yeh/Kaf, invisible characters, ZWNJ, and empty names. |
| Alias mention-matching tests | ADDED, NOT RUN | Covers confirmed alias highlighting and source-text preservation. |
| API contract compatibility | SOURCE-REVIEWED, NOT RUN | `brandAliases` is optional with an empty-array default, so existing callers remain compatible. |
| Typecheck, focused tests, lint, build | NOT RUN | Must be executed in CI or a checkout with dependencies installed. |
| Manual UI/browser verification | NOT RUN | No browser session was available in this execution context. |

## Limitations

- The dictionary is intentionally small and can produce a literal translation that is unsuitable for a particular brand. The user must decide whether to add the suggestion.
- This is not an automatic transliteration or general-purpose translation service. Extending the dictionary is the initial low-cost option; an LLM could later provide contextual suggestions, but would require explicit privacy, latency, cost, and validation decisions.
- The feature does not claim that any flagged name actually causes an LLM failure. To record a model-performance issue, run repeatable tests with and without confirmed aliases and record the model/version, prompts, and observed differences.

## Completion decision

**IMPLEMENTED, VERIFICATION PENDING.** Do not merge until the focused tests, typecheck, lint, build, and applicable CI checks pass.
