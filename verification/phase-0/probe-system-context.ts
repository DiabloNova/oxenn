import { TenantContextManager } from "../../src/core/database/tenant-context";
import { loginAction, registerAction } from "../../src/app/actions/auth";
import { requireWorkspaceMembership, requireRole, authorizeApiRequest } from "../../src/services/auth/authorization";
import {
  createWorkspaceAction,
  listWorkspacesAction,
  acceptInvitationAction,
  switchWorkspaceAction,
  inviteUserAction,
  removeMemberAction,
  updateMemberRoleAction
} from "../../src/app/actions/workspace";
import { setCookiesMock } from "../../src/services/auth/session";
import { NextRequest } from "next/server";

// Simple in-memory cookie store mock
function createMockCookieStore() {
  const store = new Map<string, string>();
  return () => Promise.resolve({
    get: (name: string) => store.has(name) ? { name, value: store.get(name)! } : undefined,
    set: (name: string, value: string) => { store.set(name, value); },
    delete: (name: string) => { store.delete(name); }
  });
}

async function runProbe() {
  process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/oxenn_test";

  console.log("=== AUTH-03 SYSTEM CONTEXT DB CLIENT RUNTIME PROBE ===");
  console.log(`DATABASE_URL set to: ${process.env.DATABASE_URL}\n`);

  // Setup cookie store mock
  const cookieMock = createMockCookieStore();
  setCookiesMock(cookieMock);

  // Helper to test async functions
  async function testFunction(name: string, fn: () => Promise<unknown>) {
    console.log(`Testing ${name}:`);
    try {
      const res = await fn();
      console.log(`   Result: WORKS ->`, res);
      return { status: "WORKS", result: res };
    } catch (err: unknown) {
      const error = err as Error;
      console.log(`   Result: THROWS -> "${error.message}"`);
      if (error.stack) {
        const stackLines = error.stack.split("\n");
        const throwSite = stackLines.find((l: string) => l.includes("src/") || l.includes("verification/"));
        if (throwSite) {
          console.log(`   Throw site: ${throwSite.trim()}`);
        }
      }
      return { status: "THROWS", error: error.message, stack: error.stack };
    }
  }

  // 1. Direct TenantContextManager
  console.log("1. Direct TenantContextManager.runWithSystemContext & getDbClient():");
  await TenantContextManager.runWithSystemContext("test-user", "test-req", async () => {
    const client = TenantContextManager.getDbClient();
    console.log(`   TenantContextManager.getDbClient() returned: ${client}\n`);
  });

  // 2. registerAction
  await testFunction("registerAction('Probe', 'probe@example.com', '***')", () =>
    registerAction("Probe", "probe@example.com", "Password123")
  );

  // 3. loginAction
  await testFunction("loginAction('probe@example.com', '***')", () =>
    loginAction("probe@example.com", "Password123")
  );

  // Set up mock session for session-dependent functions
  const mockUser = {
    id: "usr-123",
    name: "Test User",
    email: "test@example.com",
    role: "workspace_admin" as const,
    workspaceId: "ws-123"
  };

  // Helper to create valid session cookie
  const payloadStr = JSON.stringify({
    user: mockUser,
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  });
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");
  const { signPayload } = await import("../../src/services/auth/session");
  const signature = signPayload(payloadBase64);
  const cookieValue = `${payloadBase64}.${signature}`;

  const store = await cookieMock();
  store.set("seorchable_session", cookieValue);

  // 4. requireWorkspaceMembership
  await testFunction("requireWorkspaceMembership('usr-123', 'ws-123')", () =>
    requireWorkspaceMembership("usr-123", "ws-123")
  );

  // 5. requireRole
  await testFunction("requireRole('workspace_admin', 'ws-123')", () =>
    requireRole("workspace_admin", "ws-123")
  );

  // 6. authorizeApiRequest (header fallback branch)
  store.delete("seorchable_session"); // Clear session to trigger header branch
  const req = new NextRequest("http://localhost:3000/api/test", {
    headers: {
      "x-user-id": "usr-456",
      "x-tenant-id": "ws-456"
    }
  });
  await testFunction("authorizeApiRequest(req with headers)", () =>
    authorizeApiRequest(req)
  );
  store.set("seorchable_session", cookieValue); // Restore session

  // 7. createWorkspaceAction
  await testFunction("createWorkspaceAction('New Workspace')", () =>
    createWorkspaceAction("New Workspace")
  );

  // 8. listWorkspacesAction
  await testFunction("listWorkspacesAction()", () =>
    listWorkspacesAction()
  );

  // 9. acceptInvitationAction
  await testFunction("acceptInvitationAction('test-token')", () =>
    acceptInvitationAction("test-token")
  );

  // 10. switchWorkspaceAction
  await testFunction("switchWorkspaceAction('ws-456')", () =>
    switchWorkspaceAction("ws-456")
  );

  // Additional workspace actions calling system or tenant context dbClient
  // 11. inviteUserAction
  await testFunction("inviteUserAction('ws-123', 'invited@example.com', 'viewer')", () =>
    inviteUserAction("ws-123", "invited@example.com", "viewer")
  );

  // 12. removeMemberAction
  await testFunction("removeMemberAction('ws-123', 'usr-456')", () =>
    removeMemberAction("ws-123", "usr-456")
  );

  // 13. updateMemberRoleAction
  await testFunction("updateMemberRoleAction('ws-123', 'usr-456', 'workspace_admin')", () =>
    updateMemberRoleAction("ws-123", "usr-456", "workspace_admin")
  );
}

runProbe().catch(console.error);
