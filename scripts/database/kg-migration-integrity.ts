import { Client } from "pg";
import { sanitizeErrorMessage } from "../../src/core/utils/error-sanitizer";

export const WORKSPACE_DATABASE = "oxenn_workspace";
export const AUDITOR_ROLE = "oxenn_workspace_auditor";
export const MIGRATOR_ROLE = "oxenn_workspace_migrator";
export const AUDITOR_URL_ENV = "OXENN_WORKSPACE_AUDIT_DATABASE_URL";
export const MIGRATOR_URL_ENV = "OXENN_WORKSPACE_MIGRATION_DATABASE_URL";
export const GRAPH_WRITE_LOCK_KEY = "oxenn:tenant-graph-write";

const BASE_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  entities: ["id", "organization_id", "name", "entity_type", "deleted_at"],
  kg_entities: ["id", "tenant_id", "name", "type"],
  kg_relationships: ["id", "tenant_id", "source_entity_id", "target_entity_id"],
};

const RESOLUTION_COLUMNS = [
  "canonical_entity_id",
  "resolution_status",
  "resolution_method",
  "resolved_at",
] as const;

const REQUIRED_CONSTRAINTS = [
  ["kg_entities", "kg_entities_canonical_entity_id_tenant_id_fkey"],
  ["kg_entities", "kg_entities_resolution_status_check"],
  ["kg_entities", "kg_entities_resolution_consistency_check"],
  ["kg_entities", "kg_entities_matched_method_check"],
  ["kg_entities", "kg_entities_source_chunk_ids_array_check"],
  ["kg_relationships", "kg_relationships_source_entity_id_tenant_id_fkey"],
  ["kg_relationships", "kg_relationships_target_entity_id_tenant_id_fkey"],
] as const;

export interface QueryResult {
  rows: Array<Record<string, unknown>>;
  rowCount?: number | null;
}

export interface DatabaseClient {
  connect(): Promise<void>;
  query(text: string, values?: readonly unknown[]): Promise<QueryResult>;
  end(): Promise<void>;
}

export type ClientFactory = (connectionString: string, applicationName: string) => DatabaseClient;

export interface IntegrityEnvironment {
  OXENN_WORKSPACE_AUDIT_DATABASE_URL?: string;
  OXENN_WORKSPACE_MIGRATION_DATABASE_URL?: string;
}

export interface ParsedDatabaseUrl {
  host: string;
  port: number;
  database: string;
  username: string;
}

export interface ResolutionSummary {
  available: boolean;
  total: number;
  matched: number;
  unresolved: number;
  ambiguous: number;
  invalidStatus: number;
  invalidMatched: number;
  unmatchedNeedClassification: number;
  pendingUniqueMatch: number;
  pendingNoMatch: number;
  pendingMultipleMatches: number;
}

export interface IntegrityReport {
  database: string;
  auditorRole: string;
  tenantCount: number;
  entityCount: number;
  relationshipCount: number;
  missingSourceEndpointCount: number;
  crossTenantSourceEndpointCount: number;
  missingTargetEndpointCount: number;
  crossTenantTargetEndpointCount: number;
  rlsReady: boolean;
  resolution: ResolutionSummary;
  compositeConstraintsReady: boolean;
  blockingIssues: string[];
}

export interface AuditResult {
  report: IntegrityReport;
  /** Internal use only. Tenant IDs are never printed or included in the report. */
  tenantIds: string[];
}

export interface IntegrityOptions {
  env?: IntegrityEnvironment;
  clientFactory?: ClientFactory;
  log?: (message: string) => void;
}

export interface BackfillOptions extends IntegrityOptions {
  apply: boolean;
  confirmDatabase?: string;
}

interface TenantCounts {
  total: number;
  matched: number;
  unresolved: number;
  ambiguous: number;
  invalidStatus: number;
}

interface PlannedCounts {
  eligible: number;
  matched: number;
  unresolved: number;
  ambiguous: number;
  changed: number;
}

const TENANT_GRAPH_ADVISORY_LOCK_SQL =
  "SELECT pg_advisory_lock(hashtext($1), hashtext($2))";
const TENANT_GRAPH_ADVISORY_UNLOCK_SQL =
  "SELECT pg_advisory_unlock(hashtext($1), hashtext($2))";

const RELATIONSHIP_AUDIT_SQL = [
  "SELECT",
  "  COUNT(*)::text AS relationship_count,",
  "  COUNT(*) FILTER (WHERE source_entity.id IS NULL)::text AS missing_source_count,",
  "  COUNT(*) FILTER (WHERE source_entity.id IS NOT NULL AND source_entity.tenant_id <> relationship.tenant_id)::text AS cross_tenant_source_count,",
  "  COUNT(*) FILTER (WHERE target_entity.id IS NULL)::text AS missing_target_count,",
  "  COUNT(*) FILTER (WHERE target_entity.id IS NOT NULL AND target_entity.tenant_id <> relationship.tenant_id)::text AS cross_tenant_target_count",
  "FROM public.kg_relationships AS relationship",
  "LEFT JOIN public.kg_entities AS source_entity",
  "  ON source_entity.id = relationship.source_entity_id",
  "LEFT JOIN public.kg_entities AS target_entity",
  "  ON target_entity.id = relationship.target_entity_id",
].join("\n");

