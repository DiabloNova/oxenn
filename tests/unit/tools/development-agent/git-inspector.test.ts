import { mkdtemp,mkdir,writeFile,readFile,rm,access } from "node:fs/promises";
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
    expect(await readFile(path.join(root,"untracked.txt"),"utf8")).toBe("preserve");
  });
  it("does not execute configured fsmonitor or clean-filter commands and retains explicit global config",async () => {
    const root = await makeRepository();
    const external = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-hooks-"));
    temporaryRoots.push(external);
    const marker = path.join(external,"hook-executed");
    const hook = path.join(external,"sentinel.sh");
    await writeFile(path.join(root,".gitattributes"),"*.txt filter=agent-sentinel\n");
    await writeFile(path.join(root,"docs","filtered.txt"),"before");
    const run = (args: string[]) => {
      const result = spawnSync("git",args,{cwd:root,encoding:"utf8",shell:false});
      if (result.status !== 0) throw new Error("Git fixture setup failed.");
    };
    run(["add","--all"]);
    run(["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","filter fixture"]);
    await writeFile(hook,"#!/bin/sh\nprintf x >> \"" + marker + "\"\n",{mode:0o700});
    run(["config","core.fsmonitor",hook]);
    await writeFile(path.join(root,"docs","filtered.txt"),"after");
    const globalConfig = path.join(external,"global-git-config");
    const globalIgnore = path.join(external,"global-ignore");
    await writeFile(globalIgnore,".globally-ignored\n");
    await writeFile(path.join(root,".globally-ignored"),"ignored");
    await writeFile(globalConfig,"[safe]\n\tdirectory = " + root + "\n[core]\n\texcludesfile = " + globalIgnore + "\n[filter \"agent-sentinel\"]\n\tclean = " + hook + "\n\tsmudge = " + hook + "\n\tprocess = " + hook + "\n");
    const previousGlobal = process.env.GIT_CONFIG_GLOBAL;
    process.env.GIT_CONFIG_GLOBAL = globalConfig;
    try {
      const state = await inspectGitRepository(root);
      expect(state.isClean).toBe(false);
      expect(state.statusKnown).toBe(true);
      expect(state.statusEntryCount).toBe(1);
      await expect(access(marker)).rejects.toMatchObject({code:"ENOENT"});
    } finally {
      if (previousGlobal === undefined) delete process.env.GIT_CONFIG_GLOBAL;
      else process.env.GIT_CONFIG_GLOBAL = previousGlobal;
    }
  },15_000);

  it("streams large untracked status output and still reports a dirty worktree",async () => {
    const root = await makeRepository();
    const directory = path.join(root,"many-untracked");
    await mkdir(directory);
    for (let index = 0; index < 1400; index += 1) {
      await writeFile(path.join(directory,"untracked-file-" + String(index).padStart(4,"0") + "-with-a-long-name.txt"),"x");
    }
    const state = await inspectGitRepository(root);
    expect(state.isClean).toBe(false);
    expect(state.statusKnown).toBe(true);
    expect(state.statusEntryCount).toBeGreaterThan(1000);
  },15_000);

  it("counts a rename as one status entry",async () => {
    const root = await makeRepository();
    const result = spawnSync("git",["mv","docs/scope.md","docs/renamed.md"],{cwd:root,encoding:"utf8",shell:false});
    expect(result.status).toBe(0);
    const state = await inspectGitRepository(root);
    expect(state.isClean).toBe(false);
    expect(state.statusEntryCount).toBe(1);
  });

  it("preserves repository roots with trailing whitespace",async () => {
    const parent = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-space-"));
    temporaryRoots.push(parent);
    const root = path.join(parent,"repository ");
    await mkdir(root);
    const run = (args: string[]) => {
      const result = spawnSync("git",args,{cwd:root,encoding:"utf8",shell:false});
      if (result.status !== 0) throw new Error("Git fixture setup failed.");
    };
    run(["init","--initial-branch=agent-test"]);
    await writeFile(path.join(root,"AGENTS.md"),"instructions");
    run(["add","--all"]);
    run(["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","fixture"]);
    const state = await inspectGitRepository(root);
    expect(state.repositoryRoot).toBe(root);
    expect(state.isClean).toBe(true);
  });

});
