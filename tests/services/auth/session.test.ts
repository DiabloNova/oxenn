import { NextRequest } from "next/server";
import {
  createSession,
  getSession,
  requireSession,
  getAuthenticatedUser,
  invalidateSession,
  setCookiesMock
} from "../../../src/services/auth/session";
import { User } from "../../../src/types/auth";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { ingestDocumentAction } from "../../../src/app/actions/ingestion";
import { queryKnowledgeGraphAction } from "../../../src/app/actions/query";
import { requireWorkspaceMembership, requireRole, authorizeApiRequest } from "../../../src/services/auth/authorization";

interface MockCookieItem {
  value: string;
  name?: string;
  httpOnly?: boolean;
  sameSite?: string;
  path?: string;
  expires?: Date | string;
}

// Mock implementation of the cookie store
const mockCookieStore = {
  store: new Map<string, MockCookieItem>(),
  get(name: string): MockCookieItem | undefined {
    return this.store.get(name);
  },
  set(name: string, value: unknown, options?: Record<string, unknown>) {
    this.store.set(name, { value: value as string, name, ...options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
  clear() {
    this.store.clear();
  }
};

// Register our mock cookie function
setCookiesMock(() => Promise.resolve(mockCookieStore));

// Track intercepted Tenant Context values to verify protected actions resolve session context correctly
let lastInterceptedTenantId = "";
let lastInterceptedUserId = "";

// Mock TenantContextManager.runWithTenantContext to avoid hitting database / vector store / AI providers during security boundary testing
TenantContextManager.runWithTenantContext = async function (tenantId, userId) {
  lastInterceptedTenantId = tenantId;
  lastInterceptedUserId = userId || "";
  return { mockResult: "success" } as unknown as never;
};

// Mock database table for Scenario 14 (RLS & Mutation safety)
interface CompetitiveAnalysisRow {
  id: string;
  organization_id: string;
  user_url: string;
  market_position: string;
}

const mockCompetitiveAnalysesTable: CompetitiveAnalysisRow[] = [
  { id: "analysis-a1", organization_id: "ws-tenant-a", user_url: "tenant-a-brand.com", market_position: "Leader" },
  { id: "analysis-b1", organization_id: "ws-tenant-b", user_url: "tenant-b-brand.com", market_position: "Challenger" }
];

// Helper to simulate querying PostgreSQL with RLS policies active
function queryCompetitiveAnalysesRLS(activeTenantId: string): CompetitiveAnalysisRow[] {
  // RLS POLICY: SELECT organization_id = current_setting('app.current_tenant_id')
  return mockCompetitiveAnalysesTable.filter(row => row.organization_id === activeTenantId);
}

// Helper to simulate modifying a row under RLS protection
function updateCompetitiveAnalysisRLS(activeTenantId: string, rowId: string, updatedUrl: string): boolean {
  // RLS POLICY: UPDATE organization_id = current_setting('app.current_tenant_id')
  const row = mockCompetitiveAnalysesTable.find(r => r.id === rowId && r.organization_id === activeTenantId);
  if (!row) {
    return false; // Row either doesn't exist or is invisible due to RLS filter (Fail closed)
  }
  row.user_url = updatedUrl;
  return true;
}

export async function runAuthTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — PERMANENT SECURITY REGRESSION TEST SUITE (PHASE 2)");
  console.log("=========================================================================");

  const mockUser: User = {
    id: "usr-test-123",
    name: "Test Engineer",
    email: "test@seorchable.ir",
    role: "workspace_admin",
    workspaceId: "ws-test-99"
  };

  const __global = global as Record<string, unknown>;
  __global.__mockSessionRevoked = false;
  __global.__mockSessionReplaced = false;

  TenantContextManager.runWithSystemContext = (async function (userId: string | null, purpose: unknown, cb: () => Promise<unknown>) {
    if (!cb) return;
    const orig = TenantContextManager.getDbClient;
    TenantContextManager.getDbClient = () => ({
      query: async (sql: string, params: unknown[]) => {
        if (sql.includes('INSERT INTO sessions')) {
          return { rows: [{ id: 'mock-session-uuid' }] };
        }
        if (sql.includes('SELECT s.id')) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const crypto = require('crypto');
          const malformed = crypto.createHash('sha256').update('malformed_token').digest('hex');
          const another = crypto.createHash('sha256').update('another_malformed_token').digest('hex');
          if (params && (params[0] === malformed || params[0] === another)) return { rows: [] };
          if (__global.__mockSessionRevoked) return { rows: [] };
          return { rows: [{
            id: 'mock-session-uuid',
            userId: mockUser.id,
            workspaceId: mockUser.workspaceId,
            expiresAt: new Date(Date.now() + 24*3600*1000),
            revokedAt: __global.__mockSessionRevoked ? new Date() : null,
            replacedBy: __global.__mockSessionReplaced ? 'other-session' : null,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role
          }]};
        }
        if (sql.includes('UPDATE sessions')) {
          __global.__mockSessionRevoked = true;
          return { rows: [], rowCount: 1 };
        }
        if (sql.includes('SELECT role FROM organization_members')) {
          return { rows: [{ role: 'workspace_admin' }] };
        }
        if (sql.includes('SELECT 1 FROM organization_members')) {
          if (params && params[0] === 'usr-test-123' && params[1] === 'ws-test-99') return { rows: [{}] };
          if (params && params[0] === 'usr-test-123' && params[1] === 'ws-admin-home') return { rows: [{}] };
          return { rows: [] };
        }
        if (sql.includes('SELECT m.role FROM organization_members')) {
          return { rows: [{ role: 'workspace_admin' }] };
        }
        return { rows: [] };
      }
    });
    try {
      return await cb();
    } finally {
      TenantContextManager.getDbClient = orig;
    }
  }) as unknown as typeof TenantContextManager.runWithSystemContext;

  console.log("▶ SEC-REG-014 & 015: Testing Session Creation & Cookie Attributes...");
  mockCookieStore.clear();
  __global.__mockSessionRevoked = false;
  await createSession(mockUser);

  const sessionCookie = mockCookieStore.store.get("oxenn_session");
  if (!sessionCookie) throw new Error("SEC-REG-014 Failed: oxenn_session cookie not found");
  if (sessionCookie.httpOnly !== true) throw new Error("SEC-REG-014 Failed: httpOnly");
  if (sessionCookie.sameSite !== "strict") throw new Error("SEC-REG-014 Failed: sameSite");
  if (sessionCookie.path !== "/") throw new Error("SEC-REG-014 Failed: path");
  if (!sessionCookie.expires) throw new Error("SEC-REG-014 Failed: expires missing");

  const rawValue = sessionCookie.value;
  if (rawValue.includes(mockUser.id) || rawValue.includes(mockUser.email)) {
    throw new Error("SEC-REG-015 Failed: Authoritative session cookie contains unencrypted sensitive PII!");
  }
  console.log("  ✅ Secure session cookie created correctly.");

  console.log("▶ SEC-REG-013: Testing Logout & Invalidation...");
  __global.__mockSessionRevoked = false;
  await createSession(mockUser);
  if (!(await getSession())) throw new Error("Setup Failed: Active session not created");

  await invalidateSession();

  if (mockCookieStore.store.get("oxenn_session")) throw new Error("SEC-REG-013 Failed: cookie not cleared");

  try {
    await requireSession();
    throw new Error("SEC-REG-013 Failed: requireSession did not fail closed on logged out session");
  } catch (err: unknown) {
    if (!(err as Error).message?.includes("Unauthorized")) throw err;
  }
  console.log("  ✅ Logout invalidation completed successfully.");

  console.log("▶ SEC-REG-002: Stolen cookie replay rejection (Logout revocation test)");
  mockCookieStore.clear();
  __global.__mockSessionRevoked = false;
  await createSession(mockUser);
  const stolenCookie = mockCookieStore.store.get("oxenn_session");

  await invalidateSession();

  mockCookieStore.store.set("oxenn_session", stolenCookie!);
  if (await getSession() !== null) throw new Error("Stolen cookie replay test failed.");
  console.log("  ✅ Stolen cookie replay rejected successfully.");

  console.log("▶ SEC-REG-007: Testing Workspace Membership Enforcements...");
  mockCookieStore.clear();
  __global.__mockSessionRevoked = false;
  await createSession(mockUser);

  try {
    await requireWorkspaceMembership(mockUser.id, "ws-test-99");
  } catch (err) {
    throw new Error(`SEC-REG-007 Failed: Member blocked from own workspace: ${err}`);
  }

  try {
    await requireWorkspaceMembership(mockUser.id, "ws-other-hacker-tenant");
    throw new Error("SEC-REG-007 Failed: Non-member allowed access to another workspace!");
  } catch (err: unknown) {
    if (!(err as Error).message?.includes("is not a member")) throw err;
  }
  console.log("  ✅ Workspace membership boundaries strictly enforced.");

  console.log("▶ SEC-REG-011 & 001: Testing API Route Authorization Boundaries...");
  function createMockRequest(headers: Record<string, string>): NextRequest {
    const headerMap = new Map();
    Object.entries(headers).forEach(([k, v]) => headerMap.set(k.toLowerCase(), v));
    return {
      headers: { get: (name: string) => headerMap.get(name.toLowerCase()) || null }
    } as unknown as NextRequest;
  }

  __global.__mockSessionRevoked = false;
  await createSession(mockUser);
  const forgedHeadersReq = createMockRequest({
    "x-user-id": "usr-forged-hacker",
    "x-tenant-id": "ws-forged-hacker"
  });

  const apiAuthResult = await authorizeApiRequest(forgedHeadersReq);
  if (apiAuthResult.userId !== mockUser.id || apiAuthResult.tenantId !== mockUser.workspaceId) {
    throw new Error(`SEC-REG-011 Failed: Spoofed client headers overrode the active signed session!`);
  }
  console.log("  ✅ API Route boundaries tested; signed session overrides headers.");

  console.log("=========================================================================");
  console.log("✅ ALL REQUIRED SECURITY REGRESSION SCENARIOS PASSED SUCCESSFULLY!");
  console.log("=========================================================================");
}

if (require.main === module) {
  runAuthTests().catch((err) => {
    console.error("❌ Test Suite Failed with Error:", err);
    process.exit(1);
  });
}
