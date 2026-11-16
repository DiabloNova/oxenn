import { constants } from "node:fs";
import { lstat,mkdir,open,realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { DevelopmentPlan,RunLedgerRecord,TaskEnvelope } from "./types";
import { readTaskEnvelopeFile } from "./task-intake";
import { buildPlan } from "./planner";
import { isPathInside,normalizeRepoPath } from "./path-safety";
import { isValidGitBranchName } from "./git-ref";

const SAFE_REASONS = new Set([
  "DIRTY_WORKTREE","DETACHED_HEAD","TARGET_BRANCH_MISMATCH","BASE_SHA_MISMATCH",
  "ROOT_INSTRUCTIONS_MISSING","REPOSITORY_INPUT_UNSAFE_OR_UNREADABLE",
  "WORKTREE_STATUS_UNAVAILABLE","INSTRUCTION_DISCOVERY_LIMIT","GIT_EXECUTION_BOUNDARY_UNVERIFIED","TASK_AUTHORITY_INPUTS_MISSING"
]);
export function defaultLedgerPath(): string {
  const stateRoot = process.env.XDG_STATE_HOME || path.join(os.homedir(),".local","state");
  return path.join(stateRoot,"oxenn-development-agent","runs.jsonl");
}
export function validateAndRedactRecord(input: RunLedgerRecord): RunLedgerRecord {
  if (input.schemaVersion !== 1 || input.event !== "plan") throw new Error("Unsupported run-ledger record.");
  if (!/^[0-9a-f-]{36}$/i.test(input.runId) || Number.isNaN(Date.parse(input.createdAt))) throw new Error("Run-ledger identity is invalid.");
  if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(input.taskId)) throw new Error("Run-ledger task ID is invalid.");
  if (input.state !== "READY" && input.state !== "BLOCKED") throw new Error("Run-ledger state is invalid.");
  if (input.branch !== "(detached)" && !isValidGitBranchName(input.branch)) throw new Error("Run-ledger branch is invalid.");
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(input.headSha) || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(input.baseSha)) throw new Error("Run-ledger SHA is invalid.");
  if (input.reasonCodes.length > 10 || input.reasonCodes.some((reason) => !SAFE_REASONS.has(reason))) throw new Error("Run-ledger reason code is invalid.");
  if (input.state === "READY" && input.reasonCodes.length !== 0) throw new Error("A READY ledger record cannot contain blocking reason codes.");
  if (input.state === "BLOCKED" && input.reasonCodes.length === 0) throw new Error("A BLOCKED ledger record must contain at least one reason code.");
  if (input.instructionPaths.length > 256 || input.documentPaths.length > 40) throw new Error("Run-ledger evidence list is too large.");

  // Rebuild from an explicit allowlist: extra runtime properties can never enter the ledger.
  return {
    schemaVersion: 1,
    event: "plan",
    runId: input.runId,
    createdAt: input.createdAt,
    taskId: input.taskId,
    state: input.state,
    branch: input.branch,
    headSha: input.headSha,
    baseSha: input.baseSha,
    reasonCodes: [...input.reasonCodes],
    instructionPaths: input.instructionPaths.map(normalizeRepoPath),
    documentPaths: input.documentPaths.map(normalizeRepoPath)
  };
}

export interface LedgerWriteBoundary { taskFilePath: string; task: TaskEnvelope; plan: DevelopmentPlan; }
function planEvidence(plan: DevelopmentPlan): string {
  return JSON.stringify({
    status:plan.status,reasonCodes:plan.reasonCodes,task:plan.task,repository:plan.repository,
    applicableInstructions:plan.applicableInstructions,authoritativeDocuments:plan.authoritativeDocuments,
    missingAuthorityDocs:plan.missingAuthorityDocs,allowedPaths:plan.allowedPaths,prohibitedPaths:plan.prohibitedPaths,
    steps:plan.steps,forbiddenActions:plan.forbiddenActions
  });
}
async function validateWriteBoundary(record: RunLedgerRecord,repositoryRoot: string,boundary: LedgerWriteBoundary): Promise<void> {
  const currentTask = await readTaskEnvelopeFile(boundary.taskFilePath,repositoryRoot);
  if (JSON.stringify(currentTask) !== JSON.stringify(boundary.task)) throw new Error("Task envelope changed after planning; rerun the plan before writing the ledger.");
  const currentPlan = await buildPlan({repositoryPath:repositoryRoot,task:currentTask});
  if (planEvidence(currentPlan) !== planEvidence(boundary.plan)) throw new Error("Repository or authority evidence changed after planning; rerun the plan before writing the ledger.");
  const expected = boundary.plan;
  const expectedInstructionPaths = expected.applicableInstructions.map((file) => file.path);
  const expectedDocumentPaths = expected.authoritativeDocuments.map((file) => file.path);
  if (record.runId !== expected.runId || record.createdAt !== expected.createdAt || record.taskId !== currentTask.taskId ||
      record.state !== expected.status || record.branch !== expected.repository.branch || record.headSha !== expected.repository.headSha ||
      record.baseSha !== currentTask.baseSha || JSON.stringify(record.reasonCodes) !== JSON.stringify(expected.reasonCodes) ||
      JSON.stringify(record.instructionPaths) !== JSON.stringify(expectedInstructionPaths) ||
      JSON.stringify(record.documentPaths) !== JSON.stringify(expectedDocumentPaths)) {
    throw new Error("Run-ledger record does not match the revalidated task and repository plan.");
  }
}

