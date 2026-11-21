"use server";

import { AuthorizationError } from "@/services/auth/authorization";
import { mapErrorToResult } from "@/services/auth/error-mapping";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { AeoContentIntelligenceService } from "@/features/ai-intelligence/services/aeo-content-intelligence-service";
import { AeoContentIntelligenceRepository, PageRepository, WebsiteRepository } from "@/features/ai-intelligence/repositories";
import { resolveAnalysisWebsiteSelection } from "@/services/user-identity/website-selection";

/**
 * Exposes AEO Content Intelligence analytics for the selected user-owned website
 * within the active workspace. It does not fabricate pages when crawl data is absent.
 */
export async function getAeoContentDashboardDataAction(websiteId?: string) {
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
    const requestId = `req-aeo-content-${Date.now()}`;
    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const repo = new AeoContentIntelligenceRepository();
      const pageRepo = new PageRepository();
      const websiteRepo = new WebsiteRepository();
      const service = new AeoContentIntelligenceService();

      let website = await websiteRepo.findByDomain(tenantId, selectedWebsite.domain);
      if (!website) {
        website = await websiteRepo.save({
          id: crypto.randomUUID(), organizationId: tenantId, domain: selectedWebsite.domain,
          normalizedUrl: selectedWebsite.normalizedUrl, status: "active",
          audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userId, updatedBy: userId, version: 1 }
        });
      }

      const pages = (await pageRepo.findByWebsiteId(tenantId, website.id)).data;
      const analyses = [];
      for (const page of pages) {
        let analysis = await repo.findAnalysisByPageId(tenantId, page.id);
        if (!analysis) analysis = await service.executeAnalysis(tenantId, page.id);
        analyses.push(analysis);
      }

      const faqOpportunities = await repo.findAllFaqOpportunities(tenantId);
      const kgAlignments = await repo.findAllKgAlignments(tenantId);
      const recommendationSignals = [];
      for (const page of pages) {
        const signals = await service.detectAeoAlertSignals(tenantId, page.id);
        recommendationSignals.push(...signals.map(signal => ({ ...signal, pageId: page.id, path: page.path })));
      }

      return { success: true, result: { website, pages, analyses, faqOpportunities, kgAlignments, recommendationSignals } };
    });
  } catch (err: unknown) {
    return mapErrorToResult(err);
  }
}

/**
 * Execute AEO Content analysis for a given page on demand
 */
export async function runAeoAnalysisForPageAction(pageId: string) {
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

  try {
    const requestId = `req-aeo-analysis-run-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const service = new AeoContentIntelligenceService();
      const analysis = await service.executeAnalysis(tenantId, pageId);
      return { success: true, result: analysis };
    });
  } catch (err: unknown) {
    return mapErrorToResult(err);
  }
}
