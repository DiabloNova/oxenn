import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaptureEmailSender, DevEmailSender, getEmailSender, ProductionEmailSender } from "@/services/email/adapters";

describe("EmailSender factory and Resend adapter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("uses capture delivery in tests", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
    expect(getEmailSender()).toBeInstanceOf(CaptureEmailSender);
  });

  it("uses the console sender in development", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
    expect(getEmailSender()).toBeInstanceOf(DevEmailSender);
  });

  it("fails closed when the Resend API key is missing", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
    process.env.EMAIL_PROVIDER = "resend";
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    expect(() => getEmailSender()).toThrow("RESEND_API_KEY is not configured.");
  });

  it("sends verification codes through the Resend API", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const sender = new ProductionEmailSender();
    await sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { code: "12345678", locale: "en" },
    });

    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-api-key" }),
    }));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toEqual(["user@example.com"]);
    expect(payload.text).toContain("12345678");
  });

  it("rejects verification messages without an eight-digit code", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    const sender = new ProductionEmailSender();
    await expect(sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { code: "123", locale: "en" },
    })).rejects.toThrow("Verification email requires an 8-digit code.");
  });
});
