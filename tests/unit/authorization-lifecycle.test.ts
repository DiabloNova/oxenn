vi.mock("pg");
const lifecycleSession = vi.hoisted(() => ({
  user: null as null | { id: string; name: string; email: string; role: "workspace_admin"; workspaceId: string },
  registeredUserId: "",
}));
vi.mock("../../src/services/auth/session", async (importOriginal) => {
    const mod = await importOriginal<typeof import("../../src/services/auth/session")>();
    const currentSession = () => ({
      user: lifecycleSession.user ?? {
        id: "usr-b2310ea4-5f56-4740-88ce-38f6a1bb4e37",
        name: "Probe", email: "probe@example.com", role: "workspace_admin" as const,
        workspaceId: "d4001873-8482-4977-b746-ab085a855012",
      },
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      status: "authenticated" as const,
    });
    return {
      ...mod,
      getSession: vi.fn(async () => currentSession()),
      requireSession: vi.fn(async () => currentSession()),
      createSession: vi.fn(async (user) => { lifecycleSession.user = user as typeof lifecycleSession.user; }),
      invalidateSession: vi.fn().mockResolvedValue(undefined),
    };
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerAction, loginAction, verifyEmailAction } from "../../src/app/actions/auth";
import { CaptureEmailSender } from "../../src/services/email/adapters";
import { requireWorkspaceMembership, requireRole } from "../../src/services/auth/authorization";

// Ensure DATABASE_URL is set before importing PostgresClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/oxenn";
}

