import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmPasswordReset,
  loginAction,
  registerAction,
  requestPasswordReset,
  requestVerification,
  verifyEmailAction,
  verifyLegacyEmailAction,
} from "@/app/actions/auth";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  createSession: vi.fn(),
  revokeAllForUser: vi.fn(),
  sendEmail: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/services/email/adapters", () => ({
  getEmailSender: () => ({ send: mocks.sendEmail }),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: vi.fn(async (_userId, _purpose, callback) => callback()),
    getDbClient: vi.fn(() => ({ query: mocks.query })),
  },
}));

vi.mock("@/services/auth/session", () => ({
  createSession: (...args: unknown[]) => mocks.createSession(...args),
  invalidateSession: vi.fn(),
  getSession: vi.fn(),
  revokeAllForUser: (...args: unknown[]) => mocks.revokeAllForUser(...args),
}));

vi.mock("@/services/auth/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/passwords")>();
  return {
    ...actual,
    hashPassword: (...args: unknown[]) => mocks.hashPassword(...args),
    verifyPassword: (...args: unknown[]) => mocks.verifyPassword(...args),
  };
});

describe("Authentication Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.createSession.mockReset();
    mocks.revokeAllForUser.mockReset();
    mocks.sendEmail.mockReset();
    mocks.sendEmail.mockResolvedValue(undefined);
    mocks.hashPassword.mockReset();
    mocks.hashPassword.mockResolvedValue({
      hash: "dummy",
      algorithm: "scrypt",
      params: { n: 32768, r: 8, p: 1, keyLength: 64 },
    });
    mocks.verifyPassword.mockResolvedValue(true);
  });

  describe("registerAction", () => {
    it("rejects a password that does not satisfy all requirements", async () => {
      await expect(registerAction("John", "Doe", "john@doe.com", "Password123!", "johndoe", "en"))
        .resolves.toEqual({ errorCode: "INVALID_REGISTRATION" });
    });

    it("returns a duplicate-email error", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration account/IP limit
        .mockResolvedValueOnce({ rows: [{ id: "usr-existing", username: null }] });
      await expect(registerAction("John", "Doe", "john@doe.com", "Password123!!", "johndoe", "en"))
        .resolves.toEqual({ errorCode: "USER_EXISTS" });
    });

    it("keeps the account unverified and exposes delivery failure when the provider rejects the message", async () => {
      mocks.sendEmail.mockRejectedValueOnce(new Error("provider unavailable"));
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration account/IP limit
        .mockResolvedValueOnce({ rows: [] }) // email lookup
        .mockResolvedValueOnce({ rows: [] }) // username lookup
        .mockResolvedValueOnce({ rows: [] }) // insert user
        .mockResolvedValueOnce({ rows: [] }) // insert profile
        .mockResolvedValueOnce({ rows: [] }) // insert credentials
        .mockResolvedValueOnce({ rows: [] }) // insert organization
        .mockResolvedValueOnce({ rows: [] }) // insert membership
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // verification send IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // resend minute limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // resend hour limit
        .mockResolvedValueOnce({ rows: [{ id: "usr-new", email_verified_at: null }] })
        .mockResolvedValueOnce({ rows: [] }) // invalidate previous code
        .mockResolvedValueOnce({ rows: [] }) // insert new digest
        .mockResolvedValueOnce({ rows: [] }); // invalidate undelivered code

      await expect(registerAction("John", "Doe", "john@doe.com", "Password123!!", "johndoe", "en"))
        .resolves.toEqual({ success: true, verificationEmailSent: false });
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.query).toHaveBeenLastCalledWith(
        expect.stringContaining("UPDATE email_verification_tokens"),
        expect.any(Array),
      );
    });

    it("creates user, profile, credentials, workspace and requests verification without creating a session", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // registration account/IP limit
        .mockResolvedValueOnce({ rows: [] }) // email lookup
        .mockResolvedValueOnce({ rows: [] }) // username lookup
        .mockResolvedValueOnce({ rows: [] }) // insert user
        .mockResolvedValueOnce({ rows: [] }) // insert profile
        .mockResolvedValueOnce({ rows: [] }) // insert credentials
        .mockResolvedValueOnce({ rows: [] }) // insert organization
        .mockResolvedValueOnce({ rows: [] }) // insert membership
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // verification send IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // resend minute limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // resend hour limit
        .mockResolvedValueOnce({ rows: [{ id: "usr-new", email_verified_at: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(registerAction("John", "Doe", "john@doe.com", "Password123!!", "johndoe", "en"))
        .resolves.toEqual({ success: true, verificationEmailSent: true });
      expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO user_profiles"), expect.any(Array));
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: "john@doe.com",
        templateId: "verification",
        params: expect.objectContaining({ locale: "en", code: expect.stringMatching(/^\d{8}$/) }),
      }));
    });
  });

  describe("loginAction", () => {
    it("uses a dummy hash for an unknown account", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] })
        .mockResolvedValueOnce({ rows: [] });
      await expect(loginAction("missing@doe.com", "Password123!!"))
        .rejects.toThrow("Invalid credentials or user not found.");
      expect(mocks.hashPassword).toHaveBeenCalled();
    });

    it("blocks login until email verification has been completed", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // account/IP limit
        .mockResolvedValueOnce({ rows: [{ id: "usr-1", email_verified_at: null }] })
        .mockResolvedValueOnce({ rows: [{ user_id: "usr-1", password_hash: "hash", params: {} }] })
        .mockResolvedValueOnce({ rows: [] }) // reset failed attempts
        .mockResolvedValueOnce({ rows: [] }); // clear successful login bucket
      await expect(loginAction("unverified@doe.com", "Password123!!"))
        .rejects.toThrow("EMAIL_NOT_VERIFIED");
    });
  });

  describe("requestVerification", () => {
    it("returns an enumeration-safe response for an unknown address", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // minute limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // hourly limit
        .mockResolvedValueOnce({ rows: [] });
      await expect(requestVerification("missing@doe.com", "en")).resolves.toEqual({ success: true });
    });
  });

  describe("verifyEmailAction", () => {
    it("consumes the matching code, marks the user verified and creates a session", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // IP attempt limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // account/IP attempt limit
        .mockResolvedValueOnce({ rows: [{ user_id: "usr-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-1", name: "John Doe", email: "john@doe.com" }] })
        .mockResolvedValueOnce({ rows: [{ workspaceId: "org-1", role: "workspace_admin", username: "johndoe" }] });
      await expect(verifyEmailAction("john@doe.com", "12345678"))
        .resolves.toEqual({ success: true, sessionCreated: true });
      expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE users"), expect.any(Array));
      expect(mocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
        id: "usr-1", username: "johndoe", workspaceId: "org-1",
      }));
    });
  });

  describe("legacy email verification links", () => {
    it("consumes a valid legacy link once and creates a session", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ user_id: "usr-legacy" }] })
        .mockResolvedValueOnce({ rows: [{ id: "usr-legacy", name: "Legacy User", email: "legacy@doe.com" }] })
        .mockResolvedValueOnce({ rows: [{ workspaceId: "org-legacy", role: "workspace_admin", username: "legacy" }] });

      await expect(verifyLegacyEmailAction("a".repeat(64)))
        .resolves.toEqual({ success: true, sessionCreated: true });
      expect(mocks.query).toHaveBeenCalledWith(
        expect.stringContaining("users.deleted_at IS NULL"),
        expect.any(Array),
      );
      expect(mocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
        id: "usr-legacy", email: "legacy@doe.com", workspaceId: "org-legacy",
      }));
    });

    it("rejects malformed, expired, or already-consumed legacy links without creating a session", async () => {
      await expect(verifyLegacyEmailAction("not-a-legacy-token"))
        .resolves.toEqual({ success: false, sessionCreated: false });
      expect(mocks.query).not.toHaveBeenCalled();

      mocks.query.mockResolvedValueOnce({ rows: [] });
      await expect(verifyLegacyEmailAction("b".repeat(64)))
        .resolves.toEqual({ success: false, sessionCreated: false });
      expect(mocks.createSession).not.toHaveBeenCalled();
    });
  });

  it("rejects expired or previously consumed 8-digit verification codes", async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // IP attempt limit
      .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // account/IP attempt limit
      .mockResolvedValueOnce({ rows: [] }); // no active token (expired, consumed or wrong)

    await expect(verifyEmailAction("john@doe.com", "12345678"))
      .resolves.toEqual({ success: false, sessionCreated: false });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  describe("password recovery", () => {
    it("returns success for an unknown address without revealing account existence", async () => {
      mocks.query
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // IP limit
        .mockResolvedValueOnce({ rows: [{ attempts: 1 }] }) // account/IP limit
        .mockResolvedValueOnce({ rows: [] });
      await expect(requestPasswordReset("missing@doe.com")).resolves.toEqual({ success: true });
    });

    it("updates credentials and revokes old sessions after a valid reset token", async () => {
      mocks.query.mockResolvedValueOnce({ rows: [{ user_id: "usr-1" }] }).mockResolvedValueOnce({ rows: [] });
      await expect(confirmPasswordReset("a".repeat(64), "NewPassword123!!")).resolves.toEqual({ success: true });
      expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE user_credentials"), expect.any(Array));
      expect(mocks.revokeAllForUser).toHaveBeenCalledWith("usr-1");
    });
  });
});
