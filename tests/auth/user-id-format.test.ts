import { describe, it, expect, vi } from 'vitest';
import { registerAction } from '../../src/app/actions/auth';
import { TenantContextManager } from '../../src/core/database/tenant-context';

// Mock createSession at the top level
vi.mock('../../src/services/auth/session', () => ({
    createSession: vi.fn(),
    invalidateSession: vi.fn(),
    getSession: vi.fn()
}));

describe('User ID Generation', () => {
    it('should generate an ID in the correct format with a full UUID', async () => {
        let generatedId = '';

        // Mock DB Client and TenantContextManager
        vi.spyOn(TenantContextManager, 'runWithSystemContext').mockImplementation(async (tenantId, actorId, fn) => {
            return await fn();
        });

        vi.spyOn(TenantContextManager, 'getDbClient').mockReturnValue({
            query: vi.fn().mockImplementation(async (query: string, params: Array<string>) => {
                if (query.includes("SELECT id FROM users")) {
                    return { rows: [] };
                }
                if (query.includes("INSERT INTO users")) {
                    generatedId = params[0]; // Capture the user ID
                }
                return { rows: [] };
            })
        } as unknown as { query: () => Promise<{rows: unknown[]}> });

        const result = await registerAction("Test User", "test@example.com", "Password123");

        // Assertions
        expect(generatedId).toMatch(/^usr-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(result.id).toEqual(generatedId);

        vi.restoreAllMocks();
    });

    it('should generate unique IDs (sanity check with 10k iterations)', async () => {
        const ids = new Set();

        // For this test, we just want to run the ID generation logic inside registerAction
        // Since the DB insertion takes time and we don't want to actually insert 10k rows,
        // we'll mock the DB entirely and just collect the IDs.

        vi.spyOn(TenantContextManager, 'runWithSystemContext').mockImplementation(async (tenantId, actorId, fn) => {
            return await fn();
        });

        vi.spyOn(TenantContextManager, 'getDbClient').mockReturnValue({
            query: vi.fn().mockImplementation(async (query: string, params: Array<string>) => {
                if (query.includes("SELECT id FROM users")) {
                    return { rows: [] };
                }
                if (query.includes("INSERT INTO users")) {
                    ids.add(params[0]);
                }
                return { rows: [] };
            })
        } as unknown as { query: () => Promise<{rows: unknown[]}> });

        for (let i = 0; i < 10000; i++) {
            await registerAction(`Test User ${i}`, `test${i}@example.com`, "Password123");
        }

        expect(ids.size).toBe(10000); // Expect all IDs to be unique

        vi.restoreAllMocks();
    });
});
