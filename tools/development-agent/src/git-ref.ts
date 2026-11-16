export function isValidGitBranchName(branch: string): boolean {
  if (!branch || branch.length > 200 || branch === "@" || branch.startsWith("-")) return false;
  if (branch.startsWith("/") || branch.endsWith("/") || branch.includes("//") || branch.includes("..") || branch.includes("@{")) return false;
  if (/[\u0000-\u0020\u007f~^:?*\\[]/u.test(branch) || branch.endsWith(".")) return false;
  return branch.split("/").every((part) => part.length > 0 && !part.startsWith(".") && !part.endsWith(".lock"));
}
