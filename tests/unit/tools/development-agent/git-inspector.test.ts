import { mkdtemp,mkdir,writeFile,rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterEach,describe,expect,it } from "vitest";
import { inspectGitRepository } from "../../../../tools/development-agent/src/git-inspector";

const temporaryRoots: string[] = [];
async function makeRepository(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-git-"));
  temporaryRoots.push(root);
  const run = (args: string[]) => {
    const result = spawnSync("git",args,{cwd:root,encoding:"utf8",shell:false});
    if (result.status !== 0) throw new Error("Git fixture setup failed.");
    return result.stdout.trim();
  };
  run(["init","--initial-branch=agent-test"]);
  await mkdir(path.join(root,"docs"));
  await writeFile(path.join(root,"AGENTS.md"),"test-only instructions");
  await writeFile(path.join(root,"docs","scope.md"),"# Scope");
  run(["add","--all"]);
  run(["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","fixture"]);
  return root;
}
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("read-only Git inspection",() => {
  it("identifies repository root, branch, HEAD, and clean status",async () => {
    const root = await makeRepository();
    const state = await inspectGitRepository(path.join(root,"docs"));
    expect(state.repositoryRoot).toBe(root);
    expect(state.branch).toBe("agent-test");
    expect(state.headSha).toMatch(/^[a-f0-9]{40}$/);
    expect(state.isClean).toBe(true);
    expect(state.statusEntryCount).toBe(0);
  });
  it("detects untracked files without changing them",async () => {
    const root = await makeRepository();
    await writeFile(path.join(root,"untracked.txt"),"preserve");
    const state = await inspectGitRepository(root);
    expect(state.isClean).toBe(false);
    expect(state.statusEntryCount).toBe(1);
  });
});
