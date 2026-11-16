import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(async () => ({ tenantId: "tenant-test", userId: "user-test" })),
  runWithTenant: vi.fn(async (...args: unknown[]) => {
    const callback = args[3] as () => Promise<unknown>;
    return callback();
  }),
  ingest: vi.fn(async () => ({
    success: true,
    tenantId: "tenant-test",
    totalChunks: 1,
    processedChunks: 1,
    failedChunks: 0,
    errors: [] as Array<{ chunkIndex: number; error: string }>,
    rolledBack: false,
    attemptedProcessedChunks: undefined as number | undefined,
  })),
}));

vi.mock("@/services/auth/authorization", () => ({
  authorizeApiRequest: mocks.authorize,
  authorizationErrorResponse: vi.fn(() => null),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: mocks.runWithTenant },
}));

vi.mock("@/services/ingestion/document-ingestion", () => ({
  DocumentIngestionService: class {
    ingestDocument = mocks.ingest;
  },
}));

import { POST } from "@/app/api/v1/ingest/document/route";

function makeRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/ingest/document", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/v1/ingest/document resource limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns an explicit client error when a document replacement was rolled back", async () => {
    mocks.ingest.mockResolvedValueOnce({
      success: false,
      tenantId: "tenant-test",
      totalChunks: 2,
      processedChunks: 0,
      failedChunks: 1,
      errors: [{ chunkIndex: 1, error: "embedding provider unavailable" }],
      rolledBack: true,
      attemptedProcessedChunks: 1,
    });

    const response = await POST(makeRequest({ text: "valid brand profile text", metadata: { source: "brand-profile", documentId: "brand-profile" } }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({ success: false, rolledBack: true, processedChunks: 0, failedChunks: 1 });
  });


  it("returns multi-status when a non-atomic ingestion has failed chunks", async () => {
    mocks.ingest.mockResolvedValueOnce({
      success: false,
      tenantId: "tenant-test",
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 1,
      errors: [{ chunkIndex: 1, error: "provider unavailable" }],
      rolledBack: false,
      attemptedProcessedChunks: undefined,
    });

    const response = await POST(makeRequest({ text: "valid document text" }));
    const body = await response.json();

    expect(response.status).toBe(207);
    expect(body).toMatchObject({ success: false, totalChunks: 2, processedChunks: 1, failedChunks: 1 });
  });

});
