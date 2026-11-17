import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type MockIngestionResult = {
  success: boolean;
  tenantId: string;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errors: Array<{ chunkIndex: number; error: string }>;
  rolledBack?: boolean;
  preservationStatus?: "preserved" | "unknown";
  failureCode?: "DOCUMENT_REPLACEMENT_FAILED";
  failureStage?: "preparation";
  attemptedProcessedChunks?: number;
};

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(async () => ({ tenantId: "tenant-test", userId: "user-test" })),
  authorizationErrorResponse: vi.fn((): Response | null => null),
  ingest: vi.fn(async (): Promise<MockIngestionResult> => ({
    success: true,
    tenantId: "tenant-test",
    totalChunks: 1,
    processedChunks: 1,
    failedChunks: 0,
    errors: [],
    rolledBack: false,
    attemptedProcessedChunks: undefined,
  })),
}));

vi.mock("@/services/auth/authorization", () => ({
  authorizeApiRequest: mocks.authorize,
  authorizationErrorResponse: mocks.authorizationErrorResponse,
}));

vi.mock("@/services/ingestion/document-ingestion", () => ({
  DocumentIngestionService: class {
    ingestDocument = mocks.ingest;
  },
}));

import { TenantTransactionOutcomeError } from "@/core/database/tenant-context";
import { POST } from "@/app/api/v1/ingest/document/route";

function makeRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/ingest/document", {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "request-test" },
    body: JSON.stringify(payload),
  });
}

const successfulResult = {
  success: true,
  tenantId: "tenant-test",
  totalChunks: 1,
  processedChunks: 1,
  failedChunks: 0,
  errors: [],
  rolledBack: false,
};

describe("POST /api/v1/ingest/document", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockResolvedValue({ tenantId: "tenant-test", userId: "user-test" });
    mocks.authorizationErrorResponse.mockReturnValue(null);
    mocks.ingest.mockResolvedValue(successfulResult);
  });

  it("rejects oversized document text before ingestion processing", async () => {
    const response = await POST(makeRequest({ text: "x".repeat(3 * 1024 * 1024 + 1) }));

    expect(response.status).toBe(400);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("rejects request bodies above the streaming cap before ingestion processing", async () => {
    const response = await POST(makeRequest({ text: "x".repeat(4 * 1024 * 1024) }));

    expect(response.status).toBe(413);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("returns a stable replacement failure contract when provider preparation fails before the transaction", async () => {
    mocks.ingest.mockResolvedValueOnce({
      success: false,
      tenantId: "tenant-test",
      totalChunks: 2,
      processedChunks: 0,
      failedChunks: 1,
      errors: [{ chunkIndex: 1, error: "embedding provider unavailable" }],
      rolledBack: false,
      preservationStatus: "preserved",
      failureCode: "DOCUMENT_REPLACEMENT_FAILED",
      failureStage: "preparation",
      attemptedProcessedChunks: 1,
    });

    const response = await POST(makeRequest({ text: "valid brand profile text", metadata: { source: "brand-profile" } }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      success: false,
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "preserved",
      rolledBack: false,
      failureStage: "preparation",
    });
  });

  it("reports confirmed preservation only after the transaction manager confirms rollback", async () => {
    const cause = new Error("private database detail");
    mocks.ingest.mockRejectedValueOnce(new TenantTransactionOutcomeError({
      outcome: "rolled_back", phase: "work", cause,
    }));

    const response = await POST(makeRequest({ text: "valid brand profile text", metadata: { source: "brand-profile" } }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      success: false,
      error: "Document replacement failed.",
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "preserved",
      rolledBack: true,
    });
    expect(JSON.stringify(body)).not.toContain("private database detail");
  });

  it("reports preservation when transaction setup fails before the work callback starts", async () => {
    mocks.ingest.mockRejectedValueOnce(new TenantTransactionOutcomeError({
      outcome: "not_started", phase: "setup", cause: new Error("private connection detail"),
    }));

    const response = await POST(makeRequest({ text: "valid brand profile text", metadata: { source: "brand-profile" } }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "preserved",
      rolledBack: false,
    });
    expect(JSON.stringify(body)).not.toContain("private connection detail");
  });

  it.each([
    { outcome: "rollback_failed" as const, phase: "work" as const },
    { outcome: "commit_uncertain" as const, phase: "commit" as const },
  ])("reports $outcome without claiming that the previous document was preserved", async ({ outcome, phase }) => {
    mocks.ingest.mockRejectedValueOnce(new TenantTransactionOutcomeError({
      outcome,
      phase,
      cause: new Error("private SQL and connection details"),
      rollbackError: outcome === "rollback_failed" ? new Error("private rollback details") : undefined,
    }));

    const response = await POST(makeRequest({ text: "valid brand profile text", metadata: { source: "brand-profile" } }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "unknown",
      rolledBack: false,
      recoveryAction: "reload_and_verify",
    });
    expect(JSON.stringify(body)).not.toContain("private SQL");
    expect(JSON.stringify(body)).not.toContain("private rollback details");
  });

  it("preserves authentication and authorization handling before ingestion", async () => {
    const authError = new Error("not authorized");
    mocks.authorize.mockRejectedValueOnce(authError);
    mocks.authorizationErrorResponse.mockReturnValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const response = await POST(makeRequest({ text: "valid text" }));

    expect(response.status).toBe(401);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("preserves the successful response and forwards authorized tenant context", async () => {
    const metadata = { source: "route-test" };
    const response = await POST(makeRequest({ text: "valid document text", metadata }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, processedChunks: 1, failedChunks: 0 });
    expect(mocks.ingest).toHaveBeenCalledWith(
      "valid document text",
      metadata,
      undefined,
      { tenantId: "tenant-test", userId: "user-test", requestId: "request-test" },
    );
  });

  it("returns multi-status when provider preparation partially fails for a non-replacement document", async () => {
    mocks.ingest.mockResolvedValueOnce({
      success: false,
      tenantId: "tenant-test",
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 1,
      errors: [{ chunkIndex: 1, error: "provider unavailable" }],
      rolledBack: false,
    });

    const response = await POST(makeRequest({ text: "valid document text" }));
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body).toMatchObject({ success: false, totalChunks: 2, processedChunks: 1, failedChunks: 1 });
  });
});