const RESOLUTION_AUDIT_SQL = [
  "WITH candidate_counts AS (",
  "  SELECT",
  "    kg.id,",
  "    kg.resolution_status,",
  "    kg.canonical_entity_id,",
  "    COUNT(entity.id)::bigint AS candidate_count,",
  "    CASE WHEN COUNT(entity.id) = 1 THEN MIN(entity.id::text)::uuid END AS unique_entity_id",
  "  FROM public.kg_entities AS kg",
  "  LEFT JOIN public.entities AS entity",
  "    ON entity.organization_id = kg.tenant_id",
  "   AND LOWER(BTRIM(entity.name)) = LOWER(BTRIM(kg.name))",
  "   AND LOWER(BTRIM(entity.entity_type)) = LOWER(BTRIM(kg.type))",
  "   AND entity.deleted_at IS NULL",
  "  GROUP BY kg.id, kg.resolution_status, kg.canonical_entity_id",
  ")",
  "SELECT",
  "  COUNT(*)::text AS total_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'matched')::text AS matched_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'unresolved')::text AS unresolved_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'ambiguous')::text AS ambiguous_count,",
  "  COUNT(*) FILTER (WHERE resolution_status NOT IN ('matched', 'unresolved', 'ambiguous'))::text AS invalid_status_count,",
  "  COUNT(*) FILTER (",
  "    WHERE resolution_status = 'matched'",
  "      AND (candidate_count <> 1 OR canonical_entity_id IS DISTINCT FROM unique_entity_id)",
  "  )::text AS invalid_matched_count,",
  "  COUNT(*) FILTER (",
  "    WHERE resolution_status <> 'matched'",
  "      AND (",
  "        (resolution_status = 'unresolved' AND candidate_count <> 0)",
  "        OR (resolution_status = 'ambiguous' AND candidate_count <= 1)",
  "      )",
  "  )::text AS unmatched_need_classification_count,",
  "  COUNT(*) FILTER (WHERE resolution_status <> 'matched' AND candidate_count = 1)::text AS pending_unique_count,",
  "  COUNT(*) FILTER (WHERE resolution_status <> 'matched' AND candidate_count = 0)::text AS pending_zero_count,",
  "  COUNT(*) FILTER (WHERE resolution_status <> 'matched' AND candidate_count > 1)::text AS pending_multiple_count",
  "FROM candidate_counts",
].join("\n");

const TENANT_IDS_SQL = [
  "SELECT tenant_id::text AS tenant_id",
  "FROM (",
  "  SELECT tenant_id FROM public.kg_entities",
  "  UNION",
  "  SELECT tenant_id FROM public.kg_relationships",
  ") AS graph_tenants",
  "ORDER BY tenant_id",
].join("\n");

const TENANT_BEFORE_COUNTS_SQL = [
  "SELECT",
  "  COUNT(*)::text AS total_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'matched')::text AS matched_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'unresolved')::text AS unresolved_count,",
  "  COUNT(*) FILTER (WHERE resolution_status = 'ambiguous')::text AS ambiguous_count,",
  "  COUNT(*) FILTER (WHERE resolution_status NOT IN ('matched', 'unresolved', 'ambiguous'))::text AS invalid_status_count",
  "FROM public.kg_entities",
  "WHERE tenant_id = $1::uuid",
].join("\n");

const TENANT_BACKFILL_SQL = [
  "WITH candidate_counts AS MATERIALIZED (",
  "  SELECT",
  "    kg.id,",
  "    COUNT(entity.id)::bigint AS candidate_count,",
  "    CASE WHEN COUNT(entity.id) = 1 THEN MIN(entity.id::text)::uuid END AS canonical_entity_id",
  "  FROM public.kg_entities AS kg",
  "  LEFT JOIN public.entities AS entity",
  "    ON entity.organization_id = kg.tenant_id",
  "   AND LOWER(BTRIM(entity.name)) = LOWER(BTRIM(kg.name))",
  "   AND LOWER(BTRIM(entity.entity_type)) = LOWER(BTRIM(kg.type))",
  "   AND entity.deleted_at IS NULL",
  "  WHERE kg.tenant_id = $1::uuid",
  "    AND kg.resolution_status <> 'matched'",
  "  GROUP BY kg.id",
  "),",
  "classified AS MATERIALIZED (",
  "  SELECT",
  "    id,",
  "    candidate_count,",
  "    CASE",
  "      WHEN candidate_count = 1 THEN 'matched'",
  "      WHEN candidate_count > 1 THEN 'ambiguous'",
  "      ELSE 'unresolved'",
  "    END AS desired_status,",
  "    CASE WHEN candidate_count = 1 THEN canonical_entity_id END AS desired_entity_id",
  "  FROM candidate_counts",
  "),",
  "updated AS (",
  "  UPDATE public.kg_entities AS kg",
  "  SET",
  "    canonical_entity_id = classified.desired_entity_id,",
  "    resolution_status = classified.desired_status,",
  "    resolution_method = CASE WHEN classified.desired_status = 'matched' THEN 'exact_name_type' ELSE NULL END,",
  "    resolved_at = CASE WHEN classified.desired_status = 'matched' THEN NOW() ELSE NULL END",
  "  FROM classified",
  "  WHERE kg.id = classified.id",
  "    AND kg.tenant_id = $1::uuid",
  "    AND kg.resolution_status <> 'matched'",
  "    AND (",
  "      kg.canonical_entity_id IS DISTINCT FROM classified.desired_entity_id",
  "      OR kg.resolution_status IS DISTINCT FROM classified.desired_status",
  "      OR kg.resolution_method IS DISTINCT FROM CASE WHEN classified.desired_status = 'matched' THEN 'exact_name_type' ELSE NULL END",
  "      OR (classified.desired_status = 'matched' AND kg.resolved_at IS NULL)",
  "      OR (classified.desired_status <> 'matched' AND kg.resolved_at IS NOT NULL)",
  "    )",
  "  RETURNING kg.resolution_status",
  ")",
  "SELECT",
  "  COUNT(*)::text AS eligible_count,",
  "  COUNT(*) FILTER (WHERE desired_status = 'matched')::text AS planned_matched_count,",
  "  COUNT(*) FILTER (WHERE desired_status = 'unresolved')::text AS planned_unresolved_count,",
  "  COUNT(*) FILTER (WHERE desired_status = 'ambiguous')::text AS planned_ambiguous_count,",
  "  (SELECT COUNT(*)::text FROM updated) AS changed_count",
  "FROM classified",
].join("\n");

