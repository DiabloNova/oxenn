import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(async () => ({ tenantId: "tenant-test", userId: "user-test" })),
  runWithTenant: vi.fn(async (...args: unknown[]) => {
    const callback = args[3] as () => Promise<unknown>;
    return callback();
  }),
  analyze: vi.fn(async () => ({
    score: 0,
    label: "neutral",
    confidence: 0.5,
    emotions: ["neutral"],
  })),
}));

vi.mock("@/services/auth/authorization", () => ({
  authorizeApiRequest: mocks.authorize,
  authorizationErrorResponse: vi.fn(() => null),
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: mocks.runWithTenant },
}));

vi.mock("@/services/ai/sentiment-analysis", () => ({
  analyzeSentiment: mocks.analyze,
}));

import { POST } from "@/app/api/v1/ai/sentiment/route";

function makeRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/ai/sentiment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/v1/ai/sentiment resource limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects oversized direct text before invoking sentiment analysis", async () => {
    const response = await POST(makeRequest({ text: "x".repeat(32 * 1024 + 1) }));

    expect(response.status).toBe(400);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });

  it("rejects a streamed body above the route cap before parsing or provider work", async () => {
    const response = await POST(makeRequest({ text: "x".repeat(256 * 1024) }));

    expect(response.status).toBe(413);
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
});
