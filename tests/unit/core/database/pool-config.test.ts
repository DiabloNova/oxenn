import { describe, expect, it } from "vitest";
import {
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
    expect(resolvePoolMax("60", 20, "DATABASE_POOL_MAX")).toBe(60);
    expect(resolvePoolMax("1e2", 20, "DATABASE_POOL_MAX")).toBe(100);
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "9007199254740992", "2x"]) (
    "rejects invalid pool maximum %s",
    (value) => {
      expect(() => resolvePoolMax(value, 20, "DATABASE_POOL_MAX")).toThrow(
        "DATABASE_POOL_MAX must be a positive safe integer."
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
    expect(() => validateWorkspacePoolConfiguration({ AUTHENTICATOR_POOL_MAX: "0" })).toThrow(
      "AUTHENTICATOR_POOL_MAX must be a positive safe integer."
    );
  });

  it("rejects an invalid internal default", () => {
    expect(() => resolvePoolMax(undefined, 0, "DATABASE_POOL_MAX")).toThrow(
      "Invalid default for DATABASE_POOL_MAX; expected a positive safe integer."
    );
  });
});
