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

  it("accepts 50 seed URLs and a URL exactly 2048 characters long", async () => {
    const maxLengthUrl = `https://e.co/${"a".repeat(2035)}`;
    expect(maxLengthUrl).toHaveLength(2048);
    const seedUrls = [maxLengthUrl, ...Array.from({ length: 49 }, () => "https://example.com")];
    const response = await post(seedUrls);
    expect(response.status).toBe(200);
    expect(runCrawlerCampaignMock).toHaveBeenCalledWith(seedUrls, "tenant-test", "system_crawler", expect.any(String));
  });

  it("rejects a seed URL longer than 2048 characters before starting a campaign", async () => {
    const longUrl = `https://example.com/${"a".repeat(2040)}`;
    const response = await post([longUrl]);
    expect(response.status).toBe(400);
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });
});
