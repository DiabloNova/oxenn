import { validateEnv } from "./scripts/env-check";

/**
 * Enforce deployment environment safety before a Node.js server runtime handles requests.
 * This hook also runs in Vercel's Next.js server runtime, where package start scripts are bypassed.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const result = validateEnv("start");
  if (!result.valid) {
    const details = [
      ...result.missing.map((name) => `missing: ${name}`),
      ...result.invalid.map((item) => `${item.name}: ${item.reason}`),
    ];
    throw new Error(
      `Runtime environment validation failed for '${result.deploymentEnvironment}': ${details.join("; ")}`,
    );
  }
}
