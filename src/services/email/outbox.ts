import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { TenantContextManager } from "@/core/database/tenant-context";
import type { EmailSenderParams } from "./index";

export type EmailOutboxKind = "verification" | "password_reset";
export interface EmailOutboxPayload extends EmailSenderParams { rawToken: string; }
export interface EmailOutboxRecord {
  id: string;
  user_id: string;
  kind: EmailOutboxKind;
  token_hash: string;
  payload_ciphertext: string;
  payload_iv: string;
  payload_auth_tag: string;
  attempts: number;
}
interface EncryptedPayload { payloadCiphertext: string; payloadIv: string; payloadAuthTag: string; }

export class EmailOutboxConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = "EmailOutboxConfigurationError"; }
}

export const MAX_EMAIL_OUTBOX_ATTEMPTS = 5;
const DISPATCH_BATCH_SIZE = 100;
const STALE_LOCK_MINUTES = 30;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.EMAIL_OUTBOX_ENCRYPTION_KEY?.trim();
  if (!keyHex || !/^[a-f0-9]{64}$/i.test(keyHex)) {
    throw new EmailOutboxConfigurationError("EMAIL_OUTBOX_ENCRYPTION_KEY must be configured as 64 hexadecimal characters");
  }
  return Buffer.from(keyHex, "hex");
}
export function assertEmailOutboxEncryptionConfigured(): void { getEncryptionKey(); }

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function isValidPayload(value: unknown, kind: EmailOutboxKind): value is EmailOutboxPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const params = candidate.params;
  if (!params || typeof params !== "object") return false;
  const urlValue = (params as Record<string, unknown>).url;
  const expectedTemplate = kind === "verification" ? "verification" : "password_reset";
  const expectedTokenPattern = kind === "verification"
    ? /^[a-f0-9]{64}[.][a-f0-9]{64}$/i
    : /^[a-f0-9]{64}$/i;
  if (
    typeof candidate.to !== "string" || !candidate.to.trim() ||
    candidate.templateId !== expectedTemplate ||
    typeof candidate.rawToken !== "string" ||
    !expectedTokenPattern.test(candidate.rawToken) ||
    typeof urlValue !== "string"
  ) return false;
  try {
    const actionUrl = new URL(urlValue);
    return (actionUrl.protocol === "https:" || actionUrl.protocol === "http:") &&
      actionUrl.searchParams.get("token") === candidate.rawToken;
  } catch {
    return false;
  }
}

export function encryptEmailOutboxPayload(outboxId: string, payload: EmailOutboxPayload): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(outboxId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return {
    payloadCiphertext: ciphertext.toString("base64"),
    payloadIv: iv.toString("base64"),
    payloadAuthTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptEmailOutboxPayload(
  outboxId: string,
  record: Pick<EmailOutboxRecord, "kind" | "token_hash" | "payload_ciphertext" | "payload_iv" | "payload_auth_tag">,
): EmailOutboxPayload {
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(record.payload_iv, "base64"));
  decipher.setAAD(Buffer.from(outboxId, "utf8"));
  decipher.setAuthTag(Buffer.from(record.payload_auth_tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.payload_ciphertext, "base64")), decipher.final(),
  ]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  if (!isValidPayload(parsed, record.kind)) throw new Error("Email outbox payload is invalid");
  const actualTokenHash = crypto.createHash("sha256").update(parsed.rawToken).digest("hex");
  if (!safeEqualHex(actualTokenHash, record.token_hash)) throw new Error("Email outbox token fingerprint does not match");
  return parsed;
}

