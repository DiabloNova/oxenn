import { validateWorkspacePoolConfiguration } from "./core/database/pool-config";

export async function register(): Promise<void> {
  validateWorkspacePoolConfiguration(process.env);
}
