/**
 * Validates PostgreSQL pool maxima before a process opens database connections.
 * Values are per Node.js process, not per deployment or database.
 */
export const MAX_DATABASE_POOL_SIZE = 50;

export function resolvePoolMax(
  rawValue: string | undefined,
  defaultValue: number,
  variableName: string
): number {
  if (!Number.isSafeInteger(defaultValue) || defaultValue < 1 || defaultValue > MAX_DATABASE_POOL_SIZE) {
    throw new Error(`Invalid default for ${variableName}; expected an integer between 1 and ${MAX_DATABASE_POOL_SIZE}.`);
  }

  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }

  const normalized = rawValue.trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new Error(`${variableName} must be an integer between 1 and ${MAX_DATABASE_POOL_SIZE}.`);
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_DATABASE_POOL_SIZE) {
    throw new Error(`${variableName} must be an integer between 1 and ${MAX_DATABASE_POOL_SIZE}.`);
  }

  return parsed;
}
