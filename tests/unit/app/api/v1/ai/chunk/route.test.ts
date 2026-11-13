import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  MAX_CHUNK_REQUEST_BYTES,
  MAX_CHUNK_TEXT_BYTES,
} from "@/services/ai/resource-limits";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(async () => ({ tenantId: "tenant-test", userId: "user-test" })),
  runWithTenant: vi.fn(async (...args: unknown[]) => {
    const callback = args[3] as () => Promise<unknown>;
    return callback();
  }),
  chunkText: vi.fn(() => ["valid chunk"]),
}));

vi.mock("@/services/auth/authorization", () => ({
  authorizeApiRequest: mocks.authorize,
  authorizationErrorResponse: vi.fn(() => null),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: mocks.runWithTenant },
}));

vi.mock("@/services/ai/text-chunker", () => ({
  chunkText: mocks.chunkText,
}));

import { POST } from "@/app/api/v1/ai/chunk/route";

function makeRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/ai/chunk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/v1/ai/chunk resource limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a max chunk size above the shared limit before chunking", async () => {
    const response = await POST(makeRequest({
      text: "valid text",
      maxChunkSize: 4_001,
      overlap: 10,
    }));

    expect(response.status).toBe(400);
    expect(mocks.chunkText).not.toHaveBeenCalled();
  });

  it("rejects an overlap that leaves too little room for chunk content", async () => {
    const response = await POST(makeRequest({ text: "valid text", maxChunkSize: 10, overlap: 7 }));

    expect(response.status).toBe(400);
    expect(mocks.chunkText).not.toHaveBeenCalled();
  });

  it("accepts the maximum text size with worst-case JSON escaping", async () => {
    const response = await POST(makeRequest({ text: "\u0000".repeat(MAX_CHUNK_TEXT_BYTES) }));

    expect(response.status).toBe(200);
    expect(mocks.chunkText).toHaveBeenCalledOnce();
  });

  it("rejects direct request bodies above the bounded JSON byte cap", async () => {
    const response = await POST(makeRequest({ text: "x".repeat(MAX_CHUNK_REQUEST_BYTES) }));

    expect(response.status).toBe(413);
    expect(mocks.chunkText).not.toHaveBeenCalled();
  });
});
