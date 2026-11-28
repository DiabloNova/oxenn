import { describe, expect, it } from "vitest";
import {
  assertEphemeralDatabaseUrl,
  summarizeLatencySamples,
} from "../../../../scripts/database/performance-metrics";

describe("database performance smoke safety", () => {
  it("accepts only the disposable local isolation database", () => {
    expect(
      assertEphemeralDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/isolation_test_db"
      ).hostname
    ).toBe("localhost");
    expect(() =>
      assertEphemeralDatabaseUrl(
        "postgresql://postgres:secret@ep-green-resonance.example.neon.tech:5432/isolation_test_db"
      )
    ).toThrow("Refusing to benchmark a non-ephemeral database");
    expect(() =>
      assertEphemeralDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/production"
      )
    ).toThrow("Refusing to benchmark a non-ephemeral database");
    expect(() =>
      assertEphemeralDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5433/isolation_test_db"
      )
    ).toThrow("Refusing to benchmark a non-ephemeral database");
  });

  it("summarizes p50 and p95 without mutating the input samples", () => {
    const samples = [5, 1, 4, 2, 3];
    expect(summarizeLatencySamples(samples)).toEqual({
      count: 5,
      minMs: 1,
      p50Ms: 3,
      p95Ms: 5,
      maxMs: 5,
    });
    expect(samples).toEqual([5, 1, 4, 2, 3]);
  });

  it("rejects empty or invalid latency samples", () => {
    expect(() => summarizeLatencySamples([])).toThrow("at least one finite");
    expect(() => summarizeLatencySamples([1, Number.NaN])).toThrow("at least one finite");
    expect(() => summarizeLatencySamples([-1, 2])).toThrow("at least one finite");
  });
});
