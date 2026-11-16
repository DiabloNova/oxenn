import { randomUUID } from "node:crypto";
import type { DevelopmentPlan,TaskEnvelope,FileEvidence } from "./types";
import { inspectGitRepository } from "./git-inspector";
import { loadApplicableInstructions,loadAuthoritativeDocuments } from "./instruction-loader";

export interface BuildPlanOptions { repositoryPath: string; task: TaskEnvelope; }
export async function buildPlan(options: BuildPlanOptions): Promise<DevelopmentPlan> {
  const createdAt = new Date().toISOString();
  const runId = randomUUID();
  const repository = await inspectGitRepository(options.repositoryPath);
  const task = options.task;
  const reasonCodes: string[] = [];
  if (!repository.isClean) reasonCodes.push("DIRTY_WORKTREE");
  if (repository.branch === "(detached)") reasonCodes.push("DETACHED_HEAD");
  if (repository.branch !== task.targetBranch) reasonCodes.push("TARGET_BRANCH_MISMATCH");
  if (repository.headSha.toLowerCase() !== task.baseSha) reasonCodes.push("BASE_SHA_MISMATCH");
  let instructionFiles: FileEvidence[] = [];
  let referenceFiles: FileEvidence[] = [];
  try {
    const instructions = await loadApplicableInstructions(repository.repositoryRoot,task.allowedPaths);
    instructionFiles = instructions.files;
    if (!instructions.rootInstructionFound) reasonCodes.push("ROOT_INSTRUCTIONS_MISSING");
    const documents = await loadAuthoritativeDocuments(repository.repositoryRoot,task.authoritativeDocs);
    referenceFiles = documents.files;
  } catch {
    reasonCodes.push("REPOSITORY_INPUT_UNSAFE_OR_UNREADABLE");
  }
  const uniqueReasons = [...new Set(reasonCodes)];
  return {
    schemaVersion:1,runId,createdAt,status:uniqueReasons.length === 0 ? "READY" : "BLOCKED",
    reasonCodes:uniqueReasons,
    task:{taskId:task.taskId,title:task.title,taskClass:task.taskClass,objective:task.objective},
    repository,applicableInstructions:instructionFiles,authoritativeDocuments:referenceFiles,
    allowedPaths:task.allowedPaths,prohibitedPaths:task.prohibitedPaths,
    steps:[
      "Confirm the inspected branch, HEAD SHA, and clean working tree.",
      "Read only the applicable AGENTS.md files for the approved paths.",
      "Read only the explicitly listed authoritative task documents.",
      "Produce a bounded plan with prerequisites, evidence, and stop conditions."
    ],
    forbiddenActions:[
      "No repository file writes, patches, deletions, or generated-file updates.",
      "No arbitrary shell or command execution.",
      "No tests or scripts launched by the agent.",
      "No dependency, provider, LLM, API, database, migration, or deployment operations.",
      "No branch creation or switching, push, pull request, merge, or history rewrite.",
      "No work outside the explicit task envelope."
    ]
  };
}
