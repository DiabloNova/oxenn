import { mkdtemp,mkdir,writeFile,readFile,rm,stat,link,symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach,describe,expect,it } from "vitest";
import { buildPlan } from "../../../../tools/development-agent/src/planner";
import { appendRunLedger,validateAndRedactRecord } from "../../../../tools/development-agent/src/run-ledger";
import type { RunLedgerRecord,TaskEnvelope } from "../../../../tools/development-agent/src/types";

const temporaryRoots: string[] = [];
async function makeRepository(): Promise<{root:string;head:string}> {
  const root = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-ledger-"));
  temporaryRoots.push(root);
  const run = (args: string[]) => {
    const result = spawnSync("git",args,{cwd:root,encoding:"utf8",shell:false});
    if (result.status !== 0) throw new Error("Git fixture setup failed: " + result.stderr);
    return result.stdout.trim();
  };
  run(["init","--initial-branch=agent-test"]);
  await mkdir(path.join(root,"docs"),{recursive:true});
  await mkdir(path.join(root,"tools","example"),{recursive:true});
  await writeFile(path.join(root,"AGENTS.md"),"# Read-only instructions\n");
  await writeFile(path.join(root,"docs","scope.md"),"# Approved scope\n");
  run(["add","--all"]);
  run(["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","fixture"]);
  return {root,head:run(["rev-parse","HEAD"])};
}
function task(head: string,targetBranch = "agent-test"): TaskEnvelope {
  return {
    schemaVersion:1,taskId:"DEV-AGENT-1",title:"Bounded tooling task",taskClass:"tooling",
    objective:"Inspect one bounded repository scope.",authorizedBy:"Owner approval reference",targetBranch,baseSha:head,
    allowedPaths:["tools/example/placeholder.ts"],prohibitedPaths:["src/app/page.tsx"],authoritativeDocs:["docs/scope.md"],
    successCriteria:["Produce a bounded plan."],stopConditions:["Stop if the base changes."],
    providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},permittedCommands:[]
  };
}
async function makeBoundary(root: string,taskEnvelope: TaskEnvelope) {
  const taskDirectory = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-task-boundary-"));
  temporaryRoots.push(taskDirectory);
  const taskFilePath = path.join(taskDirectory,"task.json");
  await writeFile(taskFilePath,JSON.stringify(taskEnvelope));
  const plan = await buildPlan({repositoryPath:root,task:taskEnvelope});
  return {taskFilePath,task:taskEnvelope,plan};
}
function recordFor(boundary: Awaited<ReturnType<typeof makeBoundary>>): RunLedgerRecord {
  const {plan,task:taskEnvelope} = boundary;
  return {
    schemaVersion:1,event:"plan",runId:plan.runId,createdAt:plan.createdAt,taskId:plan.task.taskId,
    state:plan.status,branch:plan.repository.branch,headSha:plan.repository.headSha,baseSha:taskEnvelope.baseSha,
    reasonCodes:plan.reasonCodes,instructionPaths:plan.applicableInstructions.map((file) => file.path),
    documentPaths:plan.authoritativeDocuments.map((file) => file.path)
  };
}
afterEach(async () => { await Promise.all(temporaryRoots.splice(0).map((root) => rm(root,{recursive:true,force:true}))); });

