import { afterEach, describe, expect, it, vi } from "vitest";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { symlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  assertDbPushGuardAttestation,
  createDbPushGuardAttestation,
  DB_PUSH_GUARD_ATTESTATION_ENV,
} from "../../../../scripts/database/db-push-attestation";

const targetId = "local-throwaway";
const connectionString = "postgresql://oxenn_db_push:secret@127.0.0.1:5432/oxenn_throwaway";
let cleanup: (() => Promise<void>) | undefined;

async function issue() {
  const attestation = await createDbPushGuardAttestation(targetId, connectionString);
  cleanup = attestation.cleanup;
  vi.stubEnv(DB_PUSH_GUARD_ATTESTATION_ENV, attestation.filePath);
  return attestation.filePath;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await cleanup?.();
  cleanup = undefined;
});

describe("db:push guard attestation", () => {
  it("creates a fresh private invocation marker bound to the exact target and URL", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).not.toThrow();
  });

  it("rejects direct Drizzle invocation without the wrapper marker", () => {
    expect(() => assertDbPushGuardAttestation(targetId, connectionString, { NODE_ENV: "test" })).toThrow(/requires a fresh attestation/);
  });

  it("rejects a marker bound to another target or connection URL", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation("another-target", connectionString)).toThrow(/valid, fresh, private invocation marker/);
    expect(() => assertDbPushGuardAttestation(targetId, "postgresql://other/db")).toThrow(/valid, fresh, private invocation marker/);
  });

  it("rejects an expired invocation marker", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation(targetId, connectionString, process.env, Date.now() + 60_001)).toThrow(/valid, fresh, private invocation marker/);
  });

  it("rejects an issuedAt timestamp more than five seconds in the future", async () => {
    const filePath = await issue();
    const now = Date.now();
    const payload = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    payload.issuedAt = now + 5_001;
    writeFileSync(filePath, JSON.stringify(payload));
    expect(() => assertDbPushGuardAttestation(targetId, connectionString, process.env, now)).toThrow(/valid, fresh, private invocation marker/);
  });

  it("rejects a symlinked invocation marker file", async () => {
    const filePath = await issue();
    const symlinkPath = `${filePath}.link`;
    await symlink(filePath, symlinkPath);
    vi.stubEnv(DB_PUSH_GUARD_ATTESTATION_ENV, symlinkPath);
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).toThrow(/valid, fresh, private invocation marker/);
  });

  it.skipIf(process.platform === "win32")("rejects a group/world-readable invocation marker file", async () => {
    const filePath = await issue();
    chmodSync(filePath, 0o644);
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).toThrow(/valid, fresh, private invocation marker/);
  });

  it("rejects a malformed invocation marker payload", async () => {
    const filePath = await issue();
    const payload = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    payload.nonce = "not-a-valid-nonce";
    writeFileSync(filePath, JSON.stringify(payload));
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).toThrow(/valid, fresh, private invocation marker/);
  });

  it("does not persist or hash the database password in the invocation marker", async () => {
    const filePath = await issue();
    const serialized = readFileSync(filePath, "utf8");
    expect(serialized).not.toContain("secret");
    const payload = JSON.parse(serialized) as Record<string, unknown>;
    const nonSecretIdentity = {
      protocol: "postgresql:",
      host: "127.0.0.1",
      port: "5432",
      database: "oxenn_throwaway",
      username: "oxenn_db_push",
      sslmode: null,
    };
    const expectedHash = createHash("sha256").update(JSON.stringify(nonSecretIdentity)).digest("hex");
    expect(payload.connectionIdentityHash).toBe(expectedHash);
    expect(payload).not.toHaveProperty("connectionStringHash");
  });
});
