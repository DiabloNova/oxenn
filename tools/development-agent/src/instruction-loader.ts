import { createHash } from "node:crypto";
import type { FileEvidence } from "./types";
import { normalizeRepoPath,readRepoFile,tryReadRepoFile } from "./path-safety";

export interface LoadedInstructions { files: FileEvidence[]; rootInstructionFound: boolean; }
export interface LoadedDocuments { files: FileEvidence[]; }
function sha256(content: string): string { return createHash("sha256").update(content).digest("hex"); }

export async function loadApplicableInstructions(repositoryRoot: string, allowedPaths: string[]): Promise<LoadedInstructions> {
  const candidates = new Set<string>(["AGENTS.md"]);
  for (const allowedPath of allowedPaths) {
    const segments = normalizeRepoPath(allowedPath).split("/");
    for (let index = 1; index < segments.length; index += 1) candidates.add(segments.slice(0,index).join("/") + "/AGENTS.md");
  }
  const files: FileEvidence[] = [];
  let rootInstructionFound = false;
  for (const candidate of [...candidates].sort()) {
    const content = await tryReadRepoFile(repositoryRoot,candidate,256 * 1024);
    if (content === undefined) continue;
    if (candidate === "AGENTS.md") rootInstructionFound = true;
    files.push({path:candidate,sha256:sha256(content)});
  }
  return {files,rootInstructionFound};
}
export async function loadAuthoritativeDocuments(repositoryRoot: string, documentPaths: string[]): Promise<LoadedDocuments> {
  const files: FileEvidence[] = [];
  for (const documentPath of documentPaths) {
    const normalized = normalizeRepoPath(documentPath);
    const content = await readRepoFile(repositoryRoot,normalized,512 * 1024);
    files.push({path:normalized,sha256:sha256(content)});
  }
  return {files};
}
