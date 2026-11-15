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
      "database/schema/user-profile.ts",
    ];
    const schemaNames = readTableNames(workspaceSources);
    const migrationDirectory = path.join(repositoryRoot, "database/drizzle");
    const metadataDirectory = path.join(migrationDirectory, "meta");
    const journal = JSON.parse(
      fs.readFileSync(path.join(metadataDirectory, "_journal.json"), "utf8"),
    ) as {
      version: string;
      dialect: string;
      entries: Array<{ idx: number; tag: string }>;
    };
    const snapshotPathFor = (index: number) =>
      path.join(metadataDirectory, String(index).padStart(4, "0") + "_snapshot.json");

    // The journal is authoritative for SQL execution order. SQL-only entries may
    // legitimately have no Drizzle snapshot, so snapshot lineage follows the
    // nearest preceding generated snapshot rather than assuming idx - 1.
    expect(journal.entries.map((entry) => entry.idx)).toEqual(
      journal.entries.map((_, index) => index),
    );
    for (const entry of journal.entries) {
      expect(fs.existsSync(path.join(migrationDirectory, entry.tag + ".sql"))).toBe(true);
    }

    const latestSnapshotEntry = [...journal.entries]
      .reverse()
      .find((entry) => fs.existsSync(snapshotPathFor(entry.idx)));
    if (!latestSnapshotEntry) {
      throw new Error("Workspace migration journal has no matching Drizzle snapshot.");
    }

    const snapshot = JSON.parse(
      fs.readFileSync(snapshotPathFor(latestSnapshotEntry.idx), "utf8"),
    ) as {
      id: string;
      prevId: string;
      version: string;
      dialect: string;
      tables: Record<string, { name: string }>;
    };

    const previousSnapshotEntry = journal.entries
      .filter((entry) => entry.idx < latestSnapshotEntry.idx)
      .reverse()
      .find((entry) => fs.existsSync(snapshotPathFor(entry.idx)));
    if (!previousSnapshotEntry) {
      throw new Error("Latest Workspace snapshot has no preceding generated snapshot.");
    }
    const previousSnapshot = JSON.parse(
      fs.readFileSync(snapshotPathFor(previousSnapshotEntry.idx), "utf8"),
    ) as { id: string };

    const snapshotNames = Object.values(snapshot.tables).map((table) => table.name);
    const userProfilesOwnership = getTableOwnershipEntry("workspace", "user_profiles");

    expect(snapshot.version).toBe(journal.version);
    expect(snapshot.dialect).toBe(journal.dialect);
    expect(snapshot.prevId).toBe(previousSnapshot.id);
    expect(new Set(schemaNames).size).toBe(schemaNames.length);
    expect([...schemaNames].sort()).toEqual([...snapshotNames].sort());
    expect(snapshotNames).toContain("user_profiles");
    expect(userProfilesOwnership).toMatchObject({
      scope: "USER_OWNED",
      status: "current",
    });
    expect(userProfilesOwnership.evidence).toEqual(
      expect.arrayContaining([
        "database/schema/user-profile.ts: userProfiles.userId references users.id; lower(username) has a unique index",
        "database/drizzle/meta/0016_snapshot.json: canonical Workspace snapshot",
      ]),
    );
    expect(getOwnershipRegistryDrift("workspace", schemaNames)).toEqual({
      missingRegistryEntries: [],
      staleRegistryEntries: [],
    });
    expect(Object.keys(WORKSPACE_TABLE_OWNERSHIP)).toHaveLength(71);
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
    expect(getTableOwnershipEntry("workspace", "system_configurations").scope).toBe("UNRESOLVED");
    expect(getTableOwnershipEntry("workspace", "admin_users").scope).toBe("WORKSPACE_GLOBAL");
    expect(getTableOwnershipEntry("workspace", "audit_records").scope).toBe("WORKSPACE_GLOBAL");
    expect(getTableOwnershipEntry("workspace", "permissions").scope).toBe("WORKSPACE_GLOBAL");
    expect(getTableOwnershipEntry("workspace", "roles").scope).toBe("WORKSPACE_GLOBAL");
  });

  it("keeps Workspace-global legacy data distinct from the isolated Platform Admin database", () => {
    expect(getTableOwnershipEntry("workspace", "admin_users").status).toBe("legacy");
    expect(getTableOwnershipEntry("workspace", "audit_records").scope).toBe("WORKSPACE_GLOBAL");
    expect(getTableOwnershipEntry("workspace", "roles").status).toBe("legacy");
    expect(getTableOwnershipEntry("workspace", "permissions").status).toBe("legacy");
    expect(getTableOwnershipEntry("platform-admin", "platform_admin_accounts").scope).toBe("PLATFORM_OWNED");
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
