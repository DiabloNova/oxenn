import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(async () => ({ tenantId: "tenant-test", userId: "user-test" })),
  runWithTenant: vi.fn(async (...args: unknown[]) => {
    const callback = args[3] as () => Promise<unknown>;
    return callback();
  }),
  answer: vi.fn(async () => ({ answer: "ok", sources: [], confidence: 0 })),
}));

vi.mock("@/services/auth/authorization", () => ({
  authorizeApiRequest: mocks.authorize,
  authorizationErrorResponse: vi.fn(() => null),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: mocks.runWithTenant },
}));

vi.mock("@/services/rag/query-service", () => ({
  answerQuestion: mocks.answer,
}));

import { POST } from "@/app/api/v1/rag/query/route";

function makeRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/rag/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/v1/rag/query resource limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects excessive retrieval limits before embedding or retrieval", async () => {
    const response = await POST(makeRequest({ question: "سلام", limit: 21 }));

    expect(response.status).toBe(400);
    expect(mocks.answer).not.toHaveBeenCalled();
  });

  it("rejects direct request bodies above the route cap", async () => {
    const response = await POST(makeRequest({ question: "x".repeat(16 * 1024) }));

    expect(response.status).toBe(413);
    expect(mocks.answer).not.toHaveBeenCalled();
  });
});
