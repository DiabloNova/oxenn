import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  pathname: "/fa/dashboard",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/navigation-transition", () => ({ notifyNavigationStart: vi.fn() }));

import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

function ThemeProbe() {
  const { theme, setTheme, language, direction, setLanguage } = useTheme();
  return (
    <div>
      <output data-testid="theme-state">{theme}|{language}|{direction}</output>
      <button type="button" onClick={() => setTheme("dark")}>Set dark theme</button>
      <button type="button" onClick={() => setLanguage("en")}>Switch to English</button>
    </div>
  );
}

describe("ThemeProvider external preferences", () => {
  afterEach(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    cleanup();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.removeAttribute("lang");
    document.documentElement.removeAttribute("dir");
    mocks.pathname = "/fa/dashboard";
    mocks.replace.mockClear();
  });

  it("keeps the route locale authoritative over a stale stored language", () => {
    window.localStorage.setItem("language", "en");
    render(<ThemeProvider initialLanguage="fa"><ThemeProbe /></ThemeProvider>);

    expect(screen.getByTestId("theme-state")).toHaveTextContent("light|fa|rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(window.localStorage.getItem("language")).toBe("fa");
  });

  it("updates theme state and the document class when setTheme is called", () => {
    render(<ThemeProvider initialLanguage="fa"><ThemeProbe /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Set dark theme" }));

    expect(screen.getByTestId("theme-state")).toHaveTextContent("dark|fa|rtl");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("applies external theme preference changes to the document class", () => {
    render(<ThemeProvider initialLanguage="fa"><ThemeProbe /></ThemeProvider>);
    window.localStorage.setItem("theme", "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    expect(screen.getByTestId("theme-state")).toHaveTextContent("dark|fa|rtl");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("keeps the current locale authoritative until navigation commits", () => {
    window.history.replaceState({}, "", "/fa/dashboard?tab=seo#overview");
    const { rerender } = render(<ThemeProvider initialLanguage="fa"><ThemeProbe /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));

    expect(screen.getByTestId("theme-state")).toHaveTextContent("light|fa|rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(window.localStorage.getItem("language")).toBe("fa");
    expect(mocks.replace).toHaveBeenCalledWith("/en/dashboard?tab=seo#overview");
    mocks.pathname = "/en/dashboard";
    window.history.replaceState({}, "", "/en/dashboard?tab=seo#overview");
    rerender(<ThemeProvider initialLanguage="fa"><ThemeProbe /></ThemeProvider>);
    expect(screen.getByTestId("theme-state")).toHaveTextContent("light|en|ltr");
    expect(window.localStorage.getItem("language")).toBe("en");
  });
});
