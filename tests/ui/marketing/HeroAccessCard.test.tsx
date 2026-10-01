import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Session } from "@/types/auth";
import { HeroAccessCard } from "@/components/marketing/HeroAccessCard";

const auth = vi.hoisted(() => ({
  session: { user: null, expiresAt: null, status: "unauthenticated" } as Session,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ session: auth.session }),
}));

describe("HeroAccessCard", () => {
  beforeEach(() => {
    auth.session = { user: null, expiresAt: null, status: "unauthenticated" };
  });

  afterEach(() => {
    cleanup();
  });

  it("offers the English email access form to unauthenticated visitors", () => {
    render(<HeroAccessCard locale="en" />);

    expect(screen.getByRole("heading", { name: "Access the workspace" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Business email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Access live sandbox demo" })).toBeInTheDocument();
  });

  it("localizes the access heading in Farsi", () => {
    render(<HeroAccessCard locale="fa" />);

    expect(screen.getByRole("heading", { name: "ورود سریع به میز کار" })).toBeInTheDocument();
  });

  it("sends authenticated Farsi visitors to their dashboard", () => {
    auth.session = {
      user: {
        id: "owner",
        name: "Owner",
        email: "owner@acme.test",
        role: "workspace_admin",
        workspaceId: "acme",
      },
      expiresAt: null,
      status: "authenticated",
    };

    render(<HeroAccessCard locale="fa" />);

    expect(screen.getByText("owner@acme.test")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ورود به پیشخوان کاربری" })).toHaveAttribute("href", "/fa/dashboard");
    expect(screen.queryByRole("textbox", { name: "ایمیل سازمانی" })).not.toBeInTheDocument();
  });
});
