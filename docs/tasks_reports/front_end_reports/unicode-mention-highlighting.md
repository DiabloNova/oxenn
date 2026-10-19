# Unicode-Safe LLM Mention Highlighting

**Status: INCOMPLETE — AUTOMATED VERIFICATION NOT RUN**  
**Date:** 2026-10-19  
**Repository:** [DiabloNova/oxenn](https://github.com/DiabloNova/oxenn)  
**Branch:** `fix/llm-mention-unicode-fa-en`  
**Pull request:** [#90](https://github.com/DiabloNova/oxenn/pull/90)  
**Base branch:** `fix/audit-remediation-p2` (PR #89; stacked change)

## Invariant

Mention detection and mention classification must use consistent Unicode-aware case-insensitive semantics. Persian/Arabic spelling variants must be handled consistently, brand/competitor collisions must not be assigned a misleading brand or competitor color, and untrusted response text must remain escaped and sanitized before HTML rendering.

## Implementation

- Added `src/components/features/analytics/mention-matcher.ts` as a pure matching helper.
- Uses NFC normalization and canonicalizes common Arabic Yeh (`ي`) and Kaf (`ك`) to Persian Yeh (`ی`) and Kaf (`ک`) for matching.
- Uses Unicode property-based word edges and case-insensitive Unicode regex matching for both finding and classifying mentions; this avoids the prior `toLowerCase()` versus regex-`i` inconsistency (including Greek final sigma).
- Treats configured names as literal strings, sorts alternatives longest-first, and preserves ZWNJ as a word connector rather than silently removing it.
- Marks a mention as `ambiguous` when the same matched spelling can resolve to both the brand and a competitor; the component displays that match with a neutral style.
- Updated `LlmAnalyticsPanel.tsx` to render the helper's segments while retaining HTML escaping and `DOMPurify.sanitize()`.
- Added focused tests for English case-insensitivity, Greek sigma case-folding, Arabic/Persian Yeh-Kaf variants, normalization collisions, brand/competitor ambiguity, regex-special names, Unicode-aware word boundaries, and ZWNJ.

## Scope and safety

Only these paths differ from `fix/audit-remediation-p2`:
- `src/components/features/analytics/LlmAnalyticsPanel.tsx`
- `src/components/features/analytics/mention-matcher.ts`
- `tests/ui/features/analytics/mention-matcher.test.ts`

No dependencies, database files, migrations, CI configuration, or security-header behavior were changed. The PR is stacked on PR #89 because its sanitization and security-header work is not yet merged into `main`.

## Verification evidence

| Check | Status | Evidence / limitation |
|---|---|---|
| Branch/base identity | PASS | GitHub compare confirms merge base `130cb3919d14f4fc8a7d8f24efe7004b22e32d74`, the head of `fix/audit-remediation-p2`. |
| Changed-file scope | PASS | GitHub compare reports exactly the three paths listed above. |
| Source re-read | PASS | Re-fetched the helper, component section, and test file after updates. |
| Cubic Unicode mismatch | COVERED, NOT RUN | A regression test covers Greek sigma matching; implementation uses the same `iu` regex semantics for detection and classification. |
| Persian/Arabic normalization and ambiguity | COVERED, NOT RUN | Tests cover Yeh/Kaf variants and a brand/competitor collision after normalization. |
| HTML/XSS behavior | PRESERVED, NOT RUN | The existing escape-before-markup and DOMPurify rendering path remains in place; PR #89 already contains the hostile-markup regression test. |
| Focused test file | NOT RUN | No local repository checkout/test runner was available in this execution context. |
| Typecheck, lint, build | NOT RUN | No passing CI evidence is available for this head. |
| GitHub Actions / status checks | NOT OBSERVED | The GitHub connector returned no workflow runs or combined statuses for the latest head SHA when checked. |
| Manual browser verification | NOT VERIFIED | No running browser session was available. |

## Known limitations

- This is not marked complete until the focused UI test, typecheck, lint, and build run successfully.
- Unicode case-insensitive regex matching follows JavaScript's Unicode-aware simple case-folding behavior; it does not promise every possible linguistic equivalence (for example, multi-character folds such as `ß` versus `ss`).
- Arabic Yeh/Kaf normalization intentionally covers only common variants. ZWNJ and whitespace are not collapsed because doing so could merge distinct names.
- Ambiguity is resolved conservatively for display only; it does not change configured brand/competitor records or claim that the two underlying entities are identical.

## Completion decision

**INCOMPLETE.** Keep PR #90 in draft until automated verification is available and passing. Do not merge based only on source inspection or test presence.
