import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  WORKSPACE_TABLE_OWNERSHIP,
  PLATFORM_ADMIN_TABLE_OWNERSHIP,
  getOwnershipRegistryDrift,
  getTableOwnershipEntry,
} from "../../../../scripts/database/table-ownership-registry";

const repositoryRoot = process.cwd();

function readTableNames(relativePaths: readonly string[]): string[] {
  return relativePaths.flatMap((relativePath) => {
    const source = fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
    return Array.from(
      source.matchAll(/pgTable[(][^"']*["']([^"']+)["']/g),
      (match) => match[1],
    );
  });
}

describe("Canonical table ownership registry", () => {
  it("accounts for every canonical Workspace Drizzle table and the latest snapshot", () => {
    const workspaceSources = [
      "database/schema/index.ts",
      "database/schema/organization-table.ts",
      "database/schema/api-keys.ts",
    ];
    const schemaNames = readTableNames(workspaceSources);
    const journal = JSON.parse(
      fs.readFileSync(
        path.join(repositoryRoot, "database/drizzle/meta/_journal.json"),
        "utf8",
      ),
    ) as { entries: Array<{ idx: number }> };
    const latestEntry = journal.entries[journal.entries.length - 1];
    const snapshotPath = path.join(
      repositoryRoot,
      "database/drizzle/meta",
      String(latestEntry.idx).padStart(4, "0") + "_snapshot.json",
    );
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as {
      tables: Record<string, { name: string }>;
    };
    const snapshotNames = Object.values(snapshot.tables).map((table) => table.name);

    expect(new Set(schemaNames).size).toBe(schemaNames.length);
    expect([...schemaNames].sort()).toEqual([...snapshotNames].sort());
    expect(getOwnershipRegistryDrift("workspace", schemaNames)).toEqual({
      missingRegistryEntries: [],
      staleRegistryEntries: [],
    });
    expect(Object.keys(WORKSPACE_TABLE_OWNERSHIP)).toHaveLength(70);
  });

  it("accounts for every table in the separate Platform Admin Drizzle schema", () => {
    const platformAdminNames = readTableNames([
      "database/platform-admin/schema/index.ts",
    ]);

    expect(getOwnershipRegistryDrift("platform-admin", platformAdminNames)).toEqual({
      missingRegistryEntries: [],
      staleRegistryEntries: [],
    });
    expect(Object.keys(PLATFORM_ADMIN_TABLE_OWNERSHIP)).toHaveLength(7);
    expect(platformAdminNames).toHaveLength(7);
  });

  it("requires a rationale and evidence for every explicit entry", () => {
    for (const registry of [
      WORKSPACE_TABLE_OWNERSHIP,
      PLATFORM_ADMIN_TABLE_OWNERSHIP,
    ]) {
      for (const entry of Object.values(registry)) {
        expect(entry.rationale.trim().length).toBeGreaterThan(0);
        expect(entry.evidence.length).toBeGreaterThan(0);
      }
    }
  });

  it("surfaces unresolved legacy ownership instead of defaulting it to Global", () => {
    expect(getTableOwnershipEntry("workspace", "admin_users").scope).toBe("UNRESOLVED");
    expect(getTableOwnershipEntry("workspace", "audit_records").scope).toBe("UNRESOLVED");
    expect(getTableOwnershipEntry("workspace", "permissions").scope).toBe("UNRESOLVED");
    expect(getTableOwnershipEntry("workspace", "roles").scope).toBe("UNRESOLVED");
  });

  it("keeps user-owned sessions distinct from their optional workspace context", () => {
    const session = getTableOwnershipEntry("workspace", "sessions");
    expect(session.scope).toBe("USER_OWNED");
    expect(session.rationale).toContain("workspace_id");
  });

  it("does not infer Global for a table missing from the registry", () => {
    expect(() => getTableOwnershipEntry("workspace", "new_unclassified_table"))
      .toThrow(/No explicit ownership entry/);
    expect(() => getTableOwnershipEntry("platform-admin", "new_unclassified_table"))
      .toThrow(/No explicit ownership entry/);
  });
});
