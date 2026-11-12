import { CrawlError } from "../../domain/errors";

/** Shared per-job response budget. Stream callbacks are synchronous, so reservations cannot race. */
export class CrawlByteBudget {
  private retained = 0;
  private observed = 0;
  private exceeded = false;

  public constructor(private readonly maxBytes: number) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
      throw new RangeError("Crawl byte budget must be a positive safe integer");
    }
  }

  /** Bytes observed from response streams, including the first rejected chunk. */
  public get bytesProcessed(): number { return this.observed; }
  /** Bytes admitted for retention; this value never exceeds maxBytes. */
  public get bytesRetained(): number { return this.retained; }
  public get isExceeded(): boolean { return this.exceeded; }

  /** Check a declared Content-Length without counting bytes not yet received. */
  public canFit(bytes: number): boolean {
    if (this.exceeded) return false;
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > this.maxBytes - this.retained) {
      this.exceeded = true;
      return false;
    }
    return true;
  }

  /** Count a chunk before the caller retains it. */
  public tryConsume(bytes: number): boolean {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      this.exceeded = true;
      return false;
    }
    this.observed += bytes;
    if (!this.canFit(bytes)) return false;
    this.retained += bytes;
    return true;
  }

  public createError(): CrawlError {
    return new CrawlError("BYTE_BUDGET_EXCEEDED", "Crawl exceeded its aggregate response byte budget", {
      maxTotalBytes: this.maxBytes,
      bytesProcessed: this.observed,
      bytesRetained: this.retained
    });
  }
}
