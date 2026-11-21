import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const theme = vi.hoisted(() => ({ language: "fa", direction: "rtl" }));
const refresh = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const save = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }));
vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => theme }));
vi.mock("@/components/features/dashboard/UserWebsiteDirectoryProvider", () => ({ useUserWebsiteDirectory: () => ({ refresh }) }));
vi.mock("@/app/actions/user-identity", () => ({ saveUserIdentityProfileAction: save }));

import { UserIdentityForm } from "@/components/features/dashboard/UserIdentityForm";

const initialData = {
  account: { email: "person@example.com", name: "مریم احمدی" },
  profile: { identityType: "individual" as const, firstName: "مریم", lastName: "احمدی", gender: "", ageRange: "", jobTitle: "", customJobTitle: "", industry: "", customIndustry: "", phoneNumber: "", phoneVerified: false, smsNotificationsEnabled: false },
  legalEntity: null,
  websites: [],
};

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("UserIdentityForm", () => {
  it("shows account email as read-only and does not ask for education", () => {
    render(<UserIdentityForm initialData={initialData} />);
    const email = screen.getByDisplayValue("person@example.com");
    expect(email).toHaveAttribute("readonly");
    expect(email).toBeDisabled();
    expect(screen.queryByText(/تحصیلات/)).not.toBeInTheDocument();
  });

  it("shows the legal entity section and allows adding website directory entries", () => {
    render(<UserIdentityForm initialData={initialData} />);
    fireEvent.click(screen.getByLabelText("شخص حقوقی"));
    expect(screen.getByText("نام شرکت در آگهی تأسیس *")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "افزودن آدرس وبسایت" }));
    expect(screen.getByPlaceholderText("https://example.com")).toBeInTheDocument();
  });

  it("keeps SMS notifications disabled until the phone number is verified", () => {
    render(<UserIdentityForm initialData={initialData} />);
    expect(screen.getByLabelText("فعال‌سازی اعلان پیامکی")).toBeDisabled();
  });
});
