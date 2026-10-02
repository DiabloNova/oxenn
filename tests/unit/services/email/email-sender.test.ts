import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getEmailSender, DevEmailSender, CaptureEmailSender, ProductionEmailSender } from "@/services/email/adapters";

describe("EmailSender Factory", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns CaptureEmailSender in test environment", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
    const sender = getEmailSender();
    expect(sender).toBeInstanceOf(CaptureEmailSender);
  });

  it("returns DevEmailSender in development environment", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
    const sender = getEmailSender();
    expect(sender).toBeInstanceOf(DevEmailSender);
  });

  it("throws error for ProductionEmailSender when EMAIL_PROVIDER is not set", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
    delete process.env.EMAIL_PROVIDER;

    expect(() => getEmailSender()).toThrow("EMAIL_PROVIDER is not configured for production environment");
  });

  it("returns ProductionEmailSender when EMAIL_PROVIDER is set in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
    process.env.EMAIL_PROVIDER = "dummy-provider";

    const sender = getEmailSender();
    expect(sender).toBeInstanceOf(ProductionEmailSender);
  });
});
