export interface EmailSenderParams {
  to: string;
  templateId: "verification" | "password_reset" | "workspace_invitation";
  params: Record<string, string>;
}

export interface EmailSender {
  send(params: EmailSenderParams): Promise<void>;
}

export * from "./adapters";
