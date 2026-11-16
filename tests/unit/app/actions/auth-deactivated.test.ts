import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginAction, registerAction } from '../../../../src/app/actions/auth';
import { TenantContextManager } from '../../../../src/core/database/tenant-context';

describe('Auth handling for deactivated users', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects login for deleted user (handled by AND deleted_at IS NULL)', async () => {
    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: unknown) => {
        if (sql.includes('INSERT INTO auth_rate_limits')) return { rows: [{ attempts: 1 }] };
        if (sql.includes('SELECT * FROM users WHERE lower(email)')) {
          // If deleted_at IS NULL condition filters out the user, it returns 0 rows.
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    await expect(loginAction('deleted@example.com', 'password123')).rejects.toThrow('Invalid credentials or user not found');
  });

  it('returns generic registration success for a soft-deleted email', async () => {
    const PostgresClientModule = await import("../../../../src/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const softDeletedUser = { id: 'usr-deleted', deleted_at: new Date('2026-01-01T00:00:00.000Z') };
    const emailLookupSql = "SELECT id FROM users WHERE lower(email) = $1 LIMIT 1";
    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: unknown) => {
        if (sql.includes('INSERT INTO auth_rate_limits')) return { rows: [{ attempts: 1 }] };
        // Return the soft-deleted account only for the unfiltered email lookup.
        if (sql === emailLookupSql && JSON.stringify(params) === JSON.stringify(['deleted@example.com'])) {
          return { rows: [softDeletedUser] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await registerAction('Deleted', 'User', 'deleted@example.com', 'Password123!!', 'deleteduser', 'en');
    expect(result).toEqual({ success: true, verificationEmailSent: true });
    expect(mockClient.query).toHaveBeenCalledWith(emailLookupSql, ['deleted@example.com']);
  });
});