const TENANT_AFTER_COUNTS_SQL = TENANT_BEFORE_COUNTS_SQL;

const AUDITOR_IDENTITY_SQL = [
  "SELECT",
  "  current_database() AS database_name,",
  "  current_user AS role_name,",
  "  current_setting('transaction_read_only') AS transaction_read_only,",
  "  current_setting('default_transaction_read_only') AS default_transaction_read_only,",
  "  current_setting('row_security') AS row_security,",
  "  role_record.rolcanlogin AS can_login,",
  "  role_record.rolsuper AS is_superuser,",
  "  role_record.rolcreatedb AS can_create_database,",
  "  role_record.rolcreaterole AS can_create_role,",
  "  role_record.rolreplication AS can_replicate,",
  "  role_record.rolbypassrls AS bypasses_rls,",
  "  has_database_privilege(current_user, 'oxenn_workspace', 'CREATE') AS can_create_in_database,",
  "  has_database_privilege(current_user, 'oxenn_platform_admin', 'CONNECT') AS can_connect_platform_admin,",
  "  has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_in_public,",
  "  EXISTS (",
  "    SELECT 1 FROM pg_class AS relation",
  "    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace",
  "    WHERE namespace.nspname = 'public'",
  "      AND relation.relname IN ('entities', 'kg_entities', 'kg_relationships')",
  "      AND relation.relowner = role_record.oid",
  "  ) AS owns_graph_table,",
  "  ARRAY(",
  "    SELECT member_role.rolname::text",
  "    FROM pg_roles AS member_role",
  "    WHERE member_role.oid <> role_record.oid",
  "      AND pg_has_role(role_record.oid, member_role.oid, 'MEMBER')",
  "    ORDER BY member_role.rolname",
  "  ) AS role_memberships",
  "FROM pg_roles AS role_record",
  "WHERE role_record.rolname = current_user",
].join("\n");

const MIGRATOR_IDENTITY_SQL = [
  "SELECT",
  "  current_database() AS database_name,",
  "  current_user AS role_name,",
  "  current_setting('transaction_read_only') AS transaction_read_only,",
  "  role_record.rolcanlogin AS can_login,",
  "  role_record.rolsuper AS is_superuser,",
  "  role_record.rolcreatedb AS can_create_database,",
  "  role_record.rolcreaterole AS can_create_role,",
  "  role_record.rolreplication AS can_replicate,",
  "  role_record.rolbypassrls AS bypasses_rls,",
  "  has_database_privilege(current_user, 'oxenn_workspace', 'CREATE') AS can_create_in_database,",
  "  has_database_privilege(current_user, 'oxenn_platform_admin', 'CONNECT') AS can_connect_platform_admin,",
  "  has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_in_public,",
  "  ARRAY(",
  "    SELECT member_role.rolname::text",
  "    FROM pg_roles AS member_role",
  "    WHERE member_role.oid <> role_record.oid",
  "      AND pg_has_role(role_record.oid, member_role.oid, 'MEMBER')",
  "    ORDER BY member_role.rolname",
  "  ) AS role_memberships",
  "FROM pg_roles AS role_record",
  "WHERE role_record.rolname = current_user",
].join("\n");

function defaultClientFactory(connectionString: string, applicationName: string): DatabaseClient {
  return new Client({
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 60_000,
    query_timeout: 65_000,
  }) as unknown as DatabaseClient;
}

function safeError(error: unknown, connectionString?: string): Error {
  const raw = error instanceof Error ? error.message : String(error);
  const sanitized = sanitizeErrorMessage(raw, connectionString);
  return new Error(sanitized);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

function asNumber(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Database returned an invalid non-negative count for " + label + ".");
  }
  return parsed;
}

function firstRow(result: QueryResult, label: string): Record<string, unknown> {
  const row = result.rows[0];
  if (!row) throw new Error("Database returned no identity row for " + label + ".");
  return row;
}

