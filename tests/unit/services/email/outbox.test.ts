import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { TenantContextManager } from "@/core/database/tenant-context";
import {
  claimEmailOutbox, decryptEmailOutboxPayload, enqueueEmailOutbox, encryptEmailOutboxPayload,
  isEmailOutboxTokenCurrent, listDispatchableEmailOutboxIds, markEmailOutboxSent,
} from "@/services/email/outbox";

const { mockOutboxQuery } = vi.hoisted(() => ({ mockOutboxQuery: vi.fn() }));
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithSystemContext: vi.fn(async (_tenant: unknown, _purpose: string, work: () => Promise<unknown>) => work()),
    getDbClient: vi.fn(() => ({ query: mockOutboxQuery })),
  },
}));

const outboxId = "a2a1f3f8-1c53-4db5-ae23-8f7a2c2f4d91";
const rawToken = "a".repeat(64) + "." + "b".repeat(64);
const payload = {
  to: "person@example.com",
  templateId: "verification" as const,
  params: { url: "https://oxenn.ir/en/verify-email?token=" + rawToken },
  rawToken,
};
const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
const originalEncryptionKey = process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;

afterEach(() => {
  if (originalEncryptionKey === undefined) delete process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
  else process.env.EMAIL_OUTBOX_ENCRYPTION_KEY = originalEncryptionKey;
});

beforeEach(() => {
  process.env.EMAIL_OUTBOX_ENCRYPTION_KEY = "a".repeat(64);
  mockOutboxQuery.mockReset();
  vi.mocked(TenantContextManager.runWithSystemContext).mockClear();
});

describe("email transactional outbox encryption", () => {
  it("round-trips encrypted payloads without exposing recipient or raw token", () => {
    const encrypted = encryptEmailOutboxPayload(outboxId, payload);
    expect(JSON.stringify(encrypted)).not.toContain("person@example.com");
    expect(JSON.stringify(encrypted)).not.toContain(rawToken);
    expect(decryptEmailOutboxPayload(outboxId, {
      kind: "verification", token_hash: tokenHash,
      payload_ciphertext: encrypted.payloadCiphertext, payload_iv: encrypted.payloadIv,
      payload_auth_tag: encrypted.payloadAuthTag,
    })).toEqual(payload);
  });

  it("rejects ciphertext authenticated for a different outbox row", () => {
    const encrypted = encryptEmailOutboxPayload(outboxId, payload);
    expect(() => decryptEmailOutboxPayload("b2a1f3f8-1c53-4db5-ae23-8f7a2c2f4d91", {
      kind: "verification", token_hash: tokenHash,
      payload_ciphertext: encrypted.payloadCiphertext, payload_iv: encrypted.payloadIv,
      payload_auth_tag: encrypted.payloadAuthTag,
    })).toThrow();
  });

  it("rejects a modified authentication tag", () => {
    const encrypted = encryptEmailOutboxPayload(outboxId, payload);
    const alteredTag = encrypted.payloadAuthTag.slice(0, -1) + (encrypted.payloadAuthTag.endsWith("A") ? "B" : "A");
    expect(() => decryptEmailOutboxPayload(outboxId, {
      kind: "verification", token_hash: tokenHash,
      payload_ciphertext: encrypted.payloadCiphertext, payload_iv: encrypted.payloadIv,
      payload_auth_tag: alteredTag,
    })).toThrow();
  });

  it("persists only ciphertext, IV, tag, and token hash in the database row", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const client = { query } as unknown as PoolClient;
    const id = await enqueueEmailOutbox(client, { userId: "usr-1", kind: "verification", tokenHash, payload });
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("INSERT INTO email_outbox");
    const storedValues = JSON.stringify(query.mock.calls[0][1]);
    expect(storedValues).not.toContain("person@example.com");
    expect(storedValues).not.toContain(rawToken);
    expect(storedValues).toContain(tokenHash);
  });

  it("rejects non-HTTP(S) action URLs before persisting an outbox row", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const client = { query } as unknown as PoolClient;
    await expect(enqueueEmailOutbox(client, {
      userId: "usr-1", kind: "verification", tokenHash,
      payload: { ...payload, params: { url: "javascript:alert(1)" } },
    })).rejects.toThrow("Email outbox payload does not match its token");
    expect(query).not.toHaveBeenCalled();
  });

  it("claims rows through the dedicated system context with an atomic lease", async () => {
    const claimed = {
      id: outboxId, user_id: "usr-1", kind: "verification", token_hash: tokenHash,
      payload_ciphertext: "ciphertext", payload_iv: "iv", payload_auth_tag: "tag", attempts: 1,
    };
    mockOutboxQuery.mockResolvedValueOnce({ rows: [claimed] });
    await expect(claimEmailOutbox(outboxId)).resolves.toEqual(claimed);
    expect(TenantContextManager.runWithSystemContext).toHaveBeenCalledWith(null, "sys-email-outbox", expect.any(Function));
    expect(mockOutboxQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE email_outbox"), [outboxId, 5, 30]);
  });

  it("only dispatches a current, unexpired token for the user's current email", async () => {
    const email = "person@example.com";
    const fingerprint = crypto.createHash("sha256").update(email).digest("hex");
    const verificationToken = "c".repeat(64) + "." + fingerprint;
    const verificationPayload = {
      to: email, templateId: "verification" as const,
      params: { url: "https://oxenn.ir/en/verify-email?token=" + verificationToken },
      rawToken: verificationToken,
    };
    const verificationHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    mockOutboxQuery.mockResolvedValueOnce({ rows: [{ email, email_verified_at: null }] });
    await expect(isEmailOutboxTokenCurrent({ user_id: "usr-1", kind: "verification", token_hash: verificationHash }, verificationPayload)).resolves.toBe(true);
    expect(mockOutboxQuery.mock.calls[0][0]).toContain("email_verification_tokens");

    mockOutboxQuery.mockReset();
    mockOutboxQuery.mockResolvedValueOnce({ rows: [{ email: "changed@example.com", email_verified_at: null }] });
    await expect(isEmailOutboxTokenCurrent({ user_id: "usr-1", kind: "verification", token_hash: verificationHash }, verificationPayload)).resolves.toBe(false);
  });

  it("recovers stale work and marks a completed delivery", async () => {
    mockOutboxQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: outboxId }] });
    await expect(listDispatchableEmailOutboxIds()).resolves.toEqual([outboxId]);
    expect(mockOutboxQuery).toHaveBeenCalledTimes(2);
    mockOutboxQuery.mockReset();
    mockOutboxQuery.mockResolvedValueOnce({ rows: [] });
    await markEmailOutboxSent(outboxId);
    expect(mockOutboxQuery).toHaveBeenCalledWith(expect.stringContaining("status = 'sent'"), [outboxId]);
  });

  it("requires a correctly sized encryption key", () => {
    delete process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
    expect(() => encryptEmailOutboxPayload(outboxId, payload)).toThrow("EMAIL_OUTBOX_ENCRYPTION_KEY");
  });
});
