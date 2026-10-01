import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSection } from "@/components/marketing/HeroSection";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    login: loginMock,
    session: { user: null, expiresAt: null, status: "unauthenticated" },
  }),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ language: "en" }),
}));

describe("HeroSection", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  afterEach(cleanup);

  it("signs in with the email and password entered by the user", async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    await user.type(screen.getByRole("textbox", { name: "Business email" }), "user@company.com");
    await user.type(screen.getByLabelText("Password"), "S3cure-Passw0rd!");
    await user.click(screen.getByRole("button", { name: "Access live sandbox demo" }));

    expect(loginMock).toHaveBeenCalledExactlyOnceWith("user@company.com", "S3cure-Passw0rd!");
  });

  it("shows a credential error and re-enables submit after login rejects", async () => {
    loginMock.mockRejectedValueOnce(new Error("Invalid credentials"));
    const user = userEvent.setup();
    render(<HeroSection />);

    await user.type(screen.getByRole("textbox", { name: "Business email" }), "user@company.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Access live sandbox demo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials. Please try again.");
    expect(screen.getByRole("button", { name: "Access live sandbox demo" })).toBeEnabled();
  });

  it("does not call login when the password is empty", async () => {
    const user = userEvent.setup();
    render(<HeroSection />);

    await user.type(screen.getByRole("textbox", { name: "Business email" }), "user@company.com");
    fireEvent.submit(screen.getByRole("button", { name: "Access live sandbox demo" }).closest("form")!);

    expect(loginMock).not.toHaveBeenCalled();
  });

  it("renders a password input", () => {
    render(<HeroSection />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });
});
