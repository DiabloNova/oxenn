import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createQueryFingerprint,
  observeDatabaseQuery,
  recordDatabasePoolAcquire,
} from "../../../../src/core/database/query-telemetry";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("database query telemetry", () => {
  it("normalizes SQL literals, comments and whitespace into the same fingerprint", () => {
    const first = createQueryFingerprint(
      "SELECT * FROM users WHERE email = 'alice@example.com' AND id = 42 -- private comment"
    );
    const second = createQueryFingerprint(
      " select  *  from users where email='bob@example.com' and id=900 "
    );
    expect(first).toBe(second);
  });

  it("tokenizes comments and literals together when comments contain apostrophes", () => {
    const first = createQueryFingerprint("SELECT /* don't */ 'active' FROM users WHERE id = 42 -- don't leak");
    const second = createQueryFingerprint("select /* shouldn't */ 'pending' from users where id=900");
    expect(first).toBe(second);
  });

  it("normalizes dollar-quoted strings and nested block comments", () => {
    const first = createQueryFingerprint("SELECT /* outer /* inner */ done */ $$secret$$ FROM users");
    const second = createQueryFingerprint("select /* other */ $tag$private$tag$ from users");
    expect(first).toBe(second);
  });

  it("preserves case-sensitive quoted identifiers", () => {
    expect(createQueryFingerprint('SELECT "User" FROM users')).not.toBe(
      createQueryFingerprint('SELECT "user" FROM users')
    );
  });

  it("does not emit telemetry when disabled", async () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "false");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const result = await observeDatabaseQuery(
      { poolName: "workspace", sql: "select 1" },
      async () => ({ rowCount: 1 })
    );
    expect(result.rowCount).toBe(1);
    expect(debug).not.toHaveBeenCalled();
  });

  it("emits only a fingerprint and safe query metadata on success", async () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const result = await observeDatabaseQuery(
      {
        poolName: "workspace",
        sql: "select * from users where email = 'secret@example.com'",
        traceId: "req-123",
      },
      async () => ({ rowCount: 2 })
    );
    expect(result.rowCount).toBe(2);
    const event = JSON.parse(debug.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(event).toMatchObject({
      event: "oxenn.database.query",
      poolName: "workspace",
      rowCount: 2,
      outcome: "success",
      traceId: "req-123",
    });
    expect(event.queryFingerprint).toMatch(/^[a-f0-9]{16}$/);
    expect(event).not.toHaveProperty("sql");
    expect(event).not.toHaveProperty("params");
    expect(JSON.stringify(event)).not.toContain("secret@example.com");
  });

  it("omits trace IDs that do not match the safe request-ID format", async () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    await observeDatabaseQuery(
      { poolName: "workspace", sql: "select 1", traceId: "person@example.com" },
      async () => ({ rowCount: 1 })
    );
    const event = JSON.parse(debug.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(event).not.toHaveProperty("traceId");
    expect(JSON.stringify(event)).not.toContain("person@example.com");
  });

  it("propagates query errors and emits only the safe PostgreSQL code", async () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const error = Object.assign(new Error("private database details"), { code: "23505" });
    await expect(
      observeDatabaseQuery(
        { poolName: "authenticator", sql: "insert into users(email) values ('secret@example.com')" },
        async () => { throw error; }
      )
    ).rejects.toBe(error);
    const event = JSON.parse(debug.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(event).toMatchObject({ event: "oxenn.database.query", outcome: "error", errorCode: "23505" });
    expect(JSON.stringify(event)).not.toContain("private database details");
    expect(JSON.stringify(event)).not.toContain("secret@example.com");
  });

  it("does not change query behavior when the telemetry sink throws", async () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    vi.spyOn(console, "debug").mockImplementation(() => { throw new Error("logger unavailable"); });
    await expect(
      observeDatabaseQuery(
        { poolName: "workspace", sql: "select 1" },
        async () => ({ rowCount: 7 })
      )
    ).resolves.toEqual({ rowCount: 7 });
  });

  it("records pool acquisition wait and counters without connection details", () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    recordDatabasePoolAcquire({
      poolName: "authenticator",
      waitMs: 12.345,
      traceId: "req-456",
      totalCount: 4,
      idleCount: 1,
      waitingCount: 2,
      outcome: "success",
    });
    const event = JSON.parse(debug.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(event).toMatchObject({
      event: "oxenn.database.pool.acquire",
      poolName: "authenticator",
      waitMs: 12.35,
      totalCount: 4,
      idleCount: 1,
      waitingCount: 2,
      outcome: "success",
      traceId: "req-456",
    });
    expect(event).not.toHaveProperty("connectionString");
  });

  it("records failed pool acquisition waits without exposing error text", () => {
    vi.stubEnv("DATABASE_QUERY_TELEMETRY_ENABLED", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    recordDatabasePoolAcquire({
      poolName: "workspace",
      waitMs: 2000,
      traceId: "req-timeout",
      totalCount: 20,
      idleCount: 0,
      waitingCount: 3,
      outcome: "error",
      errorCode: "ETIMEDOUT",
    });
    const event = JSON.parse(debug.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(event).toMatchObject({
      event: "oxenn.database.pool.acquire",
      outcome: "error",
      errorCode: "ETIMEDOUT",
      waitMs: 2000,
      waitingCount: 3,
    });
    expect(JSON.stringify(event)).not.toContain("connection timeout details");
  });
});
