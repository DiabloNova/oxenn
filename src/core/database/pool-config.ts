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


export interface WorkspacePoolEnvironment {
  DATABASE_POOL_MAX?: string;
  AUTHENTICATOR_POOL_MAX?: string;
}

export interface WorkspacePoolConfiguration {
  databasePoolMax: number;
  authenticatorPoolMax: number;
}

export function validateWorkspacePoolConfiguration(
  environment: WorkspacePoolEnvironment
): WorkspacePoolConfiguration {
  return {
    databasePoolMax: resolvePoolMax(environment.DATABASE_POOL_MAX, 20, "DATABASE_POOL_MAX"),
    authenticatorPoolMax: resolvePoolMax(environment.AUTHENTICATOR_POOL_MAX, 20, "AUTHENTICATOR_POOL_MAX"),
  };
}
