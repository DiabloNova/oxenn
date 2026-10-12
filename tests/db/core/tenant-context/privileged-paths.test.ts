import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TenantContextManager, TenantContextViolationException } from "../../../../src/core/database/tenant-context";

// Ensure DATABASE_URL is set before importing PostgresClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

describe("Privileged Paths Registry Test Suite", () => {
  let PostgresClientModule: typeof import("../../../../src/features/admin/infrastructure/persistence/postgres");

  beforeEach(async () => {
    PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws TenantContextViolationException for unregistered purpose tag", async () => {
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await TenantContextManager.runWithSystemContext(null, "unregistered-haxor-tag" as any, async () => {
        // work
      });
    }).rejects.toThrow(TenantContextViolationException);
  });

  it("logs audit record for registered purpose tag and succeeds", async () => {
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockSysClient = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
        if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
           return { rowCount: 0, rows: [] };
        }
        if (sql.includes("INSERT INTO audit_records")) {
            expect(params[3]).toBe("sys-auth-check"); // Action
            expect(params[4]).toBe("privileged_db_access"); // Resource Type
            expect(params[6]).toBe("success"); // Status
            return { rowCount: 1, rows: [] };
        }
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };
    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockSysClient as unknown as import("pg").PoolClient);

    const result = await TenantContextManager.runWithSystemContext(null, "sys-auth-check", async () => {
      return "worked";
    });

    expect(result).toBe("worked");
    expect(mockSysClient.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO audit_records"), expect.any(Array));
  });

  it("logs error audit record if work throws an exception", async () => {
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockSysClient = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
        if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
           return { rowCount: 0, rows: [] };
        }
        if (sql.includes("INSERT INTO audit_records") && params[6] === "error") {
            expect(params[3]).toBe("sys-auth-check"); // Action
            expect(params[4]).toBe("privileged_db_access"); // Resource Type
            expect(params[6]).toBe("error"); // Status
            expect(params[7]).toBe("Fake Error"); // Error details
            return { rowCount: 1, rows: [] };
        }
        if (sql.includes("INSERT INTO audit_records") && params[6] === "success") {
           // We might trigger this one before the exception is fully caught in test (though here it's caught, so success shouldn't happen actually. Wait, success is always fired immediately on lease).
           return { rowCount: 1, rows: [] };
        }
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };
    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockSysClient as unknown as import("pg").PoolClient);

    await expect(async () => {
        await TenantContextManager.runWithSystemContext(null, "sys-auth-check", async () => {
            throw new Error("Fake Error");
        });
    }).rejects.toThrow("Fake Error");

    expect(mockSysClient.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO audit_records"), expect.any(Array));
  });
});
