import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];
const verifierPath = path.resolve(process.cwd(), "scripts/database/verify-rls-migrations.ts");

function runVerifier(finalMigration: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rls-verifier-regression-"));
  temporaryRoots.push(root);

  const migrationDirectory = path.join(root, "database/drizzle");
  const metadataDirectory = path.join(migrationDirectory, "meta");
  fs.mkdirSync(metadataDirectory, { recursive: true });

  fs.writeFileSync(
    path.join(metadataDirectory, "_journal.json"),
    JSON.stringify({
      entries: [
        { idx: 0, tag: "0000_baseline" },
        { idx: 1, tag: "0001_final" },
      ],
    }),
  );
  fs.writeFileSync(
    path.join(metadataDirectory, "0001_snapshot.json"),
    JSON.stringify({
      tables: {
        tenant_data: {
          name: "tenant_data",
          policies: { tenant_policy: {} },
        },
      },
    }),
  );
  fs.writeFileSync(
    path.join(migrationDirectory, "0000_baseline.sql"),
    "ALTER TABLE public.tenant_data ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.tenant_data FORCE ROW LEVEL SECURITY;\n",
  );
  fs.writeFileSync(path.join(migrationDirectory, "0001_final.sql"), finalMigration);

  return spawnSync(path.resolve(process.cwd(), "node_modules/.bin/tsx"), [verifierPath], {
    cwd: root,
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("RLS migration verifier DO-block fail-closed behavior", () => {
  it("rejects dynamic SQL in a DO block after a Drizzle statement breakpoint", () => {
    const result = runVerifier(
      "--> statement-breakpoint\nDO $$ BEGIN EXECUTE 'ALTER TABLE tenant_data DISABLE ROW LEVEL SECURITY'; END $$;\n",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("DO block contains dynamic SQL or table/RLS-changing DDL");
  });

  it("rejects static RLS-changing DDL in a DO block without EXECUTE", () => {
    const result = runVerifier(
      "--> statement-breakpoint\nDO $$ BEGIN ALTER TABLE tenant_data DISABLE ROW LEVEL SECURITY; END $$;\n",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("DO block contains dynamic SQL or table/RLS-changing DDL");
  });

  it("allows a harmless DO block after a Drizzle statement breakpoint", () => {
    const result = runVerifier(
      "--> statement-breakpoint\nDO $$ BEGIN RAISE NOTICE 'safe block'; END $$;\n",
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("RLS migration final-state verified");
  });
});
