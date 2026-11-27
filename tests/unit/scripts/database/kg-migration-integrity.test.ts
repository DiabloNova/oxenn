import { describe, expect, it, vi } from "vitest";
import {
  AUDITOR_ROLE,
  GRAPH_WRITE_LOCK_KEY,
  MIGRATOR_ROLE,
  WORKSPACE_DATABASE,
  areRequiredConstraintsReady,
  assertAuditorIdentity,
  assertMigratorIdentity,
  assertTenantCountReconciliation,
  backfillOneTenant,
  classifyCandidateCount,
  parseWorkspaceDatabaseUrl,
  type DatabaseClient,
} from "../../../../scripts/database/kg-migration-integrity";

const tenantId = "2b6c81d2-8b5a-4dfb-9aa4-91d9738f4c10";

function auditorIdentity(overrides: Record<string, unknown> = {}) {
  return {
    database_name: WORKSPACE_DATABASE,
    role_name: AUDITOR_ROLE,
    transaction_read_only: "on",
    default_transaction_read_only: "on",
    row_security: "on",
    can_login: true,
    is_superuser: false,
    can_create_database: false,
    can_create_role: false,
    can_replicate: false,
    bypasses_rls: true,
    can_create_in_database: false,
    can_connect_platform_admin: false,
    can_create_in_public: false,
    owns_graph_table: false,
    role_memberships: [],
    ...overrides,
  };
}

function migratorIdentity(overrides: Record<string, unknown> = {}) {
  return {
    database_name: WORKSPACE_DATABASE,
    role_name: MIGRATOR_ROLE,
    transaction_read_only: "on",
    default_transaction_read_only: "off",
    row_security: "on",
    can_login: true,
    is_superuser: false,
    can_create_database: false,
    can_create_role: false,
    can_replicate: false,
    bypasses_rls: false,
    can_create_in_database: false,
    can_connect_platform_admin: false,
    can_create_in_public: true,
    role_memberships: [],
    ...overrides,
  };
}

