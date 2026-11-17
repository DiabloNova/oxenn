import { NextRequest, NextResponse } from "next/server";
import { DocumentIngestionService } from "@/services/ingestion/document-ingestion";
import { TenantTransactionOutcomeError } from "@/core/database/tenant-context";
import { authorizationErrorResponse, authorizeApiRequest } from "@/services/auth/authorization";
import {
  ingestionRequestSchema,
  MAX_INGESTION_REQUEST_BYTES,
  readBoundedJson,
} from "@/services/ai/resource-limits";

export async function POST(req: NextRequest) {
  try {
    // Resolve identity from the validated server session; caller headers are ignored.
    const { userId, tenantId } = await authorizeApiRequest(req);

    const bodyResult = await readBoundedJson(req, MAX_INGESTION_REQUEST_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const parsed = ingestionRequestSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, metadata, chunkingOptions } = parsed.data;
    const ingestionService = new DocumentIngestionService();
    const requestId = req.headers.get("x-request-id") || `req-ingest-${Date.now()}`;

    const result = await ingestionService.ingestDocument(text, metadata, chunkingOptions, { tenantId, userId, requestId });

    if (result.failureCode === "DOCUMENT_REPLACEMENT_FAILED") {
      return NextResponse.json(result, { status: 422 });
    }

    if (result.totalChunks > 0 && result.processedChunks === 0) {
      return NextResponse.json(
        {
          success: false,
          totalChunks: result.totalChunks,
          processedChunks: result.processedChunks,
          failedChunks: result.failedChunks,
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result, { status: result.failedChunks > 0 ? 207 : 200 });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof RangeError) {
      return NextResponse.json({ error: "Invalid ingestion input." }, { status: 400 });
    }
    if (error instanceof TenantTransactionOutcomeError) {
      const preservationStatus = error.outcome === "not_started" || error.outcome === "rolled_back"
        ? "preserved"
        : "unknown";
      console.error("[API Document Ingestion Replacement Failure]:", {
        outcome: error.outcome,
        phase: error.phase,
        cause: error.cause,
        rollbackError: error.rollbackError,
      });
      return NextResponse.json({
        success: false,
        error: "Document replacement failed.",
        code: "DOCUMENT_REPLACEMENT_FAILED",
        preservationStatus,
        rolledBack: error.outcome === "rolled_back",
        ...(preservationStatus === "unknown" ? { recoveryAction: "reload_and_verify" } : {}),
      }, { status: 500 });
    }
    console.error("[API Document Ingestion Route Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
