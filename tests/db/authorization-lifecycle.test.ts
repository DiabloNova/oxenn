vi.mock("pg");
vi.mock("../../src/services/auth/session", async (importOriginal) => {
    const mod = await importOriginal<typeof import("../../src/services/auth/session")>();

    const mockSession = {
        user: {
            id: 'usr-b2310ea4-5f56-4740-88ce-38f6a1bb4e37',
            name: 'Probe',
            email: 'probe@example.com',
            role: 'workspace_admin',
            workspaceId: 'd4001873-8482-4977-b746-ab085a855012'
        },
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: "authenticated"
    };

    return {
      ...mod,
      getSession: vi.fn().mockResolvedValue(mockSession),
      requireSession: vi.fn().mockResolvedValue(mockSession),
      createSession: vi.fn().mockResolvedValue(undefined),
      invalidateSession: vi.fn().mockResolvedValue(undefined)
    };
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerAction, loginAction } from "../../src/app/actions/auth";
import { requireWorkspaceMembership, requireRole } from "../../src/services/auth/authorization";
import { switchWorkspaceAction } from "../../src/app/actions/workspace";

// Ensure DATABASE_URL is set before importing PostgresClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

describe("Auth Lifecycle Tests", () => {
  let PostgresClientModule: typeof import("../../src/features/admin/infrastructure/persistence/postgres");

  beforeEach(async () => {
    PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");

    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    let capturedHash = "";
    let capturedParams = "";

    const mockClient = {
      query: vi.fn().mockImplementation(async (sqlOrObj: unknown, params: unknown[]) => {
        const sql = typeof sqlOrObj === 'string' ? sqlOrObj : (sqlOrObj as {text?: string}).text || String(sqlOrObj);

        if (sql.includes("INSERT INTO users")) return { rowCount: 1 };
        if (sql.includes("SELECT id FROM users WHERE email")) return { rows: [], rowCount: 0 }; // Register unique
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }], rowCount: 1 };
        if (sql.includes("INSERT INTO user_credentials")) {
           capturedHash = params[2] as string;
           capturedParams = params[4] as string;
           return { rowCount: 1 };
        }
        if (sql.includes("SELECT * FROM users WHERE lower(email)")) return { rows: [{ id: "usr-b2310ea4-5f56-4740-88ce-38f6a1bb4e37", name: "Probe", email: "probe@example.com" }], rowCount: 1 }; // Login
        if (sql.includes("SELECT * FROM user_credentials WHERE user_id")) {
           return { rows: [{
              user_id: "usr-b2310ea4-5f56-4740-88ce-38f6a1bb4e37",
              password_hash: capturedHash || "5X942op26r/rCdLWgb3HfA==:6nwvtKsXerwaU9lugHy4cE6FoYTBrqg0BWn/tg9aiRXradK2OPsdpRNRtMbQV1qFeL+ZEIcm/ZsoKeazAD2EvA==",
              params: capturedParams ? JSON.parse(capturedParams) : { n: 32768, r: 8, p: 1, keyLength: 64 },
              failed_attempts: 0
           }], rowCount: 1 };
        }
        if (sql.includes("UPDATE user_credentials")) return { rowCount: 1 };
        if (sql.includes("SELECT m.organization_id")) return { rows: [{ workspaceId: "d4001873-8482-4977-b746-ab085a855012", role: "workspace_admin", workspaceName: "Probe's Workspace" }], rowCount: 1 };
        if (sql.includes("organization_members")) return { rows: [{ id: "1", role: "workspace_admin" }], rowCount: 1 }; // Membership passes
        if (sql.includes("organizations")) return { rows: [{ id: "d4001873-8482-4977-b746-ab085a855012" }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full auth lifecycle", async () => {
    // 1. Register
    const registeredUser = await registerAction("Probe", "probe@example.com", "Password123");
    expect((registeredUser as { id: string }).id).toBeDefined();

    // 2. Login
    const loggedInUser = await loginAction("probe@example.com", "Password123");
    expect(loggedInUser.email).toBe("probe@example.com");

    // 3. requireWorkspaceMembership (pass)
    await requireWorkspaceMembership(loggedInUser.id, loggedInUser.workspaceId);

    // 4. requireRole
    await requireRole("workspace_admin", loggedInUser.workspaceId);

  });

  it("negative test: wrong workspace denied", async () => {
     const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
     const pgClient = PostgresClientModule.PostgresClient.getInstance();

     const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
           return { rows: [], rowCount: 0 }; // Empty rows -> denied
        }),
        release: vi.fn(),
     };

     vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

     await expect(requireWorkspaceMembership('usr-b2310ea4-5f56-4740-88ce-38f6a1bb4e37', 'ws-invalid')).rejects.toThrow("Forbidden");
  });
});

  it("negative test: rate limit triggers TooManyRequests and denies login", async () => {
    const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) {
          // Simulate rate limit exceeded
          return { rows: [{ attempts: 20 }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    await expect(loginAction("limited@example.com", "Password123")).rejects.toThrow("TooManyRequests");
  });

  it("negative test: rate limit DB failure fails closed", async () => {
    const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) {
          throw new Error("DB Connection Error");
        }
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    await expect(loginAction("failclosed@example.com", "Password123")).rejects.toThrow("DB Connection Error");
  });

  it("regression: stale role_snapshot cannot authorize if DB role changes", async () => {
      const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
      const pgClient = PostgresClientModule.PostgresClient.getInstance();

      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
          // Return lower role in DB than session claims
          if (sql.includes("SELECT m.role FROM organization_members")) {
            return { rows: [{ role: "viewer" }], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }),
        release: vi.fn(),
      };

      vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

      // Should fail because DB role is 'viewer' even though mock session role is 'workspace_admin'
      await expect(requireRole("workspace_admin")).rejects.toThrow("Forbidden");
    });

    it("rate limits trip exactly at configured threshold", async () => {
      const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
      const pgClient = PostgresClientModule.PostgresClient.getInstance();

      let calls = 0;
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
          if (sql.includes("INSERT INTO auth_rate_limits")) {
            calls++;
            // Simulate threshold for login (10)
            return { rows: [{ attempts: calls }], rowCount: 1 };
          }
          // Fail login deliberately to test rate limit tripping without clearing the bucket
        if (sql.includes("SELECT * FROM users WHERE lower(email)")) return { rows: [], rowCount: 0 };
          if (sql.includes("INSERT INTO user_credentials")) return { rows: [], rowCount: 0 };
          return { rows: [], rowCount: 0 };
        }),
        release: vi.fn(),
      };

      vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

      // 10 failed logins
      for (let i = 0; i < 10; i++) {
          await expect(loginAction("trip@example.com", "WrongPassword")).rejects.toThrow("Invalid credentials");
      }
      // 11th should fail with TooManyRequests
      await expect(loginAction("trip@example.com", "WrongPassword")).rejects.toThrow("TooManyRequests");
    });

    it("successful login resets the rate limit bucket", async () => {
      const PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
      const pgClient = PostgresClientModule.PostgresClient.getInstance();

      let bucketCleared = false;
      let calls = 0;
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
          if (sql.includes("INSERT INTO auth_rate_limits")) {
            calls = bucketCleared ? 1 : calls + 1;
            return { rows: [{ attempts: calls }], rowCount: 1 };
          }
          if (sql.includes("DELETE FROM auth_rate_limits")) {
            bucketCleared = true;
            return { rowCount: 1 };
          }
          if (sql.includes("SELECT * FROM users WHERE lower(email)")) return { rows: [{ id: "usr-1", name: "Probe", email: "probe@example.com" }], rowCount: 1 };
          if (sql.includes("SELECT * FROM user_credentials")) {
             return { rows: [{
                user_id: "usr-1",
                password_hash: "5X942op26r/rCdLWgb3HfA==:6nwvtKsXerwaU9lugHy4cE6FoYTBrqg0BWn/tg9aiRXradK2OPsdpRNRtMbQV1qFeL+ZEIcm/ZsoKeazAD2EvA==",
                params: { n: 32768, r: 8, p: 1, keyLength: 64 },
                failed_attempts: 0
             }], rowCount: 1 };
          }
          if (sql.includes("SELECT m.organization_id")) return { rows: [{ workspaceId: "ws-1", role: "workspace_admin", workspaceName: "WS" }], rowCount: 1 };
          return { rows: [], rowCount: 0 };
        }),
        release: vi.fn(),
      };

      vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

      // 10 successful logins
      for (let i = 0; i < 10; i++) {
          const res = await loginAction("trip@example.com", "Password123");
          expect(res).toBeDefined();
          if (res && typeof res === 'object' && 'error' in res) {
             throw new Error("Unexpected error");
          }
      }
      // 11th should still succeed because the bucket is cleared every time
      const res = await loginAction("trip@example.com", "Password123");
      expect(res).toBeDefined();
      if (res && typeof res === 'object' && 'error' in res) {
         throw new Error("Unexpected error");
      }
      expect(bucketCleared).toBe(true);
    });
