export interface LifecycleTableMetric extends Record<string, unknown> {
  schema_name: string;
  table_name: string;
  estimated_rows: string | number;
  live_rows: string | number;
  dead_rows: string | number;
  table_bytes: string | number;
  index_bytes: string | number;
  total_bytes: string | number;
  rls_enabled: boolean;
  force_rls: boolean;
  last_vacuum: Date | string | null;
  last_autovacuum: Date | string | null;
  last_analyze: Date | string | null;
  last_autoanalyze: Date | string | null;
}

export interface LifecycleIndexMetric extends Record<string, unknown> {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_definition: string;
  index_columns: string[];
  index_scans: string | number;
  tuples_read: string | number;
  tuples_fetched: string | number;
  index_bytes: string | number;
}

export interface LifecycleTemporalColumn extends Record<string, unknown> {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
}

function asNonNegativeNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function assertLocalLifecycleAuditUrl(
  connectionString: string,
  environment: Record<string, string | undefined> = process.env
): URL {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Lifecycle audit requires a valid local PostgreSQL URL.");
  }

  let username: string;
  let password: string;
  try {
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
  } catch {
    throw new Error("Lifecycle audit requires valid local credentials.");
  }

  const supportedProtocol = url.protocol === "postgres:" || url.protocol === "postgresql:";
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const expectedDatabase = url.pathname === "/isolation_test_db";
  const expectedPort = url.port === "5432";
  const expectedUser = username === "postgres";
  const hasCredentials = password.length > 0;
  const noConnectionOverrides = url.search.length === 0 && url.hash.length === 0;
  const safeEnvironment =
    (!environment.PGHOST || environment.PGHOST === "localhost" || environment.PGHOST === "127.0.0.1") &&
    (!environment.PGPORT || environment.PGPORT === "5432") &&
    (!environment.PGDATABASE || environment.PGDATABASE === "isolation_test_db") &&
    (!environment.PGHOSTADDR || environment.PGHOSTADDR === "127.0.0.1") &&
    !environment.PGSERVICE &&
    !environment.PGSERVICEFILE;

  if (
    !supportedProtocol ||
    !localHost ||
    !expectedDatabase ||
    !expectedPort ||
    !expectedUser ||
    !hasCredentials ||
    !noConnectionOverrides ||
    !safeEnvironment
  ) {
    throw new Error(
      "Refusing lifecycle audit outside the explicit localhost:5432/isolation_test_db target."
    );
  }

  return url;
}

export interface LifecycleInventorySummary {
  tableCount: number;
  estimatedRows: number;
  liveRows: number;
  deadRows: number;
  tableBytes: number;
  indexBytes: number;
  totalBytes: number;
}

export function summarizeLifecycleInventory(
  tables: LifecycleTableMetric[]
): LifecycleInventorySummary {
  return {
    tableCount: tables.length,
    estimatedRows: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.estimated_rows), 0),
    liveRows: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.live_rows), 0),
    deadRows: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.dead_rows), 0),
    tableBytes: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.table_bytes), 0),
    indexBytes: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.index_bytes), 0),
    totalBytes: tables.reduce((sum, table) => sum + asNonNegativeNumber(table.total_bytes), 0),
  };
}

export function findExpiryIndexCoverage(
  temporalColumns: LifecycleTemporalColumn[],
  indexes: LifecycleIndexMetric[]
): Array<{
  schema: string;
  table: string;
  column: "expires_at";
  indexed: boolean;
  indexNames: string[];
}> {
  return temporalColumns
    .filter((column) => column.column_name === "expires_at")
    .map((column) => {
      const matchingIndexes = indexes.filter(
        (index) =>
          index.schema_name === column.table_schema &&
          index.table_name === column.table_name &&
          index.index_columns.some((definition) =>
            /^"?expires_at"?(?:\s+(?:ASC|DESC))?(?:\s+NULLS\s+(?:FIRST|LAST))?$/i.test(definition.trim())
          )
      );
      return {
        schema: column.table_schema,
        table: column.table_name,
        column: "expires_at" as const,
        indexed: matchingIndexes.length > 0,
        indexNames: matchingIndexes.map((index) => index.index_name),
      };
    });
}
