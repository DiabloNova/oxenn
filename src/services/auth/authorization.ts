import { NextRequest } from "next/server";
import { requireSession, getSession } from "./session";
import { UserRole } from "@/types/auth";
import { TenantContextManager } from "@/core/database/tenant-context";

export class AuthorizationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Asserts that the authenticated user has workspace membership access for the target workspaceId.
 * - A super_admin can access any workspace.
 * - Otherwise, queries the database authoritatively to verify that the user is a member of the given workspace.
 * - This prevents any cross-tenant workspace membership bypass.
 */
export async function requireWorkspaceMembership(userId: string, workspaceId: string): Promise<void> {
  const session = await requireSession();

  if (!session.user) {
    throw new AuthorizationError(401, "Unauthorized: No active session user.");
  }

  if (session.user!.id !== userId) {
      throw new AuthorizationError(403, "Forbidden: User ID mismatch.");
  }

  // Authoritatively verify membership against the database using system context
  const hasAccess = await TenantContextManager.runWithSystemContext(session.user!.id, "sys-auth-check", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) {
          throw new Error("Failed to get DB client in system context");
      }

      // Check if user is super_admin in their active workspace
      const { rows: activeRows } = await client.query(
          "SELECT m.role FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
          [userId, session.user!.workspaceId]
      );
      if (activeRows.length > 0 && activeRows[0].role === "super_admin") {
          return true; // A super_admin has access to all tenants/workspaces
      }

      // Normal membership check
      const { rows } = await client.query(
          "SELECT 1 FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
          [userId, workspaceId]
      );
      return rows.length > 0;
  });

  if (!hasAccess) {
    throw new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace.");
  }
}

/**
 * Enforces RBAC permissions on the server.
 * Maps required roles to a hierarchy where:
 * - super_admin = 3
 * - workspace_admin = 2
 * - viewer = 1
 */
export async function requireRole(requiredRole: UserRole, targetWorkspaceId?: string): Promise<void> {
  const session = await requireSession();
  if (!session.user) {
    throw new AuthorizationError(401, "Unauthorized: No active session user.");
  }

  // Authoritatively fetch role from database instead of trusting session snapshot
  const roleCheckWorkspace = targetWorkspaceId || session.user.workspaceId;
  const dbRole = await TenantContextManager.runWithSystemContext(session.user!.id, "sys-auth-role-check", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) {
          throw new Error("Failed to get DB client in system context");
      }
      // First check if they are super_admin in their active workspace
      const { rows: activeRows } = await client.query(
          "SELECT m.role FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
          [session.user!.id, session.user!.workspaceId]
      );
      const activeRoleDb = activeRows.length > 0 ? activeRows[0].role : null;

      if (activeRoleDb === "super_admin") {
          return "super_admin";
      }

      // If targeting a different workspace and not super_admin, fetch role for target
      if (targetWorkspaceId && targetWorkspaceId !== session.user!.workspaceId) {
          const { rows: targetRows } = await client.query(
              "SELECT m.role FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
              [session.user!.id, targetWorkspaceId]
          );
          return targetRows.length > 0 ? targetRows[0].role : null;
      }

      return activeRoleDb;
  });

  if (!dbRole) {
      throw new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace.");
  }
  const activeRole = dbRole as UserRole;

  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 3,
    workspace_admin: 2,
    viewer: 1,
  };

  const userRoleValue = roleHierarchy[activeRole] || 0;
  const requiredRoleValue = roleHierarchy[requiredRole] || 0;

  if (userRoleValue < requiredRoleValue) {
    throw new AuthorizationError(403, `Forbidden: Insufficient privileges. Required role: "${requiredRole}".`);
  }
}

/**
 * Validates and resolves the authoritative user and tenant identity for API routes.
 * If an active signed server session is present, its identity overrides all client-provided headers.
 * Otherwise, falls closed if neither valid session nor proper headers are present.
 */
export async function authorizeApiRequest(req: NextRequest): Promise<{ userId: string; tenantId: string }> {
  const session = await getSession();

  if (session && session.user) {
    return {
      userId: session.user!.id,
      tenantId: session.user.workspaceId
    };
  }

  // Fallback to headers for developer API integration, with validation
  const headerUserId = req.headers.get("x-user-id");
  const headerTenantId = req.headers.get("x-tenant-id");

  if (!headerUserId || headerUserId.trim() === "" || !headerTenantId || headerTenantId.trim() === "") {
    throw new AuthorizationError(401, "Unauthorized: Valid session or API headers required.");
  }

  // To keep developer API integrations secure, we verify the user belongs to the requested header tenant
  const hasAccess = await TenantContextManager.runWithSystemContext(headerUserId, "sys-auth-api-check", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) {
          throw new Error("Failed to get DB client in system context");
      }
      const { rows } = await client.query(
          "SELECT 1 FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
          [headerUserId, headerTenantId]
      );
      return rows.length > 0;
  });

  if (!hasAccess) {
      throw new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace.");
  }

  return {
    userId: headerUserId,
    tenantId: headerTenantId
  };
}
