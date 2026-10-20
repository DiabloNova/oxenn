/**
 * Minimal, deterministic detection for non-Persian characters in a brand name.
 *
 * This is a warning signal only. It does not judge brand quality or infer
 * whether a language model will misunderstand the name.
 */

export type BrandNameWarningDecision = "corrected" | "confirmed" | "not-needed";

const persianLetters = new Set(Array.from(
  "آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیء"
));

/**
 * Whitespace, Persian letters/digits and Persian ZWNJ are accepted.
 * Any other code point (including Latin letters, Arabic-specific variants,
 * punctuation/symbols and emoji) triggers a warning.
 */
export function hasNonPersianBrandCharacter(name: string): boolean {
  for (const character of name) {
    if (/\s/u.test(character) || character === "\u200c") continue;
    if (persianLetters.has(character)) continue;
    if (/[\u06F0-\u06F9]/u.test(character)) continue;
    // Arabic combining marks are accepted as marks attached to Persian text.
    if (/[\u064B-\u065F\u0670]/u.test(character)) continue;
    return true;
  }
  return false;
}
