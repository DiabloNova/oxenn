import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

vi.mock("next/headers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/headers")>();
  return {
    ...actual,
    headers: vi.fn(async () => new Headers({ "x-real-ip": "203.0.113.10" })),
  };
});

import { registerAction, loginAction, requestVerification, verifyEmailAction, requestPasswordReset, confirmPasswordReset } from "@/app/actions/auth";
import { enqueueEmailOutbox } from "@/services/email/outbox";
import { dispatchEmailOutboxAfterResponse } from "@/services/email/outbox-dispatch";

vi.mock("@/services/email/outbox", () => ({ enqueueEmailOutbox: vi.fn(async () => "outbox-test-id") }));
vi.mock("@/services/email/outbox-dispatch", () => ({ dispatchEmailOutboxAfterResponse: vi.fn() }));

const { mockEmailSend } = vi.hoisted(() => ({ mockEmailSend: vi.fn() }));
vi.mock("@/services/email/adapters", () => ({ getEmailSender: () => ({ send: mockEmailSend }) }));


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
  getSession: vi.fn(), revokeAllForUser: vi.fn(),
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
    process.env.SESSION_SECRET = "unit-test-session-secret";
  });

  describe("registerAction", () => {
    it("throws error if user already exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }).mockResolvedValueOnce({ rows: [{ id: "usr-existing" }] }); // SELECT id FROM users WHERE email

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
       mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }).mockResolvedValueOnce({ rows: [] }); // SELECT FROM users

       await expect(loginAction("test@test.com", "Password123")).rejects.toThrow("Invalid credentials or user not found.");

       // verify the dummy-hash mitigation directly instead of wall-clock time
       expect(mockHashPassword).toHaveBeenCalled();
    });

    describe("loginAction lockout constraints", () => {
      it("throws error when locked out", async () => {
         mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }).mockResolvedValueOnce({ rows: [{ id: "usr-1" }] }); // SELECT FROM users

         const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
         mockQuery.mockResolvedValueOnce({ rows: [{ user_id: "usr-1", locked_until: lockedUntil }] }); // SELECT FROM user_credentials

         await expect(loginAction("test@test.com", "Password123")).rejects.toThrow("Account is temporarily locked");
      });
    });
  });

  describe("requestVerification", () => {
    it("returns success without error if user not found (enumeration safe)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // requester rate limit
        .mockResolvedValueOnce({ rows: [] }); // user lookup
      await expect(requestVerification("missing@test.com")).resolves.toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const expectedRequesterBucket = `verification-requester:${crypto.createHmac("sha256", "unit-test-session-secret").update("203.0.113.10").digest("hex")}`;
      expect(mockQuery.mock.calls[0][1]).toContain(expectedRequesterBucket);
      expect(mockQuery.mock.calls[1][0]).toContain("SELECT id, email, email_verified_at FROM users");
    });

    it("returns the same success response when an existing address reaches its delivery quota", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // requester rate limit
        .mockResolvedValueOnce({ rows: [{ id: "usr-1", email: "user@example.com", email_verified_at: null }] }) // unverified user lookup
        .mockResolvedValueOnce({ rows: [{ attempts: 6 }] }); // per-address quota exceeded

      await expect(requestVerification("user@example.com")).resolves.toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe("requestPasswordReset", () => {
    it("returns success without error if user not found (enumeration safe)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] }).mockResolvedValueOnce({ rows: [] });
      await expect(requestPasswordReset("missing@test.com")).resolves.toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("does not look up an account after requester throttling", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 11 }] });
      await expect(requestPasswordReset("victim@example.com")).resolves.toEqual({ success: true });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("queues a known account reset without waiting for the email provider", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-1", email: "user@example.com" }] })
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(requestPasswordReset("user@example.com")).resolves.toEqual({ success: true });
      expect(enqueueEmailOutbox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        userId: "usr-1", kind: "password_reset", payload: expect.objectContaining({ to: "user@example.com", templateId: "password_reset" }),
      }));
      expect(dispatchEmailOutboxAfterResponse).toHaveBeenCalledWith("outbox-test-id");
      expect(mockEmailSend).not.toHaveBeenCalled();
      expect(JSON.stringify(mockQuery.mock.calls[2][1])).not.toContain("user@example.com");
    });
  });

  describe("transactional verification delivery", () => {
    it("creates the verification token and outbox record in the registration transaction", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await registerAction("Test", "new@example.com", "StrongPassword123!");
      expect(result).toMatchObject({ email: "new@example.com", verificationEmailQueued: true });
      expect(enqueueEmailOutbox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        kind: "verification", payload: expect.objectContaining({ to: "new@example.com", templateId: "verification" }),
      }));
      expect(dispatchEmailOutboxAfterResponse).toHaveBeenCalledWith("outbox-test-id");
      expect(mockEmailSend).not.toHaveBeenCalled();
      expect(mockQuery.mock.calls.some(([sql]) => String(sql).includes("BEGIN") || String(sql).includes("COMMIT"))).toBe(false);
    });

    it("queues a resend for an existing unverified account and returns the generic response", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-1", email: "user@example.com", email_verified_at: null }] })
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(requestVerification("user@example.com")).resolves.toEqual({ success: true });
      expect(enqueueEmailOutbox).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        userId: "usr-1", kind: "verification", payload: expect.objectContaining({ to: "user@example.com" }),
      }));
      expect(dispatchEmailOutboxAfterResponse).toHaveBeenCalledWith("outbox-test-id");
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe("Token consumption & Reset atomicity", () => {
    it("verifyEmailAction updates user and consumes token", async () => {
       const emailFingerprint = crypto.createHash("sha256").update("user@example.com").digest("hex");
       const validToken = `${"a".repeat(64)}.${emailFingerprint}`;
       mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'usr-1' }] }); // consume token
       mockQuery.mockResolvedValueOnce({ rows: [{ email: "user@example.com", emailVerifiedAt: null }] }); // lock user
       mockQuery.mockResolvedValueOnce({ rows: [{ id: "usr-1" }] }); // UPDATE user
       mockQuery.mockResolvedValueOnce({ rows: [] }); // consume other tokens
       mockQuery.mockResolvedValueOnce({ rows: [] }); // revoke sessions
       await expect(verifyEmailAction(validToken)).resolves.toEqual({ success: true });
       expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), expect.any(Array));
    });

    it("consumes a verification token without verifying an account whose email has changed", async () => {
       const oldEmailFingerprint = crypto.createHash("sha256").update("old@example.com").digest("hex");
       const staleToken = `${"b".repeat(64)}.${oldEmailFingerprint}`;
       mockQuery.mockResolvedValueOnce({ rows: [{ user_id: "usr-1" }] }); // consume presented token
       mockQuery.mockResolvedValueOnce({ rows: [{ email: "new@example.com", emailVerifiedAt: null }] }); // lock current user

       await expect(verifyEmailAction(staleToken)).resolves.toEqual({ success: false });
       expect(mockQuery.mock.calls.some(([sql]) => String(sql).includes("UPDATE users"))).toBe(false);
       expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("rejects legacy verification tokens without an email fingerprint", async () => {
       await expect(verifyEmailAction("token123")).rejects.toThrow("Invalid or expired token");
       expect(mockQuery).not.toHaveBeenCalled();
    });

    it("confirmPasswordReset updates credentials and consumes token", async () => {
       mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'usr-1' }] }); // UPDATE token
       mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE credentials
       mockQuery.mockResolvedValueOnce({ rows: [] }); // revoke session
       await expect(confirmPasswordReset("token123", "NewPassword123!")).resolves.toEqual({ success: true });
       expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE user_credentials"), expect.any(Array));
    });
  });
});
