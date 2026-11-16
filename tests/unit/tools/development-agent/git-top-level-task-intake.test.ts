import { mkdtemp,mkdir,writeFile,rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe,expect,it } from "vitest";
import { resolveGitRepositoryRoot } from "../../../../tools/development-agent/src/git-inspector";
import { readTaskEnvelopeFile } from "../../../../tools/development-agent/src/task-intake";

describe("Git top-level task-file containment",() => {
  it("rejects a task file inside the repository when --repo points to a subdirectory",async () => {
    const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-root-boundary-"));
    try {
      const init = spawnSync("git",["init","--initial-branch=agent-test"],{cwd:root,encoding:"utf8",shell:false});
      expect(init.status).toBe(0);
      const nested = path.join(root,"tools","development-agent");
      await mkdir(nested,{recursive:true});
      const taskFile = path.join(root,"task.json");
      await writeFile(taskFile,"{}");
      const resolvedRoot = await resolveGitRepositoryRoot(nested);
      expect(resolvedRoot).toBe(root);
      await expect(readTaskEnvelopeFile(taskFile,resolvedRoot)).rejects.toThrow(/outside the selected repository/);
    } finally { await rm(root,{recursive:true,force:true}); }
  },15_000);
});
