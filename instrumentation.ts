/**
 * Enforce deployment environment safety before a Node.js server runtime handles requests.
 * Dynamically import the Node-only validator so Edge instrumentation does not bundle fs/path.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv } = await import("./scripts/env-check");
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
