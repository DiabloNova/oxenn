import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  extractSeedLinksMock,
  fetchAndExtractTextMock,
} = vi.hoisted(() => ({
  extractSeedLinksMock: vi.fn(),
  fetchAndExtractTextMock: vi.fn(),
}));

vi.mock("@/services/crawler/link-discovery", () => ({
  extractSeedLinks: extractSeedLinksMock
}));
vi.mock("@/services/crawler/web-crawler", () => ({
  fetchAndExtractText: fetchAndExtractTextMock
}));
import { CrawlerOrchestrator } from "@/services/crawler/crawler-orchestrator";

describe("CrawlerOrchestrator redirect policy propagation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractSeedLinksMock.mockResolvedValue(["https://page.example/article"]);
    fetchAndExtractTextMock.mockResolvedValue("x".repeat(120));
  });

  it("forwards the paid redirect policy to discovery and text fetching", async () => {
    const ingestion = {
      ingestDocument: vi.fn().mockResolvedValue({
        success: true,
        totalChunks: 1,
        processedChunks: 1,
        failedChunks: 0
      })
    };
    const orchestrator = new CrawlerOrchestrator(ingestion as never);
    const paidPolicy = { maxRedirects: 10, maxRedirectDurationMs: 60_000 };
    const fetcher = vi.fn();

    await orchestrator.runCrawlerCampaign(
      ["https://seed.example"],
      "tenant-test",
      "user-test",
      "request-test",
      paidPolicy,
      fetcher
    );

    expect(extractSeedLinksMock).toHaveBeenCalledWith(
      "https://seed.example",
      5,
      paidPolicy,
      fetcher
    );
    expect(fetchAndExtractTextMock).toHaveBeenCalledWith(
      "https://page.example/article",
      paidPolicy,
      fetcher
    );
    expect(ingestion.ingestDocument).toHaveBeenCalledWith(
      "x".repeat(120),
      expect.objectContaining({ source: "web-crawler", url: "https://page.example/article" }),
      undefined,
      { tenantId: "tenant-test", userId: "user-test", requestId: "request-test" },
    );
  });
});
