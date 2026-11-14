import { spawn } from "node:child_process";
import { createDbPushGuardAttestation, DB_PUSH_GUARD_ATTESTATION_ENV } from "./db-push-attestation";
import { resolveConfiguredDbPushTarget, validateDbPushGuard } from "./db-push-guard";

export function assertNoForwardedDbPushArguments(args: readonly string[]): void {
  if (args.length > 0) {
    throw new Error("db:push does not accept forwarded arguments; its Drizzle config and connection target are fixed by the guard.");
  }
}

function invokeDrizzlePush(attestationFilePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const child = spawn(command, ["exec", "drizzle-kit", "push", "--config=drizzle.push.config.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, [DB_PUSH_GUARD_ATTESTATION_ENV]: attestationFilePath },
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

export async function runDbPush(args: readonly string[] = process.argv.slice(2)): Promise<number> {
  assertNoForwardedDbPushArguments(args);

  const guardResult = await validateDbPushGuard();
  if (!guardResult.allowed) throw new Error(guardResult.reason);

  // Resolve again only after the asynchronous catalog attestation succeeded. The
  // process environment is immutable for this invocation and this identity is
  // bound into the short-lived token consumed by drizzle.push.config.ts.
  const configured = resolveConfiguredDbPushTarget();
  const attestation = await createDbPushGuardAttestation(
    configured.target.id,
    configured.connectionString,
  );

  try {
    console.log(guardResult.reason);
    return await invokeDrizzlePush(attestation.filePath);
  } finally {
    await attestation.cleanup();
  }
}

/* eslint-disable-next-line @typescript-eslint/no-require-imports -- CLI execution wrapper */
if (typeof require !== "undefined" && require.main === module) {
  runDbPush()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "db:push blocked by an unexpected wrapper failure.");
      process.exitCode = 1;
    });
}
