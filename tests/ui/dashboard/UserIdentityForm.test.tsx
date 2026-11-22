import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

  it("shows the legal entity section without coupling the user website directory to it", () => {
    render(<UserIdentityForm initialData={initialData} />);
    fireEvent.click(screen.getByLabelText("شخص حقوقی"));
    expect(screen.getByText("نام شرکت در آگهی تأسیس *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "افزودن آدرس وبسایت" })).toBeInTheDocument();
  });

  it("allows an individual user to add and save website directory entries", async () => {
    render(<UserIdentityForm initialData={{
      ...initialData,
      profile: { ...initialData.profile, gender: "female", ageRange: "25_34", jobTitle: "founder", industry: "services" },
    }} />);
    fireEvent.click(screen.getByRole("button", { name: "افزودن آدرس وبسایت" }));
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), { target: { value: "https://example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: "ذخیره اطلاعات هویتی" }).closest("form")!);
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
      identityType: "individual",
      websites: [{ url: "https://example.com", platformType: "official_website" }],
    })));
  });

  it("keeps SMS notifications disabled until the phone number is verified", () => {
    render(<UserIdentityForm initialData={initialData} />);
    expect(screen.getByLabelText("فعال‌سازی اعلان پیامکی")).toBeDisabled();
  });
});
