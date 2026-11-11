import { describe, expect, it } from "vitest";
import { getTableGovernanceMetadata } from "../../../../scripts/database/build-reference-matrix";

describe("database reference matrix governance metadata", () => {
  const junctionTables = ["pages_keywords", "pages_topics", "pages_entities", "keywords_topics", "topics_entities"];

  it.each(junctionTables)("keeps %s ORGANIZATION_SCOPED when policies are absent", (name) => {
    const metadata = getTableGovernanceMetadata(
      { name, columns: { organization_id: { name: "organization_id", type: "uuid", notNull: true, primaryKey: false } }, policies: {} },
      { missingPolicyTables: [name] },
      { missingEnable: [name], missingForce: [name] },
    );

    expect(metadata).toEqual({
      ownershipScope: "ORGANIZATION_SCOPED",
      rlsPoliciesDeclared: "None",
      tenantRlsPolicyCoverage: "Missing",
      migrationCoverage: "Incomplete (missing ENABLE + FORCE)",
      runtimeEnforcementVerification: "Not verified by static generation; see PostgreSQL isolation suite",
    });
  });

  it("reports shared ownership without treating missing tenant policies as a defect", () => {
    const metadata = getTableGovernanceMetadata(
      { name: "ai_engines", columns: { id: { name: "id", type: "uuid", notNull: true, primaryKey: true } }, policies: { admin_read: { for: "SELECT" } } },
      { missingPolicyTables: [] },
      { missingEnable: [], missingForce: [] },
    );

    expect(metadata.ownershipScope).toBe("GLOBAL_SHARED");
    expect(metadata.rlsPoliciesDeclared).toBe("1 policy object");
    expect(metadata.tenantRlsPolicyCoverage).toBe("Not applicable (GLOBAL_SHARED)");
    expect(metadata.migrationCoverage).toBe("Not applicable (GLOBAL_SHARED)");
    expect(metadata.runtimeEnforcementVerification).toBe("Not applicable (GLOBAL_SHARED)");
  });

  it("keeps Workspace-global data distinct from Platform Admin and organization ownership", () => {
    const metadata = getTableGovernanceMetadata(
      { name: "admin_users", columns: { id: { name: "id", type: "uuid", notNull: true, primaryKey: true } }, policies: {} },
      { missingPolicyTables: [] },
      { missingEnable: [], missingForce: [] },
    );

    expect(metadata.ownershipScope).toBe("WORKSPACE_GLOBAL");
    expect(metadata.tenantRlsPolicyCoverage).toBe("Not applicable (WORKSPACE_GLOBAL)");
    expect(metadata.migrationCoverage).toBe("Not applicable (WORKSPACE_GLOBAL)");
  });

  it("does not infer RLS applicability for explicitly unresolved ownership", () => {
    const metadata = getTableGovernanceMetadata(
      { name: "system_configurations", columns: { id: { name: "id", type: "uuid", notNull: true, primaryKey: true } }, policies: {} },
      { missingPolicyTables: [] },
      { missingEnable: [], missingForce: [] },
    );

    expect(metadata.ownershipScope).toBe("UNRESOLVED");
    expect(metadata.tenantRlsPolicyCoverage).toBe("Not evaluated (ownership unresolved)");
    expect(metadata.migrationCoverage).toBe("Not evaluated (ownership unresolved)");
    expect(metadata.runtimeEnforcementVerification).toBe("Blocked: ownership unresolved; no Global/tenant inference");
  });
});
