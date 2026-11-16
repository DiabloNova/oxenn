import { constants } from "node:fs";
import { lstat,open } from "node:fs/promises";
import path from "node:path";
import type { TaskClass,TaskEnvelope } from "./types";
import { normalizeRepoPath } from "./path-safety";

const TASK_KEYS = ["schemaVersion","taskId","title","taskClass","objective","authorizedBy","targetBranch","baseSha","allowedPaths","prohibitedPaths","authoritativeDocs","successCriteria","stopConditions","providerPolicy","permittedCommands"] as const;
function asRecord(value: unknown,label: string): Record<string,unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be a JSON object.");
  return value as Record<string,unknown>;
}
function exactKeys(record: Record<string,unknown>,allowed: readonly string[],label: string): void {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new Error(label + " contains unsupported field(s): " + unknown.join(", "));
}
function requiredText(value: unknown,label: string,max = 500): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) throw new Error(label + " must be a non-empty string within the length limit.");
  return value.trim();
}
function textArray(value: unknown,label: string,maxItems: number,allowEmpty = false): string[] {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0)) throw new Error(label + " must be an array with an allowed number of entries.");
  const result = value.map((entry,index) => requiredText(entry,label + "[" + index + "]",512));
  if (new Set(result).size !== result.length) throw new Error(label + " must not contain duplicates.");
  return result;
}
function safeBranchName(value: unknown): string {
  const branch = requiredText(value,"targetBranch",200);
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith("-") || branch.includes("..") || branch.includes("//") || branch.endsWith("/") || branch.includes("@{")) {
    throw new Error("targetBranch is not a valid literal branch name.");
  }
  return branch;
}
function repoPaths(value: unknown,label: string,allowEmpty: boolean): string[] {
  return textArray(value,label,40,allowEmpty).map(normalizeRepoPath);
}
export function parseTaskEnvelope(value: unknown): TaskEnvelope {
  const record = asRecord(value,"Task");
  exactKeys(record,TASK_KEYS,"Task");
  if (record.schemaVersion !== 1) throw new Error("Unsupported task schemaVersion; expected 1.");
  const taskClass = record.taskClass;
  if (!["tooling","mvp-stage","remediation","maintenance"].includes(String(taskClass))) throw new Error("taskClass is not supported.");
  const baseSha = requiredText(record.baseSha,"baseSha",64).toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(baseSha)) throw new Error("baseSha must be a full 40-character Git SHA.");
  const policy = asRecord(record.providerPolicy,"providerPolicy");
  exactKeys(policy,["mode","maxTokens","maxCostUsd"],"providerPolicy");
  if (policy.mode !== "disabled" || policy.maxTokens !== 0 || policy.maxCostUsd !== 0) throw new Error("Version 1 requires all model providers and model budgets to be disabled.");
  if (!Array.isArray(record.permittedCommands) || record.permittedCommands.length !== 0) throw new Error("Version 1 does not permit command execution from task input.");
  const taskId = requiredText(record.taskId,"taskId",64);
  if (!/^[A-Z0-9][A-Z0-9._-]{1,63}$/.test(taskId)) throw new Error("taskId contains unsupported characters.");
  const allowedPaths = repoPaths(record.allowedPaths,"allowedPaths",false);
  const prohibitedPaths = repoPaths(record.prohibitedPaths,"prohibitedPaths",true);
  if (allowedPaths.some((item) => prohibitedPaths.includes(item))) throw new Error("A path cannot be both allowed and prohibited.");
  return {
    schemaVersion:1,taskId,title:requiredText(record.title,"title",200),taskClass:taskClass as TaskClass,
    objective:requiredText(record.objective,"objective",1000),authorizedBy:requiredText(record.authorizedBy,"authorizedBy",300),
    targetBranch:safeBranchName(record.targetBranch),baseSha,allowedPaths,prohibitedPaths,
    authoritativeDocs:repoPaths(record.authoritativeDocs,"authoritativeDocs",false),
    successCriteria:textArray(record.successCriteria,"successCriteria",20),
    stopConditions:textArray(record.stopConditions,"stopConditions",20),
    providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},permittedCommands:[]
  };
}
export async function readTaskEnvelopeFile(taskFile: string): Promise<TaskEnvelope> {
  const absolutePath = path.resolve(taskFile);
  // lstat is a fast fail for symlinks; O_NOFOLLOW closes the common lstat/open race on supported platforms.
  const linkInfo = await lstat(absolutePath);
  if (linkInfo.isSymbolicLink()) throw new Error("Task input must not be a symlink.");
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await open(absolutePath,constants.O_RDONLY | noFollow);
  let content: string;
  try {
    const fileInfo = await handle.stat();
    if (!fileInfo.isFile()) throw new Error("Task input must be a regular file.");
    if (fileInfo.size > 32 * 1024) throw new Error("Task input exceeds the 32 KiB size limit.");
    content = await handle.readFile({encoding:"utf8"});
  } finally {
    await handle.close();
  }
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error("Task input is not valid JSON."); }
  return parseTaskEnvelope(parsed);
}
