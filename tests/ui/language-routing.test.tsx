import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import DashboardTopbar from "@/components/navigation/DashboardTopbar";

const navigation = vi.hoisted(() => ({
  pathname: "/fa/dashboard/seo/technical",
  router: {
    back: vi.fn(),
    forward: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    session: {
      user: {
        workspaceId: "ws-tehran",
        name: "Test User",
        email: "test@example.com",
      },
      expiresAt: null,
      status: "authenticated",
    },
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");
  const motionOnlyProps = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "layout",
    "layoutId",
    "onAnimationComplete",
  ]);
  const components = new Map<string, unknown>();
  const motion = new Proxy(
    {},
    {
      get: (_target, elementName) => {
        const tagName = String(elementName);
        if (!components.has(tagName)) {
          components.set(
            tagName,
            ReactModule.forwardRef<HTMLElement, Record<string, unknown>>(
              ({ children, ...props }, ref) => {
                const domProps = Object.fromEntries(
                  Object.entries(props).filter(([name]) => !motionOnlyProps.has(name))
                );
                return ReactModule.createElement(
                  tagName,
                  { ...domProps, ref },
                  children as React.ReactNode
                );
              }
            )
          );
        }
        return components.get(tagName);
      },
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

function LanguageProbe({ targetLanguage }: { targetLanguage: "en" | "fa" }) {
  const { language, direction, setLanguage } = useTheme();

  return (
    <div>
      <output data-testid="language">{language}</output>
      <output data-testid="direction">{direction}</output>
      <button type="button" onClick={() => setLanguage(targetLanguage)}>
        Set language
      </button>
    </div>
  );
}

function renderLanguageProbe(initialLanguage: "en" | "fa", targetLanguage: "en" | "fa") {
  return render(
    <ThemeProvider initialLanguage={initialLanguage}>
      <LanguageProbe targetLanguage={targetLanguage} />
    </ThemeProvider>
  );
}

function setBrowserUrl(path: string) {
  window.history.replaceState({}, "", path);
}

describe("localized language routing contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    navigation.pathname = "/fa/dashboard/seo/technical";
    setBrowserUrl("/fa/dashboard/seo/technical?tab=links#findings");

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("changes fa to en with one route replacement while preserving the page, query, and hash", async () => {
    renderLanguageProbe("fa", "en");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("fa");
      expect(screen.getByTestId("direction")).toHaveTextContent("rtl");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set language" }));

    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/en/dashboard/seo/technical?tab=links#findings"
    );
    expect(navigation.router.push).not.toHaveBeenCalled();
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it("changes en to fa with one route replacement while preserving the page, query, and hash", async () => {
    navigation.pathname = "/en/dashboard/seo/technical";
    setBrowserUrl("/en/dashboard/seo/technical?tab=links#findings");

    renderLanguageProbe("en", "fa");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("en");
      expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set language" }));

    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/fa/dashboard/seo/technical?tab=links#findings"
    );
    expect(navigation.router.push).not.toHaveBeenCalled();
    expect(screen.getByTestId("language")).toHaveTextContent("fa");
    expect(screen.getByTestId("direction")).toHaveTextContent("rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("treats the locale in /en/pricing as authoritative over stale Persian localStorage", async () => {
    navigation.pathname = "/en/pricing";
    setBrowserUrl("/en/pricing");
    localStorage.setItem("language", "fa");

    renderLanguageProbe("en", "fa");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("en");
      expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
      expect(document.documentElement).toHaveAttribute("lang", "en");
      expect(document.documentElement).toHaveAttribute("dir", "ltr");
    });
  });

  it("does not perform a second navigation from DashboardTopbar after setLanguage", async () => {
    render(
      <ThemeProvider initialLanguage="fa">
        <DashboardTopbar onMenuTrigger={vi.fn()} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Toggle language" })).toHaveTextContent("fa");
    });

    fireEvent.click(screen.getByRole("button", { name: "Toggle language" }));

    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/en/dashboard/seo/technical?tab=links#findings"
    );
    expect(navigation.router.push).not.toHaveBeenCalled();
  });
});
