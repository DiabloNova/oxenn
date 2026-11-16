import { createHash } from "node:crypto";
import { lstat,readdir,realpath,stat } from "node:fs/promises";
import path from "node:path";
import type { FileEvidence } from "./types";
import { isPathInside,normalizeRepoPath,readRepoFile,tryReadRepoFile } from "./path-safety";

export interface LoadedInstructions { files: FileEvidence[]; rootInstructionFound: boolean; discoveryLimitExceeded: boolean; }
export interface LoadedDocuments { files: FileEvidence[]; }
const MAX_INSTRUCTION_FILES = 256;
const MAX_INSTRUCTION_CANDIDATES = 4096;
const MAX_DIRECTORY_ENTRIES = 10_000;
const MAX_DIRECTORY_DEPTH = 32;
const MAX_TOTAL_INSTRUCTION_BYTES = 8 * 1024 * 1024;
function sha256(content: string): string { return createHash("sha256").update(content).digest("hex"); }
function isMissingPath(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR"));
}

export async function loadApplicableInstructions(repositoryRoot: string,relevantPaths: string[]): Promise<LoadedInstructions> {
  const root = await realpath(repositoryRoot);
  const candidates = new Set<string>(["AGENTS.md"]);
  const visitedDirectories = new Set<string>();
  let discoveryLimitExceeded = false;
  let visitedEntries = 0;

  const addCandidate = (candidate: string): void => {
    if (candidates.has(candidate)) return;
    if (candidates.size >= MAX_INSTRUCTION_CANDIDATES) { discoveryLimitExceeded = true; return; }
    candidates.add(candidate);
  };

  const walkDirectory = async (absoluteDirectory: string,relativeDirectory: string,depth: number): Promise<void> => {
    if (discoveryLimitExceeded) return;
    if (depth > MAX_DIRECTORY_DEPTH) { discoveryLimitExceeded = true; return; }
    const resolvedDirectory = await realpath(absoluteDirectory);
    if (!isPathInside(root,resolvedDirectory)) throw new Error("Instruction directory resolves outside the repository.");
    if (visitedDirectories.has(resolvedDirectory)) return;
    visitedDirectories.add(resolvedDirectory);
    const directoryInfo = await stat(resolvedDirectory);
    if (!directoryInfo.isDirectory()) return;
    const entries = await readdir(resolvedDirectory,{withFileTypes:true});
    for (const entry of entries) {
      visitedEntries += 1;
      if (visitedEntries > MAX_DIRECTORY_ENTRIES) { discoveryLimitExceeded = true; return; }
      if (entry.name === ".git") continue;
      const relativePath = relativeDirectory ? relativeDirectory + "/" + entry.name : entry.name;
      if (entry.name === "AGENTS.md" && (entry.isFile() || entry.isSymbolicLink())) addCandidate(relativePath);
      if (entry.isDirectory()) {
        if (depth >= MAX_DIRECTORY_DEPTH) { discoveryLimitExceeded = true; return; }
        await walkDirectory(path.join(resolvedDirectory,entry.name),relativePath,depth + 1);
        if (discoveryLimitExceeded) return;
      } else if (entry.isSymbolicLink()) {
        let targetInfo;
        try { targetInfo = await stat(path.join(resolvedDirectory,entry.name)); }
        catch (error) { if (!isMissingPath(error)) throw error; continue; }
        if (targetInfo.isDirectory()) {
          const target = await realpath(path.join(resolvedDirectory,entry.name));
          if (!isPathInside(root,target)) throw new Error("Instruction directory resolves outside the repository.");
          if (depth >= MAX_DIRECTORY_DEPTH) { discoveryLimitExceeded = true; return; }
          await walkDirectory(target,relativePath,depth + 1);
          if (discoveryLimitExceeded) return;
        }
      }
    }
  };

  for (const relevantPath of relevantPaths) {
    const normalized = normalizeRepoPath(relevantPath);
    const segments = normalized.split("/");
    for (let index = 1; index < segments.length; index += 1) addCandidate(segments.slice(0,index).join("/") + "/AGENTS.md");
    if (discoveryLimitExceeded) break;
    const absoluteScope = path.resolve(root,...segments);
    try {
      const scopeInfo = await lstat(absoluteScope);
      if (scopeInfo.isDirectory()) {
        addCandidate(normalized + "/AGENTS.md");
        await walkDirectory(absoluteScope,normalized,0);
      } else if (scopeInfo.isSymbolicLink()) {
        const target = await realpath(absoluteScope);
        if (!isPathInside(root,target)) throw new Error("Allowed directory scope resolves outside the repository.");
        if ((await stat(target)).isDirectory()) {
          addCandidate(normalized + "/AGENTS.md");
          await walkDirectory(target,normalized,0);
        }
      }
    } catch (error) {
      if (!isMissingPath(error)) throw error;
    }
    if (discoveryLimitExceeded) break;
  }

  const files: FileEvidence[] = [];
  let totalBytes = 0;
  for (const candidate of [...candidates].sort()) {
    const content = await tryReadRepoFile(root,candidate,256 * 1024);
    if (content === undefined) continue;
    if (files.length >= MAX_INSTRUCTION_FILES) { discoveryLimitExceeded = true; break; }
    totalBytes += Buffer.byteLength(content,"utf8");
    if (totalBytes > MAX_TOTAL_INSTRUCTION_BYTES) { discoveryLimitExceeded = true; break; }
    files.push({path:candidate,sha256:sha256(content)});
  }
  return {files,rootInstructionFound:files.some((file) => file.path === "AGENTS.md"),discoveryLimitExceeded};
}

export async function loadAuthoritativeDocuments(repositoryRoot: string,documentPaths: string[]): Promise<LoadedDocuments> {
  const files: FileEvidence[] = [];
  for (const documentPath of documentPaths) {
    const normalized = normalizeRepoPath(documentPath);
    const content = await readRepoFile(repositoryRoot,normalized,512 * 1024);
    files.push({path:normalized,sha256:sha256(content)});
  }
  return {files};
}
