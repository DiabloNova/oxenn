import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const theme = vi.hoisted(() => ({ language: "en", direction: "ltr" }));
vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => theme }));

import { BrandProfileForm } from "@/components/features/dashboard/BrandProfileForm";

function response(body: unknown, status = 500): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function submitBrandProfile() {
  fireEvent.change(screen.getByLabelText(/Brand name/), { target: { value: "Oxenn" } });
  fireEvent.click(screen.getByRole("button", { name: "Add information to knowledge store" }));
}

describe("BrandProfileForm replacement failure messaging", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    theme.language = "en";
    theme.direction = "ltr";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("explains that the previous document is preserved only when preservation is confirmed", async () => {
    fetchMock.mockResolvedValueOnce(response({
      success: false,
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "preserved",
      rolledBack: true,
    }));
    render(<BrandProfileForm />);

    submitBrandProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The replacement failed, but the previous document is preserved.",
    );
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(screen.queryByText(/brand profile was updated/i)).not.toBeInTheDocument();
  });

  it("localizes the confirmed-preservation message in Persian", async () => {
    theme.language = "fa";
    theme.direction = "rtl";
    fetchMock.mockResolvedValueOnce(response({
      success: false,
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "preserved",
      rolledBack: true,
    }));
    render(<BrandProfileForm />);

    fireEvent.change(screen.getByLabelText(/نام برند/), { target: { value: "اکسن" } });
    fireEvent.click(screen.getByRole("button", { name: "ثبت اطلاعات در مخزن دانش" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "جایگزینی سند انجام نشد، اما نسخه قبلی حفظ شده است.",
    );
  });

  it("instructs the user to reload and verify when the transaction outcome is unknown", async () => {
    fetchMock.mockResolvedValueOnce(response({
      success: false,
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "unknown",
      rolledBack: false,
      recoveryAction: "reload_and_verify",
    }));
    render(<BrandProfileForm />);

    submitBrandProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reload this page and verify the current document before retrying.",
    );
    expect(screen.queryByText(/previous document is preserved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/brand profile was updated/i)).not.toBeInTheDocument();
  });

  it("localizes the uncertain-state recovery message in Persian", async () => {
    theme.language = "fa";
    theme.direction = "rtl";
    fetchMock.mockResolvedValueOnce(response({
      success: false,
      code: "DOCUMENT_REPLACEMENT_FAILED",
      preservationStatus: "unknown",
    }));
    render(<BrandProfileForm />);

    fireEvent.change(screen.getByLabelText(/نام برند/), { target: { value: "اکسن" } });
    fireEvent.click(screen.getByRole("button", { name: "ثبت اطلاعات در مخزن دانش" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "وضعیت نهایی جایگزینی سند تأیید نشد.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("صفحه را تازه‌سازی کنید");
  });

  it("keeps the successful replacement notification unchanged", async () => {
    fetchMock.mockResolvedValueOnce(response({
      success: true,
      totalChunks: 1,
      processedChunks: 1,
      failedChunks: 0,
    }, 200));
    render(<BrandProfileForm />);

    submitBrandProfile();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "The brand profile was updated in the workspace knowledge store.",
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves the existing partial-processing message for non-replacement ingestion", async () => {
    fetchMock.mockResolvedValueOnce(response({
      success: false,
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 1,
    }, 207));
    render(<BrandProfileForm />);

    submitBrandProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Content ingestion was partial: 1 chunks were stored and 1 failed.",
    );
  });
});
