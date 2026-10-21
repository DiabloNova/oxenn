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
});
