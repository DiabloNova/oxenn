import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const client = { query: vi.fn(), release: vi.fn() };
  const connect = vi.fn(async () => client);
  return { client, connect };
});

vi.mock("pg", () => ({
  Pool: class {
    connect = mocks.connect;
    query = vi.fn();
    on = vi.fn();
    end = vi.fn(async () => undefined);
  },
}));

describe("PostgresClient leased tenant connection cleanup", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/oxenn_test");
    mocks.client.release.mockClear();
    mocks.connect.mockClear();
    mocks.connect.mockImplementation(async () => mocks.client);
  });

  it("forwards a transaction cleanup error so pg discards an untrusted client", async () => {
    const { PostgresClient } = await import("@/features/admin/infrastructure/persistence/postgres");
    const leasedClient = await PostgresClient.getInstance().connectClient();
    const rollbackError = new Error("rollback acknowledgement failed");

    leasedClient.release(rollbackError);

    expect(mocks.client.release).toHaveBeenCalledWith(rollbackError);
  });
});
