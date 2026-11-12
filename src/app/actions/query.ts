"use server";

import { answerQuestion } from "@/services/rag/query-service";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { ragQueryRequestSchema } from "@/services/ai/resource-limits";

export async function queryKnowledgeGraphAction(data: {
  question: string;
  limit?: number;
}) {
  const parsed = ragQueryRequestSchema.safeParse(data);
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
      error: err instanceof Error ? err.message : "Unauthorized: Missing or invalid secure session on server."
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-act-query-${Date.now()}`;
    const result = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => answerQuestion(parsed.data.question, tenantId, parsed.data.limit)
    );

    return { success: true, result };
  } catch (err: unknown) {
    console.error("[queryKnowledgeGraphAction Error]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
