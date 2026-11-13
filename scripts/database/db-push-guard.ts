import { Client } from "pg";
import { sanitizeErrorMessage } from "../../src/core/utils/error-sanitizer";
import {
  APPROVED_DISPOSABLE_DB_PUSH_TARGETS,
  type DisposableDbPushTarget,
} from "./db-push-targets";

export interface GuardEnvironment {
  NODE_ENV?: string;
  APP_ENV?: string;
  ENVIRONMENT?: string;
  DATABASE_ENV?: string;
  DB_ENV?: string;
  VERCEL_ENV?: string;
  ALLOW_DB_PUSH?: string;
  DB_PUSH_TARGET_ID?: string;
  DB_PUSH_DATABASE_URL?: string;
  DATABASE_URL?: string;
  MIGRATION_DATABASE_URL?: string;
  AUTHENTICATOR_DATABASE_URL?: string;
  PLATFORM_ADMIN_DATABASE_URL?: string;
  PLATFORM_ADMIN_MIGRATION_DATABASE_URL?: string;
}

interface ParsedDatabaseUrl {
  host: string;
  port: number;
  database: string;
  username: string;
  sslMode: string | null;
}

interface GuardClient {
  connect(): Promise<void>;
  query(text: string): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
}

export interface GuardOptions {
  env?: GuardEnvironment;
  targets?: readonly DisposableDbPushTarget[];
  clientFactory?: (connectionString: string) => GuardClient;
}

export interface ConfiguredDbPushTarget {
  readonly target: DisposableDbPushTarget;
  readonly connectionString: string;
}

const DATABASE_IDENTITY_QUERY = `
SELECT
  current_database() AS database_name,
  current_user AS role_name,
  inet_server_port() AS server_port,
  shobj_description(database_record.oid, 'pg_database') AS database_comment,
  pg_get_userbyid(database_record.datdba) AS database_owner,
  pg_has_role(current_user, database_record.datdba, 'MEMBER') AS role_is_database_owner_or_member,
  database_record.datallowconn AS allows_connections,
  role_record.rolsuper AS role_is_superuser,
  role_record.rolcreatedb AS role_can_create_database,
  role_record.rolcreaterole AS role_can_create_role,
  role_record.rolreplication AS role_can_replicate,
  role_record.rolbypassrls AS role_bypasses_rls,
  COALESCE((
    SELECT jsonb_agg(member_role.rolname ORDER BY member_role.rolname)
    FROM pg_roles member_role
    WHERE member_role.oid <> role_record.oid
      AND pg_has_role(current_user, member_role.oid, 'MEMBER')
  ), '[]'::jsonb) AS role_memberships,
  jsonb_build_object(
    'schemas', (
      SELECT count(*)::int
      FROM pg_namespace namespace_record
      WHERE namespace_record.nspname NOT IN ('pg_catalog', 'information_schema', 'public')
        AND namespace_record.nspname NOT LIKE 'pg_toast%'
        AND namespace_record.nspname NOT LIKE 'pg_temp_%'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend dependency_record
          WHERE dependency_record.classid = 'pg_namespace'::regclass
            AND dependency_record.objid = namespace_record.oid
            AND dependency_record.deptype = 'e'
        )
    ),
    'relations', (
      SELECT count(*)::int
      FROM pg_class relation_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = relation_record.relnamespace
      WHERE namespace_record.nspname NOT IN ('pg_catalog', 'information_schema')
        AND namespace_record.nspname NOT LIKE 'pg_toast%'
        AND namespace_record.nspname NOT LIKE 'pg_temp_%'
        AND relation_record.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend dependency_record
          WHERE dependency_record.classid = 'pg_class'::regclass
            AND dependency_record.objid = relation_record.oid
            AND dependency_record.deptype = 'e'
        )
    ),
    'types', (
      SELECT count(*)::int
      FROM pg_type type_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = type_record.typnamespace
      WHERE namespace_record.nspname NOT IN ('pg_catalog', 'information_schema')
        AND namespace_record.nspname NOT LIKE 'pg_toast%'
        AND namespace_record.nspname NOT LIKE 'pg_temp_%'
        AND type_record.typtype IN ('c', 'd', 'e', 'r', 'm')
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend dependency_record
          WHERE dependency_record.classid = 'pg_type'::regclass
            AND dependency_record.objid = type_record.oid
            AND dependency_record.deptype = 'e'
        )
    ),
    'routines', (
      SELECT count(*)::int
      FROM pg_proc routine_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = routine_record.pronamespace
      WHERE namespace_record.nspname NOT IN ('pg_catalog', 'information_schema')
        AND namespace_record.nspname NOT LIKE 'pg_toast%'
        AND namespace_record.nspname NOT LIKE 'pg_temp_%'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_depend dependency_record
          WHERE dependency_record.classid = 'pg_proc'::regclass
            AND dependency_record.objid = routine_record.oid
            AND dependency_record.deptype = 'e'
        )
    )
  ) AS object_inventory,
  (
    SELECT COALESCE(
      jsonb_agg(extension_record.extname ORDER BY extension_record.extname),
      '[]'::jsonb
    )
    FROM pg_extension extension_record
  ) AS extensions
FROM pg_database database_record
JOIN pg_roles role_record
  ON role_record.rolname = current_user
WHERE database_record.datname = current_database()
`;

