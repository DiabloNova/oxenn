import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, sendMock, verifyPasswordMock, hashPasswordMock, createSessionMock, revokeAllMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  sendMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  createSessionMock: vi.fn(),
  revokeAllMock: vi.fn(),
}));

vi.mock("@/services/email/adapters", () => ({
  getEmailSender: () => ({ send: sendMock }),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: vi.fn(async (_tenantId: unknown, _purpose: unknown, callback: () => unknown) => callback()),
    getDbClient: vi.fn(() => ({ query: queryMock })),
  },
}));

vi.mock("@/services/auth/session", () => ({
  createSession: createSessionMock,
  invalidateSession: vi.fn(),
  getSession: vi.fn(),
  revokeAllForUser: revokeAllMock,
}));

vi.mock("@/services/auth/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/passwords")>();
  return {
    ...actual,
    hashPassword: (...args: unknown[]) => hashPasswordMock(...args),
    verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
  };
});

import {
  registerAction,
  loginAction,
  requestVerification,
  verifyEmailAction,
  requestPasswordReset,
  confirmPasswordReset,
} from "@/app/actions/auth";

describe("Authentication Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashPasswordMock.mockResolvedValue({ hash: "dummy", algorithm: "scrypt", params: {} });
    verifyPasswordMock.mockResolvedValue(true);
    sendMock.mockResolvedValue(undefined);
    queryMock.mockResolvedValue({ rows: [] });
    process.env.NEXT_PUBLIC_APP_URL = "https://oxenn.example";
  });

  describe("registration", () => {
    it("does not create a second account for an existing email", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-existing" }] });

      await expect(registerAction("Test", "test@test.com", "Password123"))
        .resolves.toEqual({ errorCode: "USER_EXISTS" });
    });

    it("rejects passwords that do not meet the policy", async () => {
      await expect(registerAction("Test", "test@test.com", "short"))
        .rejects.toThrow("Password must be between 10 and 255 characters");
    });

    it("keeps the new account but reports verification delivery failure without creating a session", async () => {
      sendMock.mockRejectedValue(new Error("private transport details"));
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql === "SELECT id FROM users WHERE lower(email) = $1") return { rows: [] };
        if (sql.includes("SELECT id, email, email_verified_at FROM users")) return { rows: [{ id: "usr-new", email: "new@test.com", email_verified_at: null }] };
        if (sql.includes("INSERT INTO email_verification_tokens")) return { rows: [{ id: "token-row-new" }] };
        return { rows: [] };
      });

      const result = await registerAction("New User", "New@Test.com", "Password123");
      expect(result).toMatchObject({ id: expect.stringMatching(/^usr-/), verificationEmailSent: false });
      expect(createSessionMock).not.toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SET delivery_status = 'failed'"), ["token-row-new"]);
    });
  });

  describe("login", () => {
    it("rejects missing passwords", async () => {
      // @ts-expect-error Testing an omitted required argument.
      await expect(loginAction("test@test.com")).rejects.toThrow("Password is required");
    });

    it("does not reveal whether an account exists when the user lookup misses", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(loginAction("test@test.com", "Password123"))
        .rejects.toThrow("Invalid credentials or user not found.");
      expect(hashPasswordMock).toHaveBeenCalled();
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("rejects an unverified account only after the correct password is proven", async () => {
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql.includes("SELECT * FROM users")) return { rows: [{ id: "usr-1", email: "test@test.com", email_verified_at: null }] };
        if (sql.includes("SELECT * FROM user_credentials")) return { rows: [{ user_id: "usr-1", password_hash: "valid", params: {}, locked_until: null }] };
        return { rows: [] };
      });

      await expect(loginAction("test@test.com", "Password123"))
        .rejects.toThrow("Email must be verified before logging in.");
      expect(verifyPasswordMock).toHaveBeenCalledOnce();
      expect(createSessionMock).not.toHaveBeenCalled();
    });


    it("still rejects a credential that is inside the account lockout window", async () => {
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql.includes("SELECT * FROM users")) return { rows: [{ id: "usr-locked", email: "locked@test.com", email_verified_at: null }] };
        if (sql.includes("SELECT * FROM user_credentials")) {
          return { rows: [{ user_id: "usr-locked", password_hash: "valid", params: {}, locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() }] };
        }
        return { rows: [] };
      });

      await expect(loginAction("locked@test.com", "Password123"))
        .rejects.toThrow("Account is temporarily locked");
      expect(verifyPasswordMock).not.toHaveBeenCalled();
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("continues to create a session for a verified account with valid credentials", async () => {
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql.includes("SELECT * FROM users")) return { rows: [{ id: "usr-1", email: "test@test.com", name: "Test", email_verified_at: new Date() }] };
        if (sql.includes("SELECT * FROM user_credentials")) return { rows: [{ user_id: "usr-1", password_hash: "valid", params: {}, locked_until: null }] };
        if (sql.includes("FROM organization_members m")) return { rows: [{ workspaceId: "org-1", role: "workspace_admin" }] };
        return { rows: [] };
      });

      await expect(loginAction("test@test.com", "Password123")).resolves.toMatchObject({ id: "usr-1", workspaceId: "org-1" });
      expect(createSessionMock).toHaveBeenCalledOnce();
    });
  });

  describe("email verification delivery", () => {
    it("preserves enumeration-safe success for an unknown email", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(requestVerification("missing@test.com")).resolves.toEqual({ success: true });
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("stores only a hash and marks the token sent only after successful delivery", async () => {
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql.includes("SELECT id, email, email_verified_at")) return { rows: [{ id: "usr-1", email: "test@test.com", email_verified_at: null }] };
        if (sql.includes("INSERT INTO email_verification_tokens")) return { rows: [{ id: "token-row-1" }] };
        if (sql.includes("SET delivery_status = 'sent'")) return { rows: [{ id: "token-row-1" }] };
        return { rows: [] };
      });

      await expect(requestVerification("Test@Test.com")).resolves.toEqual({ success: true });
      expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
        to: "test@test.com",
        templateId: "verification",
        params: { url: expect.stringMatching(/^https:\/\/oxenn\.example\/en\/verify-email\?token=[a-f0-9]{64}$/) },
      }));
      const insert = queryMock.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO email_verification_tokens"));
      expect(insert).toBeDefined();
      if (!insert) throw new Error("Verification token insert was not recorded.");
      expect(insert[1][1]).toMatch(/^[a-f0-9]{64}$/);
      expect(insert[1][1]).not.toBe(sendMock.mock.calls[0][0].params.url.split("token=")[1]);
      expect(insert[0]).toContain("email_snapshot");
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SET delivery_status = 'sent'"), ["token-row-1", "usr-1", "test@test.com"]);
      expect(queryMock.mock.calls.find(([sql]) => String(sql).includes("SET delivery_status = 'sent'"))?.[0]).toContain("NOT EXISTS");
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("TOKEN_SUPERSEDED"), ["usr-1", "token-row-1"]);
    });

    it("persists failed delivery but keeps the public resend response enumeration-safe", async () => {
      sendMock.mockRejectedValue(new Error("smtp secret must not be logged"));
      queryMock.mockImplementation(async (sql: string) => {
        if (sql.includes("INSERT INTO auth_rate_limits")) return { rows: [{ attempts: 1 }] };
        if (sql.includes("SELECT id, email, email_verified_at")) return { rows: [{ id: "usr-1", email: "test@test.com", email_verified_at: null }] };
        if (sql.includes("INSERT INTO email_verification_tokens")) return { rows: [{ id: "token-row-1" }] };
        return { rows: [] };
      });

      await expect(requestVerification("test@test.com")).resolves.toEqual({ success: true });
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SET delivery_status = 'failed'"), ["token-row-1"]);
      expect(queryMock).not.toHaveBeenCalledWith(expect.stringContaining("SET delivery_status = 'sent'"), expect.anything());
      expect(queryMock).not.toHaveBeenCalledWith(expect.stringContaining("TOKEN_SUPERSEDED"), expect.anything());
    });
  });

  describe("verification token consumption", () => {
    it("rejects malformed tokens without touching the database", async () => {
      await expect(verifyEmailAction("token123")).rejects.toThrow("Invalid or expired token");
      expect(queryMock).not.toHaveBeenCalled();
    });

    it("requires a sent token tied to the current user email and revokes existing sessions", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ id: "token-row-1", userId: "usr-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "token-row-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-1" }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(verifyEmailAction("a".repeat(64))).resolves.toEqual({ success: true });
      expect(queryMock.mock.calls[0][0]).toContain("delivery_status = 'sent'");
      expect(queryMock.mock.calls[0][0]).toContain("lower(t.email_snapshot) = lower(u.email)");
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("UPDATE sessions"), ["usr-1"]);
    });

    it("does not continue to session revocation when the account cannot be marked verified", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ id: "token-row-1", userId: "usr-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "token-row-1" }] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(verifyEmailAction("b".repeat(64))).rejects.toThrow("Unable to verify the account email.");
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), ["usr-1"]);
      expect(queryMock).not.toHaveBeenCalledWith(expect.stringContaining("UPDATE sessions"), expect.anything());
    });
  });

  describe("password reset", () => {
    it("preserves enumeration-safe success for an unknown address", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(requestPasswordReset("missing@test.com")).resolves.toEqual({ success: true });
    });

    it("consumes a reset token and revokes all sessions after password change", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ user_id: "usr-1" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(confirmPasswordReset("token123", "NewPassword123!"))
        .resolves.toEqual({ success: true });
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("UPDATE user_credentials"), expect.any(Array));
      expect(revokeAllMock).toHaveBeenCalledWith("usr-1");
    });
  });
});
