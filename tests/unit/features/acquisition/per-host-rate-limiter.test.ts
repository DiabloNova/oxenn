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

  it("serializes concurrent callers for the same host", async () => {
    let now = 0;
    const waits: number[] = [];
    const limiter = new PerHostRateLimiter(
      () => now,
      async (delayMs) => {
        waits.push(delayMs);
        await Promise.resolve();
        now += delayMs;
      }
    );
    const signal = new AbortController().signal;
    const starts: number[] = [];

    await Promise.all([
      limiter.waitForSlot("a.test", 10, signal).then(() => starts.push(now)),
      limiter.waitForSlot("a.test", 10, signal).then(() => starts.push(now))
    ]);

    expect(waits).toEqual([100, 100]);
    expect(starts).toEqual([100, 200]);
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
