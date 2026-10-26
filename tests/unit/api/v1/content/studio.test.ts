import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { scrapeUrlMock, generateTextMock, runWithTenantContextMock } = vi.hoisted(() => ({
  scrapeUrlMock: vi.fn(),
  generateTextMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
}));

vi.mock("@/lib/firecrawl", () => ({ firecrawlApp: { scrapeUrl: scrapeUrlMock } }));
vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: vi.fn(() => ({ generateText: generateTextMock })),
}));
vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: { runWithTenantContext: runWithTenantContextMock },
}));

import { POST } from "@/app/api/v1/content/studio/route";
import { getLLMClient } from "@/services/ai/llm-client";

describe("Content Studio request bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");
    runWithTenantContextMock.mockImplementation((...args: unknown[]) => {
      const callback = args[args.length - 1];
      return (callback as () => unknown)();
    });
    scrapeUrlMock.mockResolvedValue({ markdown: "test content" });
    generateTextMock.mockResolvedValue(JSON.stringify({
      semanticHealthScore: 90,
      terminologySuggestions: [],
      generatedContent: [{ title: "Title", outline: ["Outline"], seoScore: 90 }],
    }));
  });

  async function post(fields: Record<string, unknown>) {
    return POST(new NextRequest("http://localhost/api/v1/content/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "tenant-test" },
      body: JSON.stringify({ url: "https://example.com", ...fields }),
    }));
  }

  it.each([
    ["more than 100 target keywords", { targetKeywords: Array.from({ length: 101 }, () => "seo") }],
    ["a keyword longer than 200 characters", { targetKeywords: ["k".repeat(201)] }],
    ["brand voice longer than 200 characters", { brandVoice: "v".repeat(201) }],
  ])("rejects %s before invoking external services", async (_label, fields) => {
    const response = await post(fields);
    expect(response.status).toBe(400);
    expect(scrapeUrlMock).not.toHaveBeenCalled();
    expect(getLLMClient).not.toHaveBeenCalled();
  });

  it("accepts keywords and brand voice exactly at their configured limits", async () => {
    const response = await post({ targetKeywords: Array.from({ length: 100 }, () => "k".repeat(200)), brandVoice: "v".repeat(200) });
    expect(response.status).toBe(200);
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "usr-studio-default",
      "req-content-studio",
      expect.any(Function),
    );
    expect(scrapeUrlMock).toHaveBeenCalledWith("https://example.com", { formats: ["markdown"] });
    expect(getLLMClient).toHaveBeenCalledTimes(1);
  });
});
