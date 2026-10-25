import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PremiumHomeExperience } from "@/components/marketing/PremiumHomeExperience";

const navigation = vi.hoisted(() => ({ push: vi.fn(), pathname: "/en" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));

function renderHome(locale: "en" | "fa" = "en") {
  return render(
    <ThemeProvider initialLanguage={locale}>
      <PremiumHomeExperience locale={locale} />
    </ThemeProvider>,
  );
}

describe("PremiumHomeExperience", () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.push.mockClear();
    navigation.pathname = "/en";
  });

  afterEach(() => cleanup());

  it("renders icon-only public navigation and marks the home route active", () => {
    renderHome();
    expect(screen.getByRole("navigation", { name: "Main site navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute("href", "/en/about");
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute("href", "/en/docs");
    expect(document.querySelector(".oxen-nav-logo")?.textContent?.trim()).toBe("");
  });

  it("switches the existing navigation area into search mode", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: "Search Oxenn" }));
    const search = screen.getByRole("searchbox", { name: "Search Oxenn" });
    expect(search).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Main site navigation" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "competitors" } });
    expect(screen.getByRole("link", { name: "Competitors" })).toHaveAttribute("href", "/en/dashboard/competitors");
  });

  it("provides Persian copy and a right-to-left layout", () => {
    navigation.pathname = "/fa";
    renderHome("fa");
    expect(screen.getByRole("navigation", { name: "ناوبری عمومی سایت" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "صفحه اصلی" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelector(".oxen-home-experience")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("button", { name: "تغییر زبان به انگلیسی" })).toBeInTheDocument();
  });

  it("keeps the theme control outside the header and toggles the preview theme", () => {
    renderHome();
    const toggle = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(toggle.closest("header")).toBeNull();
    fireEvent.click(toggle);
    expect(document.querySelector(".oxen-home-experience")).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });
});
