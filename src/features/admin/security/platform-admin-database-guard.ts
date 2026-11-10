interface DatabaseIdentity {
  host: string;
  port: string;
  database: string;
  username: string;
}

function parseDatabaseIdentity(connectionString: string, label: string): DatabaseIdentity {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL connection URL.`);
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(`${label} must use the PostgreSQL protocol.`);
  }

  const localDevelopmentHost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
  if (
    label.startsWith("PLATFORM_ADMIN") &&
    process.env.NODE_ENV === "production" &&
    !localDevelopmentHost &&
    !["require", "verify-ca", "verify-full"].includes(sslMode ?? "")
  ) {
    throw new Error(`${label} must require TLS with sslmode=require, verify-ca, or verify-full in production.`);
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const username = decodeURIComponent(parsed.username);
  if (!database || !username) {
    throw new Error(`${label} must identify a database and a dedicated PostgreSQL role.`);
  }

  return {
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || "5432",
    database,
    username,
  };
}

function sameDatabase(left: DatabaseIdentity, right: DatabaseIdentity): boolean {
  return left.host === right.host && left.port === right.port && left.database === right.database;
}

export function assertDedicatedPlatformAdminDatabaseUrl(
  connectionString: string,
  label = "PLATFORM_ADMIN_DATABASE_URL",
): void {
  const candidate = parseDatabaseIdentity(connectionString, label);

  for (const variable of [
    "DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "AUTHENTICATOR_DATABASE_URL",
  ] as const) {
    const workspaceUrl = process.env[variable];
    if (!workspaceUrl) continue;

    if (sameDatabase(candidate, parseDatabaseIdentity(workspaceUrl, variable))) {
      throw new Error(
        `${label} must target a database distinct from ${variable}; Workspace and Platform Admin persistence must remain isolated.`,
      );
    }
  }

  const runtimeUrl = process.env.PLATFORM_ADMIN_DATABASE_URL;
  const migrationUrl = process.env.PLATFORM_ADMIN_MIGRATION_DATABASE_URL;
  if (runtimeUrl && migrationUrl) {
    const runtime = parseDatabaseIdentity(runtimeUrl, "PLATFORM_ADMIN_DATABASE_URL");
    const migration = parseDatabaseIdentity(migrationUrl, "PLATFORM_ADMIN_MIGRATION_DATABASE_URL");
    if (!sameDatabase(runtime, migration)) {
      throw new Error("Platform Admin runtime and migration URLs must target the same dedicated database.");
    }
    if (runtime.username === migration.username) {
      throw new Error("Platform Admin runtime and migration credentials must use different PostgreSQL roles.");
    }
  }
}
