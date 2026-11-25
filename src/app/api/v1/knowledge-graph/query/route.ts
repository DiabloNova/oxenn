import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TenantContextManager } from '@/core/database/tenant-context';
import { authorizationErrorResponse, authorizeApiRequest, requireWorkspaceMembership } from '@/services/auth/authorization';
import { EntityService, projectNeighborhoodForVisualization } from '@/features/ai-intelligence/services/entity-service';

// Validation schema with Persian error message
const querySchema = z.object({
  entityName: z.string().min(1, 'نام موجودیت باید ارسال شود'),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId: organizationId } = await authorizeApiRequest(req);
    const body = await req.json();
    const parsed = querySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { entityName } = parsed.data;

    // 1. Verify active workspace membership before tenant-scoped queries.
    const requestId = req.headers.get("x-request-id") || `req-kg-api-${Date.now()}`;

    // 2. Wrap executing DB lookups strictly under RLS tenant isolation context
    const result = await TenantContextManager.runWithTenantContext(
      organizationId,
      userId,
      requestId,
      async () => {
        // Enforce workspace membership validation inside context
        await requireWorkspaceMembership(userId, organizationId);

        const entityService = new EntityService();

        // Query canonical database entities and relationships via EntityService
        const centralEntity = await entityService.getEntityByName(organizationId, entityName);

        if (centralEntity) {
          // Bounded BFS Graph traversal limit to depth=2 and maxNodes=100
          const { nodes, edges } = await entityService.getNeighborhood(organizationId, centralEntity.id, 2, 100);
          return projectNeighborhoodForVisualization(nodes, edges);
        }

        return null;
      }
    );

    if (result) {
      return NextResponse.json(result);
    }

    // The endpoint exposes canonical domain graph data only. Extracted KG observations
    // are evidence, not canonical graph nodes; never synthesize demo data in a real API response.
    return NextResponse.json({ nodes: [], edges: [] });

  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[API KG Query Route Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
