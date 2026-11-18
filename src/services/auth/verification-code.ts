/** Convert Persian and Arabic-Indic digits to ASCII before code validation. */
export function normalizeVerificationCodeInput(value: string): string {
  const asciiDigits = value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  return asciiDigits.replace(/[^0-9]/g, "").slice(0, 8);
}
