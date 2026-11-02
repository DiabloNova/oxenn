import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { runCrawlerCampaignMock, authorizeApiRequestMock } = vi.hoisted(() => ({
  runCrawlerCampaignMock: vi.fn(),
  authorizeApiRequestMock: vi.fn(),
}));

vi.mock("@/services/crawler/crawler-orchestrator", () => ({
  CrawlerOrchestrator: class {
    runCrawlerCampaign = runCrawlerCampaignMock;
  },
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return { ...actual, authorizeApiRequest: authorizeApiRequestMock };
});

import { POST } from "@/app/api/v1/crawler/start/route";

describe("Legacy crawler start request bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({ userId: "user-test", tenantId: "tenant-test" });
    runCrawlerCampaignMock.mockResolvedValue({ success: true, campaignId: "campaign-test" });
  });

  async function post(seedUrls: string[]) {
    return POST(new NextRequest("http://localhost/api/v1/crawler/start", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "forged-tenant",
        "x-user-id": "forged-user",
      },
      body: JSON.stringify({ seedUrls }),
    }));
  }

  it("returns 401 and does not start a campaign when authorization fails despite forged identity headers", async () => {
    const { AuthorizationError } = await import("@/services/auth/authorization");
    authorizeApiRequestMock.mockRejectedValueOnce(
      new AuthorizationError(401, "Unauthorized: A valid server session is required."),
    );

    const response = await post(["https://example.com"]);
    const body = await response.json();

    expect(authorizeApiRequestMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });

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
    expect(authorizeApiRequestMock).toHaveBeenCalledTimes(1);
    expect(runCrawlerCampaignMock).toHaveBeenCalledWith(seedUrls, "tenant-test", "user-test", expect.any(String));
  });

  it("rejects a seed URL longer than 2048 characters before starting a campaign", async () => {
    const longUrl = `https://example.com/${"a".repeat(2040)}`;
    const response = await post([longUrl]);
    expect(response.status).toBe(400);
    expect(runCrawlerCampaignMock).not.toHaveBeenCalled();
  });
});
