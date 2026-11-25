"use server";

import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { AIVisibilityAuditEngine } from "@/features/ai-intelligence/services/ai-visibility-audit-engine";
import { AIVisibilityAuditRepository, BrandRepository, db } from "@/features/ai-intelligence/repositories";

const runAuditSchema = z.object({
  brandId: z.string().uuid("شناسه برند معتبر نیست"),
});

const getAuditSchema = z.object({
  auditId: z.string().min(1, "شناسه سنجش معتبر نیست"),
});

/**
 * Creates and runs an AI Visibility Audit for a specific brand.
 * Enforces zero-trust multi-tenant isolation.
 */
export async function createAndRunAuditAction(data: { brandId: string }) {
  const parsed = runAuditSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", details: parsed.error.format() };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: Active user not resolved from secure session.");
    }
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unauthorized: Missing or invalid secure session."
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-vis-audit-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const engine = new AIVisibilityAuditEngine();
        const audit = await engine.executeAudit(tenantId, parsed.data.brandId, userId);
        return audit;
      }
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[createAndRunAuditAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}

/**
 * Retrieves details for a specific AI Visibility Audit, including executed prompts.
 */
export async function getAuditDetailsAction(data: { auditId: string }) {
  const parsed = getAuditSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", details: parsed.error.format() };
  }

  let session;
  try {
    session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: Active user not resolved from secure session.");
    }
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unauthorized: Missing or invalid secure session."
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-get-audit-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const repo = new AIVisibilityAuditRepository();
        const audit = await repo.findById(tenantId, parsed.data.auditId);
        if (!audit) {
          throw new Error("Audit not found");
        }
        const prompts = await repo.findPromptsByAuditId(tenantId, parsed.data.auditId);
        return { audit, prompts };
      }
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[getAuditDetailsAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}

/**
 * Retrieves all monitored brands for the active tenant context.
 */
export async function getBrandsAction() {
  let session;
  try {
    session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: Active user not resolved from secure session.");
    }
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unauthorized: Missing or invalid secure session."
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-get-brands-${Date.now()}`;

    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const brandRepo = new BrandRepository();
        const paginated = await brandRepo.findByOrganizationId(tenantId);

        // A workspace without a configured Brand is a valid empty state. Do not
        // invent customer identity or website data during a read operation.
        return paginated.data;
      }
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[getBrandsAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
