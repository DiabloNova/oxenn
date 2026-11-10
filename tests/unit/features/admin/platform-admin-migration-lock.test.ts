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
