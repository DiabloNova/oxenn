import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

const actions = vi.hoisted(() => ({
  getServerSessionAction: vi.fn(async () => ({
    user: null as {
      id: string;
      name: string;
      email: string;
      username: string | null;
      role: "super_admin" | "workspace_admin" | "viewer";
      workspaceId: string;
    } | null,
    expiresAt: null as string | null,
    status: "unauthenticated" as "authenticated" | "unauthenticated",
  })),
  loginAction: vi.fn(),
  logoutAction: vi.fn(),
  registerAction: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => actions);

function SessionStatus() {
  const { session, login, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Logout failed.");
    }
  };

  return <>
    <output>{session.status}</output>
    <output aria-label="logout error">{logoutError}</output>
    <button type="button" onClick={() => void login("user@example.com", "Password123!!")}>Sign in</button>
    <button type="button" onClick={() => void signOut()}>Sign out</button>
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

  it("clears the legacy cached user after a successful server logout", async () => {
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

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(window.localStorage.getItem("auth_session_user")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByText("unauthenticated")).toBeInTheDocument();
      expect(window.localStorage.getItem("auth_session_user")).toBeNull();
      expect(actions.logoutAction).toHaveBeenCalledTimes(1);
    });
  });

  it("re-synchronizes server truth and propagates an error when logoutAction rejects", async () => {
    actions.getServerSessionAction
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        user: null,
        expiresAt: null,
        status: "unauthenticated",
      });
    actions.logoutAction.mockRejectedValueOnce(new Error("server logout failed"));

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("server logout failed")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("unauthenticated")).toBeInTheDocument();
      expect(window.localStorage.getItem("auth_session_user")).toBeNull();
      expect(actions.logoutAction).toHaveBeenCalledTimes(1);
      expect(actions.getServerSessionAction).toHaveBeenCalledTimes(2);
    });
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
