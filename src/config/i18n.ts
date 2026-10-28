/** Supported locale prefixes for the localized App Router. */
export const SUPPORTED_LOCALES = ["en", "fa"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Persian remains the default locale for routes without an explicit prefix. */
export const DEFAULT_LOCALE: Locale = "fa";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}
