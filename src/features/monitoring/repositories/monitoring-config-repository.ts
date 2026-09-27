import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { monitoringConfigs } from "../../../../database/schema";
import { MonitoringConfig } from "../domain/types";
import { CrawlPolicy } from "../../acquisition/domain/policy";

export class MonitoringConfigRepository {
  public async getById(configId: string): Promise<MonitoringConfig | null> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback global pg client */
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .select()
      .from(monitoringConfigs)
      .where(and(
        eq(monitoringConfigs.id, configId),
        eq(monitoringConfigs.organizationId, tenantId)
      ))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      organizationId: row.organizationId,
      websiteId: row.websiteId,
      targetUrl: row.targetUrl,
      enabled: row.enabled,
      crawlPolicy: row.crawlPolicy as unknown as CrawlPolicy,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  public async save(config: MonitoringConfig): Promise<MonitoringConfig> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback global pg client */
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .insert(monitoringConfigs)
      .values({
        id: config.id,
        organizationId: tenantId,
        websiteId: config.websiteId,
        targetUrl: config.targetUrl,
        enabled: config.enabled,
        crawlPolicy: config.crawlPolicy as unknown as Record<string, unknown>,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      })
      .onConflictDoUpdate({
        target: monitoringConfigs.id,
        set: {
          websiteId: config.websiteId,
          targetUrl: config.targetUrl,
          enabled: config.enabled,
          crawlPolicy: config.crawlPolicy as unknown as Record<string, unknown>,
          updatedAt: new Date()
        }
      })
      .returning();

    const row = rows[0];
    return {
      id: row.id,
      organizationId: row.organizationId,
      websiteId: row.websiteId,
      targetUrl: row.targetUrl,
      enabled: row.enabled,
      crawlPolicy: row.crawlPolicy as unknown as CrawlPolicy,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
    };
  }
}