export async function enqueueEmailOutbox(
  client: PoolClient,
  input: { userId: string; kind: EmailOutboxKind; tokenHash: string; payload: EmailOutboxPayload },
): Promise<string> {
  const actualTokenHash = crypto.createHash("sha256").update(input.payload.rawToken).digest("hex");
  if (!safeEqualHex(actualTokenHash, input.tokenHash) || !isValidPayload(input.payload, input.kind)) {
    throw new Error("Email outbox payload does not match its token");
  }
  const id = crypto.randomUUID();
  const encrypted = encryptEmailOutboxPayload(id, input.payload);
  await client.query(
    `INSERT INTO email_outbox (
       id, user_id, kind, token_hash, payload_ciphertext, payload_iv, payload_auth_tag
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.userId, input.kind, input.tokenHash, encrypted.payloadCiphertext, encrypted.payloadIv, encrypted.payloadAuthTag],
  );
  return id;
}

async function withOutboxSystemClient<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  return TenantContextManager.runWithSystemContext(null, "sys-email-outbox", async () => {
    const client = TenantContextManager.getDbClient() as PoolClient | null;
    if (!client) throw new Error("Failed to get DB client in email outbox system context");
    return work(client);
  });
}

export async function claimEmailOutbox(outboxId: string): Promise<EmailOutboxRecord | null> {
  return withOutboxSystemClient(async (client) => {
    const { rows } = await client.query<EmailOutboxRecord>(
      `UPDATE email_outbox
       SET status = 'processing', attempts = attempts + 1, locked_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND attempts < $2
         AND ((status = 'pending' AND available_at <= NOW())
           OR (status = 'processing' AND locked_at < NOW() - ($3 * INTERVAL '1 minute')))
       RETURNING id, user_id, kind, token_hash, payload_ciphertext, payload_iv, payload_auth_tag, attempts`,
      [outboxId, MAX_EMAIL_OUTBOX_ATTEMPTS, STALE_LOCK_MINUTES],
    );
    return rows[0] ?? null;
  });
}

export async function isEmailOutboxTokenCurrent(
  record: Pick<EmailOutboxRecord, "user_id" | "kind" | "token_hash">,
  payload: EmailOutboxPayload,
): Promise<boolean> {
  return withOutboxSystemClient(async (client) => {
    const tokenTable = record.kind === "verification" ? "email_verification_tokens" : "password_reset_tokens";
    const sql = "SELECT users.email, users.email_verified_at FROM " + tokenTable +
      " AS tokens INNER JOIN users ON users.id = tokens.user_id " +
      "WHERE tokens.user_id = $1 AND tokens.token_hash = $2 " +
      "AND tokens.consumed_at IS NULL AND tokens.expires_at > NOW() " +
      "AND users.deleted_at IS NULL LIMIT 1";
    const { rows } = await client.query<{ email: string; email_verified_at: Date | null }>(
      sql, [record.user_id, record.token_hash],
    );
    const user = rows[0];
    if (!user || String(user.email).toLowerCase() !== payload.to.toLowerCase()) return false;
    if (record.kind === "verification") {
      if (user.email_verified_at) return false;
      const fingerprint = payload.rawToken.split(".")[1] ?? "";
      const currentFingerprint = crypto.createHash("sha256").update(String(user.email).toLowerCase()).digest("hex");
      return safeEqualHex(fingerprint, currentFingerprint);
    }
    return true;
  });
}

export async function markEmailOutboxSent(outboxId: string): Promise<void> {
  await withOutboxSystemClient(async (client) => {
    await client.query(
      `UPDATE email_outbox SET status = 'sent', sent_at = NOW(), locked_at = NULL,
       last_error_code = NULL, updated_at = NOW() WHERE id = $1 AND status = 'processing'`,
      [outboxId],
    );
  });
}
export async function markEmailOutboxCancelled(outboxId: string): Promise<void> {
  await withOutboxSystemClient(async (client) => {
    await client.query(
      `UPDATE email_outbox SET status = 'cancelled', locked_at = NULL,
       last_error_code = 'TOKEN_NO_LONGER_CURRENT', updated_at = NOW()
       WHERE id = $1 AND status = 'processing'`,
      [outboxId],
    );
  });
}
export async function markEmailOutboxFailed(outboxId: string, errorCode: "PAYLOAD_DECRYPTION_FAILED"): Promise<void> {
  await withOutboxSystemClient(async (client) => {
    await client.query(
      `UPDATE email_outbox SET status = 'failed', locked_at = NULL,
       last_error_code = $2, updated_at = NOW() WHERE id = $1 AND status = 'processing'`,
      [outboxId, errorCode],
    );
  });
}

export async function listDispatchableEmailOutboxIds(): Promise<string[]> {
  return withOutboxSystemClient(async (client) => {
    await client.query(
      `UPDATE email_outbox SET status = 'failed', locked_at = NULL,
       last_error_code = 'MAX_ATTEMPTS_EXCEEDED', updated_at = NOW()
       WHERE attempts >= $1 AND (status = 'pending'
         OR (status = 'processing' AND locked_at < NOW() - ($2 * INTERVAL '1 minute')) )`,
      [MAX_EMAIL_OUTBOX_ATTEMPTS, STALE_LOCK_MINUTES],
    );
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM email_outbox WHERE attempts < $1
       AND ((status = 'pending' AND available_at <= NOW())
         OR (status = 'processing' AND locked_at < NOW() - ($2 * INTERVAL '1 minute')))
       ORDER BY created_at ASC LIMIT $3`,
      [MAX_EMAIL_OUTBOX_ATTEMPTS, STALE_LOCK_MINUTES, DISPATCH_BATCH_SIZE],
    );
    return rows.map((row) => row.id);
  });
}
