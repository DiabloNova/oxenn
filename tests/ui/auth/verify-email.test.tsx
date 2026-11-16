import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams("email=member%40example.com&returnTo=%2Fen"),
  router: { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() },
}));
const auth = vi.hoisted(() => ({
  refreshSession: vi.fn().mockResolvedValue({
    status: "authenticated",
    user: { id: "usr-test", email: "member@example.com" },
  }),
}));
const actions = vi.hoisted(() => ({
  requestVerification: vi.fn(),
  verifyEmailAction: vi.fn(),
  verifyLegacyEmailAction: vi.fn(),
}));

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  return {
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
      ReactModule.createElement("a", { ...props, href }, children),
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.params,
}));
vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ refreshSession: auth.refreshSession }),
}));
vi.mock("@/app/actions/auth", () => actions);
vi.mock("@/components/Input", () => ({
  Input: ({ label, value, onChange, type, ...props }: {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    type?: string;
    [key: string]: unknown;
  }) => (
    <label>
      {label}
      <input aria-label={label} type={type ?? "text"} value={value} onChange={onChange} {...props} />
    </label>
  ),
}));
vi.mock("@/components/Button", () => ({
  Button: ({ children, type, disabled }: { children: React.ReactNode; type?: "button" | "submit"; disabled?: boolean }) =>
    <button type={type ?? "button"} disabled={disabled}>{children}</button>,
}));
vi.mock("@/components/Card", () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { Card: Wrapper, CardHeader: Wrapper, CardTitle: Wrapper, CardDescription: Wrapper, CardContent: Wrapper };
});
vi.mock("@/components/marketing/SeorchableLogo", () => ({ SeorchableLogo: () => <span>Logo</span> }));

import VerifyEmailPage from "@/app/[locale]/verify-email/page";

describe("VerifyEmailPage localized code input", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    navigation.params = new URLSearchParams("email=member%40example.com&returnTo=%2Fen");
  });

  it("converts Persian digits typed into the actual code field to ASCII", async () => {
    render(<React.Suspense fallback={<p>Loading verification form</p>}><VerifyEmailPage params={Promise.resolve({ locale: "fa" })} /></React.Suspense>);
    const codeInput = await screen.findByLabelText("کد تأیید ۸ رقمی");
    fireEvent.change(codeInput, { target: { value: "۱۲۳۴۵۶۷۸" } });
    expect(codeInput).toHaveValue("12345678");
  });

  it("converts Arabic-Indic digits typed into the actual code field to ASCII", async () => {
    render(<VerifyEmailPage params={Promise.resolve({ locale: "fa" })} />);
    const codeInput = await screen.findByLabelText("کد تأیید ۸ رقمی");
    fireEvent.change(codeInput, { target: { value: "١٢٣٤٥٦٧٨" } });
    expect(codeInput).toHaveValue("12345678");
  });
});
