import { createHash, randomBytes } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const DB_PUSH_GUARD_ATTESTATION_ENV = "OXENN_DB_PUSH_GUARD_ATTESTATION_FILE";
const ATTESTATION_VERSION = 1;
const MAX_ATTESTATION_AGE_MS = 60_000;

interface DbPushGuardAttestation {
  version: number;
  nonce: string;
  targetId: string;
  connectionIdentityHash: string;
  issuedAt: number;
}

function hashConnectionIdentity(connectionString: string): string {
  const parsed = new URL(connectionString);
  const identity = {
    protocol: parsed.protocol,
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || "5432",
    database: decodeURIComponent(parsed.pathname.replace(/^\/+/, "")),
    username: decodeURIComponent(parsed.username),
    sslmode: parsed.searchParams.get("sslmode"),
  };
  // Never hash the complete connection URL: it contains a password and would
  // turn a leftover temp marker into an offline password-guessing oracle.
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

export async function createDbPushGuardAttestation(
  targetId: string,
  connectionString: string,
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "oxenn-db-push-"));
  const filePath = path.join(directory, "guard-attestation.json");
  const attestation: DbPushGuardAttestation = {
    version: ATTESTATION_VERSION,
    nonce: randomBytes(32).toString("hex"),
    targetId,
    connectionIdentityHash: hashConnectionIdentity(connectionString),
    issuedAt: Date.now(),
  };

  try {
    await writeFile(filePath, JSON.stringify(attestation), { encoding: "utf8", flag: "wx", mode: 0o600 });
  } catch (error: unknown) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }

  return {
    filePath,
    cleanup: () => rm(directory, { recursive: true, force: true }),
  };
}

export function assertDbPushGuardAttestation(
  targetId: string,
  connectionString: string,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): void {
  const filePath = env[DB_PUSH_GUARD_ATTESTATION_ENV];
  if (!filePath) {
    throw new Error("Drizzle db:push requires a fresh attestation issued by the db:push guard.");
  }

  try {
    const fileStats = lstatSync(filePath);
    const directoryStats = lstatSync(path.dirname(filePath));
    if (!fileStats.isFile() || fileStats.isSymbolicLink() || !directoryStats.isDirectory() || directoryStats.isSymbolicLink()) {
      throw new Error("invalid attestation file type");
    }
    if (process.platform !== "win32" && ((fileStats.mode & 0o077) !== 0 || (directoryStats.mode & 0o077) !== 0)) {
      throw new Error("attestation file permissions are too broad");
    }
    if (typeof process.getuid === "function" && (fileStats.uid !== process.getuid() || directoryStats.uid !== process.getuid())) {
      throw new Error("attestation file owner does not match the current process");
    }

    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid attestation payload");
    const attestation = parsed as Partial<DbPushGuardAttestation>;
    if (
      attestation.version !== ATTESTATION_VERSION ||
      typeof attestation.nonce !== "string" || !/^[a-f0-9]{64}$/.test(attestation.nonce) ||
      attestation.targetId !== targetId ||
      attestation.connectionIdentityHash !== hashConnectionIdentity(connectionString) ||
      typeof attestation.issuedAt !== "number" || !Number.isSafeInteger(attestation.issuedAt) ||
      attestation.issuedAt > now + 5_000 || now - attestation.issuedAt > MAX_ATTESTATION_AGE_MS
    ) {
      throw new Error("attestation does not match the current target or is no longer fresh");
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "unknown validation error";
    throw new Error(
      `Drizzle db:push requires a valid, fresh, private invocation marker (${reason}).`,
      { cause: error },
    );
  }
}
