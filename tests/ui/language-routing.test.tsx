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
    useReducedMotion: () => false,
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
    vi.useRealTimers();
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
    fireEvent.click(view.container.querySelector('[data-testid="desktop-dock-trigger"]')!);

    let settingsLink: HTMLAnchorElement | null = null;
    await waitFor(() => {
      settingsLink = view.container.querySelector<HTMLAnchorElement>('a[href="/fa/dashboard/content/studio"]');
      expect(settingsLink).not.toBeNull();
    });

    fireEvent.click(settingsLink!);

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).toBeNull();
    });

    navigation.pathname = "/fa/dashboard/content/studio";
    setBrowserUrl("/fa/dashboard/content/studio");
    view.rerender(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    // The target pathname is committed, but the transition guard must keep the
    // dock hidden for the short settling window so it cannot overlay a white frame.
    expect(view.container.querySelector('a[href="/fa/dashboard/aeo/playground"]')).toBeNull();

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/fa/dashboard/aeo/playground"]')).not.toBeNull();
    });
  });

  it("restores the dock when navigation returns to its source path before the settle timer expires", async () => {
    const sourcePath = "/fa/dashboard/seo/technical";
    navigation.pathname = sourcePath;
    setBrowserUrl(sourcePath);

    const view = render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    const desktopDock = view.container.querySelector('div[class*="fixed bottom-6"]');
    expect(desktopDock).not.toBeNull();
    fireEvent.click(view.container.querySelector('[data-testid="desktop-dock-trigger"]')!);

    let settingsLink: HTMLAnchorElement | null = null;
    await waitFor(() => {
      settingsLink = view.container.querySelector<HTMLAnchorElement>('a[href="/fa/dashboard/content/studio"]');
      expect(settingsLink).not.toBeNull();
    });

    fireEvent.click(settingsLink!);
    expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).toBeNull();

    navigation.pathname = "/fa/dashboard/content/studio";
    setBrowserUrl("/fa/dashboard/content/studio");
    view.rerender(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );
    expect(view.container.querySelector('a[href="/fa/dashboard/aeo/playground"]')).toBeNull();

    // Simulate an immediate Back/redirect to the original pathname, before 300 ms elapses.
    navigation.pathname = sourcePath;
    setBrowserUrl(sourcePath);
    view.rerender(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );
    expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).toBeNull();

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).not.toBeNull();
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
    fireEvent.click(view.container.querySelector('[data-testid="desktop-dock-trigger"]')!);

    let settingsLink: HTMLAnchorElement | null = null;
    await waitFor(() => {
      settingsLink = view.container.querySelector<HTMLAnchorElement>('a[href="/fa/dashboard/content/studio"]');
      expect(settingsLink).not.toBeNull();
    });

    vi.useFakeTimers();
    fireEvent.click(settingsLink!);
    expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(view.container.querySelector('a[href="/fa/dashboard/content/studio"]')).not.toBeNull();
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


  it("opens the desktop quick-action dock only after the hover delay", () => {
    vi.useFakeTimers();
    render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    const trigger = screen.getByTestId("desktop-dock-trigger");
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.queryByTestId("quick-action-playground")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("quick-action-playground")).toHaveAttribute(
      "href",
      "/fa/dashboard/aeo/playground"
    );
  });

  it("requires a second mobile tap within three seconds to open the dock", () => {
    vi.useFakeTimers();
    render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    const trigger = screen.getByTestId("mobile-dock-trigger");
    fireEvent.click(trigger);
    expect(screen.getByRole("status")).toHaveTextContent("دوباره ضربه بزنید");
    expect(screen.queryByTestId("quick-action-playground")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2_999);
    });
    fireEvent.click(trigger);
    expect(screen.getByTestId("quick-action-playground")).toHaveAttribute(
      "href",
      "/fa/dashboard/aeo/playground"
    );
  });

  it("expires the mobile activation hint after three seconds without opening the dock", () => {
    vi.useFakeTimers();
    render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("mobile-dock-trigger"));
    expect(screen.getByRole("status")).toHaveTextContent("دوباره ضربه بزنید");
    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByTestId("quick-action-playground")).toBeNull();
  });

  it("keeps logout behind an explicit confirmation step", () => {
    render(
      <ThemeProvider initialLanguage="fa">
        <FloatingSidebar />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("desktop-dock-trigger"));
    fireEvent.click(screen.getByTestId("quick-action-logout"));

    expect(screen.getByRole("group", { name: "تأیید خروج از حساب" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأیید خروج" })).toBeInTheDocument();
  });

});
