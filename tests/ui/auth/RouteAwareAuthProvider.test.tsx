import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { RouteAwareAuthProvider } from "@/components/auth/RouteAwareAuthProvider";

const mocks = vi.hoisted(() => ({
  pathname: "/en",
  getServerSessionAction: vi.fn(async () => ({ user: null, expiresAt: null, status: "unauthenticated" as const })),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  registerAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/app/actions/auth", () => ({
  getServerSessionAction: mocks.getServerSessionAction,
  loginAction: mocks.loginAction,
  logoutAction: mocks.logoutAction,
  registerAction: mocks.registerAction,
}));

function Probe() { return <span>provider-mounted</span>; }

describe("RouteAwareAuthProvider", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("skips the server session action on the localized homepage", async () => {
    mocks.pathname = "/en";
    render(<RouteAwareAuthProvider><Probe /></RouteAwareAuthProvider>);
    expect(screen.getByText("provider-mounted")).toBeInTheDocument();
    await waitFor(() => expect(mocks.getServerSessionAction).not.toHaveBeenCalled());
  });

  it("performs the server session action on a localized login route", async () => {
    mocks.pathname = "/en/login";
    render(<RouteAwareAuthProvider><Probe /></RouteAwareAuthProvider>);
    await waitFor(() => expect(mocks.getServerSessionAction).toHaveBeenCalledTimes(1));
  });
});
