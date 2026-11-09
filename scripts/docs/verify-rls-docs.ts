import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();

export const CURRENT_RLS_DOCUMENTS = Object.freeze([
  "docs/architecture/database/tenant-context-spec.md",
  "docs/security/README.md",
  "docs/architecture/README.md",
  "docs/architecture/features/ARCHITECTURE.md",
] as const);

export const HISTORICAL_RLS_DOCUMENTS = Object.freeze([
  "docs/architecture/database/reconciliation-report.md",
  "docs/project/MVP_PHASE_1_SECURITY_TENANT_ISOLATION.md",
] as const);

/**
 * Resolve an allowlisted repository path and reject both lexical traversal and
 * symlink escapes. The optional root is exposed for isolated security tests.
 */
export function resolveRepositoryPath(relativePath: string, repositoryRoot = root): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Repository path must be relative: ${relativePath}`);
  }

  const canonicalRoot = fs.realpathSync(repositoryRoot);
  const lexicalCandidate = path.resolve(canonicalRoot, relativePath);
  const lexicalRelative = path.relative(canonicalRoot, lexicalCandidate);
  if (
    lexicalRelative === ".." ||
    lexicalRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(lexicalRelative)
  ) {
    throw new Error(`Repository path escapes the repository root: ${relativePath}`);
  }

  const canonicalCandidate = fs.realpathSync(lexicalCandidate);
  const canonicalRelative = path.relative(canonicalRoot, canonicalCandidate);
  if (
    canonicalRelative === ".." ||
    canonicalRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(canonicalRelative)
  ) {
    throw new Error(`Repository path resolves outside the repository root: ${relativePath}`);
  }

  return canonicalCandidate;
}

export function isDirectExecution(argvPath: string | undefined, moduleUrl: string): boolean {
  return Boolean(argvPath) && path.resolve(argvPath!) === path.resolve(fileURLToPath(moduleUrl));
}

export function collectRlsDocumentationIssues(documents: Record<string, string>) {
  const issues: string[] = [];
  const read = (relativePath: string): string => {
    const content = documents[relativePath];
    if (typeof content !== "string") {
      issues.push(`Missing required RLS documentation: ${relativePath}`);
      return "";
    }
    return content;
  };

  for (const relativePath of CURRENT_RLS_DOCUMENTS) {
    const content = read(relativePath);
    if (!content) continue;
    if (content.includes("app.current_organization_id")) {
      issues.push(`${relativePath} uses the obsolete app.current_organization_id setting`);
    }
    if (!content.includes("app.current_tenant_id")) {
      issues.push(`${relativePath} must identify the canonical app.current_tenant_id setting`);
    }
    if (!content.includes("canonical-data-contract.md")) {
      issues.push(`${relativePath} must link to the Canonical Data Contract`);
    }
    if (!content.includes("reference-matrix.md")) {
      issues.push(`${relativePath} must link to the generated Database Reference Matrix`);
    }
  }

  const tenantContextPath = CURRENT_RLS_DOCUMENTS[0];
  const tenantContext = documents[tenantContextPath] ?? "";
  if (/following\s+12\s+tables|exactly\s+12\s+tables|12\s+tables\s+are\s+strictly\s+isolated/i.test(tenantContext)) {
    issues.push(`${tenantContextPath} must not maintain the obsolete 12-table inventory`);
  }
  if (/^\|\s*Table Name\s*\|/im.test(tenantContext)) {
    issues.push(`${tenantContextPath} must defer table inventory to the generated Reference Matrix`);
  }

  for (const relativePath of CURRENT_RLS_DOCUMENTS.slice(1, 3)) {
    const content = documents[relativePath] ?? "";
    if (/\b51\s+(?:tenant[- ]scoped|policy[- ]bearing|tenant[- ]owned)\s+tables?\b/i.test(content)) {
      issues.push(`${relativePath} contains a stale hard-coded 51-table RLS claim`);
    }
  }

  const phaseOnePath = "docs/project/MVP_PHASE_1_SECURITY_TENANT_ISOLATION.md";
  const phaseOne = documents[phaseOnePath] ?? "";
  if (!/Historical Phase 1 repository baseline\s*[—-]\s*2026-11-04/i.test(phaseOne)) {
    issues.push(`${phaseOnePath} must label its 70/51 figures as the dated historical Phase 1 baseline`);
  }
  if (!/historical evidence\s+only/i.test(phaseOne)) {
    issues.push(`${phaseOnePath} must state that its historical counts are not current inventory`);
  }

  const reconciliationPath = HISTORICAL_RLS_DOCUMENTS[0];
  const reconciliation = read(reconciliationPath);
  if (reconciliation && !/HISTORICAL SNAPSHOT[\s—-]*NOT THE CURRENT RLS CONTRACT/i.test(reconciliation)) {
    issues.push(`${reconciliationPath} must prominently identify its historical RLS snapshot as superseded`);
  }
  for (const relativePath of HISTORICAL_RLS_DOCUMENTS) {
    const content = relativePath === reconciliationPath ? reconciliation : phaseOne;
    if (content && (!/canonical-data-contract\.md/.test(content) || !/reference-matrix\.md/.test(content))) {
      issues.push(`${relativePath} must point readers to the current canonical contract and generated Matrix`);
    }
  }

  const auditPath = "ai_tasks/docs-folder-audit.md";
  const audit = read(auditPath);
  const doc002Start = audit.indexOf("### DOC-002 —");
  const doc003Start = audit.indexOf("### DOC-003 —", doc002Start + 1);
  const doc002 = doc002Start >= 0 ? audit.slice(doc002Start, doc003Start >= 0 ? doc003Start : undefined) : "";
  if (!doc002 || !/56 Tenant-Owned and 14 Global/i.test(doc002)) {
    issues.push("DOC-002 in docs-folder-audit.md must record the current 56 Tenant-Owned / 14 Global Matrix inventory");
  }
  if (!/MVP Phase 0[\s\S]*?already records the corrected 56-table/i.test(doc002)) {
    issues.push("DOC-002 audit text must distinguish the corrected MVP Phase 0 baseline from historical Phase 1 figures");
  }

  return issues;
}

export function verifyRlsDocumentation(documents: Record<string, string>) {
  const issues = collectRlsDocumentationIssues(documents);
  assert.deepEqual(issues, [], `RLS documentation consistency failed:\n- ${issues.join("\n- ")}`);
  return { checkedCurrentDocuments: CURRENT_RLS_DOCUMENTS.length, checkedHistoricalDocuments: HISTORICAL_RLS_DOCUMENTS.length };
}

function main() {
  const required = [...CURRENT_RLS_DOCUMENTS, ...HISTORICAL_RLS_DOCUMENTS, "ai_tasks/docs-folder-audit.md"];
  const documents = Object.fromEntries(required.map((relativePath) => [
    relativePath,
    fs.readFileSync(resolveRepositoryPath(relativePath), "utf8"),
  ]));
  const result = verifyRlsDocumentation(documents);
  console.log(`RLS documentation consistency passed (${result.checkedCurrentDocuments} active documents, ${result.checkedHistoricalDocuments} historical documents).`);
}

if (isDirectExecution(process.argv[1], import.meta.url)) {
  main();
}
