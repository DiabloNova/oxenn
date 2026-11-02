import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireSessionMock,
  requireWorkspaceMembershipMock,
  runWithTenantContextMock,
  entityServiceConstructorMock,
  getEntityByNameMock,
  getNeighborhoodMock,
  projectNeighborhoodMock,
} = vi.hoisted(() => ({
  requireSessionMock: vi.fn(),
  requireWorkspaceMembershipMock: vi.fn(),
  runWithTenantContextMock: vi.fn(),
  entityServiceConstructorMock: vi.fn(),
  getEntityByNameMock: vi.fn(),
  getNeighborhoodMock: vi.fn(),
  projectNeighborhoodMock: vi.fn(),
}));

vi.mock("@/services/auth/session", () => ({
  requireSession: requireSessionMock,
  getSession: vi.fn(),
}));

vi.mock("@/services/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth/authorization")>();
  return {
    ...actual,
    requireWorkspaceMembership: requireWorkspaceMembershipMock,
  };
});

vi.mock("@/core/database/tenant-context", () => ({
  TenantContextManager: {
    runWithTenantContext: runWithTenantContextMock,
  },
}));

vi.mock("@/features/ai-intelligence/services/entity-service", () => ({
  EntityService: class {
    constructor() {
      entityServiceConstructorMock();
    }

    getEntityByName(...args: unknown[]) {
      return getEntityByNameMock(...args);
    }

    getNeighborhood(...args: unknown[]) {
      return getNeighborhoodMock(...args);
    }
  },
  projectNeighborhoodForVisualization: projectNeighborhoodMock,
}));

import { AuthorizationError } from "@/services/auth/authorization";
import { POST } from "@/app/api/v1/knowledge-graph/query/route";

describe("Knowledge Graph API authorization status mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runWithTenantContextMock.mockImplementation(
      async (
        _tenantId: string,
        _userId: string,
        _requestId: string,
        callback: () => Promise<unknown>,
      ) => callback(),
    );
  });

  function post() {
    return POST(new NextRequest("http://localhost/api/v1/knowledge-graph/query", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-kg-test",
        "x-user-id": "forged-user",
        "x-tenant-id": "forged-tenant",
      },
      body: JSON.stringify({ entityName: "Optimus AI" }),
    }));
  }

  it("returns 401 and does not enter tenant context without a valid session", async () => {
    requireSessionMock.mockRejectedValueOnce(
      new Error("Unauthorized: Active session is missing, invalid or expired."),
    );

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(runWithTenantContextMock).not.toHaveBeenCalled();
    expect(entityServiceConstructorMock).not.toHaveBeenCalled();
  });

  it("preserves 403 when the authenticated user is not a workspace member", async () => {
    requireSessionMock.mockResolvedValueOnce({
      user: {
        id: "user-test",
        workspaceId: "tenant-test",
      },
    });
    requireWorkspaceMembershipMock.mockRejectedValueOnce(
      new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace."),
    );

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "user-test",
      "req-kg-test",
      expect.any(Function),
    );
    expect(requireWorkspaceMembershipMock).toHaveBeenCalledWith("user-test", "tenant-test");
    expect(requireWorkspaceMembershipMock).not.toHaveBeenCalledWith("forged-user", "forged-tenant");
    expect(entityServiceConstructorMock).not.toHaveBeenCalled();
  });

  it("uses session identity and executes the entity query path despite forged identity headers", async () => {
    requireSessionMock.mockResolvedValueOnce({
      user: {
        id: "user-test",
        workspaceId: "tenant-test",
      },
    });
    requireWorkspaceMembershipMock.mockResolvedValueOnce(undefined);

    const centralEntity = { id: "entity-test", name: "Optimus AI" };
    const neighborhood = {
      nodes: [centralEntity],
      edges: [],
    };
    const projectedGraph = {
      nodes: [{ id: "entity-test", label: "Optimus AI" }],
      edges: [],
    };
    getEntityByNameMock.mockResolvedValueOnce(centralEntity);
    getNeighborhoodMock.mockResolvedValueOnce(neighborhood);
    projectNeighborhoodMock.mockReturnValueOnce(projectedGraph);

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(projectedGraph);
    expect(runWithTenantContextMock).toHaveBeenCalledWith(
      "tenant-test",
      "user-test",
      "req-kg-test",
      expect.any(Function),
    );
    expect(requireWorkspaceMembershipMock).toHaveBeenCalledWith("user-test", "tenant-test");
    expect(requireWorkspaceMembershipMock).not.toHaveBeenCalledWith("forged-user", "forged-tenant");
    expect(entityServiceConstructorMock).toHaveBeenCalledTimes(1);
    expect(getEntityByNameMock).toHaveBeenCalledWith("tenant-test", "Optimus AI");
    expect(getNeighborhoodMock).toHaveBeenCalledWith("tenant-test", "entity-test", 2, 100);
    expect(projectNeighborhoodMock).toHaveBeenCalledWith(neighborhood.nodes, neighborhood.edges);
  });
});
