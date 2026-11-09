import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  collectRlsDocumentationIssues,
  CURRENT_RLS_DOCUMENTS,
  HISTORICAL_RLS_DOCUMENTS,
  verifyRlsDocumentation,
} from "../../../../scripts/docs/verify-rls-docs.mjs";

const requiredPaths = [
  ...CURRENT_RLS_DOCUMENTS,
  ...HISTORICAL_RLS_DOCUMENTS,
  "ai_tasks/docs-folder-audit.md",
];

function repositoryDocuments() {
  return Object.fromEntries(requiredPaths.map((relativePath) => [
    relativePath,
    fs.readFileSync(relativePath, "utf8"),
  ]));
}

describe("RLS documentation consistency contract", () => {
  it("accepts the current active contract while preserving explicitly historical inventories", () => {
    expect(verifyRlsDocumentation(repositoryDocuments())).toEqual({
      checkedCurrentDocuments: 4,
      checkedHistoricalDocuments: 2,
    });
  });

  it("rejects the obsolete tenant-context setting in an active document", () => {
    const documents = repositoryDocuments();
    const target = CURRENT_RLS_DOCUMENTS[3];
    documents[target] = documents[target].replace(
      "app.current_tenant_id",
      "app.current_organization_id",
    );
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "obsolete app.current_organization_id",
    );
  });

  it("requires active documents to link to both canonical sources", () => {
    const documents = repositoryDocuments();
    const target = CURRENT_RLS_DOCUMENTS[1];
    documents[target] = documents[target].replace("reference-matrix.md", "reference-list.md");
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "must link to the generated Database Reference Matrix",
    );
  });

  it("rejects the obsolete hand-maintained 12-table inventory", () => {
    const documents = repositoryDocuments();
    const target = CURRENT_RLS_DOCUMENTS[0];
    documents[target] += "\nThe following 12 tables are strictly isolated.\n";
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "obsolete 12-table inventory",
    );
  });

  it("requires a visible historical label instead of banning old 51/19 evidence", () => {
    const documents = repositoryDocuments();
    const target = HISTORICAL_RLS_DOCUMENTS[0];
    documents[target] = documents[target].replace("HISTORICAL SNAPSHOT", "CURRENT SNAPSHOT");
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "must prominently identify its historical RLS snapshot as superseded",
    );
  });
});
