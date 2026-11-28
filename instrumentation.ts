import { validateWorkspacePoolConfiguration } from "./src/core/database/pool-config";

export async function register(): Promise<void> {
  validateWorkspacePoolConfiguration(process.env);
}
