import { describe, expect, it } from "vitest";
import {
  MAX_DATABASE_POOL_SIZE,
  resolvePoolMax,
  validateWorkspacePoolConfiguration,
} from "../../../../src/core/database/pool-config";

describe("resolvePoolMax", () => {
  it("uses the existing default when the variable is unset or blank", () => {
    expect(resolvePoolMax(undefined, 20, "DATABASE_POOL_MAX")).toBe(20);
    expect(resolvePoolMax("", 20, "DATABASE_POOL_MAX")).toBe(20);
    expect(resolvePoolMax("   ", 20, "DATABASE_POOL_MAX")).toBe(20);
  });

  it("accepts positive integer values with surrounding whitespace", () => {
    expect(resolvePoolMax(" 2 ", 20, "AUTHENTICATOR_POOL_MAX")).toBe(2);
    expect(resolvePoolMax(String(MAX_DATABASE_POOL_SIZE), 20, "DATABASE_POOL_MAX")).toBe(MAX_DATABASE_POOL_SIZE);
  });

  it.each(["0", "-1", "+2", "1.5", "1e2", "NaN", "51", "2x"]) (
    "rejects invalid pool maximum %s",
    (value) => {
      expect(() => resolvePoolMax(value, 20, "DATABASE_POOL_MAX")).toThrow(
        "DATABASE_POOL_MAX must be an integer between 1 and 50."
      );
    }
  );

  it("preserves the crawl worker pool's previous pg default of ten", () => {
    expect(resolvePoolMax(undefined, 10, "CRAWL_WORKER_POOL_MAX")).toBe(10);
    expect(resolvePoolMax("4", 10, "CRAWL_WORKER_POOL_MAX")).toBe(4);
  });

  it("validates both Workspace pools together at server startup", () => {
    expect(validateWorkspacePoolConfiguration({})).toEqual({
      databasePoolMax: 20,
      authenticatorPoolMax: 20,
    });
    expect(validateWorkspacePoolConfiguration({
      DATABASE_POOL_MAX: "12",
      AUTHENTICATOR_POOL_MAX: "2",
    })).toEqual({ databasePoolMax: 12, authenticatorPoolMax: 2 });
    expect(() => validateWorkspacePoolConfiguration({ AUTHENTICATOR_POOL_MAX: "51" })).toThrow(
      "AUTHENTICATOR_POOL_MAX must be an integer between 1 and 50."
    );
  });

  it("rejects an invalid internal default", () => {
    expect(() => resolvePoolMax(undefined, 0, "DATABASE_POOL_MAX")).toThrow(
      "Invalid default for DATABASE_POOL_MAX"
    );
  });
});
