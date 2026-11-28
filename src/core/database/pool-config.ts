/**
 * Validates PostgreSQL pool maxima before a process opens database connections.
 * Values are per Node.js process, not per deployment or database.
 */
export function resolvePoolMax(
  rawValue: string | undefined,
  defaultValue: number,
  variableName: string
): number {
  if (!Number.isSafeInteger(defaultValue) || defaultValue < 1) {
    throw new Error(`Invalid default for ${variableName}; expected a positive safe integer.`);
  }

  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(rawValue.trim());
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${variableName} must be a positive safe integer.`);
  }

  return parsed;
}


export interface WorkspacePoolEnvironment extends Record<string, string | undefined> {
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
