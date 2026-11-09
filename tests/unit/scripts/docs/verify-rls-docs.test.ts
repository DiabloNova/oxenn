import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  collectRlsDocumentationIssues,
  CURRENT_RLS_DOCUMENTS,
  HISTORICAL_RLS_DOCUMENTS,
  isDirectExecution,
  resolveRepositoryPath,
  verifyRlsDocumentation,
} from "../../../../scripts/docs/verify-rls-docs";

const requiredPaths = [
  ...CURRENT_RLS_DOCUMENTS,
  ...HISTORICAL_RLS_DOCUMENTS,
  "ai_tasks/docs-folder-audit.md",
];

function repositoryDocuments() {
  return Object.fromEntries(requiredPaths.map((relativePath) => [
    relativePath,
    fs.readFileSync(resolveRepositoryPath(relativePath), "utf8"),
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

  it("rejects stale hard-coded 51-table claims in active READMEs", () => {
    const documents = repositoryDocuments();
    const target = CURRENT_RLS_DOCUMENTS[1];
    documents[target] += "\nThe 51 tenant-owned tables are all protected.\n";
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "stale hard-coded 51-table RLS claim",
    );
  });

  it("requires the Phase 1 counts to remain dated historical evidence", () => {
    const documents = repositoryDocuments();
    const target = HISTORICAL_RLS_DOCUMENTS[1];
    documents[target] = documents[target]
      .replace("Historical Phase 1 repository baseline", "Current Phase 1 repository baseline")
      .replace(/historical evidence\\s+only/i, "current evidence");
    const issues = collectRlsDocumentationIssues(documents).join("\n");
    expect(issues).toContain("dated historical Phase 1 baseline");
    expect(issues).toContain("historical counts are not current inventory");
  });

  it("requires the DOC-002 audit to record the current 56/14 inventory", () => {
    const documents = repositoryDocuments();
    const target = "ai_tasks/docs-folder-audit.md";
    documents[target] = documents[target].replace("56 Tenant-Owned and 14 Global", "51 Tenant-Owned and 19 Global");
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "current 56 Tenant-Owned / 14 Global Matrix inventory",
    );
  });

  it("distinguishes the corrected Phase 0 baseline from historical Phase 1 figures", () => {
    const documents = repositoryDocuments();
    const target = "ai_tasks/docs-folder-audit.md";
    documents[target] = documents[target].replace(
      "already records the corrected 56-table",
      "still awaits the 51-table",
    );
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "distinguish the corrected MVP Phase 0 baseline",
    );
  });

  it("reports missing required documentation explicitly", () => {
    const documents = repositoryDocuments();
    delete documents[CURRENT_RLS_DOCUMENTS[2]];
    expect(collectRlsDocumentationIssues(documents).join("\n")).toContain(
      "Missing required RLS documentation: " + CURRENT_RLS_DOCUMENTS[2],
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

describe("RLS documentation path safety", () => {
  it("rejects parent-directory traversal", () => {
    expect(() => resolveRepositoryPath("../outside.md")).toThrow(
      "escapes the repository root",
    );
  });

  it("rejects absolute paths", () => {
    expect(() => resolveRepositoryPath(path.resolve("outside.md"))).toThrow(
      "must be relative",
    );
  });

  it("rejects symlinks that resolve outside the repository root", () => {
    const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rls-doc-root-"));
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rls-doc-outside-"));
    try {
      fs.writeFileSync(path.join(outsideRoot, "secret.md"), "outside");
      fs.symlinkSync(outsideRoot, path.join(repositoryRoot, "linked"), "dir");
      expect(() => resolveRepositoryPath("linked/secret.md", repositoryRoot)).toThrow(
        "resolves outside the repository root",
      );
    } finally {
      fs.rmSync(repositoryRoot, { recursive: true, force: true });
      fs.rmSync(outsideRoot, { recursive: true, force: true });
    }
  });

  it("compares decoded script paths correctly when workspaces contain spaces and Unicode", () => {
    const scriptPath = path.join(os.tmpdir(), "oxenn workspace ü", "verify-rls-docs.ts");
    expect(isDirectExecution(scriptPath, pathToFileURL(scriptPath).href)).toBe(true);
    expect(isDirectExecution(scriptPath + ".other", pathToFileURL(scriptPath).href)).toBe(false);
    expect(isDirectExecution(undefined, pathToFileURL(scriptPath).href)).toBe(false);
  });
});
