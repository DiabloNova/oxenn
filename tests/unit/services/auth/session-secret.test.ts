import { describe, expect, it } from "vitest";
import {
  SESSION_SECRET_PLACEHOLDER,
  isValidSessionSecret,
  normalizeRuntimeEnvValue,
} from "@/services/auth/session-secret";

describe("runtime session secret normalization", () => {
  it("preserves runtime secret hashes and only trims surrounding whitespace", () => {
    const runtimeSecret = "a-valid-runtime-secret-with-32-characters # retained";
    expect(normalizeRuntimeEnvValue(` ${runtimeSecret} `)).toBe(runtimeSecret);
    expect(isValidSessionSecret(normalizeRuntimeEnvValue(runtimeSecret))).toBe(true);
  });

  it("rejects quoted values that were not parsed before reaching runtime", () => {
    const quotedSecret = '"a-valid-length-secret-with-at-least-32-chars"';
    expect(isValidSessionSecret(normalizeRuntimeEnvValue(quotedSecret))).toBe(false);
  });

  it("rejects the placeholder and short secrets after runtime normalization", () => {
    expect(isValidSessionSecret(normalizeRuntimeEnvValue(SESSION_SECRET_PLACEHOLDER))).toBe(false);
    expect(isValidSessionSecret(normalizeRuntimeEnvValue("short-secret"))).toBe(false);
  });
});
