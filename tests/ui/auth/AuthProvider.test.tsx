import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  const { session } = useAuth();
  return <output>{session.status}</output>;
}

describe("AuthProvider public homepage isolation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not invoke the Workspace-backed session action when explicitly skipped", async () => {
    render(
      <AuthProvider skipSessionCheck>
        <SessionStatus />
      </AuthProvider>
    );

    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
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
    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
  });
});