describe("Auth Lifecycle Tests", () => {
  let PostgresClientModule: typeof import("../../src/features/admin/infrastructure/persistence/postgres");


  beforeEach(async () => {
    process.env.SESSION_SECRET = "lifecycle-test-session-secret-with-32-chars";
    lifecycleSession.user = null;
    lifecycleSession.registeredUserId = "";
    CaptureEmailSender.clear();
    PostgresClientModule = await import("../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    let createdUserId = "";
    let createdWorkspaceId = "";
    let createdEmail = "";
    let isEmailVerified = false;
    let capturedPasswordHash = "";
    let capturedPasswordParams = "";
    let verificationTokenHash = "";
    let verificationTokenUserId = "";

    const mockClient = {
      query: vi.fn().mockImplementation(async (sqlOrObj: unknown, params: unknown[] = []) => {
        const sql = typeof sqlOrObj === "string" ? sqlOrObj : (sqlOrObj as { text?: string }).text || String(sqlOrObj);
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }], rowCount: 1 };
        if (sql.includes("SELECT id FROM users WHERE lower(email)")) return { rows: [], rowCount: 0 };
        if (sql.includes("SELECT user_id FROM user_profiles")) return { rows: [], rowCount: 0 };
        if (sql.includes("INSERT INTO users")) {
          createdUserId = String(params[0]);
          lifecycleSession.registeredUserId = createdUserId;
          createdEmail = String(params[2]);
          return { rows: [], rowCount: 1 };
        }
        if (sql.includes("INSERT INTO user_profiles")) return { rows: [], rowCount: 1 };
        if (sql.includes("INSERT INTO user_credentials")) {
          capturedPasswordHash = String(params[2]); capturedPasswordParams = String(params[4]);
          return { rows: [], rowCount: 1 };
        }
        if (sql.includes("INSERT INTO organizations")) {
          createdWorkspaceId = String(params[0]); return { rows: [], rowCount: 1 };
        }
        if (sql.includes("INSERT INTO organization_members")) return { rows: [], rowCount: 1 };
        if (sql.includes("SELECT id, email_verified_at FROM users")) {
          return { rows: [{ id: createdUserId, email_verified_at: isEmailVerified ? new Date() : null }], rowCount: 1 };
        }
        if (sql.includes("INSERT INTO email_verification_tokens")) {
          verificationTokenUserId = String(params[0]); verificationTokenHash = String(params[1]);
          return { rows: [], rowCount: 1 };
        }
        if (sql.includes("UPDATE email_verification_tokens")) {
          if (params.length > 1) {
            if (String(params[0] ?? "").trim().toLowerCase() === createdEmail.trim().toLowerCase() && String(params[1]) === verificationTokenHash && verificationTokenUserId === createdUserId) {
              return { rows: [{ user_id: createdUserId }], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }
          return { rows: [], rowCount: 1 };
        }
        if (sql.includes("UPDATE users SET email_verified_at")) {
          if (String(params[0]) !== createdUserId) return { rows: [], rowCount: 0 };
          isEmailVerified = true;
          return { rows: [{ id: createdUserId, name: "Probe User", email: createdEmail }], rowCount: 1 };
        }
        if (sql.includes("SELECT * FROM users WHERE lower(email)")) {
          return { rows: [{ id: createdUserId, name: "Probe User", email: createdEmail, email_verified_at: isEmailVerified ? new Date() : null }], rowCount: 1 };
        }
        if (sql.includes("SELECT * FROM user_credentials WHERE user_id")) {
          return { rows: [{ user_id: createdUserId, password_hash: capturedPasswordHash, params: JSON.parse(capturedPasswordParams), failed_attempts: 0 }], rowCount: 1 };
        }
        if (sql.includes("UPDATE user_credentials") || sql.includes("DELETE FROM auth_rate_limits")) return { rows: [], rowCount: 1 };
        if (sql.includes("SELECT m.organization_id")) {
          return { rows: [{ workspaceId: createdWorkspaceId, role: "workspace_admin", workspaceName: "Probe User's Workspace", username: "probeuser" }], rowCount: 1 };
        }
        if (sql.includes("organization_members")) return { rows: [{ id: "1", role: "workspace_admin" }], rowCount: 1 };
        if (sql.includes("organizations")) return { rows: [{ id: createdWorkspaceId }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    };
    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes registration, recipient-bound email verification, and login lifecycle", async () => {
    const registeredUser = await registerAction("Probe", "User", "probe@example.com", "Password123!!", "probeuser", "en");
    expect(registeredUser).toMatchObject({ success: true, verificationEmailSent: true });

    const verificationEmail = CaptureEmailSender.capturedEmails.find((message) => message.to === "probe@example.com");
    expect(verificationEmail?.params.code).toMatch(/^\d{8}$/);
    expect(verificationEmail?.to).toBe("probe@example.com");
    const verificationResult = await verifyEmailAction("probe@example.com", verificationEmail!.params.code!);
    expect(verificationResult).toEqual({ success: true, sessionCreated: true });

    const loginResult = await loginAction("probe@example.com", "Password123!!");
    expect(loginResult.success).toBe(true);
    if (!loginResult.success) throw new Error("Expected the verified user to sign in.");
    const loggedInUser = loginResult.user;
    expect(loggedInUser.email).toBe("probe@example.com");
    expect(loggedInUser.id).toBe(lifecycleSession.registeredUserId);
    expect(loggedInUser.id).toMatch(/^usr-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(loggedInUser.id).toBe(lifecycleSession.user?.id);
    expect(loggedInUser.workspaceId).toBe(lifecycleSession.user?.workspaceId);

    await requireWorkspaceMembership(loggedInUser.id, loggedInUser.workspaceId);
    const crossWorkspaceRole = await requireRole("workspace_admin", "ws-cross-workspace");
    expect(crossWorkspaceRole).toBe("workspace_admin");
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

      const callsByBucket = new Map<string, number>();
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
          if (sql.includes("INSERT INTO auth_rate_limits")) {
            const bucket = `${String(params[0])}:${String(params[1])}`;
            const attempts = (callsByBucket.get(bucket) ?? 0) + 1;
            callsByBucket.set(bucket, attempts);
            // Simulate the login account/IP bucket threshold independently from the IP-wide bucket.
            return { rows: [{ attempts }], rowCount: 1 };
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
          if (sql.includes("SELECT * FROM users WHERE lower(email)")) return { rows: [{ id: "usr-1", name: "Probe", email: "probe@example.com", email_verified_at: new Date() }], rowCount: 1 };
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
          expect(res.success).toBe(true);
          if (!res.success) throw new Error("Expected verified user to sign in.");
      }
      // 11th should still succeed because the bucket is cleared every time
      const res = await loginAction("trip@example.com", "Password123");
      expect(res.success).toBe(true);
      if (!res.success) throw new Error("Expected verified user to sign in.");
      expect(bucketCleared).toBe(true);
    });
