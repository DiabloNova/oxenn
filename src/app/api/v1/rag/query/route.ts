import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/services/rag/query-service";
import { TenantContextManager } from "@/core/database/tenant-context";
import { authorizationErrorResponse, authorizeApiRequest } from "@/services/auth/authorization";
import {
  MAX_RAG_REQUEST_BYTES,
  ragQueryRequestSchema,
  readBoundedJson,
} from "@/services/ai/resource-limits";

export async function POST(req: NextRequest) {
  try {
    // Resolve identity from the validated server session; caller headers are ignored.
    const { userId, tenantId } = await authorizeApiRequest(req);

    const bodyResult = await readBoundedJson(req, MAX_RAG_REQUEST_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const parsed = ragQueryRequestSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { question, limit } = parsed.data;
    const requestId = req.headers.get("x-request-id") || `req-rag-${Date.now()}`;

    const ragResponse = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => answerQuestion(question, tenantId, limit)
    );

    return NextResponse.json(ragResponse);
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof RangeError) {
      return NextResponse.json({ error: "Invalid RAG query input." }, { status: 400 });
    }
    console.error("[API RAG Query Route Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
