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
  const { session, login, logout } = useAuth();
  return <>
    <output>{session.status}</output>
    <button type="button" onClick={() => void login("user@example.com", "Password123!!")}>Sign in</button>
    <button type="button" onClick={() => void logout()}>Sign out</button>
  </>;
}

describe("AuthProvider public homepage isolation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    window.localStorage.clear();
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
  it("keeps the server session when browser storage rejects cache writes", async () => {
    actions.getServerSessionAction.mockResolvedValueOnce({
      user: {
        id: "usr-1",
        name: "Test User",
        email: "user@example.com",
        username: "testuser",
        role: "workspace_admin",
        workspaceId: "org-1",
      },
      expiresAt: "2026-11-19T00:00:00.000Z",
      status: "authenticated",
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable", "SecurityError");
    });

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(setItem).toHaveBeenCalledWith("auth_session_user", expect.any(String));
  });

  it("performs server logout even when browser storage cleanup throws", async () => {
    window.localStorage.setItem("auth_session_user", JSON.stringify({ name: "Legacy user" }));
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable", "SecurityError");
    });

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    await screen.findByText("unauthenticated");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => {
      expect(actions.logoutAction).toHaveBeenCalledTimes(1);
    });
    expect(removeItem).toHaveBeenCalledWith("auth_session_user");
  });

});
