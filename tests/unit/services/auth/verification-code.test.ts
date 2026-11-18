import { describe, expect, it } from "vitest";
import { normalizeVerificationCodeInput } from "@/services/auth/verification-code";

describe("normalizeVerificationCodeInput", () => {
  it("converts Persian digits to an eight-digit ASCII code", () => {
    expect(normalizeVerificationCodeInput("۱۲۳۴۵۶۷۸")).toBe("12345678");
  });

  it("converts Arabic-Indic digits to an eight-digit ASCII code", () => {
    expect(normalizeVerificationCodeInput("١٢٣٤٥٦٧٨")).toBe("12345678");
  });

  it("removes non-digits and limits the value to eight digits", () => {
    expect(normalizeVerificationCodeInput("12-34 567890")).toBe("12345678");
  });
});
