export type TenantTransactionOutcome =
  | "not_started"
  | "rolled_back"
  | "rollback_failed"
  | "commit_uncertain";

export type TenantTransactionPhase = "setup" | "work" | "commit";

export interface TenantTransactionOutcomeErrorOptions {
  outcome: TenantTransactionOutcome;
  phase: TenantTransactionPhase;
  cause: unknown;
  rollbackError?: unknown;
}

/**
 * Describes what the transaction manager could actually confirm after a failure.
 * The original operation error remains available as `cause`; cleanup failures are
 * retained separately so callers never have to infer preservation from an exception.
 */
export class TenantTransactionOutcomeError extends Error {
  public readonly outcome: TenantTransactionOutcome;
  public readonly phase: TenantTransactionPhase;
  public readonly rollbackError?: unknown;

  constructor(options: TenantTransactionOutcomeErrorOptions) {
    super("Tenant transaction failed.", { cause: options.cause });
    this.name = "TenantTransactionOutcomeError";
    this.outcome = options.outcome;
    this.phase = options.phase;
    this.rollbackError = options.rollbackError;
  }
}
