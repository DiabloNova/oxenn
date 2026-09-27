import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import { AuthorizationError } from "@/services/auth/authorization";
import { TenantContextViolationException } from "@/core/database/tenant-context";
import { DatabaseUnavailableError } from "@/features/admin/infrastructure/persistence/postgres";
import { mapErrorToResult } from "@/services/auth/error-mapping";

describe("error-mapping", () => {
  it("should map AuthorizationError to its message", () => {
    const error = new AuthorizationError(403, "Forbidden");
    const result = mapErrorToResult(error);
    expect(result).toEqual({ success: false, error: "Forbidden" });
  });

  it("should map TenantContextViolationException to ServiceUnavailable", () => {
    const error = new TenantContextViolationException("Context violation");
    const result = mapErrorToResult(error);
    expect(result).toEqual({
      success: false,
      error: "ServiceUnavailable",
      retryable: true,
    });
  });

  it("should map DatabaseUnavailableError to ServiceUnavailable", () => {
    const error = new DatabaseUnavailableError("DB connection error");
    const result = mapErrorToResult(error);
    expect(result).toEqual({
      success: false,
      error: "ServiceUnavailable",
      retryable: true,
    });
  });

  it("should map ZodError to BadRequest", () => {
    const error = new ZodError([
      { code: "custom", path: ["email"], message: "Invalid email" },
    ]);
    const result = mapErrorToResult(error);
    expect(result).toEqual({
      success: false,
      error: "BadRequest",
      details: error.issues,
    });
  });

  it("should map default Errors to InternalServerError", () => {
    const error = new Error("Generic error");
    const result = mapErrorToResult(error);
    expect(result).toEqual({ success: false, error: "InternalServerError" });
  });
});
