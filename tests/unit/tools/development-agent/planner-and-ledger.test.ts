import { mkdtemp,mkdir,writeFile,readFile,rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterEach,describe,expect,it } from "vitest";
import { buildPlan } from "../../../../tools/development-agent/src/planner";
import { appendRunLedger } from "../../../../tools/development-agent/src/run-ledger";
import type { TaskEnvelope,RunLedgerRecord } from "../../../../tools/development-agent/src/types";

const temporaryRoots: string[] = [];
async function makeRepository(): Promise<{root:string;head:string}> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-plan-"));
  temporaryRoots.push(root);
  const run = (args: string[]) => {
    const result = spawnSync("git",args,{cwd:root,encoding:"utf8",shell:false});
    if (result.status !== 0) throw new Error("Git fixture setup failed.");
    return result.stdout.trim();
  };
  run(["init","--initial-branch=agent-test"]);
  await mkdir(path.join(root,"docs"));
  await mkdir(path.join(root,"tools","example"));
  await writeFile(path.join(root,"AGENTS.md"),"# Instructions\nRead only.");
  await writeFile(path.join(root,"docs","scope.md"),"# Approved scope");
  run(["add","--all"]);
  run(["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","fixture"]);
  return {root,head:run(["rev-parse","HEAD"])};
}
function task(baseSha: string): TaskEnvelope {
  return {
    schemaVersion:1,taskId:"DEV-AGENT-1",title:"Read-only plan",taskClass:"tooling",
    objective:"Create a bounded plan without changing the repository.",
    authorizedBy:"Explicit owner approval",targetBranch:"agent-test",baseSha,
    allowedPaths:["tools/example/placeholder.ts"],prohibitedPaths:["src/app/page.tsx"],
    authoritativeDocs:["docs/scope.md"],successCriteria:["A clean, exact-base plan is ready."],
    stopConditions:["Stop if the repository is dirty or the base differs."],
    providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},permittedCommands:[]
  };
}
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("bounded planning and run ledger",() => {
  it("emits READY only for a clean exact-branch and exact-SHA repository",async () => {
    const fixture = await makeRepository();
    const plan = await buildPlan({repositoryPath:fixture.root,task:task(fixture.head)});
    expect(plan.status).toBe("READY");
    expect(plan.applicableInstructions.map((item) => item.path)).toContain("AGENTS.md");
    expect(plan.authoritativeDocuments.map((item) => item.path)).toContain("docs/scope.md");
    expect(plan.forbiddenActions.join(" ")).toContain("No arbitrary shell");
  });
  it("blocks a dirty worktree and preserves its contents",async () => {
    const fixture = await makeRepository();
    const pathToPreserve = path.join(fixture.root,"user-work.txt");
    await writeFile(pathToPreserve,"keep this change");
    const plan = await buildPlan({repositoryPath:fixture.root,task:task(fixture.head)});
    expect(plan.status).toBe("BLOCKED");
    expect(plan.reasonCodes).toContain("DIRTY_WORKTREE");
    expect(await readFile(pathToPreserve,"utf8")).toBe("keep this change");
  });
  it("appends a private JSONL record outside the repository",async () => {
    const fixture = await makeRepository();
    const plan = await buildPlan({repositoryPath:fixture.root,task:task(fixture.head)});
    const ledger = path.join(os.tmpdir(),"oxenn-dev-agent-ledger-"+plan.runId,"runs.jsonl");
    temporaryRoots.push(path.dirname(ledger));
    const record: RunLedgerRecord = {
      schemaVersion:1,event:"plan",runId:plan.runId,createdAt:plan.createdAt,taskId:"DEV-AGENT-1",
      state:plan.status,branch:plan.repository.branch,headSha:plan.repository.headSha,baseSha:fixture.head,
      reasonCodes:plan.reasonCodes,instructionPaths:["AGENTS.md"],documentPaths:["docs/scope.md"]
    };
    const actualPath = await appendRunLedger(record,fixture.root,ledger);
    const lines = (await readFile(actualPath,"utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).taskId).toBe("DEV-AGENT-1");
    await expect(appendRunLedger(record,fixture.root,path.join(fixture.root,".agent","runs.jsonl"))).rejects.toThrow(/outside the repository/);
  });
});
