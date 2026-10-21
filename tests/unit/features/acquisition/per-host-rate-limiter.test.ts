import { describe, expect, it, vi } from "vitest";
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

  it("removes the abort listener when a timed wait completes", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const removeListener = vi.spyOn(controller.signal, "removeEventListener");
      const limiter = new PerHostRateLimiter(() => Date.now());

      await limiter.waitForSlot("a.test", 10, controller.signal);
      const pending = limiter.waitForSlot("a.test", 10, controller.signal);
      await vi.advanceTimersByTimeAsync(100);
      await pending;

      expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects with CANCELLED when aborted during a timed wait", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const limiter = new PerHostRateLimiter(() => Date.now());

      await limiter.waitForSlot("a.test", 10, controller.signal);
      const pending = limiter.waitForSlot("a.test", 10, controller.signal);
      await Promise.resolve();
      controller.abort();

      await expect(pending).rejects.toMatchObject({ code: "CANCELLED" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects an already-aborted signal even when no delay remains", async () => {
    let now = 1_000;
    const controller = new AbortController();
    const limiter = new PerHostRateLimiter(() => now);

    await limiter.waitForSlot("a.test", 10, controller.signal);
    now += 100;
    controller.abort();

    await expect(
      limiter.waitForSlot("a.test", 10, controller.signal)
    ).rejects.toMatchObject({ code: "CANCELLED" });
  });
});
