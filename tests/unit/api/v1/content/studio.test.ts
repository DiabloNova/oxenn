import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { scrapeUrlMock, generateTextMock } = vi.hoisted(() => ({
  scrapeUrlMock: vi.fn(),
  generateTextMock: vi.fn(),
}));

vi.mock("@/lib/firecrawl", () => ({ firecrawlApp: { scrapeUrl: scrapeUrlMock } }));
vi.mock("@/services/ai/llm-client", () => ({
  getLLMClient: vi.fn(() => ({ generateText: generateTextMock })),
}));

import { POST } from "@/app/api/v1/content/studio/route";
import { getLLMClient } from "@/services/ai/llm-client";

describe("Content Studio request bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(body: unknown) {
    return POST(new NextRequest("http://localhost/api/v1/content/studio", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "tenant-test" },
      body: JSON.stringify(body),
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
});