export function parseWorkspaceDatabaseUrl(
  connectionString: string | undefined,
  expectedRole: string,
  label: string,
): ParsedDatabaseUrl {
  if (!connectionString?.trim()) {
    throw new Error(label + " is required; no database connection was opened.");
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(label + " must be a valid PostgreSQL connection URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(label + " must use the PostgreSQL protocol.");
  }

  const allowedParameters = new Set(["sslmode", "channel_binding"]);
  const seenParameters = new Set<string>();
  for (const [name] of parsed.searchParams.entries()) {
    const normalized = name.toLowerCase();
    if (seenParameters.has(normalized) || !allowedParameters.has(normalized)) {
      throw new Error(label + " contains duplicate or unsupported connection parameters.");
    }
    seenParameters.add(normalized);
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const username = decodeURIComponent(parsed.username);
  const port = Number(parsed.port || "5432");
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

  if (
    !host ||
    host.includes("-pooler.") ||
    !database ||
    database.includes("/") ||
    username !== expectedRole ||
    !parsed.password ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    parsed.hash
  ) {
    throw new Error(label + " must target the direct oxenn_workspace endpoint with the exact dedicated role.");
  }

  if (!sslMode || !["require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw new Error(label + " must require PostgreSQL TLS through sslmode.");
  }

  if (database !== WORKSPACE_DATABASE) {
    throw new Error(label + " must target exactly " + WORKSPACE_DATABASE + ".");
  }

  return { host, port, database, username };
}

export function classifyCandidateCount(candidateCount: number): "matched" | "unresolved" | "ambiguous" {
  if (!Number.isSafeInteger(candidateCount) || candidateCount < 0) {
    throw new Error("Candidate count must be a non-negative safe integer.");
  }
  if (candidateCount === 1) return "matched";
  if (candidateCount === 0) return "unresolved";
  return "ambiguous";
}

export function assertAuditorIdentity(row: Record<string, unknown>): void {
  if (
    asString(row.database_name) !== WORKSPACE_DATABASE ||
    asString(row.role_name) !== AUDITOR_ROLE ||
    asString(row.transaction_read_only) !== "on" ||
    asString(row.default_transaction_read_only) !== "on" ||
    asString(row.row_security) !== "on" ||
    !asBoolean(row.can_login) ||
    asBoolean(row.is_superuser) ||
    asBoolean(row.can_create_database) ||
    asBoolean(row.can_create_role) ||
    asBoolean(row.can_replicate) ||
    !asBoolean(row.bypasses_rls) ||
    asBoolean(row.can_create_in_database) ||
    asBoolean(row.can_connect_platform_admin) ||
    asBoolean(row.can_create_in_public) ||
    asBoolean(row.owns_graph_table)
  ) {
    throw new Error(
      "Auditor identity failed its read-only least-privilege contract; expected the dedicated BYPASSRLS auditor role in a read-only transaction.",
    );
  }

  const memberships = row.role_memberships;
  if (!Array.isArray(memberships) || memberships.length !== 0) {
    throw new Error("Auditor role must not inherit or be able to assume any other PostgreSQL role.");
  }
}

export function assertMigratorIdentity(row: Record<string, unknown>): void {
  if (
    asString(row.database_name) !== WORKSPACE_DATABASE ||
    asString(row.role_name) !== MIGRATOR_ROLE ||
    asString(row.transaction_read_only) !== "off" ||
    !asBoolean(row.can_login) ||
    asBoolean(row.is_superuser) ||
    asBoolean(row.can_create_database) ||
    asBoolean(row.can_create_role) ||
    asBoolean(row.can_replicate) ||
    asBoolean(row.bypasses_rls) ||
    asBoolean(row.can_connect_platform_admin) ||
    !asBoolean(row.can_create_in_public)
  ) {
    throw new Error(
      "Workspace migrator identity failed its least-privilege contract; BYPASSRLS and elevated role attributes are forbidden.",
    );
  }

  const memberships = row.role_memberships;
  if (!Array.isArray(memberships) || memberships.length !== 0) {
    throw new Error("Workspace migrator must not inherit or be able to assume another PostgreSQL role.");
  }
}

async function verifyAuditorColumnGrants(
  client: DatabaseClient,
  resolutionAvailable: boolean,
): Promise<void> {
  const required = [
    ["public.entities", "id"],
    ["public.entities", "organization_id"],
    ["public.entities", "name"],
    ["public.entities", "entity_type"],
    ["public.entities", "deleted_at"],
    ["public.kg_entities", "id"],
    ["public.kg_entities", "tenant_id"],
    ["public.kg_entities", "name"],
    ["public.kg_entities", "type"],
    ["public.kg_relationships", "id"],
    ["public.kg_relationships", "tenant_id"],
    ["public.kg_relationships", "source_entity_id"],
    ["public.kg_relationships", "target_entity_id"],
  ];
  if (resolutionAvailable) {
    required.push(
      ["public.kg_entities", "canonical_entity_id"],
      ["public.kg_entities", "resolution_status"],
      ["public.kg_entities", "resolution_method"],
      ["public.kg_entities", "resolved_at"],
    );
  }

  const selectChecks = required.map((entry, index) =>
    "has_column_privilege(current_user, '" + entry[0] + "', '" + entry[1] + "', 'SELECT') AS select_" + index,
  );
  const tableNames = ["public.entities", "public.kg_entities", "public.kg_relationships"];
  const dmlChecks = tableNames.flatMap((table, tableIndex) => [
    "has_table_privilege(current_user, '" + table + "', 'INSERT') AS insert_" + tableIndex,
    "has_table_privilege(current_user, '" + table + "', 'UPDATE') AS update_" + tableIndex,
    "has_table_privilege(current_user, '" + table + "', 'DELETE') AS delete_" + tableIndex,
    "has_table_privilege(current_user, '" + table + "', 'TRUNCATE') AS truncate_" + tableIndex,
    "has_any_column_privilege(current_user, '" + table + "', 'INSERT') AS column_insert_" + tableIndex,
    "has_any_column_privilege(current_user, '" + table + "', 'UPDATE') AS column_update_" + tableIndex,
  ]);
  const result = await client.query("SELECT\n" + [...selectChecks, ...dmlChecks].join(",\n"));
  const row = firstRow(result, "auditor column privileges");

  for (let index = 0; index < required.length; index += 1) {
    if (!asBoolean(row["select_" + index])) {
      throw new Error("Auditor is missing a required column-level SELECT grant; required columns are limited to identifiers, tenant keys, names, types, and resolution metadata.");
    }
  }

  for (const [key, value] of Object.entries(row)) {
    if ((key.startsWith("insert_") || key.startsWith("update_") || key.startsWith("delete_") ||
      key.startsWith("truncate_") || key.startsWith("column_insert_") || key.startsWith("column_update_")) &&
      asBoolean(value)) {
      throw new Error("Auditor has a write privilege on a Knowledge Graph table; all DML privileges must be absent.");
    }
  }
}

async function inspectSchema(client: DatabaseClient): Promise<{
  columns: Map<string, Set<string>>;
  rlsReady: boolean;
  resolutionAvailable: boolean;
  compositeConstraintsReady: boolean;
}> {
  const relationResult = await client.query(
    [
      "SELECT relation.relname AS table_name,",
      "       relation.relrowsecurity AS rls_enabled,",
      "       relation.relforcerowsecurity AS rls_forced",
      "FROM pg_class AS relation",
      "JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace",
      "WHERE namespace.nspname = 'public'",
      "  AND relation.relname = ANY($1::text[])",
      "  AND relation.relkind IN ('r', 'p')",
    ].join("\n"),
    [["entities", "kg_entities", "kg_relationships"]],
  );

  const columnResult = await client.query(
    [
      "SELECT relation.relname AS table_name, attribute.attname AS column_name",
      "FROM pg_class AS relation",
      "JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace",
      "JOIN pg_attribute AS attribute ON attribute.attrelid = relation.oid",
      "WHERE namespace.nspname = 'public'",
      "  AND relation.relname = ANY($1::text[])",
      "  AND attribute.attnum > 0",
      "  AND NOT attribute.attisdropped",
    ].join("\n"),
    [["entities", "kg_entities", "kg_relationships"]],
  );

  const columns = new Map<string, Set<string>>();
  for (const table of ["entities", "kg_entities", "kg_relationships"]) columns.set(table, new Set());
  for (const row of columnResult.rows) {
    const table = asString(row.table_name);
    const column = asString(row.column_name);
    columns.get(table)?.add(column);
  }

  for (const [table, requiredColumns] of Object.entries(BASE_COLUMNS)) {
    const present = columns.get(table);
    if (!present) throw new Error("Required Workspace Knowledge Graph table is missing: " + table + ".");
    for (const column of requiredColumns) {
      if (!present.has(column)) {
        throw new Error("Required Workspace column is missing: " + table + "." + column + ".");
      }
    }
  }

  const rlsByTable = new Map<string, boolean>();
  for (const row of relationResult.rows) {
    rlsByTable.set(
      asString(row.table_name),
      asBoolean(row.rls_enabled) && asBoolean(row.rls_forced),
    );
  }
  const rlsReady = ["entities", "kg_entities", "kg_relationships"].every((table) => rlsByTable.get(table) === true);
  const resolutionAvailable = RESOLUTION_COLUMNS.every((column) => columns.get("kg_entities")?.has(column) === true);

  const constraintResult = await client.query(
    [
      "SELECT relation.relname AS table_name, constraint_record.conname AS constraint_name,",
      "       constraint_record.convalidated AS is_validated, constraint_record.contype AS constraint_type",
      "FROM pg_constraint AS constraint_record",
      "JOIN pg_class AS relation ON relation.oid = constraint_record.conrelid",
      "JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace",
      "WHERE namespace.nspname = 'public'",
      "  AND (",
      "    (relation.relname = 'kg_entities' AND constraint_record.conname = ANY($1::text[]))",
      "    OR (relation.relname = 'kg_relationships' AND constraint_record.conname = ANY($2::text[]))",
      "  )",
    ].join("\n"),
    [
      REQUIRED_CONSTRAINTS.filter((entry) => entry[0] === "kg_entities").map((entry) => entry[1]),
      REQUIRED_CONSTRAINTS.filter((entry) => entry[0] === "kg_relationships").map((entry) => entry[1]),
    ],
  );

  const validatedConstraints = new Set(
    constraintResult.rows
      .filter((row) => asBoolean(row.is_validated))
      .map((row) => asString(row.constraint_name)),
  );
  const compositeConstraintsReady = REQUIRED_CONSTRAINTS.every(([, name]) => validatedConstraints.has(name));

  return { columns, rlsReady, resolutionAvailable, compositeConstraintsReady };
}

function emptyResolutionSummary(available: boolean): ResolutionSummary {
  return {
    available,
    total: 0,
    matched: 0,
    unresolved: 0,
    ambiguous: 0,
    invalidStatus: 0,
    invalidMatched: 0,
    unmatchedNeedClassification: 0,
    pendingUniqueMatch: 0,
    pendingNoMatch: 0,
    pendingMultipleMatches: 0,
  };
}

async function auditWorkspaceWithClient(client: DatabaseClient): Promise<AuditResult> {
  await client.query("BEGIN READ ONLY");
  const identity = firstRow(await client.query(AUDITOR_IDENTITY_SQL), "auditor");
  assertAuditorIdentity(identity);

  const schema = await inspectSchema(client);
  if (!schema.rlsReady) {
    throw new Error("RLS must be both enabled and forced on entities, kg_entities, and kg_relationships before a global KG audit is accepted.");
  }
  await verifyAuditorColumnGrants(client, schema.resolutionAvailable);

  const tenantResult = await client.query(TENANT_IDS_SQL);
  const tenantIds = tenantResult.rows.map((row) => asString(row.tenant_id));
  if (tenantIds.some((tenantId) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId))) {
    throw new Error("Auditor returned a malformed tenant identifier; refusing to continue.");
  }

  const relationship = firstRow(await client.query(RELATIONSHIP_AUDIT_SQL), "relationship integrity audit");
  const entityCount = asNumber(
    (await client.query("SELECT COUNT(*)::text AS entity_count FROM public.kg_entities")).rows[0]?.entity_count,
    "kg_entities",
  );
  const relationshipCount = asNumber(relationship.relationship_count, "kg_relationships");
  const missingSource = asNumber(relationship.missing_source_count, "missing source endpoints");
  const crossTenantSource = asNumber(relationship.cross_tenant_source_count, "cross-tenant source endpoints");
  const missingTarget = asNumber(relationship.missing_target_count, "missing target endpoints");
  const crossTenantTarget = asNumber(relationship.cross_tenant_target_count, "cross-tenant target endpoints");

  let resolution = emptyResolutionSummary(schema.resolutionAvailable);
  if (schema.resolutionAvailable) {
    const row = firstRow(await client.query(RESOLUTION_AUDIT_SQL), "canonical resolution audit");
    resolution = {
      available: true,
      total: asNumber(row.total_count, "canonical resolution total"),
      matched: asNumber(row.matched_count, "matched KG entities"),
      unresolved: asNumber(row.unresolved_count, "unresolved KG entities"),
      ambiguous: asNumber(row.ambiguous_count, "ambiguous KG entities"),
      invalidStatus: asNumber(row.invalid_status_count, "invalid resolution statuses"),
      invalidMatched: asNumber(row.invalid_matched_count, "invalid matched canonical references"),
      unmatchedNeedClassification: asNumber(row.unmatched_need_classification_count, "unmatched resolution classifications"),
      pendingUniqueMatch: asNumber(row.pending_unique_count, "pending unique canonical matches"),
      pendingNoMatch: asNumber(row.pending_zero_count, "pending unresolved records"),
      pendingMultipleMatches: asNumber(row.pending_multiple_count, "pending ambiguous records"),
    };
    if (resolution.total !== entityCount) {
      throw new Error("Canonical resolution total does not reconcile with the global kg_entities count.");
    }
  }

  const blockingIssues: string[] = [];
  if (missingSource + crossTenantSource + missingTarget + crossTenantTarget > 0) {
    blockingIssues.push("Knowledge Graph relationship endpoints contain missing or cross-tenant references.");
  }
  if (resolution.available && resolution.invalidMatched > 0) {
    blockingIssues.push("Existing matched canonical references do not resolve to exactly one active same-tenant entity.");
  }
  if (resolution.available && resolution.invalidStatus > 0) {
    blockingIssues.push("Knowledge Graph contains an unsupported canonical resolution status.");
  }

  return {
    report: {
      database: WORKSPACE_DATABASE,
      auditorRole: AUDITOR_ROLE,
      tenantCount: tenantIds.length,
      entityCount,
      relationshipCount,
      missingSourceEndpointCount: missingSource,
      crossTenantSourceEndpointCount: crossTenantSource,
      missingTargetEndpointCount: missingTarget,
      crossTenantTargetEndpointCount: crossTenantTarget,
      rlsReady: schema.rlsReady,
      resolution,
      compositeConstraintsReady: schema.compositeConstraintsReady,
      blockingIssues,
    },
    tenantIds,
  };
}

async function openAuditor(
  connectionString: string,
  factory: ClientFactory,
): Promise<DatabaseClient> {
  const client = factory(connectionString, "oxenn-kg-migration-auditor");
  try {
    await client.connect();
    return client;
  } catch (error) {
    try { await client.end(); } catch { /* the connection never became usable */ }
    throw safeError(error, connectionString);
  }
}

export async function auditWorkspaceKnowledgeGraph(options: IntegrityOptions = {}): Promise<AuditResult> {
  const env = options.env ?? process.env;
  const factory = options.clientFactory ?? defaultClientFactory;
  const parsed = parseWorkspaceDatabaseUrl(env.OXENN_WORKSPACE_AUDIT_DATABASE_URL, AUDITOR_ROLE, AUDITOR_URL_ENV);
  const connectionString = env.OXENN_WORKSPACE_AUDIT_DATABASE_URL as string;
  const client = await openAuditor(connectionString, factory);

  let result: AuditResult | undefined;
  let failure: unknown;
  try {
    result = await auditWorkspaceWithClient(client);
  } catch (error) {
    failure = error;
  }

  try {
    await client.query("ROLLBACK");
  } catch (error) {
    failure = failure ?? error;
  }

  try {
    await client.end();
  } catch (error) {
    failure = failure ?? error;
  }

  if (failure) throw safeError(failure, connectionString);
  if (!result) throw new Error("KG integrity audit did not return a report.");
  void parsed;
  return result;
}

async function validateMigratorConnection(
  client: DatabaseClient,
): Promise<void> {
  await client.query("BEGIN READ ONLY");
  try {
    const identity = firstRow(await client.query(MIGRATOR_IDENTITY_SQL), "Workspace migrator");
    assertMigratorIdentity(identity);

    const privilegeResult = await client.query(
      [
        "SELECT",
        "  has_table_privilege(current_user, 'public.kg_entities', 'SELECT') AS can_select_kg_entities,",
        "  has_table_privilege(current_user, 'public.kg_entities', 'UPDATE') AS can_update_kg_entities,",
        "  has_table_privilege(current_user, 'public.entities', 'SELECT') AS can_select_entities",
      ].join("\n"),
    );
    const privileges = firstRow(privilegeResult, "Workspace migrator table privileges");
    if (
      !asBoolean(privileges.can_select_kg_entities) ||
      !asBoolean(privileges.can_update_kg_entities) ||
      !asBoolean(privileges.can_select_entities)
    ) {
      throw new Error("Workspace migrator is missing the SELECT/UPDATE privileges required for the controlled tenant-scoped backfill.");
    }
  } finally {
    await client.query("ROLLBACK");
  }
}

function readTenantCounts(row: Record<string, unknown>, label: string): TenantCounts {
  return {
    total: asNumber(row.total_count, label + " total"),
    matched: asNumber(row.matched_count, label + " matched"),
    unresolved: asNumber(row.unresolved_count, label + " unresolved"),
    ambiguous: asNumber(row.ambiguous_count, label + " ambiguous"),
    invalidStatus: asNumber(row.invalid_status_count, label + " invalid statuses"),
  };
}

export function assertTenantCountReconciliation(
  before: TenantCounts,
  planned: PlannedCounts,
  after: TenantCounts,
): void {
  const expectedTotal = before.total;
  const expectedMatched = before.matched + planned.matched;
  if (
    after.total !== expectedTotal ||
    after.matched !== expectedMatched ||
    after.unresolved !== planned.unresolved ||
    after.ambiguous !== planned.ambiguous ||
    after.invalidStatus !== 0 ||
    planned.eligible !== before.total - before.matched ||
    planned.matched + planned.unresolved + planned.ambiguous !== planned.eligible ||
    planned.changed > planned.eligible
  ) {
    throw new Error("Tenant Backfill row-count reconciliation failed; the tenant transaction must be rolled back.");
  }
}

export async function backfillOneTenant(
  client: DatabaseClient,
  tenantId: string,
): Promise<PlannedCounts> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error("Backfill received a malformed tenant identifier.");
  }

  let lockHeld = false;
  let transactionOpen = false;
  let committed = false;
  let result: PlannedCounts | undefined;
  let failure: unknown;

  try {
    // Match graph-store.ts lock ordering and key. Acquire it before opening the
    // transaction so a waiting backfill does not hold a stale SERIALIZABLE snapshot.
    await client.query(TENANT_GRAPH_ADVISORY_LOCK_SQL, [tenantId, GRAPH_WRITE_LOCK_KEY]);
    lockHeld = true;

    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    transactionOpen = true;
    const context = firstRow(
      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true) AS tenant_id, current_setting('transaction_read_only') AS transaction_read_only",
        [tenantId],
      ),
      "tenant transaction context",
    );
    if (
      asString(context.tenant_id) !== tenantId ||
      asString(context.transaction_read_only) !== "off"
    ) {
      throw new Error("Backfill could not establish the exact writable tenant transaction context.");
    }

    await client.query("SET LOCAL lock_timeout = '30s'");
    await client.query("SET LOCAL statement_timeout = '60s'");

    const before = readTenantCounts(
      firstRow(await client.query(TENANT_BEFORE_COUNTS_SQL, [tenantId]), "tenant pre-backfill counts"),
      "tenant pre-backfill",
    );

    const plannedRow = firstRow(
      await client.query(TENANT_BACKFILL_SQL, [tenantId]),
      "tenant backfill classification",
    );
    const planned: PlannedCounts = {
      eligible: asNumber(plannedRow.eligible_count, "eligible KG entities"),
      matched: asNumber(plannedRow.planned_matched_count, "planned matched KG entities"),
      unresolved: asNumber(plannedRow.planned_unresolved_count, "planned unresolved KG entities"),
      ambiguous: asNumber(plannedRow.planned_ambiguous_count, "planned ambiguous KG entities"),
      changed: asNumber(plannedRow.changed_count, "updated KG entities"),
    };

    const after = readTenantCounts(
      firstRow(await client.query(TENANT_AFTER_COUNTS_SQL, [tenantId]), "tenant post-backfill counts"),
      "tenant post-backfill",
    );

    assertTenantCountReconciliation(before, planned, after);
    await client.query("COMMIT");
    transactionOpen = false;
    committed = true;
    result = planned;
  } catch (error) {
    failure = error;
    if (transactionOpen && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        failure = new Error(
          "Backfill failed and the tenant transaction rollback could not be confirmed; discard the connection before retrying.",
          { cause: rollbackError },
        );
      }
    }
  } finally {
    if (lockHeld) {
      try {
        const unlocked = firstRow(
          await client.query(TENANT_GRAPH_ADVISORY_UNLOCK_SQL, [tenantId, GRAPH_WRITE_LOCK_KEY]),
          "tenant graph advisory unlock",
        );
        if (!asBoolean(unlocked.pg_advisory_unlock)) {
          throw new Error("The tenant graph advisory lock was not released by this connection.");
        }
      } catch (unlockError) {
        failure = failure ?? unlockError;
      }
    }
  }

  if (failure) throw failure instanceof Error ? failure : new Error("Tenant backfill failed.");
  if (!result) throw new Error("Tenant backfill did not produce a reconciliation result.");
  return result;
}