function fakeClient(options?: {
  before?: Record<string, unknown>;
  planned?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  const calls: Array<{ sql: string; values?: readonly unknown[] }> = [];
  const responses: Array<{ rows: Array<Record<string, unknown>> }> = [
    { rows: [] }, // session advisory lock
    { rows: [] }, // BEGIN
    {
      rows: [{
        tenant_id: tenantId,
        active_tenant_id: tenantId,
        transaction_read_only: "off",
        role_name: MIGRATOR_ROLE,
      }],
    },
    { rows: [] }, // SET LOCAL lock_timeout
    { rows: [] }, // SET LOCAL statement_timeout
    {
      rows: [{
        total_count: "3",
        matched_count: "1",
        unresolved_count: "1",
        ambiguous_count: "1",
        invalid_status_count: "0",
        ...options?.before,
      }],
    },
    {
      rows: [{
        eligible_count: "2",
        planned_matched_count: "1",
        planned_unresolved_count: "0",
        planned_ambiguous_count: "1",
        changed_count: "1",
        ...options?.planned,
      }],
    },
    {
      rows: [{
        total_count: "3",
        matched_count: "2",
        unresolved_count: "0",
        ambiguous_count: "1",
        invalid_status_count: "0",
        ...options?.after,
      }],
    },
    { rows: [] }, // COMMIT or ROLLBACK
    { rows: [{ pg_advisory_unlock: true }] }, // advisory unlock
  ];

  const client: DatabaseClient = {
    connect: vi.fn(async () => undefined),
    query: vi.fn(async (sql: string, values?: readonly unknown[]) => {
      calls.push({ sql, values });
      const response = responses.shift();
      if (!response) throw new Error("Unexpected SQL query: " + sql);
      return response;
    }),
    end: vi.fn(async () => undefined),
  };

  return { client, calls, remaining: () => responses.length };
}

describe("KG migration integrity connection contracts", () => {
  it("accepts only the dedicated direct Workspace auditor and migrator URLs", () => {
    const auditor = parseWorkspaceDatabaseUrl(
      "postgresql://oxenn_workspace_auditor:secret@ep-example.eu-central-1.aws.neon.tech:5432/oxenn_workspace?sslmode=require&channel_binding=require",
      AUDITOR_ROLE,
      "audit URL",
    );
    const migrator = parseWorkspaceDatabaseUrl(
      "postgresql://oxenn_workspace_migrator:secret@ep-example.eu-central-1.aws.neon.tech:5432/oxenn_workspace?sslmode=verify-full",
      MIGRATOR_ROLE,
      "migration URL",
    );

    expect(auditor.database).toBe(WORKSPACE_DATABASE);
    expect(auditor.username).toBe(AUDITOR_ROLE);
    expect(migrator.host).toBe(auditor.host);
    expect(migrator.username).toBe(MIGRATOR_ROLE);
  });

  it.each([
    ["wrong database", "postgresql://oxenn_workspace_auditor:secret@db.example.test/other?sslmode=require"],
    ["wrong role", "postgresql://postgres:secret@db.example.test/oxenn_workspace?sslmode=require"],
    ["pooler endpoint", "postgresql://oxenn_workspace_auditor:secret@ep-example-pooler.eu.neon.tech/oxenn_workspace?sslmode=require"],
    ["TLS downgrade", "postgresql://oxenn_workspace_auditor:secret@db.example.test/oxenn_workspace?sslmode=disable"],
    ["unknown driver option", "postgresql://oxenn_workspace_auditor:secret@db.example.test/oxenn_workspace?sslmode=require&host=other.example"],
    ["duplicate query option", "postgresql://oxenn_workspace_auditor:secret@db.example.test/oxenn_workspace?sslmode=require&sslmode=verify-full"],
  ])("rejects %s before opening a database connection", (_label, url) => {
    expect(() => parseWorkspaceDatabaseUrl(url, AUDITOR_ROLE, "audit URL")).toThrow();
  });

  it("requires the global auditor to be read-only, BYPASSRLS, and narrowly delegated", () => {
    expect(() => assertAuditorIdentity(auditorIdentity())).not.toThrow();
    expect(() => assertAuditorIdentity(auditorIdentity({ bypasses_rls: false }))).toThrow(/BYPASSRLS/);
    expect(() => assertAuditorIdentity(auditorIdentity({ default_transaction_read_only: "off" }))).toThrow(/BYPASSRLS/);
    expect(() => assertAuditorIdentity(auditorIdentity({ can_create_role: true }))).toThrow(/BYPASSRLS/);
    expect(() => assertAuditorIdentity(auditorIdentity({ role_memberships: ["pg_read_all_data"] }))).toThrow(/inherit/);
  });

  it("requires the Backfill identity to remain under forced RLS and not bypass it", () => {
    expect(() => assertMigratorIdentity(migratorIdentity())).not.toThrow();
    // The existing migrator has database/schema DDL grants for Drizzle, but it
    // must not gain the distinct BYPASSRLS role attribute.
    expect(() => assertMigratorIdentity(migratorIdentity({ can_create_in_database: true }))).not.toThrow();
    expect(() => assertMigratorIdentity(migratorIdentity({ bypasses_rls: true }))).toThrow(/BYPASSRLS/);
    expect(() => assertMigratorIdentity(migratorIdentity({ row_security: "off" }))).toThrow(/BYPASSRLS/);
    expect(() => assertMigratorIdentity(migratorIdentity({ role_memberships: ["app_owner"] }))).toThrow(/inherit/);
    expect(() => assertMigratorIdentity(migratorIdentity({ can_create_database: true }))).toThrow(/BYPASSRLS/);
  });
});

describe("canonical schema constraint verification", () => {
  const validatedConstraints = [
    {
      table_name: "entity_relationships",
      constraint_name: "entity_relationships_source_entity_id_org_id_fkey",
      is_validated: true,
      constraint_type: "f",
      columns: ["source_entity_id", "organization_id"],
      referenced_schema: "public",
      referenced_table: "entities",
      referenced_columns: ["id", "organization_id"],
    },
    {
      table_name: "entity_relationships",
      constraint_name: "entity_relationships_target_entity_id_org_id_fkey",
      is_validated: true,
      constraint_type: "f",
      columns: ["target_entity_id", "organization_id"],
      referenced_schema: "public",
      referenced_table: "entities",
      referenced_columns: ["id", "organization_id"],
    },
    {
      table_name: "kg_entities",
      constraint_name: "kg_entities_canonical_entity_id_tenant_id_fkey",
      is_validated: true,
      constraint_type: "f",
      columns: ["canonical_entity_id", "tenant_id"],
      referenced_schema: "public",
      referenced_table: "entities",
      referenced_columns: ["id", "organization_id"],
    },
    ...[
      "kg_entities_resolution_status_check",
      "kg_entities_resolution_consistency_check",
      "kg_entities_matched_method_check",
      "kg_entities_source_chunk_ids_array_check",
    ].map((constraint_name) => ({
      table_name: "kg_entities",
      constraint_name,
      is_validated: true,
      constraint_type: "c",
      columns: [],
      referenced_table: null,
      referenced_columns: [],
    })),
    {
      table_name: "kg_relationships",
      constraint_name: "kg_relationships_source_entity_id_tenant_id_fkey",
      is_validated: true,
      constraint_type: "f",
      columns: ["source_entity_id", "tenant_id"],
      referenced_schema: "public",
      referenced_table: "kg_entities",
      referenced_columns: ["id", "tenant_id"],
    },
    {
      table_name: "kg_relationships",
      constraint_name: "kg_relationships_target_entity_id_tenant_id_fkey",
      is_validated: true,
      constraint_type: "f",
      columns: ["target_entity_id", "tenant_id"],
      referenced_schema: "public",
      referenced_table: "kg_entities",
      referenced_columns: ["id", "tenant_id"],
    },
  ] as const;

  it("accepts only validated composite foreign keys with exact source and target columns", () => {
    expect(areRequiredConstraintsReady(validatedConstraints)).toBe(true);
    expect(areRequiredConstraintsReady(
      validatedConstraints.map((row) =>
        row.constraint_name === "kg_relationships_source_entity_id_tenant_id_fkey"
          ? { ...row, columns: ["source_entity_id"] }
          : row,
      ),
    )).toBe(false);
    expect(areRequiredConstraintsReady(
      validatedConstraints.map((row) =>
        row.constraint_name === "kg_entities_canonical_entity_id_tenant_id_fkey"
          ? { ...row, referenced_table: "kg_entities" }
          : row,
      ),
    )).toBe(false);
    expect(areRequiredConstraintsReady(
      validatedConstraints.map((row) =>
        row.constraint_name === "kg_relationships_target_entity_id_tenant_id_fkey"
          ? { ...row, is_validated: false }
          : row,
      ),
    )).toBe(false);
    expect(areRequiredConstraintsReady(
      validatedConstraints.map((row) =>
        row.constraint_name === "kg_entities_canonical_entity_id_tenant_id_fkey"
          ? { ...row, referenced_schema: "unsafe_schema" }
          : row,
      ),
    )).toBe(false);
  });
});

describe("canonical entity classification", () => {
  it("matches only one exact normalized-name and exact-type candidate", () => {
    expect(classifyCandidateCount(1)).toBe("matched");
    expect(classifyCandidateCount(0)).toBe("unresolved");
    expect(classifyCandidateCount(2)).toBe("ambiguous");
    expect(classifyCandidateCount(25)).toBe("ambiguous");
  });

  it("rejects an invalid candidate count instead of guessing", () => {
    expect(() => classifyCandidateCount(-1)).toThrow(/non-negative/);
    expect(() => classifyCandidateCount(1.5)).toThrow(/non-negative/);
  });
});

describe("tenant Backfill reconciliation", () => {
  it("accepts only a total-preserving classification with the expected matched increase", () => {
    expect(() =>
      assertTenantCountReconciliation(
        { total: 3, matched: 1, unresolved: 1, ambiguous: 1, invalidStatus: 0 },
        { eligible: 2, matched: 1, unresolved: 0, ambiguous: 1, changed: 1 },
        { total: 3, matched: 2, unresolved: 0, ambiguous: 1, invalidStatus: 0 },
      ),
    ).not.toThrow();
  });

  it.each([
    [
      "lost rows",
      { total: 2, matched: 2, unresolved: 0, ambiguous: 0, invalidStatus: 0 },
    ],
    [
      "unexpected matched rows",
      { total: 3, matched: 3, unresolved: 0, ambiguous: 0, invalidStatus: 0 },
    ],
    [
      "unsupported status",
      { total: 3, matched: 2, unresolved: 0, ambiguous: 0, invalidStatus: 1 },
    ],
  ])("rejects %s", (_description, after) => {
    expect(() =>
      assertTenantCountReconciliation(
        { total: 3, matched: 1, unresolved: 1, ambiguous: 1, invalidStatus: 0 },
        { eligible: 2, matched: 1, unresolved: 0, ambiguous: 1, changed: 1 },
        after,
      ),
    ).toThrow(/reconciliation failed/);
  });

  it("acquires the existing graph-write lock before a SERIALIZABLE tenant transaction", async () => {
    const { client, calls, remaining } = fakeClient();
    const planned = await backfillOneTenant(client, tenantId);

    expect(planned).toEqual({
      eligible: 2,
      matched: 1,
      unresolved: 0,
      ambiguous: 1,
      changed: 1,
    });
    expect(calls[0].sql).toContain("pg_advisory_lock");
    expect(calls[0].values).toEqual([tenantId, GRAPH_WRITE_LOCK_KEY]);
    expect(calls[1].sql).toBe("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(calls[2].sql).toContain("set_config('app.current_tenant_id'");
    expect(calls[2].values).toEqual([tenantId]);
    expect(calls[6].sql).toContain("UPDATE public.kg_entities");
    expect(calls[6].sql).toContain("kg.resolution_status <> 'matched'");
    expect(calls[6].sql).toContain("kg.tenant_id = $1::uuid");
    expect(calls[8].sql).toBe("COMMIT");
    expect(calls[9].sql).toContain("pg_advisory_unlock");
    expect(remaining()).toBe(0);
  });

  it("does not commit when post-update counts do not reconcile", async () => {
    const { client, calls } = fakeClient({
      after: { total_count: "2", matched_count: "1", unresolved_count: "0", ambiguous_count: "1" },
    });

    await expect(backfillOneTenant(client, tenantId)).rejects.toThrow(/reconciliation failed/);
    expect(calls.some((call) => call.sql === "COMMIT")).toBe(false);
    expect(calls.some((call) => call.sql === "ROLLBACK")).toBe(true);
    expect(calls[calls.length - 1].sql).toContain("pg_advisory_unlock");
  });

  it("rejects a malformed tenant identifier before issuing SQL", async () => {
    const { client, calls } = fakeClient();
    await expect(backfillOneTenant(client, "not-a-uuid")).rejects.toThrow(/malformed tenant/);
    expect(calls).toHaveLength(0);
  });
});
