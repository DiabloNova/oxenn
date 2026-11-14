import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
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
  it("issues a fresh private attestation bound to the exact target and URL", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).not.toThrow();
  });

  it("rejects direct Drizzle invocation without a guard-issued attestation", () => {
    expect(() => assertDbPushGuardAttestation(targetId, connectionString, { NODE_ENV: "test" })).toThrow(/requires a fresh attestation/);
  });

  it("rejects an attestation bound to another target or connection URL", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation("another-target", connectionString)).toThrow(/valid, fresh, private attestation/);
    expect(() => assertDbPushGuardAttestation(targetId, "postgresql://other/db")).toThrow(/valid, fresh, private attestation/);
  });

  it("rejects an expired attestation", async () => {
    await issue();
    expect(() => assertDbPushGuardAttestation(targetId, connectionString, process.env, Date.now() + 60_001)).toThrow(/valid, fresh, private attestation/);
  });

  it("rejects a modified attestation payload", async () => {
    const filePath = await issue();
    const payload = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    payload.targetId = "another-target";
    writeFileSync(filePath, JSON.stringify(payload));
    expect(() => assertDbPushGuardAttestation(targetId, connectionString)).toThrow(/valid, fresh, private attestation/);
  });
});
