import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OwnerDefinedPage } from "@/components/features/dashboard/OwnerDefinedPage";

const theme = vi.hoisted(() => ({ language: "en", direction: "ltr" }));
vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => theme }));

describe("OwnerDefinedPage accessibility", () => {
  afterEach(() => {
    cleanup();
    theme.language = "en";
    theme.direction = "ltr";
  });

  it("supports arrow, Home and End keyboard navigation with roving tab focus", () => {
    render(
      <OwnerDefinedPage
        titleEn="AI answer insights"
        titleFa="بینش پاسخ هوش مصنوعی"
        tabs={[
          { id: "visibility", labelEn: "Visibility", labelFa: "قابلیت مشاهده" },
          { id: "sentiment", labelEn: "Sentiment", labelFa: "احساسات" },
          { id: "mentions", labelEn: "Mentions", labelFa: "اشاره‌ها" },
        ]}
      />,
    );

    const visibility = screen.getByRole("tab", { name: "Visibility" });
    const sentiment = screen.getByRole("tab", { name: "Sentiment" });
    const mentions = screen.getByRole("tab", { name: "Mentions" });
    expect(visibility).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(visibility, { key: "ArrowRight" });
    expect(sentiment).toHaveFocus();
    expect(sentiment).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(sentiment, { key: "End" });
    expect(mentions).toHaveFocus();
    fireEvent.keyDown(mentions, { key: "Home" });
    expect(visibility).toHaveFocus();
  });

  it("uses the opposite arrow direction for right-to-left tab lists", () => {
    theme.language = "fa";
    theme.direction = "rtl";
    render(
      <OwnerDefinedPage
        titleEn="AI answer insights"
        titleFa="بینش پاسخ هوش مصنوعی"
        tabs={[
          { id: "visibility", labelEn: "Visibility", labelFa: "قابلیت مشاهده" },
          { id: "sentiment", labelEn: "Sentiment", labelFa: "احساسات" },
        ]}
      />,
    );

    const visibility = screen.getByRole("tab", { name: "قابلیت مشاهده" });
    const sentiment = screen.getByRole("tab", { name: "احساسات" });
    fireEvent.keyDown(visibility, { key: "ArrowLeft" });
    expect(sentiment).toHaveFocus();
  });

  it("presents owner-specified GEO areas as equal, unordered items", () => {
    render(
      <OwnerDefinedPage
        titleEn="Language model analytics"
        titleFa="تحلیل ماشین‌های زبانی"
        sections={[
          { id: "content", titleEn: "AI answer content", titleFa: "تولید محتوای مبتنی بر پاسخ هوش مصنوعی" },
          { id: "citations", titleEn: "Internal citations", titleFa: "ساختار استناد داخلی برند" },
        ]}
      />,
    );

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("listitem", { name: /priority|step/i })).not.toBeInTheDocument();
  });
});
