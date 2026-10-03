import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deactivateAccountAction } from '../../../../src/app/actions/account';
import { requireSession } from '../../../../src/services/auth/session';

vi.mock('../../../../src/services/auth/session', () => ({
  requireSession: vi.fn(),
  revokeAllForUser: vi.fn(),
}));

vi.mock('../../../../src/services/auth/passwords', () => ({
  hashPassword: vi.fn().mockResolvedValue({ hash: 'mockHash', algorithm: 'scrypt', params: {} }),
  verifyPassword: vi.fn(),
}));

describe('deactivateAccountAction', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: 'usr-1', email: 'test@example.com', name: 'Test', role: 'viewer', workspaceId: 'ws-1' },
      expiresAt: new Date().toISOString(),
      status: 'authenticated',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects if no session', async () => {
    vi.mocked(requireSession).mockResolvedValue({
      user: null,
      expiresAt: null,
      status: 'unauthenticated',
    });
    await expect(deactivateAccountAction('password')).rejects.toThrow('Unauthorized');
  });

  it('fails if password verification fails', async () => {
    const { verifyPassword } = await import('../../../../src/services/auth/passwords');
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT * FROM user_credentials')) {
          return { rows: [{ password_hash: 'hash', params: {} }] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await deactivateAccountAction('wrongpass');
    expect(result).toEqual({ success: false, errorCode: 'INVALID_PASSWORD' });
  });

  it('successfully deactivates account and leaves sole admin alone', async () => {
    const { verifyPassword } = await import('../../../../src/services/auth/passwords');
    const { revokeAllForUser } = await import('../../../../src/services/auth/session');
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const queryMock = vi.fn().mockImplementation(async (sql: string, params: unknown) => {
      if (typeof sql !== 'string') {
        const text = (sql as {text?: string}).text || String(sql);
        if (text.includes('delete from "organization_members"')) {
           return { rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('SELECT * FROM user_credentials')) {
        return { rows: [{ password_hash: 'hash', params: {} }] };
      }
      if (sql.includes('SELECT m.organization_id')) {
        return { rows: [
          { organization_id: 'org-sole-admin', role: 'workspace_admin', org_name: 'Org 1' },
          { organization_id: 'org-other-admin', role: 'workspace_admin', org_name: 'Org 2' },
          { organization_id: 'org-viewer', role: 'viewer', org_name: 'Org 3' }
        ] };
      }
      if (sql.includes('SELECT count(*) AS admin_count FROM (')) {
        const paramsArray = params as string[];
        if (paramsArray && paramsArray[0] === 'org-sole-admin') {
          return { rows: [{ admin_count: '0' }] }; // Returns 0 because the user themselves was already soft-deleted in step 2!
        }
        if (paramsArray && paramsArray[0] === 'org-other-admin') {
          return { rows: [{ admin_count: '1' }] }; // 1 other active admin exists
        }
        if (paramsArray && paramsArray[0] === 'org-viewer') {
          return { rows: [{ admin_count: '1' }] };
        }
      }
      if (sql.includes('UPDATE users SET deleted_at')) {
        return { rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    const mockClient = {
      query: queryMock,
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);
    vi.spyOn(pgClient, "connectClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await deactivateAccountAction('correctpass');
    expect(result.success).toBe(true);
    expect(revokeAllForUser).toHaveBeenCalledWith('usr-1');

    // Make sure users table was updated
    expect(queryMock.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('UPDATE users SET deleted_at = NOW()'))).toBe(true);

    // Make sure db.delete was called for org-other-admin and org-viewer, but NOT org-sole-admin
    const deleteCalls = queryMock.mock.calls.filter(call =>
      typeof call[0] === 'object' && call[0].text && call[0].text.includes('delete from "organization_members"')
    );
    // 2 deletions (org-other-admin, org-viewer)
    expect(deleteCalls.length).toBe(2);
    expect(queryMock.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('INSERT INTO audit_records'))).toBe(true);
  });
});
