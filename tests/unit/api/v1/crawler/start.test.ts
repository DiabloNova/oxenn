import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { runCrawlerCampaignMock } = vi.hoisted(() => ({ runCrawlerCampaignMock: vi.fn() }));

vi.mock("@/services/crawler/crawler-orchestrator", () => ({
  CrawlerOrchestrator: class {
    runCrawlerCampaign = runCrawlerCampaignMock;
  },
}));

import { POST } from "@/app/api/v1/crawler/start/route";

describe("Legacy crawler start request bounds", () => {
  beforeEach(() => vi.clearAllMocks());

  async function post(seedUrls: string[]) {
    return POST(new NextRequest("http://localhost/api/v1/crawler/start", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "tenant-test" },
      body: JSON.stringify({ seedUrls }),
    }));
  }

  it("rejects more than 50 seed URLs before starting a campaign", async () => {
    const response = await post(Array.from({ length: 51 }, (_, index) => `https://example${index}.com`));
    expect(response.status).toBe(400);
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });

  it("rejects a seed URL longer than 2048 characters before starting a campaign", async () => {
    const longUrl = `https://example.com/${"a".repeat(2040)}`;
    const response = await post([longUrl]);
    expect(response.status).toBe(400);
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });
});
