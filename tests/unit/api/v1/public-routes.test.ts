import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { scrapeUrlMock } = vi.hoisted(() => ({
  scrapeUrlMock: vi.fn(),
}));

vi.mock("@/lib/firecrawl", () => ({
  firecrawlApp: {
    scrapeUrl: scrapeUrlMock,
  },
}));

import { POST as freeAuditPost } from "@/app/api/v1/audit/free/route";
import { GET as docsGet } from "@/app/api/v1/docs/route";

describe("Public API routes remain accessible without a user session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("keeps the free audit public without cookies or Bearer credentials", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-public-route-test-key");
    scrapeUrlMock.mockResolvedValueOnce({
      success: true,
      markdown: "# Public website\nPublic audit fixture.",
      metadata: {
        title: "Public website audit fixture",
        description: "A public route fixture used to verify that free audits do not require a signed-in user.",
        language: "en",
        robots: "index, follow",
      },
    });

    const request = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "forged-user",
        "x-tenant-id": "forged-tenant",
      },
      body: JSON.stringify({ url: "https://public.example" }),
    });

    const response = await freeAuditPost(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.score).toEqual(expect.any(Number));
    expect(scrapeUrlMock).toHaveBeenCalledWith("https://public.example", {
      formats: ["markdown"],
    });
  });

  it("keeps public documentation lookup accessible without cookies or Bearer credentials", async () => {
    const request = new Request("http://localhost/api/v1/docs?slug=README&domain=api");
    const response = await docsGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.content).toEqual(expect.any(String));
    expect(body.content.length).toBeGreaterThan(0);
  });
});
