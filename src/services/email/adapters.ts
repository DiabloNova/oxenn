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
  private readonly apiKey: string;
  private readonly from: string;

  constructor() {
    if ((process.env.EMAIL_PROVIDER ?? "").toLowerCase() !== "resend") throw new Error("EMAIL_PROVIDER must be set to resend in production.");
    this.apiKey = process.env.RESEND_API_KEY ?? "";
    const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "";
    const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Oxenn";
    if (!this.apiKey) throw new Error("RESEND_API_KEY is not configured.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) throw new Error("EMAIL_FROM_ADDRESS must be a valid address on a verified sending domain.");
    this.from = `${fromName.replace(/[<>\r\n]/g, "")} <${fromAddress}>`;
  }

  async send({ to, templateId, params }: EmailSenderParams): Promise<void> {
    const locale = params.locale === "fa" ? "fa" : "en";
    const verification = templateId === "verification";
    const subject = verification ? (locale === "fa" ? "کد تأیید ایمیل Oxenn" : "Your Oxenn email verification code") : templateId === "password_reset" ? (locale === "fa" ? "بازیابی رمز عبور Oxenn" : "Reset your Oxenn password") : (locale === "fa" ? "دعوت‌نامه فضای کاری Oxenn" : "Your Oxenn workspace invitation");
    let text: string;
    let html: string;
    if (verification) {
      const code = escapeHtml(params.code ?? "");
      if (!/^\d{8}$/.test(params.code ?? "")) throw new Error("Verification email requires an 8-digit code.");
      text = locale === "fa" ? `کد تأیید ایمیل شما: ${params.code}\nاین کد تا ۱۵ دقیقه معتبر است. اگر شما این درخواست را نداده‌اید، این پیام را نادیده بگیرید.` : `Your Oxenn verification code is ${params.code}. It expires in 15 minutes. If you did not request this, ignore this email.`;
      html = locale === "fa" ? `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>تأیید ایمیل</h2><p>برای تکمیل ثبت‌نام، کد زیر را در Oxenn وارد کنید:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${code}</div><p>این کد تا ۱۵ دقیقه معتبر است.</p></div>` : `<div style="font-family:Arial,sans-serif;line-height:1.8"><h2>Verify your email</h2><p>Enter this code in Oxenn to finish creating your account:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px;background:#f3f4f6;text-align:center">${code}</div><p>This code expires in 15 minutes.</p></div>`;
    } else {
      const url = escapeHtml(params.url ?? "");
      if (!params.url || !/^https:\/\//i.test(params.url)) throw new Error("Email action requires an HTTPS URL.");
      const action = templateId === "password_reset" ? (locale === "fa" ? "بازیابی رمز عبور" : "Reset password") : (locale === "fa" ? "پذیرفتن دعوت‌نامه" : "Accept invitation");
      text = `${action}: ${params.url}`;
      html = `<div style="font-family:Arial,sans-serif;line-height:1.8"><h2>${escapeHtml(subject)}</h2><p><a href="${url}">${escapeHtml(action)}</a></p></div>`;
    }
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: this.from, to: [to], subject, html, text }), signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Resend email delivery failed with HTTP ${response.status}.`);
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
