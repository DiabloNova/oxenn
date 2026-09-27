import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult<T = any> =
  | { success: true; result: T }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { success: false; error: string; retryable?: boolean; details?: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapErrorToResult(err: unknown): ActionResult<any> {
  if (err && typeof err === "object" && "name" in err) {
    if (err.name === "AuthorizationError") {
      return {
        success: false,
        error: (err as Error).message,
      };
    }

    if (
      err.name === "TenantContextViolationException" ||
      err.name === "DatabaseUnavailableError"
    ) {
      return {
        success: false,
        error: "ServiceUnavailable",
        retryable: true,
      };
    }
  }

  if (err instanceof ZodError) {
    return {
      success: false,
      error: "BadRequest",
      details: err.issues,
    };
  }

  return {
    success: false,
    error: "InternalServerError",
  };
}
