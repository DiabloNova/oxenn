import { mkdtemp,writeFile,link,symlink,rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach,describe,expect,it } from "vitest";
import { readTaskEnvelopeFile } from "../../../../tools/development-agent/src/task-intake";

const temporaryRoots: string[] = [];
async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-task-file-"));
  temporaryRoots.push(root);
  return root;
}
const validTask = {
  schemaVersion:1,taskId:"DEV-AGENT-1",title:"Read-only task",taskClass:"tooling",
  objective:"Inspect a bounded repository scope.",authorizedBy:"Owner approval reference",targetBranch:"feat/a+b",
  baseSha:"a".repeat(40),allowedPaths:["tools/development-agent/src/cli.ts"],prohibitedPaths:["src/app/page.tsx"],
  authoritativeDocs:["AGENTS.md"],successCriteria:["Produce a bounded plan."],stopConditions:["Stop if the base changes."],
  providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},permittedCommands:[]
};
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("task-envelope file boundary",() => {
  it("accepts an owner-supplied task file outside the selected repository",async () => {
    const repository = await tempRoot();
    const external = await tempRoot();
    const taskFile = path.join(external,"task.json");
    await writeFile(taskFile,JSON.stringify(validTask));
    const task = await readTaskEnvelopeFile(taskFile,repository);
    expect(task.taskId).toBe("DEV-AGENT-1");
    expect(task.targetBranch).toBe("feat/a+b");
  });

  it("rejects task files located inside the selected repository",async () => {
    const repository = await tempRoot();
    const taskFile = path.join(repository,"task.json");
    await writeFile(taskFile,JSON.stringify(validTask));
    await expect(readTaskEnvelopeFile(taskFile,repository)).rejects.toThrow(/outside the selected repository/);
  });

  it("rejects hard-linked and symlink task files",async () => {
    const repository = await tempRoot();
    const external = await tempRoot();
    const original = path.join(repository,"task.json");
    const hardLink = path.join(external,"hard-linked-task.json");
    const symbolicLink = path.join(external,"symbolic-task.json");
    await writeFile(original,JSON.stringify(validTask));
    await link(original,hardLink);
    await symlink(path.join(external,"missing.json"),symbolicLink,"file");
    await expect(readTaskEnvelopeFile(hardLink,repository)).rejects.toThrow(/hard-linked/);
    await expect(readTaskEnvelopeFile(symbolicLink,repository)).rejects.toThrow(/symlink/);
  });

  it("enforces the 32 KiB limit while reading the opened file",async () => {
    const repository = await tempRoot();
    const external = await tempRoot();
    const taskFile = path.join(external,"oversized-task.json");
    await writeFile(taskFile,JSON.stringify(validTask) + " ".repeat(33 * 1024));
    await expect(readTaskEnvelopeFile(taskFile,repository)).rejects.toThrow(/32 KiB/);
  });
});
