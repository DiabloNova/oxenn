import nodemailer from "nodemailer";
import type { EmailSender, EmailSenderParams } from "./index";

export class DevEmailSender implements EmailSender {
  async send({ to, templateId, params }: EmailSenderParams): Promise<void> {
    if (templateId === "workspace_invitation") {
      throw new Error("Workspace invitation emails are disabled until the invitation acceptance route is implemented.");
    }
    console.log("================== DEV EMAIL SENT ==================");
    console.log(`To: ${to}`);
    console.log(`Template: ${templateId}`);
    console.log("Params:", JSON.stringify(params, null, 2));
    if (params.url) {
      console.log(`Link: ${params.url}`);
    }
    console.log("====================================================");
  }
}

export class CaptureEmailSender implements EmailSender {
  public static capturedEmails: EmailSenderParams[] = [];

  static clear() {
    this.capturedEmails = [];
  }

  async send(params: EmailSenderParams): Promise<void> {
    CaptureEmailSender.capturedEmails.push(params);
  }
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function resolveTemplate(params: EmailSenderParams): { subject: string; intro: string; actionLabel: string; context: string } {
  switch (params.templateId) {
    case "verification":
      return {
        subject: "Verify your Oxenn email address",
        intro: "Confirm that you control this email address to activate your Oxenn account.",
        actionLabel: "Verify email address",
        context: "This link expires in one hour and can only be used once.",
      };
    case "password_reset":
      return {
        subject: "Reset your Oxenn password",
        intro: "A password reset was requested for your Oxenn account.",
        actionLabel: "Reset password",
        context: "If you did not request this change, you can ignore this email. This link expires in one hour.",
      };
    case "workspace_invitation":
      throw new Error("Workspace invitation emails are disabled until the invitation acceptance route is implemented.");
    default:
      throw new Error("Unsupported email template.");
  }
}

export class ProductionEmailSender implements EmailSender {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;
  private readonly from: string | { name: string; address: string };

  constructor() {
    if (process.env.EMAIL_PROVIDER?.trim().toLowerCase() !== "smtp") {
      throw new Error("EMAIL_PROVIDER must be set to 'smtp' in production.");
    }

    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT);
    const fromAddress = process.env.EMAIL_FROM?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS;

    if (!host || /\s|:\/\//.test(host)) {
      throw new Error("SMTP_HOST must be configured with a hostname.");
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("SMTP_PORT must be a valid TCP port.");
    }
    if (!fromAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
      throw new Error("EMAIL_FROM must be a valid sender email address.");
    }
    if (Boolean(smtpUser) !== Boolean(smtpPass)) {
      throw new Error("SMTP_USER and SMTP_PASS must either both be set or both be empty.");
    }

    const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
    if (secureSetting && secureSetting !== "true" && secureSetting !== "false") {
      throw new Error("SMTP_SECURE must be either 'true' or 'false'.");
    }
    const secure = secureSetting ? secureSetting === "true" : port === 465;
    if (port === 465 && !secure) {
      throw new Error("SMTP port 465 requires implicit TLS (SMTP_SECURE=true).");
    }

    const fromName = process.env.EMAIL_FROM_NAME?.trim().replace(/[\r\n]+/g, " ").slice(0, 100);
    this.from = fromName ? { name: fromName, address: fromAddress } : fromAddress;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(params: EmailSenderParams): Promise<void> {
    const actionUrl = params.params.url?.trim();
    if (!actionUrl) {
      throw new Error("Email template requires an action URL.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(actionUrl);
    } catch {
      throw new Error("Email action URL is invalid.");
    }
    if (
      (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") ||
      parsedUrl.username ||
      parsedUrl.password ||
      (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:")
    ) {
      throw new Error("Email action URL must be a safe HTTPS URL in production.");
    }

    if (process.env.NODE_ENV === "production") {
      const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
      if (!configuredAppUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL is required for production email delivery.");
      }
      let configuredOrigin: URL;
      try {
        configuredOrigin = new URL(configuredAppUrl);
      } catch {
        throw new Error("NEXT_PUBLIC_APP_URL must be a valid HTTPS origin.");
      }
      if (
        configuredOrigin.protocol !== "https:" ||
        configuredOrigin.pathname !== "/" ||
        configuredOrigin.username ||
        configuredOrigin.password ||
        configuredOrigin.search ||
        configuredOrigin.hash ||
        parsedUrl.origin !== configuredOrigin.origin
      ) {
        throw new Error("Email action URL must use the configured application origin.");
      }
    }

    const template = resolveTemplate(params);
    const safeIntro = escapeHtml(template.intro);
    const safeContext = escapeHtml(template.context);
    const safeActionUrl = escapeHtml(actionUrl);
    const safeActionLabel = escapeHtml(template.actionLabel);
    const text = `${template.intro}\n\n${template.actionLabel}: ${actionUrl}\n\n${template.context}`;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><main style="max-width:560px;margin:32px auto;padding:24px"><h1 style="font-size:22px">Oxenn</h1><p>${safeIntro}</p><p><a href="${safeActionUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">${safeActionLabel}</a></p><p style="font-size:13px;color:#586174">${safeContext}</p></main></body></html>`;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: template.subject.replace(/[\r\n]/g, " ").slice(0, 255),
        text,
        html,
      });
      if (!Array.isArray(info.accepted) || info.accepted.length === 0) {
        throw new Error("SMTP server did not accept the recipient.");
      }
    } catch {
      // Do not leak transport diagnostics, credentials, tokens, or recipient data to callers/logs.
      throw new Error("Email delivery failed.");
    }
  }
}

let mockSender: EmailSender | null = null;

export function setMockEmailSender(sender: EmailSender | null) {
  mockSender = sender;
}

export function getEmailSender(): EmailSender {
  if (mockSender) {
    return mockSender;
  }

  if (process.env.NODE_ENV === "test") {
    return new CaptureEmailSender();
  }

  if (process.env.NODE_ENV === "development") {
    return new DevEmailSender();
  }

  if (process.env.NODE_ENV === "production") {
    return new ProductionEmailSender();
  }

  throw new Error("Unsupported NODE_ENV for email delivery.");
}
