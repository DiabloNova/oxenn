import { beforeEach, describe, expect, it, vi } from "vitest";

const getDirectory = vi.hoisted(() => vi.fn());
vi.mock("@/services/user-identity/user-website-directory", () => ({ getUserWebsiteDirectory: getDirectory }));

import { resolveAnalysisWebsiteSelection } from "@/services/user-identity/website-selection";

const website = (id: string, url: string, platformType: string) => ({ id, url, platformType, createdAt: "2026-11-22T00:00:00.000Z", updatedAt: "2026-11-22T00:00:00.000Z" });

describe("resolveAnalysisWebsiteSelection", () => {
  beforeEach(() => getDirectory.mockReset());

  it("resolves only the selected user-owned website and normalizes its domain", async () => {
    getDirectory.mockResolvedValue([website("w1", "https://shop.example.com/catalog", "ecommerce_store")]);
    await expect(resolveAnalysisWebsiteSelection("user-1", "w1")).resolves.toMatchObject({
      domain: "shop.example.com", normalizedUrl: "https://shop.example.com", website: { id: "w1" },
    });
  });

  it("does not silently choose a website when no selection is supplied", async () => {
    getDirectory.mockResolvedValue([website("w1", "https://example.com", "official_website")]);
    await expect(resolveAnalysisWebsiteSelection("user-1")).resolves.toBeNull();
  });

  it("does not send social-network pages to crawler-based SEO tools", async () => {
    getDirectory.mockResolvedValue([website("w2", "https://social.example/page", "social_network")]);
    await expect(resolveAnalysisWebsiteSelection("user-1", "w2")).resolves.toBeNull();
  });

  it("rejects IDs that do not belong to the user's website directory", async () => {
    getDirectory.mockResolvedValue([website("w1", "https://example.com", "official_website")]);
    await expect(resolveAnalysisWebsiteSelection("user-1", "w2")).resolves.toBeNull();
  });
});
