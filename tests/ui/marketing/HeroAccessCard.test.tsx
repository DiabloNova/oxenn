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

  it("offers direct registration and login routes to unauthenticated visitors", () => {
    render(<HeroAccessCard locale="en" />);

    expect(screen.getByRole("heading", { name: "Create your Oxenn account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/en/register");
    expect(screen.getByRole("link", { name: "Already have an account? Sign in" })).toHaveAttribute("href", "/en/login");
  });

  it("localizes both account-entry routes in Farsi", () => {
    render(<HeroAccessCard locale="fa" />);

    expect(screen.getByRole("heading", { name: "برای شروع، حساب کاربری ایجاد کنید" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ثبت‌نام" })).toHaveAttribute("href", "/fa/register");
    expect(screen.getByRole("link", { name: "قبلاً حساب ساخته‌اید؟ ورود" })).toHaveAttribute("href", "/fa/login");
  });

  it("does not show account-entry links while the authoritative session is loading", () => {
    auth.session = { user: null, expiresAt: null, status: "loading" };

    render(<HeroAccessCard locale="en" />);

    expect(screen.getByRole("status")).toHaveTextContent("Checking your account status...");
    expect(screen.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Already have an account? Sign in" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "ورود به داشبورد" })).toHaveAttribute("href", "/fa/dashboard");
    expect(screen.queryByRole("link", { name: "ثبت‌نام" })).not.toBeInTheDocument();
  });
});
