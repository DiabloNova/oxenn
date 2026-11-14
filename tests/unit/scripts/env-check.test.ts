import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMode, validateEnv } from "../../../scripts/env-check";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveMode", () => {
  it("uses APP_MODE when no explicit mode is provided", () => {
    vi.stubEnv("APP_MODE", "migrate");

    expect(resolveMode()).toBe("migrate");
  });

  it("prefers an explicit mode argument over APP_MODE", () => {
    vi.stubEnv("APP_MODE", "migrate");

    expect(resolveMode("test")).toBe("test");
  });

  it("defaults to dev when neither source provides a mode", () => {
    vi.stubEnv("APP_MODE", "");

    expect(resolveMode()).toBe("dev");
  });

  it.each(["dev", "build", "migrate", "test"])("accepts the supported mode %s", (mode) => {
    expect(resolveMode(mode)).toBe(mode);
  });

  it("rejects an unsupported explicit mode", () => {
    expect(() => resolveMode("staging")).toThrow(
      "Unsupported environment mode 'staging'. Expected one of: dev, build, migrate, test.",
    );
  });

  it("rejects an unsupported APP_MODE instead of bypassing validation", () => {
    vi.stubEnv("APP_MODE", "staging");

    expect(() => resolveMode()).toThrow(
      "Unsupported environment mode 'staging'. Expected one of: dev, build, migrate, test.",
    );
  });
});


describe("validateEnv db:push settings", () => {
  function stubBaseEnvironment(mode: "dev" | "test") {
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    if (mode === "dev") vi.stubEnv("SESSION_SECRET", "a-session-secret-long-enough");
  }

  it.each(["dev", "test"] as const)("reports missing paired db:push settings as missing in %s mode", (mode) => {
    stubBaseEnvironment(mode);
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "");

    const result = validateEnv(mode);
    expect(result.missing).toEqual(expect.arrayContaining(["DB_PUSH_TARGET_ID", "DB_PUSH_DATABASE_URL"]));
    expect(result.invalid.some((item) => item.name === "DB_PUSH_TARGET_ID" || item.name === "DB_PUSH_DATABASE_URL")).toBe(false);
  });

  it("reports malformed target IDs and push URLs as invalid", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "Not a valid target!");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "not-a-postgres-url");

    const result = validateEnv("dev");
    expect(result.invalid.map((item) => item.name)).toEqual(expect.arrayContaining(["DB_PUSH_TARGET_ID", "DB_PUSH_DATABASE_URL"]));
    expect(result.missing.some((name) => name === "DB_PUSH_TARGET_ID" || name === "DB_PUSH_DATABASE_URL")).toBe(false);
  });

  it("ignores db:push-only variables in migrate mode", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "invalid target");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "not-a-postgres-url");

    expect(validateEnv("migrate")).toMatchObject({ mode: "migrate", missing: [], invalid: [], valid: true });
  });
});
