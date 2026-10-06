import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginAction, registerAction } from "@/app/actions/auth";
import { TenantContextManager } from "@/core/database/tenant-context";

describe('Auth handling for deactivated users', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://mock:mock@localhost:5432/mock";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects login for deleted user (handled by AND deleted_at IS NULL)', async () => {
    const PostgresClientModule = await import("@/features/admin/infrastructure/persistence/postgres");
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

  it('rejects registration for deleted user (handled by unique constraint logic/existing query)', async () => {
    const PostgresClientModule = await import("@/features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClientModule.PostgresClient.getInstance();

    const mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params: unknown) => {
        if (sql.includes('INSERT INTO auth_rate_limits')) return { rows: [{ attempts: 1 }] };
        // Registration checks if user exists using lower(email). If they are soft deleted, the query without deleted_at IS NULL will still find them.
        if (sql.includes('SELECT id FROM users WHERE lower(email)')) {
          return { rows: [{ id: 'usr-deleted' }] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    vi.spyOn(pgClient, "connectSystemClient").mockResolvedValue(mockClient as unknown as import("pg").PoolClient);

    const result = await registerAction('Deleted User', 'deleted@example.com', 'Password123');
    expect(result).toEqual({ errorCode: 'USER_EXISTS' });
  });
});
