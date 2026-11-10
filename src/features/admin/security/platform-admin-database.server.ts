import "server-only";

import { Pool } from "pg";
import { assertDedicatedPlatformAdminDatabaseUrl } from "./platform-admin-database-guard";

export { assertDedicatedPlatformAdminDatabaseUrl };

let platformAdminPool: Pool | undefined;

export function getPlatformAdminPool(): Pool {
  if (platformAdminPool) return platformAdminPool;

  const connectionString = process.env.PLATFORM_ADMIN_DATABASE_URL;
  if (!connectionString) {
    throw new Error("PLATFORM_ADMIN_DATABASE_URL is required for Platform Admin persistence.");
  }

  assertDedicatedPlatformAdminDatabaseUrl(connectionString);
  platformAdminPool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    application_name: "oxenn-platform-admin",
  });

  return platformAdminPool;
}

export async function closePlatformAdminPool(): Promise<void> {
  if (!platformAdminPool) return;
  const pool = platformAdminPool;
  platformAdminPool = undefined;
  await pool.end();
}
