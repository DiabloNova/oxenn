import { TenantContextManager } from "@/core/database/tenant-context";

export interface UserWebsiteDirectoryEntry {
  id: string;
  url: string;
  platformType: "official_website" | "ecommerce_store" | "social_network" | "marketplace" | "other";
  createdAt: string;
  updatedAt: string;
}

/** Canonical user-level website directory shared by dashboard products. */
export async function getUserWebsiteDirectory(userId: string): Promise<UserWebsiteDirectoryEntry[]> {
  return TenantContextManager.runWithSystemContext(userId, "sys-user-identity-profile", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get database client for the user website directory.");
    const { rows } = await client.query(
      `SELECT id, url, platform_type AS "platformType", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM user_websites WHERE user_id = $1 ORDER BY created_at ASC, id ASC`, [userId],
    );
    return rows.map((row: { id: string; url: string; platformType: UserWebsiteDirectoryEntry["platformType"]; createdAt: Date | string; updatedAt: Date | string }) => ({
      id: row.id, url: row.url, platformType: row.platformType,
      createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString(),
    }));
  });
}
