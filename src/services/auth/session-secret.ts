export const SESSION_SECRET_PLACEHOLDER = "change-this-to-a-secure-32-character-secret-in-production";
export const SESSION_SECRET_MIN_LENGTH = 32;

/** Normalize values consistently with dotenv-style quoted env-file values. */
export function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length >= 2) {
    const quote = trimmed[0];
    if ((quote === '"' || quote === "'") && trimmed[trimmed.length - 1] === quote) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

export function isValidSessionSecret(value: string): boolean {
  return value.length >= SESSION_SECRET_MIN_LENGTH && value !== SESSION_SECRET_PLACEHOLDER;
}
