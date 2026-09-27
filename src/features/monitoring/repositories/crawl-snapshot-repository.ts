import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { crawlSnapshots } from "../../../../database/schema";
import { CrawlSnapshot } from "../domain/types";

export class CrawlSnapshotRepository {
  public async getPreviousSnapshot(monitoringConfigId: string): Promise<CrawlSnapshot | null> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback global pg client */
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .select()
      .from(crawlSnapshots)
      .where(and(
        eq(crawlSnapshots.monitoringConfigId, monitoringConfigId),
        eq(crawlSnapshots.organizationId, tenantId)
      ))
      .orderBy(desc(crawlSnapshots.capturedAt))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      organizationId: row.organizationId,
      monitoringConfigId: row.monitoringConfigId,
      crawlJobId: row.crawlJobId,
      capturedAt: row.capturedAt?.toISOString() || new Date().toISOString(),
      contentHash: row.contentHash,
      extractedContent: row.extractedContent,
      snapshotMetadata: row.snapshotMetadata as Record<string, unknown>
    };
  }

  public async create(snapshot: Omit<CrawlSnapshot, "id" | "organizationId" | "capturedAt">): Promise<CrawlSnapshot> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback global pg client */
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .insert(crawlSnapshots)
      .values({
        organizationId: tenantId,
        monitoringConfigId: snapshot.monitoringConfigId,
        crawlJobId: snapshot.crawlJobId,
        contentHash: snapshot.contentHash,
        extractedContent: snapshot.extractedContent,
        snapshotMetadata: snapshot.snapshotMetadata
      })
      .returning();

    const row = rows[0];
    return {
      id: row.id,
      organizationId: row.organizationId,
      monitoringConfigId: row.monitoringConfigId,
      crawlJobId: row.crawlJobId,
      capturedAt: row.capturedAt?.toISOString() || new Date().toISOString(),
      contentHash: row.contentHash,
      extractedContent: row.extractedContent,
      snapshotMetadata: row.snapshotMetadata as Record<string, unknown>
    };
  }
}
