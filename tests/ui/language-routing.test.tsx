import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import DashboardTopbar from "@/components/navigation/DashboardTopbar";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";

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

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      const { href, children, ...rest } = props;
      return ReactModule.createElement(
        "a",
        { ...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>), href: String(href) },
        children as React.ReactNode
      );
    },
  };
});

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      const { href, children, ...rest } = props;
      return ReactModule.createElement(
        "a",
        { ...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>), href: String(href) },
        children as React.ReactNode
      );
    },
  };
});

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

  it("syncs language and direction when the localized pathname changes", async () => {
    navigation.pathname = "/fa/pricing";
    setBrowserUrl("/fa/pricing");
    localStorage.setItem("language", "fa");

    const view = renderLanguageProbe("fa", "fa");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("fa");
      expect(screen.getByTestId("direction")).toHaveTextContent("rtl");
    });

    navigation.pathname = "/en/pricing";
    setBrowserUrl("/en/pricing");
    view.rerender(
      <ThemeProvider initialLanguage="fa">
        <LanguageProbe targetLanguage="fa" />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("en");
      expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
      expect(document.documentElement).toHaveAttribute("lang", "en");
      expect(document.documentElement).toHaveAttribute("dir", "ltr");
    });
    expect(localStorage.getItem("language")).toBe("en");
  });

  it("adds the selected locale to an unprefixed route and preserves query/hash", async () => {
    navigation.pathname = "/dashboard/seo/technical";
    setBrowserUrl("/dashboard/seo/technical?tab=links#findings");

    renderLanguageProbe("fa", "en");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("fa");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set language" }));

    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/en/dashboard/seo/technical?tab=links#findings"
    );
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

  it("canonicalizes an unprefixed route even when the selected language is already Persian", async () => {
    navigation.pathname = "/dashboard/seo/technical";
    setBrowserUrl("/dashboard/seo/technical?tab=links#findings");

    renderLanguageProbe("fa", "fa");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("fa");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set language" }));

    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/fa/dashboard/seo/technical?tab=links#findings"
    );
    expect(navigation.router.push).not.toHaveBeenCalled();
  });
  it("hides the floating workspace dock immediately during route transition and restores it on a workspace destination", async () => {
    navigation.pathname = "/fa/dashboard/seo/technical";
    setBrowserUrl("/fa/dashboard/seo/technical");

    const view = render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    const desktopDock = view.container.querySelector('div[class*="fixed bottom-6"]');
    expect(desktopDock).not.toBeNull();
    fireEvent.mouseEnter(desktopDock!);

    let settingsLink: HTMLAnchorElement | null = null;
    await waitFor(() => {
      settingsLink = view.container.querySelector<HTMLAnchorElement>('a[href="/fa/settings"]');
      expect(settingsLink).not.toBeNull();
    });

    fireEvent.click(settingsLink!);

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/fa/settings"]')).toBeNull();
    });

    navigation.pathname = "/fa/settings";
    setBrowserUrl("/fa/settings");
    view.rerender(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/fa/profile"]')).not.toBeNull();
    });
  });

  it("restores the floating workspace dock if a route transition never commits", async () => {
    navigation.pathname = "/fa/dashboard/seo/technical";
    setBrowserUrl("/fa/dashboard/seo/technical");

    const view = render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    const desktopDock = view.container.querySelector('div[class*="fixed bottom-6"]');
    expect(desktopDock).not.toBeNull();
    fireEvent.mouseEnter(desktopDock!);

    let settingsLink: HTMLAnchorElement | null = null;
    await waitFor(() => {
      settingsLink = view.container.querySelector<HTMLAnchorElement>('a[href="/fa/settings"]');
      expect(settingsLink).not.toBeNull();
    });

    vi.useFakeTimers();
    fireEvent.click(settingsLink!);
    expect(view.container.querySelector('a[href="/fa/settings"]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(view.container.querySelector('a[href="/fa/settings"]')).not.toBeNull();
    vi.useRealTimers();
  });

  it("does not navigate when the selected language already matches the route", async () => {
    navigation.pathname = "/fa/pricing";
    setBrowserUrl("/fa/pricing");

    renderLanguageProbe("fa", "fa");

    await waitFor(() => {
      expect(screen.getByTestId("language")).toHaveTextContent("fa");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set language" }));

    expect(navigation.router.replace).not.toHaveBeenCalled();
    expect(navigation.router.push).not.toHaveBeenCalled();
  });

});