export async function backfillWorkspaceKnowledgeGraph(options: BackfillOptions): Promise<IntegrityReport> {
  const env = options.env ?? process.env;
  const factory = options.clientFactory ?? defaultClientFactory;
  const auditUrl = env.OXENN_WORKSPACE_AUDIT_DATABASE_URL;
  const migratorUrl = env.OXENN_WORKSPACE_MIGRATION_DATABASE_URL;
  const parsedAuditor = parseWorkspaceDatabaseUrl(auditUrl, AUDITOR_ROLE, AUDITOR_URL_ENV);
  const parsedMigrator = parseWorkspaceDatabaseUrl(migratorUrl, MIGRATOR_ROLE, MIGRATOR_URL_ENV);

  if (
    parsedAuditor.host !== parsedMigrator.host ||
    parsedAuditor.port !== parsedMigrator.port ||
    parsedAuditor.database !== parsedMigrator.database
  ) {
    throw new Error("Auditor and migrator URLs must address the same direct oxenn_workspace endpoint.");
  }

  if (options.apply && options.confirmDatabase !== WORKSPACE_DATABASE) {
    throw new Error("Applying the KG Backfill requires --confirm-database oxenn_workspace.");
  }

  const initialAudit = await auditWorkspaceKnowledgeGraph(options);
  const report = initialAudit.report;
  if (report.blockingIssues.length > 0) {
    throw new Error("KG Backfill is blocked by preflight integrity findings: " + report.blockingIssues.join(" "));
  }
  if (!report.resolution.available || !report.compositeConstraintsReady) {
    throw new Error("KG Backfill requires the validated 0018 canonical-resolution schema and 0019 tenant-composite foreign keys.");
  }

  if (!options.apply) return report;

  if (report.entityCount === 0 && report.relationshipCount === 0) {
    options.log?.("No Knowledge Graph rows exist; Backfill is a verified no-op.");
    return report;
  }

  const connectionString = migratorUrl as string;
  const client = await openAuditor(connectionString, factory);
  let failure: unknown;
  let processedTenants = 0;

  try {
    await validateMigratorConnection(client);
    for (const tenantId of initialAudit.tenantIds) {
      await backfillOneTenant(client, tenantId);
      processedTenants += 1;
      options.log?.("Backfill processed tenant " + processedTenants + " of " + initialAudit.tenantIds.length + ".");
    }
  } catch (error) {
    failure = error;
  }

  try {
    await client.end();
  } catch (error) {
    failure = failure ?? error;
  }

  if (failure) {
    throw new Error(
      "KG Backfill stopped after " + processedTenants +
      " tenant transaction(s). Completed tenant transactions are committed and the operation is safe to resume because it is idempotent. " +
      safeError(failure, connectionString).message,
      { cause: failure },
    );
  }

  const finalAudit = await auditWorkspaceKnowledgeGraph(options);
  const final = finalAudit.report;
  if (
    final.blockingIssues.length > 0 ||
    final.resolution.invalidStatus !== 0 ||
    final.resolution.invalidMatched !== 0 ||
    final.resolution.unmatchedNeedClassification !== 0
  ) {
    throw new Error("Post-backfill global audit did not reconcile; do not mark the Backfill complete.");
  }

  options.log?.(
    "KG Backfill complete: " + processedTenants +
    " tenant transaction(s); " + final.resolution.matched +
    " matched, " + final.resolution.unresolved + " unresolved, and " +
    final.resolution.ambiguous + " ambiguous records.",
  );
  return final;
}

