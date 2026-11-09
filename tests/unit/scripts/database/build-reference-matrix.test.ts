import { describe, expect, it } from "vitest";
import { getTableGovernanceMetadata } from "../../../../scripts/database/build-reference-matrix";

describe("database reference matrix governance metadata", () => {
  const junctionTables = ["pages_keywords", "pages_topics", "pages_entities", "keywords_topics", "topics_entities"];

  it.each(junctionTables)("keeps %s Tenant-Owned when policies are absent", (name) => {
    const metadata = getTableGovernanceMetadata(
      { name, columns: { organization_id: { name: "organization_id", type: "uuid", notNull: true, primaryKey: false } }, policies: {} },
      { missingPolicyTables: [name] },
      { missingEnable: [name], missingForce: [name] },
    );

    expect(metadata).toEqual({
      ownershipScope: "Tenant-Owned",
      rlsPoliciesDeclared: "None",
      tenantRlsPolicyCoverage: "Missing",
      migrationCoverage: "Incomplete (missing ENABLE + FORCE)",
      runtimeEnforcementVerification: "Not verified by static generation; see PostgreSQL isolation suite",
    });
  });

  it("reports Global ownership without treating missing tenant policies as a defect", () => {
    const metadata = getTableGovernanceMetadata(
      { name: "system_settings", columns: { id: { name: "id", type: "uuid", notNull: true, primaryKey: true } }, policies: { admin_read: { for: "SELECT" } } },
      { missingPolicyTables: [] },
      { missingEnable: [], missingForce: [] },
    );

    expect(metadata.ownershipScope).toBe("Global");
    expect(metadata.rlsPoliciesDeclared).toBe("1 policy object");
    expect(metadata.tenantRlsPolicyCoverage).toBe("Not applicable (Global)");
    expect(metadata.migrationCoverage).toBe("Not applicable (Global)");
    expect(metadata.runtimeEnforcementVerification).toBe("Not applicable (Global)");
  });
});
