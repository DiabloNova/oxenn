import { EmailSender, EmailSenderParams } from "./index";

const MAILEROO_EMAIL_API_URL = "https://smtp.maileroo.com/api/v2/emails";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function buildEmailContent({ templateId, params }: EmailSenderParams): {
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
} {
  switch (templateId) {
    case "verification":
      return {
        subject: "Verify your Oxenn email address",
        heading: "Verify your email address",
        message: "Confirm your email address to finish setting up your Oxenn account.",
        actionLabel: "Verify email address",
      };
    case "password_reset":
      return {
        subject: "Reset your Oxenn password",
        heading: "Reset your password",
        message: "We received a request to reset your Oxenn password. If you did not make this request, you can ignore this email.",
        actionLabel: "Reset password",
      };
    case "workspace_invitation":
      return {
        subject: "You have been invited to Oxenn",
        heading: "You have a workspace invitation",
        message: params.workspaceName
          ? `You have been invited to join the ${params.workspaceName} workspace on Oxenn.`
          : "You have been invited to join a workspace on Oxenn.",
        actionLabel: "Accept invitation",
      };
  }
}

export class DevEmailSender implements EmailSender {
  async send({ to, templateId, params }: EmailSenderParams): Promise<void> {
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

export class ProductionEmailSender implements EmailSender {
  private readonly sendingKey: string;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor() {
    if (process.env.EMAIL_PROVIDER !== "maileroo") {
      throw new Error('EMAIL_PROVIDER must be set to "maileroo" in production');
    }

    const sendingKey = process.env.MAILEROO_SENDING_KEY?.trim();
    const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim() || "noreply@oxenn.ir";
    const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Oxenn";

    if (!sendingKey) {
      throw new Error("MAILEROO_SENDING_KEY is not configured");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
      throw new Error("EMAIL_FROM_ADDRESS must be a valid email address");
    }

    this.sendingKey = sendingKey;
    this.fromAddress = fromAddress;
    this.fromName = fromName;
  }

  async send(email: EmailSenderParams): Promise<void> {
    if (!email.params.url) {
      throw new Error("Email action URL is required");
    }

    const content = buildEmailContent(email);
    const safeUrl = escapeHtml(email.params.url);
    const safeHeading = escapeHtml(content.heading);
    const safeMessage = escapeHtml(content.message);
    const safeActionLabel = escapeHtml(content.actionLabel);

    const html = [
      '<!doctype html>',
      '<html lang="en">',
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>',
      '<body style="margin:0;padding:32px 16px;background:#f6f7f9;font-family:Arial,sans-serif;color:#172033;">',
      '<main style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;">',
      '<p style="margin:0 0 24px;font-size:18px;font-weight:700;">Oxenn</p>',
      `<h1 style="font-size:24px;line-height:1.3;">${safeHeading}</h1>`,
      `<p style="font-size:16px;line-height:1.6;">${safeMessage}</p>`,
      `<p style="margin:28px 0;"><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#3157d5;color:#ffffff;text-decoration:none;border-radius:6px;">${safeActionLabel}</a></p>`,
      '<p style="font-size:13px;line-height:1.5;color:#647084;">If the button does not work, copy and paste the link into your browser.</p>',
      `<p style="font-size:13px;line-height:1.5;overflow-wrap:anywhere;">${safeUrl}</p>`,
      '</main></body></html>',
    ].join("");

    const plain = [
      content.heading,
      "",
      content.message,
      "",
      `${content.actionLabel}: ${email.params.url}`,
      "",
      "If you did not request this action, you can ignore this email.",
    ].join("\n");

    const response = await fetch(MAILEROO_EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.sendingKey,
      },
      body: JSON.stringify({
        from: { address: this.fromAddress, display_name: this.fromName },
        to: { address: email.to },
        subject: content.subject,
        html,
        plain,
        tracking: false,
        tags: { category: "authentication", template: email.templateId },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    let result: { success?: boolean } | null = null;
    try {
      result = (await response.json()) as { success?: boolean };
    } catch {
      // A non-JSON provider response is treated as a failed delivery below.
    }

    if (!response.ok || result?.success !== true) {
      // Never include provider response bodies or credentials in thrown errors/logs.
      throw new Error(`Maileroo email delivery failed (HTTP ${response.status})`);
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

  if (process.env.NODE_ENV === "production") {
    return new ProductionEmailSender();
  }

  return new DevEmailSender();
}