function formatReport(report: IntegrityReport): string {
  const lines = [
    "Workspace Knowledge Graph migration integrity",
    "Database: " + report.database,
    "Auditor role: " + report.auditorRole,
    "Tenants containing graph rows: " + report.tenantCount,
    "KG entities: " + report.entityCount,
    "KG relationships: " + report.relationshipCount,
    "Missing source endpoints: " + report.missingSourceEndpointCount,
    "Cross-tenant source endpoints: " + report.crossTenantSourceEndpointCount,
    "Missing target endpoints: " + report.missingTargetEndpointCount,
    "Cross-tenant target endpoints: " + report.crossTenantTargetEndpointCount,
    "RLS enabled and forced: " + (report.rlsReady ? "yes" : "no"),
    "Canonical resolution schema available: " + (report.resolution.available ? "yes" : "no"),
    "Tenant-composite constraints validated: " + (report.compositeConstraintsReady ? "yes" : "no"),
  ];

  if (report.resolution.available) {
    lines.push(
      "Resolution matched/unresolved/ambiguous: " +
      report.resolution.matched + "/" +
      report.resolution.unresolved + "/" +
      report.resolution.ambiguous,
      "Invalid matched references: " + report.resolution.invalidMatched,
      "Unmatched rows needing classification: " + report.resolution.unmatchedNeedClassification,
      "Pending unique/no/multiple candidates: " +
      report.resolution.pendingUniqueMatch + "/" +
      report.resolution.pendingNoMatch + "/" +
      report.resolution.pendingMultipleMatches,
    );
  }

  lines.push(
    "Blocking findings: " + (report.blockingIssues.length ? report.blockingIssues.join(" ") : "none"),
  );
  return lines.join("\n");
}

