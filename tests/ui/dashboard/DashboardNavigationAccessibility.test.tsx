import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import { Tabs } from "@/components/Tabs";

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
  usePathname: () => "/en/dashboard",
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
  const MotionDiv = ReactModule.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
    ({ children, initial, animate, exit, transition, ...props }, ref) =>
      ReactModule.createElement("div", { ...props, ref }, children)
  );
  MotionDiv.displayName = "MockMotionDiv";
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

const SidebarHarness = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setMobileOpen(true)}>Open navigation</button>
      <DashboardSidebar
        collapsed={false}
        setCollapsed={vi.fn()}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
    </>
  );
};

describe("dashboard navigation accessibility", () => {
  it("traps mobile drawer focus in both directions and restores focus to its trigger", async () => {
    render(<SidebarHarness />);

    const trigger = screen.getByRole("button", { name: "Open navigation" });
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
