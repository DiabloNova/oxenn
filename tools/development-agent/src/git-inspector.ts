import { spawn } from "node:child_process";
import path from "node:path";
import { realpath,stat } from "node:fs/promises";
import type { GitSnapshot } from "./types";

type GitOperation = "top-level" | "branch" | "head" | "status" | "main" | "filters";
interface GitResult { stdout: string; stderr: string; exitCode: number; statusEntryCount?: number; }
const GIT_ARGS: Record<GitOperation,string[]> = {
  "top-level":["rev-parse","--show-toplevel"],branch:["branch","--show-current"],
  head:["rev-parse","HEAD"],status:["status","--porcelain=v1","-z","--untracked-files=all"],
  main:["rev-parse","--verify","refs/heads/main^{commit}"],
  filters:["config","--null","--get-regexp","^filter\\..*\\.(clean|smudge|process)$"]
};
const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_FILTER_CONFIG_KEYS = 256;
const COMMAND_TIMEOUT_MS = 5000;
const STATUS_TIMEOUT_MS = 15_000;

function gitEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    PATH:process.env.PATH ?? "",
    NODE_ENV:process.env.NODE_ENV ?? "production",
    GIT_OPTIONAL_LOCKS:"0",
    GIT_TERMINAL_PROMPT:"0",
    GIT_PAGER:"cat",
    LC_ALL:"C"
  };
  for (const key of ["HOME","XDG_CONFIG_HOME","GIT_CONFIG_GLOBAL","GIT_CONFIG_SYSTEM","SystemRoot","WINDIR"]) {
    const value = process.env[key];
    if (value) env[key] = ["HOME","XDG_CONFIG_HOME","GIT_CONFIG_GLOBAL","GIT_CONFIG_SYSTEM"].includes(key) ? path.resolve(process.cwd(),value) : value;
  }
  return env;
}

function filterConfigKeys(stdout: string): string[] {
  const keys = new Set<string>();
  for (const entry of stdout.split("\0")) {
    if (!entry) continue;
    const separator = entry.indexOf("\n");
    if (separator <= 0) throw new Error("Git filter configuration could not be parsed safely.");
    const key = entry.slice(0,separator);
    if (!/^filter\.[^=\0\r\n]+\.(?:clean|smudge|process)$/i.test(key)) throw new Error("Git filter configuration contains an unsupported key.");
    keys.add(key);
    if (keys.size > MAX_FILTER_CONFIG_KEYS) throw new Error("Git filter configuration exceeds the safe inspection limit.");
  }
  return [...keys].sort();
}

