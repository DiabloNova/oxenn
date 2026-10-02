import { EmailSender, EmailSenderParams } from "./index";

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
  constructor() {
    if (!process.env.EMAIL_PROVIDER) {
      throw new Error("EMAIL_PROVIDER is not configured for production environment");
    }
    // We would initialize the real provider SDK here (e.g., Resend, SendGrid) based on the env var
  }

  async send(params: EmailSenderParams): Promise<void> {
    throw new Error("EMAIL_PROVIDER not implemented yet. Follow-up required. " + params.to);
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
