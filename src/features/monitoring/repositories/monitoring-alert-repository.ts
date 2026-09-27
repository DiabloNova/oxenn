import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { monitoringAlerts } from "../../../../database/schema";
import { MonitoringAlert } from "../domain/types";

export class MonitoringAlertRepository {
  public async create(alert: Omit<MonitoringAlert, "id" | "organizationId" | "createdAt">): Promise<MonitoringAlert> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback global pg client */
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .insert(monitoringAlerts)
      .values({
        organizationId: tenantId,
        monitoringConfigId: alert.monitoringConfigId,
        crawlSnapshotId: alert.crawlSnapshotId,
        alertType: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        eventMetadata: alert.eventMetadata,
        dedupKey: alert.dedupKey
      })
      .onConflictDoNothing({ target: [monitoringAlerts.organizationId, monitoringAlerts.dedupKey] })
      .returning();

    if (rows.length === 0) {
      // It was deduplicated (already exists)
      const existingRows = await db
        .select()
        .from(monitoringAlerts)
        .where(and(
          eq(monitoringAlerts.organizationId, tenantId),
          eq(monitoringAlerts.dedupKey, alert.dedupKey)
        ))
        .limit(1);

      if (existingRows.length === 0) {
         throw new Error("Alert deduplication failed but alert not found.");
      }

      const existing = existingRows[0];
      return {
        id: existing.id,
        organizationId: existing.organizationId,
        monitoringConfigId: existing.monitoringConfigId,
        crawlSnapshotId: existing.crawlSnapshotId,
        alertType: existing.alertType,
        severity: existing.severity,
        message: existing.message,
        eventMetadata: existing.eventMetadata as Record<string, unknown>,
        createdAt: existing.createdAt?.toISOString() || new Date().toISOString(),
        dedupKey: existing.dedupKey
      };
    }

    const row = rows[0];
    return {
      id: row.id,
      organizationId: row.organizationId,
      monitoringConfigId: row.monitoringConfigId,
      crawlSnapshotId: row.crawlSnapshotId,
      alertType: row.alertType,
      severity: row.severity,
      message: row.message,
      eventMetadata: row.eventMetadata as Record<string, unknown>,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      dedupKey: row.dedupKey
    };
  }
}
