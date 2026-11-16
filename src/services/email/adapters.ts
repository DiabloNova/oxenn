import { EmailSender, EmailSenderParams } from "./index";

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

export class DevEmailSender implements EmailSender {
  async send({ to, templateId, params }: EmailSenderParams): Promise<void> {
    console.log("================== DEV EMAIL SENT ==================");
    console.log(`To: ${to}`);
    console.log(`Template: ${templateId}`);
    if (params.code) console.log(`Verification code: ${params.code}`);
    if (params.url) console.log(`Link: ${params.url}`);
    console.log("====================================================");
  }
}

export class CaptureEmailSender implements EmailSender {
  public static capturedEmails: EmailSenderParams[] = [];
  static clear() { this.capturedEmails = []; }
  async send(params: EmailSenderParams): Promise<void> { CaptureEmailSender.capturedEmails.push(params); }
}

export class ProductionEmailSender implements EmailSender {
  private readonly provider: "maileroo" | "resend";
  private readonly apiKey: string;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor() {
    const provider = (process.env.EMAIL_PROVIDER ?? "maileroo").toLowerCase();
    if (provider !== "maileroo" && provider !== "resend") {
      throw new Error("EMAIL_PROVIDER must be set to maileroo or resend in production.");
    }
    this.provider = provider;
    this.apiKey = provider === "maileroo" ? process.env.MAILEROO_API_KEY ?? "" : process.env.RESEND_API_KEY ?? "";
    if (!this.apiKey) throw new Error(`${provider === "maileroo" ? "MAILEROO_API_KEY" : "RESEND_API_KEY"} is not configured.`);
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.fromAddress)) {
      throw new Error("EMAIL_FROM_ADDRESS must be a valid address on a verified sending domain.");
    }
    this.fromName = (process.env.EMAIL_FROM_NAME?.trim() || "Oxenn").replace(/[<>\r\n]/g, "") || "Oxenn";
  }

  async send({ to, templateId, params }: EmailSenderParams): Promise<void> {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("A valid recipient email address is required.");
    const locale = params.locale === "fa" ? "fa" : "en";
    const verification = templateId === "verification";
    const subject = verification
      ? (locale === "fa" ? "کد تأیید ایمیل Oxenn" : "Your Oxenn email verification code")
      : templateId === "password_reset"
        ? (locale === "fa" ? "بازیابی رمز عبور Oxenn" : "Reset your Oxenn password")
        : (locale === "fa" ? "دعوت‌نامه فضای کاری Oxenn" : "Your Oxenn workspace invitation");

    let plain: string;
    let html: string;
    if (verification) {
      const rawCode = params.code ?? "";
      if (!/^\d{8}$/.test(rawCode)) throw new Error("Verification email requires an 8-digit code.");
      const code = escapeHtml(rawCode);
      plain = locale === "fa"
        ? `کد تأیید ایمیل شما: ${rawCode}\nاین کد تا ۱۵ دقیقه معتبر است. اگر شما این درخواست را نداده‌اید، این پیام را نادیده بگیرید.`
        : `Your Oxenn verification code is ${rawCode}. It expires in 15 minutes. If you did not request this, ignore this email.`;
      html = locale === "fa"
        ? `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تأیید ایمیل</h2><p>برای تکمیل ثبت‌نام، کد زیر را در Oxenn وارد کنید:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${code}</div><p>این کد تا ۱۵ دقیقه معتبر است.</p></div>`
        : `<div style="font-family:Arial,sans-serif;line-height:1.8"><h2>Verify your email</h2><p>Enter this code in Oxenn to finish creating your account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${code}</div><p>This code expires in 15 minutes.</p></div>`;
    } else {
      let actionUrl: URL;
      try { actionUrl = new URL(params.url ?? ""); }
      catch { throw new Error("Email action requires a valid HTTPS URL."); }
      if (actionUrl.protocol !== "https:") throw new Error("Email action requires an HTTPS URL.");
      const action = templateId === "password_reset"
        ? (locale === "fa" ? "بازیابی رمز عبور" : "Reset password")
        : (locale === "fa" ? "پذیرفتن دعوت‌نامه" : "Accept invitation");
      const workspaceName = params.workspaceName?.replace(/\\s+/g, " ").trim() || (locale === "fa" ? "فضای کاری شما" : "your workspace");
      const inviterName = params.inviterName?.replace(/\\s+/g, " ").trim() || (locale === "fa" ? "یکی از مدیران فضای کاری" : "a workspace administrator");
      const isInvitation = templateId === "workspace_invitation";
      const context = isInvitation
        ? (locale === "fa" ? "فضای کاری: " + workspaceName + String.fromCharCode(10) + "دعوت‌کننده: " + inviterName : "Workspace: " + workspaceName + String.fromCharCode(10) + "Invited by: " + inviterName)
        : "";
      plain = [action, context, actionUrl.toString()].filter(Boolean).join(String.fromCharCode(10));
      html = "<div style=\"font-family:Arial,sans-serif;line-height:1.8\"><h2>" + escapeHtml(subject) + "</h2>" +
        (isInvitation ? "<p>" + (locale === "fa" ? "فضای کاری:" : "Workspace:") + " <strong>" + escapeHtml(workspaceName) + "</strong></p><p>" + (locale === "fa" ? "دعوت‌کننده:" : "Invited by:") + " " + escapeHtml(inviterName) + "</p>" : "") +
        "<p><a href=\"" + escapeHtml(actionUrl.toString()) + "\">" + escapeHtml(action) + "</a></p></div>";
    }

    let response: Response;
    if (this.provider === "maileroo") {
      // Use Maileroo's current versioned Email API. Sending keys authenticate
      // with X-Api-Key and the endpoint expects JSON EmailObject recipients.
      const payload = {
        from: { address: this.fromAddress, display_name: this.fromName },
        to: [{ address: to }],
        subject,
        plain,
        html,
      };
      response = await fetch("https://smtp.maileroo.com/api/v2/emails", {
        method: "POST",
        headers: { "X-Api-Key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
    } else {
      const slash = String.fromCharCode(92);
      const quote = String.fromCharCode(34);
      const quotedFromName = this.fromName.split(slash).join(slash + slash).split(quote).join(slash + quote);
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: quote + quotedFromName + quote + " <" + this.fromAddress + ">", to: [to], subject, html, text: plain }),
        signal: AbortSignal.timeout(10_000),
      });
    }
    if (!response.ok) throw new Error(`${this.provider} email delivery failed with HTTP ${response.status}.`);
    if (this.provider === "maileroo") {
      let result: unknown;
      try { result = await response.json(); }
      catch { throw new Error("Maileroo returned an invalid email API response."); }
      if (!result || typeof result !== "object" || (result as { success?: unknown }).success !== true) {
        throw new Error("Maileroo did not accept the email for delivery.");
      }
    }
  }
}

let mockSender: EmailSender | null = null;
export function setMockEmailSender(sender: EmailSender | null) { mockSender = sender; }
export function getEmailSender(): EmailSender {
  if (mockSender) return mockSender;
  if (process.env.NODE_ENV === "test") return new CaptureEmailSender();
  if (process.env.NODE_ENV === "production") return new ProductionEmailSender();
  return new DevEmailSender();
}
