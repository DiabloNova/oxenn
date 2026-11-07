import type { ReactNode } from "react";
import { Suspense } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InvoicePaymentPage from "@/app/[locale]/invoice/page";

vi.mock("next/link", async () => {
  const ReactModule = await import("react");
  return {
    default: ({
      href,
      children,
      ...props
    }: {
      href: string;
      children?: ReactNode;
      [key: string]: unknown;
    }) =>
      ReactModule.createElement(
        "a",
        { ...props, href },
        children as ReactNode
      ),
  };
});

afterEach(() => {
  cleanup();
});

describe("InvoicePaymentPage payment safety", () => {
  it("does not collect payment details or claim success when no verified provider is connected", async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading invoice preview...</div>}>
          <InvoicePaymentPage params={Promise.resolve({ locale: "en" })} />
        </Suspense>
      );
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Payment Is Not Available Yet" })).toBeInTheDocument();
    expect(screen.getByText(/No verified payment provider is connected to this page/)).toBeInTheDocument();
    expect(screen.getByText("NOT PAYABLE")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Payment Successfully Processed!")).not.toBeInTheDocument();
    expect(screen.queryByText(/Transaction Hash:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/USDT-TRC20/)).not.toBeInTheDocument();
  });

  it("shows the same non-payable state in Persian", async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>در حال بارگذاری...</div>}>
          <InvoicePaymentPage params={Promise.resolve({ locale: "fa" })} />
        </Suspense>
      );
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "پرداخت در حال حاضر در دسترس نیست" })).toBeInTheDocument();
    expect(screen.getByText(/هیچ پرداختی انجام یا ثبت نمی‌شود/)).toBeInTheDocument();
    expect(screen.getByText("غیرقابل پرداخت")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
