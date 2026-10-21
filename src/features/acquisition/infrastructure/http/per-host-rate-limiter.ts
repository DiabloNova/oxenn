import { CrawlError } from "../../domain/errors";

export type RateLimitWait = (delayMs: number, signal: AbortSignal) => Promise<void>;

function cancelledError(): CrawlError {
  return new CrawlError("CANCELLED", "Crawl was cancelled");
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw cancelledError();
  }
}

function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(cancelledError());
  }

  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(cancelledError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Serializes rate-limit scheduling per host using an injectable clock and wait function. */
export class PerHostRateLimiter {
  private readonly lastRequestAt = new Map<string, number>();
  private readonly hostLocks = new Map<string, Promise<void>>();

  public constructor(
    private readonly now: () => number = Date.now,
    private readonly waitFor: RateLimitWait = wait
  ) {}

  public async waitForSlot(
    host: string,
    requestsPerSecond: number,
    signal: AbortSignal
  ): Promise<void> {
    throwIfAborted(signal);

    const spacing = 1000 / requestsPerSecond;
    const previous = this.hostLocks.get(host) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => {
      release = resolve;
    });
    this.hostLocks.set(host, current);

    try {
      await previous;
      throwIfAborted(signal);

      const lastRequest = this.lastRequestAt.get(host) ?? 0;
      const remaining = spacing - (this.now() - lastRequest);
      if (remaining > 0) {
        await this.waitFor(remaining, signal);
      }

      throwIfAborted(signal);
      this.lastRequestAt.set(host, this.now());
    } finally {
      release();
      if (this.hostLocks.get(host) === current) {
        this.hostLocks.delete(host);
      }
    }
  }
}
