import { mkdtemp,mkdir,writeFile,symlink,rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach,describe,expect,it } from "vitest";
import { normalizeRepoPath,PathSafetyError,readRepoFile } from "../../../../tools/development-agent/src/path-safety";

const temporaryRoots: string[] = [];
async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-path-"));
  temporaryRoots.push(root);
  return root;
}
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("repository path safety",() => {
  it("accepts literal repository-relative paths",() => {
    expect(normalizeRepoPath("tools/development-agent/src/cli.ts")).toBe("tools/development-agent/src/cli.ts");
  });
  it.each(["../outside.txt","a/../outside.txt","/etc/passwd","C:\\\\Windows\\\\win.ini","a/*.ts","a//b","a/./b"])("rejects unsafe path %s", (value) => {
    expect(() => normalizeRepoPath(value)).toThrow(PathSafetyError);
  });
  it("rejects a symlink that resolves outside the repository",async () => {
    const root = await tempRoot();
    const outside = await tempRoot();
    await mkdir(path.join(root,"linked"));
    await writeFile(path.join(outside,"secret.txt"),"not for the repository reader");
    await rm(path.join(root,"linked"),{recursive:true});
    await symlink(outside,path.join(root,"linked"),"dir");
    await expect(readRepoFile(root,"linked/secret.txt")).rejects.toThrow(PathSafetyError);
  });
  it("reads a contained regular file through a bounded descriptor",async () => {
    const root = await tempRoot();
    await writeFile(path.join(root,"scope.txt"),"bounded content");
    await expect(readRepoFile(root,"scope.txt",32)).resolves.toBe("bounded content");
  });
  it("rejects repository files that exceed the descriptor read limit",async () => {
    const root = await tempRoot();
    await writeFile(path.join(root,"large.txt"),"x".repeat(17));
    await expect(readRepoFile(root,"large.txt",16)).rejects.toThrow(PathSafetyError);
  });

});