function parseArgs(argv: string[]): { command: "audit" | "backfill"; apply: boolean; confirmDatabase?: string } {
  const command = argv[0] ?? "audit";
  if (command === "--help" || command === "-h") {
    return { command: "audit", apply: false };
  }
  if (command !== "audit" && command !== "backfill") {
    throw new Error("Usage: pnpm db:kg-integrity [audit|backfill] [--apply --confirm-database oxenn_workspace].");
  }

  const allowed = new Set(["--apply", "--confirm-database"]);
  for (const argument of argv.slice(1)) {
    if (!allowed.has(argument) && !argv.slice(1).some((item, index) => item === "--confirm-database" && index + 1 === argv.slice(1).indexOf(argument))) {
      throw new Error("Unsupported KG integrity command-line option.");
    }
  }

  const apply = argv.includes("--apply");
  const confirmIndex = argv.indexOf("--confirm-database");
  const confirmDatabase = confirmIndex >= 0 ? argv[confirmIndex + 1] : undefined;
  if (confirmIndex >= 0 && (!confirmDatabase || confirmDatabase.startsWith("--"))) {
    throw new Error("--confirm-database requires an exact database name.");
  }
  if (command === "audit" && (apply || confirmDatabase)) {
    throw new Error("The audit command is read-only and does not accept write-confirmation options.");
  }
  if (command === "backfill" && apply && !confirmDatabase) {
    throw new Error("The Backfill --apply option requires --confirm-database oxenn_workspace.");
  }
  if (confirmDatabase && confirmDatabase !== WORKSPACE_DATABASE) {
    throw new Error("The confirmation database must match exactly " + WORKSPACE_DATABASE + ".");
  }
  return { command, apply, confirmDatabase };
}

