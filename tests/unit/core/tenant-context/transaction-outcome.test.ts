import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    rollbackError: undefined as Error | undefined,
    commitError: undefined as Error | undefined,
    setupError: undefined as Error | undefined,
    commitAppliedBeforeError: false,
    transactionOpen: false,
    rollbackGate: undefined as Promise<void> | undefined,
    rollbackStarted: undefined as (() => void) | undefined,
  };

  const query = vi.fn(async (sql: string) => {
    const statement = sql.trim().toUpperCase();
    if (statement === "BEGIN") {
      state.transactionOpen = true;
      return { command: "BEGIN", rows: [], rowCount: 0 };
    }
    if (statement.startsWith("SELECT SET_CONFIG")) {
      if (state.setupError) throw state.setupError;
      return { command: "SELECT", rows: [], rowCount: 1 };
    }
    if (statement === "COMMIT") {
      if (state.commitError) {
        if (state.commitAppliedBeforeError) state.transactionOpen = false;
        throw state.commitError;
      }
      state.transactionOpen = false;
      return { command: "COMMIT", rows: [], rowCount: 0 };
    }
    if (statement === "ROLLBACK") {
      if (state.rollbackError) throw state.rollbackError;
      state.rollbackStarted?.();
      if (state.rollbackGate) await state.rollbackGate;
      // A ROLLBACK response is an acknowledgement, even when the server reports
      // there was no active transaction (the COMMIT-uncertainty case).
      state.transactionOpen = false;
      return { command: "ROLLBACK", rows: [], rowCount: 0 };
    }
    return { command: "SELECT", rows: [], rowCount: 1 };
  });

  const release = vi.fn();
  const connectClient = vi.fn(async () => ({ query, release }));
  return { state, query, release, connectClient };
});

vi.mock("@/features/admin/infrastructure/persistence/postgres", () => ({
  PostgresClient: { getInstance: () => ({ connectClient: mocks.connectClient }) },
}));

import { TenantContextManager, TenantTransactionOutcomeError } from "@/core/database/tenant-context";

describe("TenantContextManager transaction outcome reporting", () => {
  beforeEach(() => {
    mocks.state.rollbackError = undefined;
    mocks.state.commitError = undefined;
    mocks.state.setupError = undefined;
    mocks.state.commitAppliedBeforeError = false;
    mocks.state.transactionOpen = false;
    mocks.state.rollbackGate = undefined;
    mocks.state.rollbackStarted = undefined;
    mocks.query.mockClear();
    mocks.release.mockClear();
    mocks.connectClient.mockClear();
    mocks.connectClient.mockImplementation(async () => ({ query: mocks.query, release: mocks.release }));
  });

  it("commits successful work and releases the client", async () => {
    const result = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => "saved", { reportTransactionOutcome: true },
    );

    expect(result).toBe("saved");
    expect(mocks.query.mock.calls.map(([sql]) => String(sql).trim().toUpperCase())).toEqual([
      "BEGIN",
      "SELECT SET_CONFIG('APP.CURRENT_TENANT_ID', $1, TRUE)",
      "COMMIT",
    ]);
    expect(mocks.release).toHaveBeenCalledTimes(1);
    expect(mocks.release.mock.calls[0]?.[0]).toBeUndefined();
  });

  it("reports confirmed rollback only after the ROLLBACK query resolves", async () => {
    const operationError = new Error("write failed");
    let resolveRollback!: () => void;
    let notifyRollbackStarted!: () => void;
    const rollbackStarted = new Promise<void>((resolve) => { notifyRollbackStarted = resolve; });
    mocks.state.rollbackGate = new Promise<void>((resolve) => { resolveRollback = resolve; });
    mocks.state.rollbackStarted = notifyRollbackStarted;

    let outcomeSettled = false;
    const outcomePromise = TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => { throw operationError; }, { reportTransactionOutcome: true },
    ).catch((caught: unknown) => caught).then((error) => {
      outcomeSettled = true;
      return error;
    });

    await rollbackStarted;
    expect(outcomeSettled).toBe(false);
    resolveRollback();
    const error = await outcomePromise;

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "rolled_back", phase: "work", cause: operationError });
    expect(mocks.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mocks.release).toHaveBeenCalledTimes(1);
    expect(mocks.release.mock.calls[0]?.[0]).toBeUndefined();
  });

  it("reports unknown preservation and destroys the client when rollback fails", async () => {
    const operationError = new Error("write failed");
    const rollbackError = new Error("connection lost during rollback");
    mocks.state.rollbackError = rollbackError;

    const error = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => { throw operationError; }, { reportTransactionOutcome: true },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "rollback_failed", phase: "work", cause: operationError, rollbackError });
    expect(mocks.release).toHaveBeenCalledWith(rollbackError);
  });

  it("keeps a failed COMMIT uncertain even if the best-effort ROLLBACK resolves", async () => {
    const commitError = new Error("connection lost while acknowledging commit");
    mocks.state.commitError = commitError;
    mocks.state.commitAppliedBeforeError = true;

    const error = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => "prepared", { reportTransactionOutcome: true },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "commit_uncertain", phase: "commit", cause: commitError });
    expect(mocks.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mocks.release).toHaveBeenCalledWith(commitError);
  });

  it("reports that work never started when transaction setup fails", async () => {
    const setupError = new Error("tenant context setup failed");
    mocks.state.setupError = setupError;
    const work = vi.fn(async () => "must not run");

    const error = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", work, { reportTransactionOutcome: true },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "not_started", phase: "setup", cause: setupError });
    expect(work).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });

  it("reports a client acquisition failure as not started without releasing a missing client", async () => {
    const connectionError = new Error("database unavailable");
    mocks.connectClient.mockRejectedValueOnce(connectionError);

    const error = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => "must not run", { reportTransactionOutcome: true },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TenantTransactionOutcomeError);
    expect(error).toMatchObject({ outcome: "not_started", phase: "setup", cause: connectionError });
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("preserves the original thrown error for callers that do not opt into outcome reporting", async () => {
    const operationError = new Error("legacy caller failure");

    const error = await TenantContextManager.runWithTenantContext(
      "tenant-a", "user-a", "request-a", async () => { throw operationError; },
    ).catch((caught: unknown) => caught);

    expect(error).toBe(operationError);
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
});
