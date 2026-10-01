import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordRequirements } from "@/services/auth/passwords";

describe("Password Service", () => {
  it("hashes password with exact D-4 scrypt parameters", async () => {
    const pwd = "mySecurePassword123";
    const result = await hashPassword(pwd);
    expect(result.algorithm).toBe("scrypt");
    expect(result.params.n).toBe(32768);
    expect(result.params.r).toBe(8);
    expect(result.params.p).toBe(1);
    expect(result.params.keyLength).toBe(64);
    expect(result.hash.split(":").length).toBe(2);
  });

  it("correct password verifies successfully", async () => {
    const pwd = "mySecurePassword123";
    const result = await hashPassword(pwd);
    const isValid = await verifyPassword(pwd, result.hash, result.params);
    expect(isValid).toBe(true);
  });

  it("wrong password fails", async () => {
    const pwd = "mySecurePassword123";
    const result = await hashPassword(pwd);
    const isValid = await verifyPassword("wrongPassword", result.hash, result.params);
    expect(isValid).toBe(false);
  });

  it("malformed/untrusted stored parameters are rejected safely", async () => {
    const pwd = "mySecurePassword123";
    const result = await hashPassword(pwd);

    // Test with missing params
    // @ts-expect-error testing missing arguments
    let isValid = await verifyPassword(pwd, result.hash, null);
    expect(isValid).toBe(false);

    // Test with malicious large parameters to prevent DoS
    isValid = await verifyPassword(pwd, result.hash, { ...result.params, n: 1048576 });
    expect(isValid).toBe(false);
  });

  it("validates password length correctly", () => {
    expect(validatePasswordRequirements("123456789")).toBe(false); // < 10
    expect(validatePasswordRequirements("1234567890")).toBe(true); // == 10
    expect(validatePasswordRequirements("".padStart(255, 'a'))).toBe(true); // == 255
    expect(validatePasswordRequirements("".padStart(256, 'a'))).toBe(false); // > 255
  });
});
