export interface LatencySummary {
  count: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}

export function assertEphemeralDatabaseUrl(
  connectionString: string,
  environment: Record<string, string | undefined> = process.env
): URL {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Database performance smoke requires a valid local PostgreSQL URL.");
  }

  let username: string;
  let password: string;
  try {
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
  } catch {
    throw new Error("Database performance smoke requires valid local credentials.");
  }

  const supportedProtocol = url.protocol === "postgres:" || url.protocol === "postgresql:";
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const expectedDatabase = url.pathname === "/isolation_test_db";
  const expectedPort = url.port === "5432";
  const expectedUser = username === "postgres";
  const hasCredentials = password.length > 0;
  const hasConnectionOverrides = url.search.length > 0 || url.hash.length > 0;
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
    hasConnectionOverrides ||
    !safeEnvironment
  ) {
    throw new Error(
      "Refusing to benchmark a non-ephemeral database; only an explicit localhost:5432/isolation_test_db target is allowed."
    );
  }

  return url;
}

function roundMilliseconds(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizeLatencySamples(samples: number[]): LatencySummary {
  if (samples.length === 0 || samples.some((sample) => !Number.isFinite(sample) || sample < 0)) {
    throw new Error("Latency samples must contain at least one finite, non-negative value.");
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const percentile = (fraction: number): number =>
    sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)];

  return {
    count: sorted.length,
    minMs: roundMilliseconds(sorted[0]),
    p50Ms: roundMilliseconds(percentile(0.5)),
    p95Ms: roundMilliseconds(percentile(0.95)),
    maxMs: roundMilliseconds(sorted[sorted.length - 1]),
  };
}
