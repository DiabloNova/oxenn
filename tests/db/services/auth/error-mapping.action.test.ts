import { describe, it, expect, vi } from "vitest";
import { getKeywordIntelligenceAction } from "@/app/actions/keyword-intelligence";
import { requireSession } from "@/services/auth/session";
import { DatabaseUnavailableError } from "@/features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "@/core/database/tenant-context";

vi.mock("@/services/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/services/auth/authorization", () => ({
  requireWorkspaceMembership: vi.fn(),
  AuthorizationError: class AuthorizationError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "AuthorizationError";
    }
  },
}));

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: vi.fn(),
  },
  TenantContextViolationException: class TenantContextViolationException extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TenantContextViolationException";
    }
  },
}));

vi.mock("@/features/ai-intelligence/repositories", () => ({
  KeywordRepository: vi.fn(),
  PageRepository: vi.fn(),
  WebsiteRepository: vi.fn(),
  CompetitorRepository: vi.fn(),
  CompetitiveSeoFindingRepository: vi.fn(),
  EntityRepository: vi.fn(),
  TopicRepository: vi.fn(),
  PromptIntelligenceRepository: vi.fn(),
}));

vi.mock("@/features/ai-intelligence/services/keyword-intelligence-service", () => ({
  KeywordIntelligenceService: vi.fn(),
}));

describe("getKeywordIntelligenceAction error mapping", () => {
  it("should return ServiceUnavailable for DatabaseUnavailableError", async () => {
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: "test-user", workspaceId: "test-workspace", name: "Test", email: "test@example.com", role: "viewer" },
      expiresAt: null,
      status: "authenticated",
    });

    vi.mocked(TenantContextManager.runWithTenantContext).mockRejectedValueOnce(
      new DatabaseUnavailableError("Simulated DB connection error")
    );

    const result = await getKeywordIntelligenceAction();

    expect(result).toEqual({
      success: false,
      error: "ServiceUnavailable",
      retryable: true,
    });
  });
});
