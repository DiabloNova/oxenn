import { describe, expect, it, vi } from "vitest";
import { withPlatformAdminMigrationLock } from "../../../../scripts/platform-admin/migration-lock";

describe("Platform Admin migration advisory lock", () => {
  it("holds the database lock across migration-history reads and migration execution", async () => {
    const events: string[] = [];
    const client = {
      query: vi.fn(async (queryText: string) => {
        events.push(queryText.includes("pg_advisory_lock") ? "lock" : "unlock");
        return { rows: [] };
      }),
    };

    const result = await withPlatformAdminMigrationLock(client, async () => {
      events.push("migrate");
      return "applied";
    });

    expect(result).toBe("applied");
    expect(events).toEqual(["lock", "migrate", "unlock"]);
  });

  it("preserves migration success when advisory-lock cleanup fails", async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error("unlock failed")),
    };
    const onUnlockError = vi.fn();

    await expect(
      withPlatformAdminMigrationLock(client, async () => "applied", onUnlockError),
    ).resolves.toBe("applied");
    expect(onUnlockError).toHaveBeenCalledWith(expect.objectContaining({ message: "unlock failed" }));
  });

  it("preserves the migration error when both migration and lock cleanup fail", async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error("unlock failed")),
    };
    const migrationFailure = new Error("migration failed");
    const onUnlockError = vi.fn();

    await expect(
      withPlatformAdminMigrationLock(
        client,
        async () => { throw migrationFailure; },
        onUnlockError,
      ),
    ).rejects.toBe(migrationFailure);
    expect(onUnlockError).toHaveBeenCalledWith(expect.objectContaining({ message: "unlock failed" }));
  });

  it("releases the database lock when migration execution fails", async () => {
    const events: string[] = [];
    const client = {
      query: vi.fn(async (queryText: string) => {
        events.push(queryText.includes("pg_advisory_lock") ? "lock" : "unlock");
        return { rows: [] };
      }),
    };
    const failure = new Error("migration failed");

    await expect(
      withPlatformAdminMigrationLock(client, async () => {
        events.push("migrate");
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(events).toEqual(["lock", "migrate", "unlock"]);
  });
});
