# Unicode-Safe LLM Mention Highlighting

**Status: IMPLEMENTED — AUTOMATED VERIFICATION NOT RUN**  
**Date:** 2026-10-20  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Branch:** `fix/llm-mention-unicode-fa-en`  
**Pull request:** [#90](https://github.com/DiabloNova/oxenn/pull/90)

## Invariant

Mention detection and classification must use consistent Unicode-aware case-insensitive semantics. Persian/Arabic spelling variants must be handled consistently, brand/competitor collisions must not be assigned a misleading brand or competitor color, and untrusted response text must remain escaped and sanitized before HTML rendering. Most importantly, the highlighted segments must concatenate to exactly the original LLM response; normalization is for matching only and must not alter displayed content.

## Implementation

- Added `src/components/features/analytics/mention-matcher.ts` as a pure matching helper.
- Uses a separate normalized matching view, including NFC normalization and canonicalization of common Arabic Yeh (`ي`) and Kaf (`ك`) variants to Persian Yeh (`ی`) and Kaf (`ک`).
- Uses `Intl.Segmenter` grapheme ranges when available, with a combining-mark-aware fallback for supported browsers without it, to map normalized offsets back to source ranges. Every returned segment is sliced from the original response, preserving its original Unicode spelling and UTF-16 content.
- Uses Unicode property escapes, including combining marks, and case-insensitive Unicode regex matching for classification. Token boundaries are checked without regex lookbehind for compatibility with older supported Safari versions; this avoids the prior `toLowerCase()` versus regex-`i` inconsistency (including Greek final sigma).
- Treats configured names as literal strings, sorts alternatives longest-first, and preserves ZWNJ as a word connector rather than silently removing it.
- Marks a mention as `ambiguous` when the same matched spelling can resolve to both the brand and a competitor; the component displays that match with a neutral style.
- Retains HTML escaping and `DOMPurify.sanitize()` in the rendering path.
- Added regression assertions for Arabic text preservation, unchanged no-match/no-entity paths, exact source reconstruction, NFC-equivalent decomposed input, longest-first overlapping names, combining-mark token boundaries, and the `Intl.Segmenter` fallback.

## Scope

- `src/components/features/analytics/LlmAnalyticsPanel.tsx` (updated earlier in this PR to render the matching helper's segments)
- `src/components/features/analytics/mention-matcher.ts`
- `tests/ui/features/analytics/mention-matcher.test.ts`
- `docs/tasks_reports/front_end_reports/unicode-mention-highlighting.md`

No dependencies, database files, migrations, API contracts, or CI configuration were changed.

## Verification evidence

| Check | Status | Evidence / limitation |
|---|---|---|
| Source re-read | PASS | Helper and test source were re-read after updates. |
| Source-preservation invariant | COVERED, NOT RUN | Tests assert `segments.map(s => s.text).join("") === source` and exact preservation of Arabic characters. |
| NFC offset mapping | COVERED, NOT RUN | Test uses a decomposed accent and checks that the returned highlighted text retains the original decomposed sequence. |
| Persian/Arabic normalization and ambiguity | COVERED, NOT RUN | Tests cover Yeh/Kaf variants and a brand/competitor collision after normalization. |
| HTML/XSS behavior | PRESERVED, NOT RUN | The existing escape-before-markup and DOMPurify rendering path remains unchanged. |
| Focused test file | NOT RUN | No local repository checkout/test runner was available in this execution context. |
| Typecheck, lint, build | NOT RUN | No passing CI evidence is available for this head. |
| GitHub Actions / status checks | NOT VERIFIED | Must be checked on the resulting head commit. |
| Manual browser verification | NOT VERIFIED | No running browser session was available. |

## Known limitations

- This change must not be considered verified until the focused UI test, typecheck, lint, and build run successfully.
- Without `Intl.Segmenter`, the fallback keeps combining marks attached to preceding code points; it is intentionally a lightweight compatibility fallback rather than a full Unicode grapheme-break implementation.
- Unicode case-insensitive regex matching follows JavaScript's Unicode-aware simple case-folding behavior; it does not promise every possible linguistic equivalence (for example, multi-character folds such as `ß` versus `ss`).
- Arabic Yeh/Kaf normalization intentionally covers common variants only. ZWNJ and whitespace are not collapsed because doing so could merge distinct names.
- Ambiguity is resolved conservatively for display only; it does not change configured brand/competitor records or claim that the two underlying entities are identical.

## Completion decision

**IMPLEMENTED, VERIFICATION PENDING.** Do not merge until focused tests, typecheck, lint, build, and applicable CI checks pass.
