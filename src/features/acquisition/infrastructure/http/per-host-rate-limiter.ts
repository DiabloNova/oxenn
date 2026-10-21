import { CrawlError } from "../../domain/errors";

export type RateLimitWait = (delayMs: number, signal: AbortSignal) => Promise<void>;

function wait(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
      },
      { once: true }
    );
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
    const spacing = 1000 / requestsPerSecond;
    const previous = this.hostLocks.get(host) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => {
      release = resolve;
    });
    this.hostLocks.set(host, current);

    await previous;
    try {
      const lastRequest = this.lastRequestAt.get(host) ?? 0;
      const remaining = spacing - (this.now() - lastRequest);
      if (remaining > 0) {
        await this.waitFor(remaining, signal);
      }
      this.lastRequestAt.set(host, this.now());
    } finally {
      release();
      if (this.hostLocks.get(host) === current) {
        this.hostLocks.delete(host);
      }
    }
  }
}
