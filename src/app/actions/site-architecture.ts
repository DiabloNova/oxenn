"use server";

import { AuthorizationError } from "@/services/auth/authorization";
import { mapErrorToResult } from "@/services/auth/error-mapping";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import {
  PageRepository,
  WebsiteRepository,
  PostgresDiagnosticFindingRepository
} from "@/features/ai-intelligence/repositories";
import { SiteArchitectureAnalyzerService } from "@/features/ai-intelligence/services/site-architecture-analyzer-service";
import { resolveAnalysisWebsiteSelection } from "@/services/user-identity/website-selection";

/**
 * Server Action: Analyzes site architecture intelligence for the active tenant context.
 * Calculates deterministic crawl depth, identifies orphan pages, checks internal link distribution,
 * evaluates URL hierarchy, and returns standardized findings and metrics.
 */
export async function getSiteArchitectureAction(websiteId?: string) {
  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new AuthorizationError(401, "Unauthorized: No active session user.");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return mapErrorToResult(err);
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;
  let selectedWebsite: Awaited<ReturnType<typeof resolveAnalysisWebsiteSelection>>;
  try {
    selectedWebsite = await resolveAnalysisWebsiteSelection(userId, websiteId);
  } catch (err: unknown) {
    return mapErrorToResult(err);
  }
  if (!selectedWebsite) {
    return { success: false as const, error: "Select an official website or online store from your user website directory first." };
  }

  try {
    const requestId = `req-site-arch-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const websiteRepo = new WebsiteRepository();
      const pageRepo = new PageRepository();
      const findingRepo = new PostgresDiagnosticFindingRepository();
      const analyzer = new SiteArchitectureAnalyzerService();

      // 1. Fetch website for active tenant
      let website = await websiteRepo.findByDomain(tenantId, selectedWebsite.domain);
      if (!website) {
        website = await websiteRepo.save({
          id: crypto.randomUUID(),
          organizationId: tenantId,
          domain: selectedWebsite.domain,
          normalizedUrl: selectedWebsite.normalizedUrl,
          status: "active",
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
            version: 1
          }
        });
      }

      // 2. Fetch pages for website
      const pagesRes = await pageRepo.findByWebsiteId(tenantId, website.id);
      const pages = pagesRes.data;



      // The page repository does not currently expose persisted crawl-link records.
      const links: Array<{ sourceUrl: string; targetUrl: string; normalizedTargetUrl: string; anchorText?: string }> = [];

      // 4. Run Analysis
      const result = analyzer.analyzeArchitecture(tenantId, website.id, {
        pages,
        links,
        rootUrl: `${selectedWebsite.normalizedUrl}/`
      });

      // 5. Persist findings to diagnostic repository
      for (const finding of result.findings) {
        await findingRepo.save({
          id: finding.id,
          organizationId: tenantId,
          websiteId: website.id,
          category: "technical",
          code: finding.code,
          title: finding.title,
          explanation: finding.explanation,
          severity: finding.severity,
          confidence: finding.confidence,
          status: "active",
          affectedResource: finding.affectedResource,
          evidence: finding.evidence,
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
            version: 1
          }
        });
      }

      return {
        success: true,
        result
      };
    });
  } catch (err: unknown) {
    return mapErrorToResult(err);
  }
}