describe("planner and append-only run ledger",() => {
  it("blocks a target-branch mismatch and a base-SHA mismatch with their exact reason codes",async () => {
    const fixture = await makeRepository();
    const wrongBranch = await buildPlan({repositoryPath:fixture.root,task:task(fixture.head,"another-branch")});
    expect(wrongBranch.status).toBe("BLOCKED");
    expect(wrongBranch.reasonCodes).toContain("TARGET_BRANCH_MISMATCH");
    const wrongBase = await buildPlan({repositoryPath:fixture.root,task:{...task(fixture.head),baseSha:"a".repeat(40)}});
    expect(wrongBase.status).toBe("BLOCKED");
    expect(wrongBase.reasonCodes).toContain("BASE_SHA_MISMATCH");
  },15_000);

  it("creates a READY plan and appends a redacted JSONL event outside the repository",async () => {
    const fixture = await makeRepository();
    const boundary = await makeBoundary(fixture.root,task(fixture.head));
    expect(boundary.plan.status).toBe("READY");
    expect(boundary.plan.forbiddenActions.join(" ")).toContain("No arbitrary shell");
    const ledgerDirectory = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-ledger-outside-"));
    temporaryRoots.push(ledgerDirectory);
    const ledger = path.join(ledgerDirectory,"runs.jsonl");
    const record = {...recordFor(boundary),providerToken:"must-not-persist"} as unknown as RunLedgerRecord;
    const actualPath = await appendRunLedger(record,fixture.root,boundary,ledger);
    const persisted = JSON.parse((await readFile(actualPath,"utf8")).trim());
    expect(persisted.providerToken).toBeUndefined();
    expect(persisted.taskId).toBe("DEV-AGENT-1");
    expect((await stat(actualPath)).mode & 0o777).toBe(0o600);
  },15_000);

  it("rejects ledger destinations inside the repository",async () => {
    const fixture = await makeRepository();
    const boundary = await makeBoundary(fixture.root,task(fixture.head));
    await expect(appendRunLedger(recordFor(boundary),fixture.root,boundary,path.join(fixture.root,".agent","runs.jsonl"))).rejects.toThrow(/outside the repository/);
  },15_000);

  it("accepts Git punctuation, SHA-256 object IDs and 256 instruction paths but rejects overflow",() => {
    const record: RunLedgerRecord = {
      schemaVersion:1,event:"plan",runId:"00000000-0000-4000-8000-000000000000",createdAt:new Date().toISOString(),taskId:"DEV-AGENT-1",
      state:"BLOCKED",branch:"feat/a+b",headSha:"a".repeat(64),baseSha:"b".repeat(64),reasonCodes:["TARGET_BRANCH_MISMATCH"],
      instructionPaths:Array.from({length:256},(_,index) => "instructions/dir-" + index + "/AGENTS.md"),documentPaths:["docs/scope.md"]
    };
    const validated = validateAndRedactRecord(record);
    expect(validated.branch).toBe("feat/a+b");
    expect(validated.headSha).toHaveLength(64);
    expect(validated.instructionPaths).toHaveLength(256);
    expect(() => validateAndRedactRecord({...record,instructionPaths:[...record.instructionPaths,"instructions/overflow/AGENTS.md"]})).toThrow(/evidence list is too large/);
    expect(() => validateAndRedactRecord({...record,state:"READY"})).toThrow(/READY ledger record/);
    expect(() => validateAndRedactRecord({...record,reasonCodes:[]})).toThrow(/BLOCKED ledger record/);
  });

  it("rejects a hard-linked ledger target without modifying the repository file",async () => {
    const fixture = await makeRepository();
    const blockedTask = task(fixture.head,"another-branch");
    const boundary = await makeBoundary(fixture.root,blockedTask);
    expect(boundary.plan.status).toBe("BLOCKED");
    const protectedFile = path.join(fixture.root,"docs","scope.md");
    const ledgerDirectory = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-hardlink-"));
    temporaryRoots.push(ledgerDirectory);
    const ledger = path.join(ledgerDirectory,"runs.jsonl");
    await link(protectedFile,ledger);
    await expect(appendRunLedger(recordFor(boundary),fixture.root,boundary,ledger)).rejects.toThrow(/must not be hard-linked/);
    expect(await readFile(protectedFile,"utf8")).toBe("# Approved scope\n");
  },15_000);

  it("rejects a ledger parent symlink that resolves into the repository",async () => {
    const fixture = await makeRepository();
    const boundary = await makeBoundary(fixture.root,task(fixture.head));
    const parent = await mkdtemp(path.join(os.tmpdir(),"oxenn-dev-agent-ledger-link-"));
    temporaryRoots.push(parent);
    const linkedDirectory = path.join(parent,"ledger");
    await symlink(fixture.root,linkedDirectory,"dir");
    await expect(appendRunLedger(recordFor(boundary),fixture.root,boundary,path.join(linkedDirectory,"runs.jsonl"))).rejects.toThrow(/outside the repository/);
  },15_000);

  it("revalidates the external task file immediately before ledger append",async () => {
    const fixture = await makeRepository();
    const boundary = await makeBoundary(fixture.root,task(fixture.head));
    await writeFile(boundary.taskFilePath,JSON.stringify({...boundary.task,title:"Changed after planning"}));
    await expect(appendRunLedger(recordFor(boundary),fixture.root,boundary,path.join(os.tmpdir(),"oxenn-changed-task-runs.jsonl"))).rejects.toThrow(/Task envelope changed after planning/);
  },15_000);

  it("revalidates branch and repository evidence immediately before ledger append",async () => {
    const fixture = await makeRepository();
    const boundary = await makeBoundary(fixture.root,task(fixture.head));
    await writeFile(path.join(fixture.root,"after-plan.txt"),"changed");
    const add = spawnSync("git",["add","--all"],{cwd:fixture.root,encoding:"utf8",shell:false});
    expect(add.status).toBe(0);
    const commit = spawnSync("git",["-c","user.name=Oxenn Test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","-m","state changed after planning"],{cwd:fixture.root,encoding:"utf8",shell:false});
    expect(commit.status).toBe(0);
    await expect(appendRunLedger(recordFor(boundary),fixture.root,boundary,path.join(os.tmpdir(),"oxenn-changed-state-runs.jsonl"))).rejects.toThrow(/evidence changed after planning/);
  },15_000);
});
