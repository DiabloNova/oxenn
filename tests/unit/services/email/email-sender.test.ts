import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaptureEmailSender, DevEmailSender, getEmailSender, ProductionEmailSender } from "@/services/email/adapters";

describe("EmailSender factory and transactional email adapters", () => {
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
  it("defaults production delivery to Maileroo and fails closed without its API key", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
    delete process.env.EMAIL_PROVIDER;
    delete process.env.MAILEROO_API_KEY;
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    expect(() => getEmailSender()).toThrow("MAILEROO_API_KEY is not configured.");
  });

  it("sends verification email through the documented Maileroo API contract", async () => {
    process.env.EMAIL_PROVIDER = "maileroo";
    process.env.MAILEROO_API_KEY = "test-maileroo-key";
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    process.env.EMAIL_FROM_NAME = "Oxenn";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const sender = new ProductionEmailSender();
    await sender.send({ to: "user@example.com", templateId: "verification", params: { code: "12345678", locale: "en" } });

    expect(fetchMock).toHaveBeenCalledWith("https://smtp.maileroo.com/api/v2/emails", expect.objectContaining({
      method: "POST",
      headers: { "X-Api-Key": "test-maileroo-key", "Content-Type": "application/json" },
      body: expect.any(String),
    }));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.from).toEqual({ address: "accounts@example.com", display_name: "Oxenn" });
    expect(payload.to).toEqual([{ address: "user@example.com" }]);
    expect(payload.plain).toContain("12345678");
    expect(payload.html).toContain("12345678");
  });

  it("rejects a Maileroo API response that does not confirm acceptance", async () => {
    process.env.EMAIL_PROVIDER = "maileroo";
    process.env.MAILEROO_API_KEY = "test-maileroo-key";
    process.env.EMAIL_FROM_ADDRESS = "accounts@example.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: false }) }));
    const sender = new ProductionEmailSender();
    await expect(sender.send({ to: "user@example.com", templateId: "verification", params: { code: "12345678", locale: "en" } }))
      .rejects.toThrow("Maileroo did not accept the email for delivery.");
  });

});
