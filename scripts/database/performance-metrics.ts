export interface LatencySummary {
  count: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
}

export function assertEphemeralDatabaseUrl(connectionString: string): URL {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("Database performance smoke requires a valid local PostgreSQL URL.");
  }

  const supportedProtocol = url.protocol === "postgres:" || url.protocol === "postgresql:";
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const expectedDatabase = url.pathname === "/isolation_test_db";
  const expectedPort = !url.port || url.port === "5432";

  if (!supportedProtocol || !localHost || !expectedDatabase || !expectedPort) {
    throw new Error(
      "Refusing to benchmark a non-ephemeral database; only localhost:5432/isolation_test_db is allowed."
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
