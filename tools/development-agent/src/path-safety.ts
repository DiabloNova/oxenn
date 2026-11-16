import path from "node:path";
import { readFile, realpath, stat } from "node:fs/promises";

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
export async function readRepoFile(repositoryRoot: string, repoPath: string, maxBytes = 256 * 1024): Promise<string> {
  const normalized = normalizeRepoPath(repoPath);
  const root = await realpath(repositoryRoot);
  const candidate = path.resolve(root, ...normalized.split("/"));
  const resolved = await realpath(candidate);
  if (!isPathInside(root, resolved)) throw new PathSafetyError("Repository file resolves outside the repository.");
  const info = await stat(resolved);
  if (!info.isFile()) throw new PathSafetyError("Repository path is not a regular file.");
  if (info.size > maxBytes) throw new PathSafetyError("Repository file exceeds the read limit.");
  return readFile(resolved, "utf8");
}
export async function tryReadRepoFile(repositoryRoot: string, repoPath: string, maxBytes = 256 * 1024): Promise<string | undefined> {
  try {
    return await readRepoFile(repositoryRoot, repoPath, maxBytes);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}
