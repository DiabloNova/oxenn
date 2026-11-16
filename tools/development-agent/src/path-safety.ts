import { constants } from "node:fs";
import { open,lstat,realpath } from "node:fs/promises";
import path from "node:path";

export class PathSafetyError extends Error {
  constructor(message: string) { super(message); this.name = "PathSafetyError"; }
}
export function normalizeRepoPath(input: string): string {
  if (typeof input !== "string" || input.length === 0 || input.length > 512 ||
      input.includes("\0") || input.includes("\\") || input.startsWith("/") ||
      /^[A-Za-z]:/.test(input)) {
    throw new PathSafetyError("Repository path is not a valid relative path.");
  }
  const segments = input.split("/");
  if (segments.some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new PathSafetyError("Repository path contains an unsafe segment.");
  }
  if (segments.some((part) => /[*?<>:"|]/.test(part))) {
    throw new PathSafetyError("Repository paths must be literal paths, not globs.");
  }
  return segments.join("/");
}
export function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative));
}
async function readBounded(handle: Awaited<ReturnType<typeof open>>,maxBytes: number): Promise<string> {
  const buffer = Buffer.alloc(maxBytes + 1);
  let offset = 0;
  while (offset < buffer.length) {
    const {bytesRead} = await handle.read(buffer,offset,buffer.length - offset,offset);
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset > maxBytes) throw new PathSafetyError("Repository file exceeds the read limit.");
  return buffer.subarray(0,offset).toString("utf8");
}
export async function readRepoFile(repositoryRoot: string,repoPath: string,maxBytes = 256 * 1024): Promise<string> {
  const normalized = normalizeRepoPath(repoPath);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 1024 * 1024) throw new PathSafetyError("Repository file read limit is invalid.");
  const root = await realpath(repositoryRoot);
  const candidate = path.resolve(root,...normalized.split("/"));
  const resolved = await realpath(candidate);
  if (!isPathInside(root,resolved)) throw new PathSafetyError("Repository file resolves outside the repository.");
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await open(resolved,constants.O_RDONLY | noFollow);
  try {
    const before = await handle.stat({bigint:true});
    if (!before.isFile()) throw new PathSafetyError("Repository path is not a regular file.");
    if (before.size > BigInt(maxBytes)) throw new PathSafetyError("Repository file exceeds the read limit.");
    const pathInfo = await lstat(resolved,{bigint:true});
    if (pathInfo.isSymbolicLink() || pathInfo.dev !== before.dev || pathInfo.ino !== before.ino) throw new PathSafetyError("Repository file changed during safe open.");
    const confirmedPath = await realpath(resolved);
    if (!isPathInside(root,confirmedPath)) throw new PathSafetyError("Repository file changed to a path outside the repository.");
    const content = await readBounded(handle,maxBytes);
    const after = await handle.stat({bigint:true});
    if (before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new PathSafetyError("Repository file changed while it was being read.");
    return content;
  } finally {
    await handle.close();
  }
}
export async function tryReadRepoFile(repositoryRoot: string,repoPath: string,maxBytes = 256 * 1024): Promise<string | undefined> {
  try {
    return await readRepoFile(repositoryRoot,repoPath,maxBytes);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}
