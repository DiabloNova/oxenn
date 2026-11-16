import { spawn } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import type { GitSnapshot } from "./types";

type GitOperation = "top-level" | "branch" | "head" | "status" | "main";
interface GitResult { stdout: string; exitCode: number; }
const GIT_ARGS: Record<GitOperation,string[]> = {
  "top-level":["rev-parse","--show-toplevel"], branch:["branch","--show-current"],
  head:["rev-parse","HEAD"], status:["status","--porcelain=v1","-z","--untracked-files=all"],
  main:["rev-parse","--verify","refs/heads/main^{commit}"]
};
const MAX_OUTPUT_BYTES = 64 * 1024;
const COMMAND_TIMEOUT_MS = 5000;

function runGit(repositoryRoot: string, operation: GitOperation): Promise<GitResult> {
  return new Promise((resolve,reject) => {
    const child = spawn("git",GIT_ARGS[operation],{
      cwd:repositoryRoot, shell:false, windowsHide:true, stdio:["ignore","pipe","ignore"],
      env:{ PATH:process.env.PATH ?? "", GIT_OPTIONAL_LOCKS:"0", GIT_TERMINAL_PROMPT:"0", LC_ALL:"C" }
    });
    let stdout = ""; let bytes = 0; let overflow = false; let timedOut = false; let settled = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); },COMMAND_TIMEOUT_MS);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data",(chunk: string) => {
      bytes += Buffer.byteLength(chunk,"utf8");
      if (bytes > MAX_OUTPUT_BYTES) { overflow = true; child.kill("SIGKILL"); return; }
      stdout += chunk;
    });
    child.once("error",() => {
      if (!settled) { settled = true; clearTimeout(timer); reject(new Error("Unable to start the fixed Git executable.")); }
    });
    child.once("close",(code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (timedOut) reject(new Error("Git inspection timed out."));
      else if (overflow) reject(new Error("Git inspection exceeded the output limit."));
      else resolve({stdout,exitCode:code ?? 1});
    });
  });
}
async function requiredOutput(root: string, operation: GitOperation): Promise<string> {
  const result = await runGit(root,operation);
  if (result.exitCode !== 0 || !result.stdout.trim()) throw new Error("Required Git inspection failed: " + operation + ".");
  return result.stdout.trim();
}
export async function inspectGitRepository(startPath: string): Promise<GitSnapshot> {
  const start = await realpath(startPath);
  if (!(await stat(start)).isDirectory()) throw new Error("Repository inspection path must be a directory.");
  const repositoryRoot = await realpath(await requiredOutput(start,"top-level"));
  const branchResult = await runGit(repositoryRoot,"branch");
  const branch = branchResult.exitCode === 0 && branchResult.stdout.trim() ? branchResult.stdout.trim() : "(detached)";
  const [headSha,statusResult,mainResult] = await Promise.all([
    requiredOutput(repositoryRoot,"head"),runGit(repositoryRoot,"status"),runGit(repositoryRoot,"main")
  ]);
  if (statusResult.exitCode !== 0) throw new Error("Required Git working-tree inspection failed.");
  const statusEntryCount = statusResult.stdout.split("\0").filter((entry) => entry.length > 0).length;
  const mainSha = mainResult.exitCode === 0 ? mainResult.stdout.trim() : undefined;
  return { repositoryRoot,branch,headSha,...(mainSha ? {mainSha} : {}),isClean:statusEntryCount === 0,statusEntryCount };
}
