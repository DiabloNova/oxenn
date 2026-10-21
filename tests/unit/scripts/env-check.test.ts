import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMode } from "../../../scripts/env-check";

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
