import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

const actions = vi.hoisted(() => ({
  getServerSessionAction: vi.fn(async () => ({
    user: null,
    expiresAt: null,
    status: "unauthenticated" as const,
  })),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  registerAction: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => actions);

function SessionStatus() {
  const { session, logout } = useAuth();
  return <><output>{session.status}</output><button type="button" onClick={() => void logout()}>Sign out</button></>;
}

describe("AuthProvider public homepage isolation", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.removeItem("auth_session_user");
    vi.clearAllMocks();
  });

  it("does not invoke the Workspace-backed session action when explicitly skipped", async () => {
    render(
      <AuthProvider skipSessionCheck>
        <SessionStatus />
      </AuthProvider>
    );

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    await waitFor(() => {
      expect(actions.getServerSessionAction).not.toHaveBeenCalled();
    });
  });

  it("retains the authoritative server session lookup on authenticated routes", async () => {
    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(actions.getServerSessionAction).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
  });
  it("clears the legacy cached user after a successful server logout", async () => {
    window.localStorage.setItem("auth_session_user", JSON.stringify({ name: "Legacy user" }));
    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    await screen.findByText("unauthenticated");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => {
      expect(window.localStorage.getItem("auth_session_user")).toBeNull();
      expect(actions.logoutAction).toHaveBeenCalledTimes(1);
    });
  });

});
