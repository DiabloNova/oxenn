import { constants } from "node:fs";
import { lstat,mkdir,open,realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RunLedgerRecord } from "./types";
import { isPathInside,normalizeRepoPath } from "./path-safety";

const SAFE_REASONS = new Set([
  "DIRTY_WORKTREE","DETACHED_HEAD","TARGET_BRANCH_MISMATCH","BASE_SHA_MISMATCH",
  "ROOT_INSTRUCTIONS_MISSING","REPOSITORY_INPUT_UNSAFE_OR_UNREADABLE"
]);
export function defaultLedgerPath(): string {
  const stateRoot = process.env.XDG_STATE_HOME || path.join(os.homedir(),".local","state");
  return path.join(stateRoot,"oxenn-development-agent","runs.jsonl");
}
function validateAndRedactRecord(input: RunLedgerRecord): RunLedgerRecord {
  if (input.schemaVersion !== 1 || input.event !== "plan") throw new Error("Unsupported run-ledger record.");
  if (!/^[0-9a-f-]{36}$/i.test(input.runId) || Number.isNaN(Date.parse(input.createdAt))) throw new Error("Run-ledger identity is invalid.");
  if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(input.taskId)) throw new Error("Run-ledger task ID is invalid.");
  if (input.state !== "READY" && input.state !== "BLOCKED") throw new Error("Run-ledger state is invalid.");
  if (input.branch !== "(detached)" && !/^[A-Za-z0-9._/-]{1,200}$/.test(input.branch)) throw new Error("Run-ledger branch is invalid.");
  if (!/^[a-f0-9]{40}$/.test(input.headSha) || !/^[a-f0-9]{40}$/.test(input.baseSha)) throw new Error("Run-ledger SHA is invalid.");
  if (input.reasonCodes.length > 6 || input.reasonCodes.some((reason) => !SAFE_REASONS.has(reason))) throw new Error("Run-ledger reason code is invalid.");
  if (input.instructionPaths.length > 41 || input.documentPaths.length > 40) throw new Error("Run-ledger evidence list is too large.");

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
async function assertOutsideRepository(repositoryRoot: string,targetDirectory: string): Promise<void> {
  const root = await realpath(repositoryRoot);
  let ancestor = path.resolve(targetDirectory);
  const missing: string[] = [];
  while (true) {
    try {
      const resolved = await realpath(ancestor);
      const projected = path.resolve(resolved,...missing.reverse());
      if (isPathInside(root,projected)) throw new Error("Run ledger must be stored outside the repository.");
      return;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        const parent = path.dirname(ancestor);
        if (parent === ancestor) throw new Error("Unable to resolve the run-ledger parent directory.");
        missing.push(path.basename(ancestor));
        ancestor = parent;
        continue;
      }
      throw error;
    }
  }
}
export async function appendRunLedger(record: RunLedgerRecord,repositoryRoot: string,requestedPath = defaultLedgerPath()): Promise<string> {
  const safeRecord = validateAndRedactRecord(record);
  const absolutePath = path.resolve(requestedPath);
  const targetDirectory = path.dirname(absolutePath);
  await assertOutsideRepository(repositoryRoot,targetDirectory);
  await mkdir(targetDirectory,{recursive:true,mode:0o700});
  const resolvedDirectory = await realpath(targetDirectory);
  if (isPathInside(await realpath(repositoryRoot),resolvedDirectory)) throw new Error("Run ledger must be stored outside the repository.");
  const ledgerPath = path.join(resolvedDirectory,path.basename(absolutePath));
  try {
    const existing = await lstat(ledgerPath);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new Error("Run ledger path must be a regular file, not a symlink.");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await open(ledgerPath,constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | noFollow,0o600);
  try {
    if (!(await handle.stat()).isFile()) throw new Error("Run ledger target is not a regular file.");
    await handle.chmod(0o600);
    await handle.writeFile(JSON.stringify(safeRecord) + "\n","utf8");
  } finally {
    await handle.close();
  }
  return ledgerPath;
}
