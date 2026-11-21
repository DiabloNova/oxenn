import React, { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import { Tabs } from "@/components/Tabs";

const navigationState = vi.hoisted(() => ({ pathname: "/en/dashboard" }));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ language: "en", direction: "ltr" }),
}));
vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { name: "Test User", email: "test@example.com" } },
    logout: vi.fn(),
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/navigation-transition", () => ({
  notifyNavigationStart: vi.fn(),
}));
vi.mock("@/components/marketing/SeorchableLogo", () => ({
  SeorchableLogo: () => <span aria-hidden="true">OXENN</span>,
}));
vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");
  type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  };
  const MotionDiv = ReactModule.forwardRef<HTMLDivElement, MotionDivProps>((props, ref) => {
    const domProps = { ...props };
    delete domProps.initial;
    delete domProps.animate;
    delete domProps.exit;
    delete domProps.transition;
    const children = domProps.children;
    delete domProps.children;
    return ReactModule.createElement("div", { ...domProps, ref }, children);
  });
  MotionDiv.displayName = "MockMotionDiv";
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

const SidebarHarness = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setMobileOpen(true)}>Open navigation</button>
      <DashboardSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
    </>
  );
};

describe("dashboard navigation accessibility", () => {
  afterEach(() => {
    cleanup();
    navigationState.pathname = "/en/dashboard";
  });
  it("traps mobile drawer focus in both directions and restores focus to its trigger", async () => {
    render(<SidebarHarness />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    const closeButton = screen.getByRole("button", { name: "Close menu" });
    expect(document.activeElement).toBe(closeButton);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select')
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.click(closeButton);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });


  it("keeps Analytics and Agent as independent navigation modes", () => {
    const { rerender } = render(<SidebarHarness />);

    expect(screen.getByRole("button", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Your brand" })).toBeInTheDocument();

    navigationState.pathname = "/en/dashboard/agent";
    rerender(<SidebarHarness />);

    expect(screen.getByRole("button", { name: "Agent" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByText("Conversation history")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Test User/ })).toBeInTheDocument();

    navigationState.pathname = "/en/dashboard";
    rerender(<SidebarHarness />);

    expect(screen.getByRole("button", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Your brand" })).toBeInTheDocument();
  });

  it("supports controlled desktop sidebar collapse and expansion without losing navigation controls", () => {
    render(<SidebarHarness />);

    expect(screen.getByText("Your brand")).toBeInTheDocument();
    const collapseButton = screen.getByRole("button", { name: "Toggle Sidebar Collapse" });

    fireEvent.click(collapseButton);
    expect(screen.queryByText("Your brand")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Your brand" })).toBeInTheDocument();

    fireEvent.click(collapseButton);
    expect(screen.getByText("Your brand")).toBeInTheDocument();
  });

  it("exposes tab semantics and activates adjacent tabs with direction-aware arrow keys", () => {
    render(
      <div dir="rtl">
        <Tabs
          tabs={[
            { id: "overview", label: "Overview", content: <p>Overview panel</p> },
            { id: "sources", label: "Sources", content: <p>Sources panel</p> },
            { id: "topics", label: "Topics", content: <p>Topics panel</p> },
          ]}
        />
      </div>
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview panel");

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[2]).toHaveFocus();
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Topics panel");

    fireEvent.keyDown(tabs[2], { key: "Home" });
    expect(tabs[0]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview panel");

    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(tabs[2]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Topics panel");
  });
});
