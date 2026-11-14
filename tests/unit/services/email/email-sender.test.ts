import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

import {
  getEmailSender,
  DevEmailSender,
  CaptureEmailSender,
  ProductionEmailSender,
} from "@/services/email/adapters";

describe("EmailSender factory and SMTP adapter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });
    sendMailMock.mockResolvedValue({ accepted: ["user@example.com"], rejected: [] });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function configureProduction() {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_PROVIDER = "smtp";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.EMAIL_FROM = "no-reply@example.com";
    process.env.EMAIL_FROM_NAME = "Oxenn";
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  }

  it("returns the capture sender in tests", () => {
    process.env.NODE_ENV = "test";
    expect(getEmailSender()).toBeInstanceOf(CaptureEmailSender);
  });

  it("returns the development sender only in development", () => {
    process.env.NODE_ENV = "development";
    expect(getEmailSender()).toBeInstanceOf(DevEmailSender);
  });

  it("does not log an invitation token in development while the acceptance route is absent", async () => {
    process.env.NODE_ENV = "development";
    const sender = getEmailSender();
    await expect(sender.send({
      to: "user@example.com",
      templateId: "workspace_invitation",
      params: { url: "https://oxenn.example/en/accept-invite?token=secret" },
    })).rejects.toThrow("Workspace invitation emails are disabled until the invitation acceptance route is implemented.");
  });

  it("rejects a missing or unsupported production provider", () => {
    configureProduction();
    delete process.env.EMAIL_PROVIDER;
    expect(() => getEmailSender()).toThrow("EMAIL_PROVIDER must be set to 'smtp' in production.");
    process.env.EMAIL_PROVIDER = "dummy-provider";
    expect(() => getEmailSender()).toThrow("EMAIL_PROVIDER must be set to 'smtp' in production.");
  });

  it("rejects incomplete or invalid SMTP configuration before creating a transport", () => {
    configureProduction();
    delete process.env.SMTP_HOST;
    expect(() => getEmailSender()).toThrow("SMTP_HOST must be configured");
    expect(createTransportMock).not.toHaveBeenCalled();

    configureProduction();
    process.env.SMTP_PORT = "70000";
    expect(() => getEmailSender()).toThrow("SMTP_PORT must be a valid TCP port");

    configureProduction();
    process.env.EMAIL_FROM = "not-an-email";
    expect(() => getEmailSender()).toThrow("EMAIL_FROM must be a valid sender email address");

    configureProduction();
    process.env.SMTP_USER = "user";
    expect(() => getEmailSender()).toThrow("SMTP_USER and SMTP_PASS must either both be set or both be empty");
  });

  it("requires implicit TLS on port 465", () => {
    configureProduction();
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "false";
    expect(() => getEmailSender()).toThrow("SMTP port 465 requires implicit TLS");
  });

  it("creates a TLS-enforced SMTP transport and sends a verification template", async () => {
    configureProduction();
    const sender = getEmailSender();
    expect(sender).toBeInstanceOf(ProductionEmailSender);
    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { minVersion: "TLSv1.2" },
    }));

    await sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { url: "https://oxenn.example/en/verify-email?token=abc" },
    });

    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      from: { name: "Oxenn", address: "no-reply@example.com" },
      to: "user@example.com",
      subject: "Verify your Oxenn email address",
      text: expect.stringContaining("https://oxenn.example/en/verify-email?token=abc"),
      html: expect.stringContaining("Verify email address"),
    }));
  });

  it("fails closed for workspace invitation email until its acceptance route exists", async () => {
    configureProduction();
    const sender = getEmailSender();
    await expect(sender.send({
      to: "user@example.com",
      templateId: "workspace_invitation",
      params: {
        workspaceName: "Example workspace",
        inviterName: "Workspace admin",
        url: "https://oxenn.example/en/accept-invite?token=abc",
      },
    })).rejects.toThrow("Workspace invitation emails are disabled until the invitation acceptance route is implemented.");
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects unsafe or external email action URLs", async () => {
    configureProduction();
    const sender = getEmailSender();
    await expect(sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { url: "http://evil.example/token" },
    })).rejects.toThrow("Email action URL must be a safe HTTPS URL in production");
    await expect(sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { url: "https://evil.example/token" },
    })).rejects.toThrow("Email action URL must use the configured application origin");
  });

  it("does not expose provider diagnostics when SMTP delivery fails", async () => {
    configureProduction();
    sendMailMock.mockRejectedValue(new Error("private smtp credential detail"));
    const sender = getEmailSender();
    await expect(sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { url: "https://oxenn.example/verify?token=abc" },
    })).rejects.toThrow("Email delivery failed.");
  });
});
