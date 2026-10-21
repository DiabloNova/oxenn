import { describe, expect, it } from "vitest";
import { PerHostRateLimiter } from "@/features/acquisition/infrastructure/http/per-host-rate-limiter";

describe("PerHostRateLimiter", () => {
  it("spaces requests to the same host using a controllable clock", async () => {
    let now = 1_000;
    const requestedWaits: number[] = [];
    const limiter = new PerHostRateLimiter(
      () => now,
      async (delayMs) => {
        requestedWaits.push(delayMs);
        now += delayMs;
      }
    );
    const signal = new AbortController().signal;
    const starts: number[] = [];

    await limiter.waitForSlot("a.test", 10, signal);
    starts.push(now);
    await limiter.waitForSlot("a.test", 10, signal);
    starts.push(now);

    expect(requestedWaits).toEqual([100]);
    expect(starts).toEqual([1_000, 1_100]);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(100);
  });

  it("tracks separate hosts independently", async () => {
    let now = 1_000;
    const requestedWaits: number[] = [];
    const limiter = new PerHostRateLimiter(
      () => now,
      async (delayMs) => {
        requestedWaits.push(delayMs);
        now += delayMs;
      }
    );
    const signal = new AbortController().signal;

    await limiter.waitForSlot("a.test", 10, signal);
    await limiter.waitForSlot("b.test", 10, signal);

    expect(requestedWaits).toEqual([]);
  });
});
