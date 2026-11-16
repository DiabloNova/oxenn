export const SESSION_SECRET_PLACEHOLDER = "change-this-to-a-secure-32-character-secret-in-production";
export const SESSION_SECRET_MIN_LENGTH = 32;

/** Runtime process.env values have already been parsed by the host/dotenv loader. */
export function normalizeRuntimeEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function isValidSessionSecret(value: string): boolean {
  return value.length >= SESSION_SECRET_MIN_LENGTH &&
    value !== SESSION_SECRET_PLACEHOLDER &&
    !/^["']/.test(value) &&
    !/["']$/.test(value);
}
