import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AeoInsightsPage from "@/app/[locale]/dashboard/aeo/page";
import SeoPage from "@/app/[locale]/dashboard/seo/page";
import GeoPage from "@/app/[locale]/dashboard/geo/page";

const theme = vi.hoisted(() => ({ language: "en", direction: "ltr" }));
vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => theme }));

describe("owner-approved dashboard page structure", () => {
  afterEach(() => {
    cleanup();
    theme.language = "en";
    theme.direction = "ltr";
  });

  it("renders exactly the six approved AEO tabs", () => {
    render(<AeoInsightsPage />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(6);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Visibility",
      "Perception",
      "Sources",
      "Topics",
      "Queries",
      "Geography",
    ]);
    expect(screen.queryByRole("tab", { name: "Sentiment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Mentions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Fan-out" })).not.toBeInTheDocument();
  });

  it("retains the six approved SEO tabs", () => {
    render(<SeoPage />);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Overview",
      "Search engine pages",
      "Search engine crawls",
      "Visits",
      "Logs",
      "Settings",
    ]);
  });

  it("retains the five approved GEO sections without converting them into tabs", () => {
    render(<GeoPage />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "AI-answer-based content generation",
      "Brand internal citation structure",
      "Technical issues",
      "Sitemap",
      "Brand understanding by language models",
    ]);
  });
});
