import { PostgresClient } from "@/features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";

const AUDIT_PAGE_SIZE = 20;
export interface PremiumAuditListItem { id: string; url: string; score: number; grade: string; pagesAnalyzed: number; createdAt: string }
export interface PremiumAuditRecord extends PremiumAuditListItem { metrics: Record<string, unknown>; issues: unknown[]; recommendations: unknown[] }
interface PremiumAuditRow {
  [column: string]: unknown;
  id: string; url: string; score: number; grade: string; pages_analyzed: number;
  metrics: Record<string, unknown> | string; issues: unknown[] | string;
  recommendations: unknown[] | string; created_at: Date | string;
}
function parseObject(value: PremiumAuditRow["metrics"]): Record<string, unknown> {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}
function parseArray(value: PremiumAuditRow["issues"] | PremiumAuditRow["recommendations"]): unknown[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed : [];
}
function mapAudit(row: PremiumAuditRow): PremiumAuditRecord {
  return {
    id: row.id, url: row.url, score: Number(row.score), grade: row.grade,
    pagesAnalyzed: Number(row.pages_analyzed),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    metrics: parseObject(row.metrics), issues: parseArray(row.issues), recommendations: parseArray(row.recommendations),
  };
}
type AuthenticatedSession = Awaited<ReturnType<typeof requireSession>>;

async function withTenant<T>(
  work: (tenantId: string, pg: PostgresClient) => Promise<T>,
  existingSession?: AuthenticatedSession,
): Promise<T> {
  const session = existingSession ?? await requireSession();
  if (!session.user?.workspaceId) throw new Error("Unauthorized: An active workspace is required to view audit reports.");
  const tenantId = session.user.workspaceId;
  const pg = PostgresClient.getInstance();
  return TenantContextManager.runWithTenantContext(
    tenantId, session.user.id, `req-dashboard-audits-${Date.now()}`, () => work(tenantId, pg),
  );
}
export async function listPremiumAudits(options: { page?: number; query?: string } = {}) {
  const requestedPage = Number.isSafeInteger(options.page) && Number(options.page) > 0 ? Math.min(Number(options.page), 1_000_000) : 1;
  const query = (options.query ?? "").trim().slice(0, 200);
  const escapedQuery = query.replace(/[\\%_]/g, "\\$&");
  return withTenant(async (tenantId, pg) => {
    const searchClause = query ? "AND url ILIKE $2 ESCAPE chr(92)" : "";
    const searchParams = query ? [tenantId, `%${escapedQuery}%`] : [tenantId];
    const count = await pg.query<{ [column: string]: unknown; total: string }>(
      `SELECT COUNT(*)::text AS total FROM premium_audits WHERE organization_id = $1 ${searchClause}`,
      searchParams,
    );
    const total = Number(count.rows[0]?.total ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
    const page = Math.min(requestedPage, pageCount);
    const offset = (page - 1) * AUDIT_PAGE_SIZE;
    const params = query ? [tenantId, `%${escapedQuery}%`, AUDIT_PAGE_SIZE, offset] : [tenantId, AUDIT_PAGE_SIZE, offset];
    const result = await pg.query<PremiumAuditRow>(
      `SELECT id, url, score, grade, pages_analyzed, created_at FROM premium_audits
       WHERE organization_id = $1 ${searchClause} ORDER BY created_at DESC, id DESC
       LIMIT $${query ? 3 : 2} OFFSET $${query ? 4 : 3}`,
      params,
    );
    return {
      audits: result.rows.map((row) => ({
        id: row.id, url: row.url, score: Number(row.score), grade: row.grade,
        pagesAnalyzed: Number(row.pages_analyzed),
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })), page, pageCount, total, query,
    };
  });
}
export async function getPremiumAuditById(
  id: string,
  session?: AuthenticatedSession,
): Promise<PremiumAuditRecord | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  return withTenant(async (tenantId, pg) => {
    const result = await pg.query<PremiumAuditRow>(
      `SELECT id, url, score, grade, pages_analyzed, metrics, issues, recommendations, created_at
       FROM premium_audits WHERE organization_id = $1 AND id = $2 LIMIT 1`,
      [tenantId, id],
    );
    return result.rows[0] ? mapAudit(result.rows[0]) : null;
  }, session);
}
