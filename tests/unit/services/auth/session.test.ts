import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from "next/server";
import {
  createSession,
  getSession,
  requireSession,
  invalidateSession,
  setCookiesMock
} from "@/services/auth/session";
import { User } from "@/types/auth";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireWorkspaceMembership, authorizeApiRequest } from "@/services/auth/authorization";

interface MockCookieItem {
  value: string;
  name?: string;
  httpOnly?: boolean;
  sameSite?: string;
  path?: string;
  expires?: Date | string;
}

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

setCookiesMock(() => Promise.resolve(mockCookieStore));

describe('Auth Session & Security Regression Suite', () => {
  const mockUser: User = {
    id: "usr-test-123",
    name: "Test Engineer",
    email: "test@seorchable.ir",
    role: "workspace_admin",
    workspaceId: "ws-test-99"
  };

  const __global = global as Record<string, unknown>;

  beforeEach(() => {
    mockCookieStore.clear();
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
  });

  it('creates secure session cookies without PII in payload', async () => {
    await createSession(mockUser);

    const sessionCookie = mockCookieStore.store.get("oxenn_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("strict");
    expect(sessionCookie?.path).toBe("/");
    expect(sessionCookie?.expires).toBeDefined();

    const rawValue = sessionCookie!.value;
    expect(rawValue.includes(mockUser.id)).toBe(false);
    expect(rawValue.includes(mockUser.email)).toBe(false);
  });

  it('handles logout and invalidates active session', async () => {
    await createSession(mockUser);
    expect(await getSession()).not.toBeNull();

    await invalidateSession();

    expect(mockCookieStore.store.get("oxenn_session")).toBeUndefined();
    await expect(requireSession()).rejects.toThrow("Unauthorized");
  });

  it('rejects stolen cookie replay after session logout/revocation', async () => {
    await createSession(mockUser);
    const stolenCookie = mockCookieStore.store.get("oxenn_session");

    await invalidateSession();

    mockCookieStore.store.set("oxenn_session", stolenCookie!);
    expect(await getSession()).toBeNull();
  });

  it('strictly enforces workspace membership boundaries', async () => {
    await createSession(mockUser);

    await expect(requireWorkspaceMembership(mockUser.id, "ws-test-99")).resolves.not.toThrow();
    await expect(requireWorkspaceMembership(mockUser.id, "ws-other-hacker-tenant")).rejects.toThrow("is not a member");
  });

  it('overrides spoofed request headers with active signed session info', async () => {
    function createMockRequest(headers: Record<string, string>): NextRequest {
      const headerMap = new Map();
      Object.entries(headers).forEach(([k, v]) => headerMap.set(k.toLowerCase(), v));
      return {
        headers: { get: (name: string) => headerMap.get(name.toLowerCase()) || null }
      } as unknown as NextRequest;
    }

    await createSession(mockUser);
    const forgedHeadersReq = createMockRequest({
      "x-user-id": "usr-forged-hacker",
      "x-tenant-id": "ws-forged-hacker"
    });

    const apiAuthResult = await authorizeApiRequest(forgedHeadersReq);
    expect(apiAuthResult.userId).toBe(mockUser.id);
    expect(apiAuthResult.tenantId).toBe(mockUser.workspaceId);
  });
});
