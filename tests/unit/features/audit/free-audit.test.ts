import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, FreeAuditResponse } from "@/app/api/v1/audit/free/route";
import { firecrawlApp } from "@/lib/firecrawl";

import type { Document } from "@mendable/firecrawl-js";

describe("Free SEO Audit (Firecrawl Lead Magnet Module)", () => {
  const originalScrapeUrl = firecrawlApp.scrapeUrl;

  afterEach(() => {
    firecrawlApp.scrapeUrl = originalScrapeUrl;
    vi.restoreAllMocks();
  });

  it("Scenario A: Testing Perfect Score (100) & Grade A", async () => {
    vi.spyOn(firecrawlApp, "scrapeUrl").mockImplementation(async (url: string, options?: unknown) => {
      if (!url || !options) return {};
      return {
        markdown: "# Welcome to Optimus AI\nThis is a beautiful page content.",
        metadata: {
          title: "تحلیل پیشرفته سئو معنایی و هوشمندسازی کسب‌وکار آنلاین",
          description: "تحلیل جامع ساختار سئو معنایی، پایش سلامت احساسات برند، استخراج تخصصی گراف دانش و بررسی بهینه‌سازی موتورهای پاسخ‌دهی هوشمند به زبان فارسی انجام می‌گردد.",
          language: "fa",
          robots: "index, follow",
        },
      } satisfies Document;
    });

    const reqA = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "https://optimus.ai" }),
    });

    const resA = await POST(reqA);
    const perfectPayload = (await resA.json()) as FreeAuditResponse;

    expect(resA.status).toBe(200);
    expect(perfectPayload.score).toBe(100);
    expect(perfectPayload.grade).toBe("A");
    expect(perfectPayload.quickTips.length).toBeGreaterThanOrEqual(2);
  });

  it("Scenario B: Testing Poor Score & Grade F", async () => {
    vi.spyOn(firecrawlApp, "scrapeUrl").mockImplementation(async (url: string, options?: unknown) => {
      if (!url || !options) return {};
      return {
        markdown: "No header content at all.",
        metadata: {
          title: "",
          description: "",
          language: "",
          robots: "noindex, nofollow",
        },
      } satisfies Document;
    });

    const reqB = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "http://poor-site.com" }),
    });

    const resB = await POST(reqB);
    const poorPayload = (await resB.json()) as FreeAuditResponse;

    expect(resB.status).toBe(200);
    expect(poorPayload.score).toBe(0);
    expect(poorPayload.grade).toBe("F");

    const { checks } = poorPayload;
    expect(checks.hasTitle).toBe(false);
    expect(checks.hasMetaDescription).toBe(false);
    expect(checks.hasH1).toBe(false);
    expect(checks.isHttps).toBe(false);
    expect(checks.hasLanguage).toBe(false);
    expect(checks.isIndexable).toBe(false);

    const hasTitleTip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("عنوان"));
    const hasMetaTip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("توضیحات"));
    const hasH1Tip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("H1"));

    expect(hasTitleTip).toBe(true);
    expect(hasMetaTip).toBe(true);
    expect(hasH1Tip).toBe(true);
  });

  it("Scenario C: Testing Invalid URL rejection", async () => {
    const reqC = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const resC = await POST(reqC);
    const badUrlPayload = (await resC.json()) as { error: string; message: string };

    expect(resC.status).toBe(400);
    expect(badUrlPayload.message).toContain("لطفاً");
  });
});
