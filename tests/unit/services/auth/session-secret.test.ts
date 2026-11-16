import { describe, expect, it } from "vitest";
import {
  SESSION_SECRET_PLACEHOLDER,
  isValidSessionSecret,
  normalizeEnvValue,
} from "@/services/auth/session-secret";

describe("session secret normalization", () => {
  it("strips dotenv-style inline comments from unquoted values", () => {
    expect(normalizeEnvValue(SESSION_SECRET_PLACEHOLDER + " # local note"))
      .toBe(SESSION_SECRET_PLACEHOLDER);
    expect(isValidSessionSecret(normalizeEnvValue(SESSION_SECRET_PLACEHOLDER + " # local note")))
      .toBe(false);
  });

  it("preserves hashes inside quoted values and strips comments after the closing quote", () => {
    expect(normalizeEnvValue('"secret # retained" # local note')).toBe("secret # retained");
    expect(normalizeEnvValue("'secret # retained' # local note")).toBe("secret # retained");
  });

  it("does not strip a hash that is not preceded by whitespace", () => {
    expect(normalizeEnvValue("abc#def")).toBe("abc#def");
  });

  it("rejects short and placeholder secrets after normalization", () => {
    expect(isValidSessionSecret(normalizeEnvValue('"short-secret"'))).toBe(false);
    expect(isValidSessionSecret(normalizeEnvValue(SESSION_SECRET_PLACEHOLDER))).toBe(false);
  });
});