function runGit(repositoryRoot: string,operation: GitOperation,filterKeys: string[] = []): Promise<GitResult> {
  return new Promise((resolve,reject) => {
    const configOverrides = operation === "status"
      ? ["-c","core.fsmonitor=false",...filterKeys.flatMap((key) => ["-c",key + "="])]
      : [];
    const child = spawn("git",[...configOverrides,...GIT_ARGS[operation]],{
      cwd:repositoryRoot,shell:false,windowsHide:true,stdio:["ignore","pipe","pipe"],env:gitEnvironment()
    });
    let stdout = ""; let stderr = ""; let bytes = 0; let stderrBytes = 0; let overflow = false; let timedOut = false; let settled = false;
    let statusEntryCount = 0; let statusRecordLength = 0; let statusRecordCode = ""; let skipPairedRenamePath = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); },operation === "status" ? STATUS_TIMEOUT_MS : COMMAND_TIMEOUT_MS);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data",(chunk: string) => {
      stderrBytes += Buffer.byteLength(chunk,"utf8");
      if (stderrBytes > MAX_OUTPUT_BYTES) { overflow = true; child.kill("SIGKILL"); return; }
      stderr += chunk;
    });
    if (operation === "status") {
      child.stdout.on("data",(chunk: Buffer) => {
        for (const byte of chunk) {
          if (byte === 0) {
            if (statusRecordLength > 0) {
              if (skipPairedRenamePath) skipPairedRenamePath = false;
              else {
                statusEntryCount += 1;
                if (statusRecordCode.includes("R") || statusRecordCode.includes("C")) skipPairedRenamePath = true;
              }
            }
            statusRecordLength = 0;
            statusRecordCode = "";
          } else {
            if (statusRecordLength < 2) statusRecordCode += String.fromCharCode(byte);
            statusRecordLength += 1;
          }
        }
      });
    } else {
      child.stdout.setEncoding("utf8");
      child.stdout.on("data",(chunk: string) => {
        bytes += Buffer.byteLength(chunk,"utf8");
        if (bytes > MAX_OUTPUT_BYTES) { overflow = true; child.kill("SIGKILL"); return; }
        stdout += chunk;
      });
    }
    child.once("error",() => {
      if (!settled) { settled = true; clearTimeout(timer); reject(new Error("Unable to start the fixed Git executable.")); }
    });
    child.once("close",(code: number | null) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (timedOut) reject(new Error("Git inspection timed out."));
      else if (overflow) reject(new Error("Git inspection exceeded the output limit."));
      else {
        if (operation === "status" && statusRecordLength > 0 && !skipPairedRenamePath) statusEntryCount += 1;
        resolve({stdout,stderr,exitCode:code ?? 1,...(operation === "status" ? {statusEntryCount} : {})});
      }
    });
  });
}

async function requiredOutput(root: string,operation: GitOperation): Promise<string> {
  const result = await runGit(root,operation);
  const output = operation === "top-level" ? result.stdout.replace(/\r?\n$/,"" ) : result.stdout.trim();
  if (result.exitCode !== 0 || result.stderr.trim().length > 0 || !output) throw new Error("Required Git inspection failed: " + operation + ".");
  return output;
}

export async function inspectGitRepository(startPath: string): Promise<GitSnapshot> {
  const start = await realpath(startPath);
  if (!(await stat(start)).isDirectory()) throw new Error("Repository inspection path must be a directory.");
  const repositoryRoot = await realpath(await requiredOutput(start,"top-level"));
  const [branchResult,headSha,mainResult,filterResult] = await Promise.all([
    runGit(repositoryRoot,"branch"),requiredOutput(repositoryRoot,"head"),runGit(repositoryRoot,"main").catch(() => undefined),runGit(repositoryRoot,"filters").catch(() => undefined)
  ]);
  if (branchResult.exitCode !== 0 || branchResult.stderr.trim().length > 0) throw new Error("Git branch identity could not be inspected.");
  const branch = branchResult.stdout.trim() || "(detached)";
  const mainSha = mainResult && mainResult.exitCode === 0 && mainResult.stderr.trim().length === 0 ? mainResult.stdout.trim() : undefined;
  let executionBoundaryKnown = false;
  let statusKnown = false;
  let statusEntryCount = 0;
  try {
    if (!filterResult || filterResult.stderr.trim().length > 0 ||
        (filterResult.exitCode !== 0 && !(filterResult.exitCode === 1 && filterResult.stdout.length === 0))) {
      throw new Error("Git filter configuration could not be inspected.");
    }
    const filters = filterConfigKeys(filterResult.stdout);
    executionBoundaryKnown = true;
    const statusResult = await runGit(repositoryRoot,"status",filters);
    statusKnown = statusResult.exitCode === 0 && statusResult.stderr.trim().length === 0;
    statusEntryCount = statusResult.statusEntryCount ?? 0;
  } catch {
    // Unknown status is represented as BLOCKED evidence; never infer a clean worktree.
  }
  return {
    repositoryRoot,branch,headSha,...(mainSha ? {mainSha} : {}),
    isClean:executionBoundaryKnown && statusKnown && statusEntryCount === 0,
    executionBoundaryKnown,statusKnown,statusEntryCount
  };
}