function descriptorDirectoryPath(fd: number): string {
  if (process.platform === "linux") return "/proc/self/fd/" + fd;
  if (process.platform === "darwin") return "/dev/fd/" + fd;
  throw new Error("Race-resistant run-ledger writes require descriptor-relative filesystem support on this platform.");
}
function isMissingPath(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
async function openPinnedLedgerDirectory(repositoryRoot: string,targetDirectory: string) {
  const root = await realpath(repositoryRoot);
  let ancestor = path.resolve(targetDirectory);
  const missing: string[] = [];
  while (true) {
    try {
      const info = await lstat(ancestor);
      if (info.isSymbolicLink()) {
        const resolved = await realpath(ancestor);
        if (isPathInside(root,resolved)) throw new Error("Run ledger must be stored outside the repository.");
        ancestor = resolved;
      } else if (!info.isDirectory()) throw new Error("Run-ledger parent path is not a directory.");
      break;
    } catch (error) {
      if (!isMissingPath(error)) throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw new Error("Unable to resolve the run-ledger parent directory.");
      missing.push(path.basename(ancestor));
      ancestor = parent;
    }
  }
  const resolvedAncestor = await realpath(ancestor);
  if (isPathInside(root,resolvedAncestor)) throw new Error("Run ledger must be stored outside the repository.");
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const directoryFlag = constants.O_DIRECTORY ?? 0;
  let current = await open(resolvedAncestor,constants.O_RDONLY | directoryFlag | noFollow);
  try {
    const openedInfo = await current.stat({bigint:true});
    const confirmedPath = await realpath(ancestor);
    if (isPathInside(root,confirmedPath)) throw new Error("Run-ledger parent changed to a path inside the repository.");
    const confirmedInfo = await lstat(confirmedPath,{bigint:true});
    if (!confirmedInfo.isDirectory() || confirmedInfo.dev !== openedInfo.dev || confirmedInfo.ino !== openedInfo.ino) throw new Error("Run-ledger parent changed during safe open.");
    for (const segment of missing.reverse()) {
      const childPath = path.join(descriptorDirectoryPath(current.fd),segment);
      try { await mkdir(childPath,{mode:0o700}); }
      catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) throw error; }
      const child = await open(childPath,constants.O_RDONLY | directoryFlag | noFollow);
      try {
        const childInfo = await child.stat({bigint:true});
        if (!childInfo.isDirectory()) throw new Error("Run-ledger parent component is not a directory.");
        await current.close();
        current = child;
      } catch (error) {
        await child.close();
        throw error;
      }
    }
    return current;
  } catch (error) {
    await current.close();
    throw error;
  }
}
export async function appendRunLedger(record: RunLedgerRecord,repositoryRoot: string,boundary: LedgerWriteBoundary,requestedPath = defaultLedgerPath()): Promise<string> {
  const safeRecord = validateAndRedactRecord(record);
  await validateWriteBoundary(safeRecord,repositoryRoot,boundary);
  const absolutePath = path.resolve(requestedPath);
  const ledgerName = path.basename(absolutePath);
  if (!ledgerName || ledgerName === "." || ledgerName === "..") throw new Error("Run-ledger path must name a file.");
  const directoryHandle = await openPinnedLedgerDirectory(repositoryRoot,path.dirname(absolutePath));
  const ledgerPath = path.join(descriptorDirectoryPath(directoryHandle.fd),ledgerName);
  const noFollow = constants.O_NOFOLLOW ?? 0;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(ledgerPath,constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | noFollow,0o600);
    const info = await handle.stat({bigint:true});
    if (!info.isFile()) throw new Error("Run ledger target is not a regular file.");
    if (info.nlink !== 1n) throw new Error("Run ledger target must not be hard-linked to another file.");
    const pathInfo = await lstat(ledgerPath,{bigint:true});
    if (pathInfo.isSymbolicLink() || pathInfo.dev !== info.dev || pathInfo.ino !== info.ino) throw new Error("Run ledger target changed during safe open.");
    await handle.chmod(0o600);
    await handle.writeFile(JSON.stringify(safeRecord) + "\n","utf8");
  } finally {
    if (handle) await handle.close();
    await directoryHandle.close();
  }
  return absolutePath;
}
