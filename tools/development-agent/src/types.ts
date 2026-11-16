export type TaskClass = "tooling" | "mvp-stage" | "remediation" | "maintenance";
export interface TaskEnvelope {
  schemaVersion: 1; taskId: string; title: string; taskClass: TaskClass;
  objective: string; authorizedBy: string; targetBranch: string; baseSha: string;
  allowedPaths: string[]; prohibitedPaths: string[]; authoritativeDocs: string[];
  successCriteria: string[]; stopConditions: string[];
  providerPolicy: { mode: "disabled"; maxTokens: 0; maxCostUsd: 0 };
  permittedCommands: [];
}
export interface GitSnapshot {
  repositoryRoot: string; branch: string; headSha: string; mainSha?: string;
  isClean: boolean; executionBoundaryKnown: boolean; statusKnown: boolean; statusEntryCount: number;
}
export interface FileEvidence { path: string; sha256: string; }
export interface DevelopmentPlan {
  schemaVersion: 1; runId: string; createdAt: string; status: "READY" | "BLOCKED";
  reasonCodes: string[];
  task: {
    taskId: string; title: string; taskClass: TaskClass; objective: string;
    successCriteria: string[]; stopConditions: string[];
  };
  repository: GitSnapshot; applicableInstructions: FileEvidence[];
  authoritativeDocuments: FileEvidence[]; missingAuthorityDocs: string[]; allowedPaths: string[];
  prohibitedPaths: string[]; steps: string[]; forbiddenActions: string[];
}
export interface RunLedgerRecord {
  schemaVersion: 1; event: "plan"; runId: string; createdAt: string; taskId: string;
  state: "READY" | "BLOCKED"; branch: string; headSha: string; baseSha: string;
  reasonCodes: string[]; instructionPaths: string[]; documentPaths: string[];
}
