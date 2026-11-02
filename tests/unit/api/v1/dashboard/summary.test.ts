import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authorizeApiRequestMock, getDashboardSummaryMock } = vi.hoisted(() => ({
  authorizeApiRequestMock: vi.fn(),
  getDashboardSummaryMock: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return {
    ...actual,
    authorizeApiRequest: authorizeApiRequestMock,
  };
});

vi.mock("@/services/dashboard-home", () => ({
  dashboardHomeService: {
    getDashboardSummary: getDashboardSummaryMock,
  },
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { GET } from "@/app/api/v1/dashboard/summary/route";

const authorizationFailures: Array<[number, string]> = [
  [401, "Unauthorized"],
  [403, "Forbidden"],
];

describe("Dashboard Summary authorization status mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(authorizationFailures)(
    "preserves HTTP %i when authorization rejects the request",
    async (statusCode, errorLabel) => {
      authorizeApiRequestMock.mockRejectedValueOnce(
        new AuthorizationError(statusCode, errorLabel + ": test authorization failure"),
      );

      const request = new NextRequest("http://localhost/api/v1/dashboard/summary?locale=en", {
        headers: {
          "x-user-id": "forged-user",
          "x-tenant-id": "forged-tenant",
          authorization: "Bearer seo_test_api_key",
        },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(statusCode);
      expect(body.error).toBe(errorLabel);
      expect(authorizeApiRequestMock).toHaveBeenCalledTimes(1);
      expect(getDashboardSummaryMock).not.toHaveBeenCalled();
    },
  );
});
