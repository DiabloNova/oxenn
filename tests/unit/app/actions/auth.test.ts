import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction, loginAction } from "@/app/actions/auth";

// A mock to intercept Postgres queries
const mockQuery = vi.fn();

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: vi.fn(async (tenantId, purpose, callback) => {
      return await callback();
    }),
    getDbClient: vi.fn(() => ({
      query: mockQuery,
    })),
  },
}));

vi.mock("@/services/auth/session", () => ({
  createSession: vi.fn(),
  invalidateSession: vi.fn(),
  getSession: vi.fn(),
}));

const mockHashPassword = vi.fn().mockResolvedValue({ hash: "dummy" });

vi.mock("@/services/auth/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/passwords")>();
  return {
    ...actual,
    hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  };
});

describe("Authentication Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerAction", () => {
    it("throws error if user already exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "usr-existing" }] }); // SELECT id FROM users WHERE email

      await expect(registerAction("Test", "test@test.com", "Password123")).resolves.toEqual({ errorCode: "USER_EXISTS" });
    });

    it("throws error if password doesn't meet requirements", async () => {
       await expect(registerAction("Test", "test@test.com", "short")).rejects.toThrow("Password must be between 10 and 255 characters");
    });
  });

  describe("loginAction", () => {
    it("throws error if missing password", async () => {
        // @ts-expect-error testing missing arguments
        await expect(loginAction("test@test.com")).rejects.toThrow("Password is required");
    });

    it("throws error if user not found (with dummy hash timing protection)", async () => {
       mockQuery.mockResolvedValueOnce({ rows: [] }); // SELECT FROM users

       await expect(loginAction("test@test.com", "Password123")).rejects.toThrow("Invalid credentials or user not found.");

       // verify the dummy-hash mitigation directly instead of wall-clock time
       expect(mockHashPassword).toHaveBeenCalled();
    });

    describe("loginAction lockout constraints", () => {
      it("throws error when locked out", async () => {
         mockQuery.mockResolvedValueOnce({ rows: [{ id: "usr-1" }] }); // SELECT FROM users

         const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
         mockQuery.mockResolvedValueOnce({ rows: [{ user_id: "usr-1", locked_until: lockedUntil }] }); // SELECT FROM user_credentials

         await expect(loginAction("test@test.com", "Password123")).rejects.toThrow("Account is temporarily locked");
      });
    });
  });
});
