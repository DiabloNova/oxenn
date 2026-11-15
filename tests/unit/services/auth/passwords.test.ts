import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";

describe("Password Service", () => {
  it("hashes password with exact D-4 scrypt parameters", async () => {
    const pwd = "MySecurePassword123!!";
    const result = await hashPassword(pwd);
    expect(result.algorithm).toBe("scrypt");
    expect(result.params.n).toBe(32768);
    expect(result.params.r).toBe(8);
    expect(result.params.p).toBe(1);
    expect(result.params.keyLength).toBe(64);
    expect(result.hash.split(":").length).toBe(2);
  });

  it("correct password verifies successfully", async () => {
    const pwd = "MySecurePassword123!!";
    const result = await hashPassword(pwd);
    const isValid = await verifyPassword(pwd, result.hash, result.params);
    expect(isValid).toBe(true);
  });

  it("wrong password fails", async () => {
    const pwd = "MySecurePassword123!!";
    const result = await hashPassword(pwd);
    const isValid = await verifyPassword("wrongPassword", result.hash, result.params);
    expect(isValid).toBe(false);
  });

  it("malformed/untrusted stored parameters are rejected safely", async () => {
    const pwd = "MySecurePassword123!!";
    const result = await hashPassword(pwd);

    // Test with missing params
    // @ts-expect-error testing missing arguments
    let isValid = await verifyPassword(pwd, result.hash, null);
    expect(isValid).toBe(false);

    // Test table for malformed parameters
    const malformedParams = [
      { ...result.params, n: 1048576 }, // Large n DoS
      { ...result.params, r: 32 }, // Large r DoS
      { ...result.params, p: 8 }, // Large p DoS
      { ...result.params, keyLength: 256 }, // Large keyLength DoS
      { ...result.params, n: "32768" as unknown as number }, // Non-numeric n
      { ...result.params, r: "8" as unknown as number }, // Non-numeric r
      { ...result.params, p: "1" as unknown as number }, // Non-numeric p
      { ...result.params, keyLength: "64" as unknown as number }, // Non-numeric keyLength
      { ...result.params, n: -1 }, // Negative n
      { ...result.params, n: NaN }, // NaN n
      { ...result.params, r: -1 }, // Negative r
      { ...result.params, p: -1 }, // Negative p
      { ...result.params, keyLength: -1 }, // Negative keyLength
      { ...result.params, n: Infinity }, // Infinity n
      { ...result.params, r: Infinity }, // Infinity r
      { ...result.params, p: Infinity }, // Infinity p
      { ...result.params, keyLength: Infinity }, // Infinity keyLength
    ];

    for (const params of malformedParams) {
      isValid = await verifyPassword(pwd, result.hash, params);
      expect(isValid).toBe(false);
    }

    // Test malformed hashes
    isValid = await verifyPassword(pwd, "badhashformat", result.params);
    expect(isValid).toBe(false);

    // Test key length mismatch
    isValid = await verifyPassword(pwd, result.hash, { ...result.params, keyLength: 32 });
    expect(isValid).toBe(false);
  });

  it("enforces the complete registration password policy", () => {
    expect(validatePasswordRequirements("1234567890")).toBe(false);
    expect(validatePasswordRequirements("Aa123456!!")).toBe(true);
    expect(validatePasswordRequirements("Aa12345 !!")).toBe(true);
    expect(validatePasswordRequirements("aa123456!!")).toBe(false);
    expect(validatePasswordRequirements("AAabcdef!!")).toBe(false);
    expect(validatePasswordRequirements("Aa1234567!")).toBe(false);
    expect(validatePasswordRequirements("Aa123456! ")).toBe(false);
    expect(validatePasswordRequirements("Aa123456!پ")).toBe(false);
    expect(validatePasswordRequirements("A1!!" + "a".repeat(251))).toBe(true);
    expect(validatePasswordRequirements("A1!!" + "a".repeat(252))).toBe(false);
  });
});