const COMPARED_DATABASE_URLS = [
  "DATABASE_URL",
  "MIGRATION_DATABASE_URL",
  "AUTHENTICATOR_DATABASE_URL",
  "PLATFORM_ADMIN_DATABASE_URL",
  "PLATFORM_ADMIN_MIGRATION_DATABASE_URL",
] as const;

const INVENTORY_KEYS = ["schemas", "relations", "types", "routines"] as const;

function normalizeHost(host: string): string {
  return host.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

function parseDatabaseUrl(connectionString: string, label: string): ParsedDatabaseUrl {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL connection URL.`);
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(`${label} must use the PostgreSQL protocol.`);
  }

  const host = normalizeHost(parsed.hostname);
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const username = decodeURIComponent(parsed.username);
  const port = Number(parsed.port || "5432");
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase() ?? null;

  if (
    !host ||
    !database ||
    database.includes("/") ||
    !username ||
    !parsed.password ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    parsed.hash
  ) {
    throw new Error(`${label} must identify a host, port, database, and dedicated login role.`);
  }

  const localHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!localHost && sslMode !== "verify-full") {
    throw new Error(`${label} must use sslmode=verify-full for non-local database hosts.`);
  }

  return { host, port, database, username, sslMode };
}

function sameDatabase(left: ParsedDatabaseUrl, right: ParsedDatabaseUrl): boolean {
  return left.host === right.host && left.port === right.port && left.database === right.database;
}

function assertValidTargetDefinition(target: DisposableDbPushTarget): void {
  if (
    !/^[a-z0-9][a-z0-9-]{0,63}$/.test(target.id) ||
    !target.host ||
    !Number.isInteger(target.port) ||
    target.port < 1 ||
    target.port > 65535 ||
    !target.database ||
    !target.username ||
    !target.databaseOwner ||
    target.username === target.databaseOwner ||
    target.databaseComment !== `oxenn:disposable-db-push:v1:${target.id}` ||
    new Set(target.expectedExtensions).size !== target.expectedExtensions.length
  ) {
    throw new Error("The reviewed db:push target registry contains an invalid identity definition.");
  }
}

function assertEnvironmentAllowsDbPush(env: GuardEnvironment): void {
  if (env.NODE_ENV !== "development" && env.NODE_ENV !== "test") {
    throw new Error("db:push is allowed only when NODE_ENV is explicitly 'development' or 'test'.");
  }

  const environmentMarkers = [
    ["APP_ENV", env.APP_ENV],
    ["ENVIRONMENT", env.ENVIRONMENT],
    ["DATABASE_ENV", env.DATABASE_ENV],
    ["DB_ENV", env.DB_ENV],
    ["VERCEL_ENV", env.VERCEL_ENV],
  ] as const;
  for (const [name, value] of environmentMarkers) {
    const normalized = value?.trim().toLowerCase();
    if (normalized && !["development", "dev", "test"].includes(normalized)) {
      throw new Error(`db:push is blocked because ${name} does not identify a development or test environment.`);
    }
  }

  if (env.ALLOW_DB_PUSH !== "true") {
    throw new Error("db:push requires ALLOW_DB_PUSH=true as an additional operator approval gate.");
  }
}

/**
 * Synchronous target resolution shared by the guard and Drizzle's push config.
 * The catalog attestation and object inventory are checked asynchronously by
 * validateDbPushGuard before the package-script command invokes Drizzle Kit.
 */
export function resolveConfiguredDbPushTarget(
  env: GuardEnvironment = process.env,
  targets: readonly DisposableDbPushTarget[] = APPROVED_DISPOSABLE_DB_PUSH_TARGETS,
): ConfiguredDbPushTarget {
  assertEnvironmentAllowsDbPush(env);

  const targetId = env.DB_PUSH_TARGET_ID?.trim();
  if (!targetId) {
    throw new Error("DB_PUSH_TARGET_ID is required; db:push has no implicit target.");
  }

  const connectionString = env.DB_PUSH_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DB_PUSH_DATABASE_URL is required; DATABASE_URL is never used by db:push.");
  }

  const target = targets.find((candidate) => candidate.id === targetId);
  if (!target) {
    throw new Error(
      "DB_PUSH_TARGET_ID is not present in the reviewed disposable-target registry. No db:push target is currently provisioned.",
    );
  }

  assertValidTargetDefinition(target);
  const candidate = parseDatabaseUrl(connectionString, "DB_PUSH_DATABASE_URL");

  if (
    candidate.host !== normalizeHost(target.host) ||
    candidate.port !== target.port ||
    candidate.database !== target.database ||
    candidate.username !== target.username
  ) {
    throw new Error("DB_PUSH_DATABASE_URL does not match the reviewed target host, port, database, and login role.");
  }

  for (const variableName of COMPARED_DATABASE_URLS) {
    const configuredUrl = env[variableName];
    if (!configuredUrl?.trim()) continue;

    let configuredIdentity: ParsedDatabaseUrl;
    try {
      configuredIdentity = parseDatabaseUrl(configuredUrl, variableName);
    } catch {
      throw new Error(`${variableName} is configured but its database identity cannot be verified; refusing db:push.`);
    }

    if (sameDatabase(candidate, configuredIdentity)) {
      throw new Error(`The db:push target must be separate from ${variableName}.`);
    }
  }

  return { target, connectionString };
}

function parseObjectInventory(value: unknown): Record<(typeof INVENTORY_KEYS)[number], number> | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const counts = {} as Record<(typeof INVENTORY_KEYS)[number], number>;

  for (const key of INVENTORY_KEYS) {
    const count = record[key];
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return null;
    counts[key] = count;
  }

  return counts;
}

function parseExtensions(value: unknown): string[] | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.some((extension) => typeof extension !== "string")) return null;
  return [...parsed].sort();
}

function parseStringArray(value: unknown): string[] | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) return null;
  return parsed;
}

function validateCatalogIdentity(
  rows: Array<Record<string, unknown>>,
  target: DisposableDbPushTarget,
): string | null {
  if (rows.length !== 1) {
    return "The database catalog did not return exactly one identity row; refusing to infer a safe target.";
  }

  const row = rows[0];
  if (
    row.database_name !== target.database ||
    row.role_name !== target.username ||
    Number(row.server_port) !== target.port ||
    row.database_comment !== target.databaseComment ||
    row.database_owner !== target.databaseOwner
  ) {
    return "The connected database identity or independent provisioning attestation does not match the reviewed target.";
  }

  if (
    row.allows_connections !== true ||
    row.role_is_database_owner_or_member !== false ||
    row.role_is_superuser !== false ||
    row.role_can_create_database !== false ||
    row.role_can_create_role !== false ||
    row.role_can_replicate !== false ||
    row.role_bypasses_rls !== false
  ) {
    return "The target login role or database ownership grants privileges that are not permitted for db:push.";
  }

  const roleMemberships = parseStringArray(row.role_memberships);
  if (!roleMemberships || roleMemberships.length > 0) {
    return "The db:push login role must not inherit or be able to assume any other PostgreSQL role.";
  }

  const inventory = parseObjectInventory(row.object_inventory);
  if (!inventory) {
    return "The database returned an incomplete or invalid object inventory; refusing to treat unknown as empty.";
  }

  const unexpectedObjects = INVENTORY_KEYS.filter((key) => inventory[key] !== 0);
  if (unexpectedObjects.length > 0) {
    return `The disposable target contains user database objects (${unexpectedObjects.join(", ")}); db:push requires an empty schema target.`;
  }

  const extensions = parseExtensions(row.extensions);
  const expectedExtensions = [...target.expectedExtensions].sort();
  if (!extensions || JSON.stringify(extensions) !== JSON.stringify(expectedExtensions)) {
    return "The installed PostgreSQL extensions do not match the reviewed target definition.";
  }

  return null;
}

export async function validateDbPushGuard(
  options: GuardOptions = {},
): Promise<{ allowed: boolean; reason: string }> {
  const env = options.env ?? process.env;
  let configured: ConfiguredDbPushTarget;

  try {
    configured = resolveConfiguredDbPushTarget(env, options.targets);
  } catch (error: unknown) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : "db:push target validation failed.",
    };
  }

  let client: GuardClient | undefined;
  let failureReason: string | null = null;

  try {
    client = options.clientFactory
      ? options.clientFactory(configured.connectionString)
      : (new Client({
          connectionString: configured.connectionString,
          connectionTimeoutMillis: 5_000,
          application_name: "oxenn-db-push-guard",
        }) as unknown as GuardClient);

    await client.connect();
    const result = await client.query(DATABASE_IDENTITY_QUERY);
    failureReason = validateCatalogIdentity(result.rows, configured.target);
  } catch (error: unknown) {
    const rawError = error instanceof Error ? error.message : String(error);
    const safeError = sanitizeErrorMessage(rawError, configured.connectionString);
    failureReason = `Unable to verify the registered disposable database identity and catalog. Details: ${safeError}`;
  }

  if (client) {
    try {
      await client.end();
    } catch {
      failureReason = "The database inspection connection could not be closed cleanly; refusing db:push.";
    }
  }

  if (failureReason) return { allowed: false, reason: `db:push blocked: ${failureReason}` };

  return {
    allowed: true,
    reason:
      `db:push target '${configured.target.id}' passed the reviewed identity, database-owner, least-privilege, extension, and empty-object checks. No database mutation was performed by the guard.`,
  };
}

// CLI Execution Wrapper
/* eslint-disable-next-line @typescript-eslint/no-require-imports -- CLI execution wrapper */
if (typeof require !== "undefined" && require.main === module) {
  validateDbPushGuard()
    .then((result) => {
      if (!result.allowed) {
        console.error(result.reason);
        process.exitCode = 1;
        return;
      }

      console.log(result.reason);
    })
    .catch((error: unknown) => {
      const rawError = error instanceof Error ? error.message : String(error);
      console.error(`db:push blocked: unexpected guard failure. Details: ${sanitizeErrorMessage(rawError)}`);
      process.exitCode = 1;
    });
}
