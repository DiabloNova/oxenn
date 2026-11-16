export const SESSION_SECRET_PLACEHOLDER = "change-this-to-a-secure-32-character-secret-in-production";
export const SESSION_SECRET_MIN_LENGTH = 32;

/**
 * Normalize surrounding whitespace only. Dotenv syntax (quotes/comments) is
 * parsed by env-check's parser before this helper is called; runtime process
 * environment values must otherwise remain byte-for-byte intact (notably
 * secrets containing " #").
 */
export function normalizeEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function isValidSessionSecret(value: string): boolean {
  const normalized = value.trim();
  return normalized.length >= SESSION_SECRET_MIN_LENGTH &&
    normalized === value &&
    normalized !== SESSION_SECRET_PLACEHOLDER &&
    !/^["']/.test(normalized) &&
    !/["']$/.test(normalized);
}