async function main(argv: string[]): Promise<void> {
  if (argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(
      "Usage: pnpm db:kg-integrity audit\n" +
      "       pnpm db:kg-integrity backfill [--apply --confirm-database oxenn_workspace]\n" +
      "The default Backfill mode is dry-run. No database URL or tenant data is printed.\n",
    );
    return;
  }

  const args = parseArgs(argv);
  const options: IntegrityOptions = { log: (message) => process.stdout.write(message + "\n") };

  if (args.command === "audit") {
    const result = await auditWorkspaceKnowledgeGraph(options);
    process.stdout.write(formatReport(result.report) + "\n");
    if (result.report.blockingIssues.length > 0) process.exitCode = 2;
    return;
  }

  if (!args.apply) {
    const result = await auditWorkspaceKnowledgeGraph(options);
    process.stdout.write("Backfill dry-run; no database writes were performed.\n");
    process.stdout.write(formatReport(result.report) + "\n");
    if (!result.report.resolution.available || !result.report.compositeConstraintsReady) {
      process.stderr.write("Backfill is not yet available because migrations 0018 and 0019 are not fully applied.\n");
      process.exitCode = 2;
    } else if (result.report.blockingIssues.length > 0) {
      process.exitCode = 2;
    }
    return;
  }

  const result = await backfillWorkspaceKnowledgeGraph({
    ...options,
    apply: true,
    confirmDatabase: args.confirmDatabase,
  });
  process.stdout.write(formatReport(result) + "\n");
}

// CLI only; importing this module for tests never opens a database connection.
/* eslint-disable-next-line @typescript-eslint/no-require-imports -- CLI execution guard */
if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown failure";
    process.stderr.write("KG integrity operation failed: " + sanitizeErrorMessage(message) + "\n");
    process.exitCode = 1;
  });
}
