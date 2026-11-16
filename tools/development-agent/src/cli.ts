import path from "node:path";
import { appendRunLedger,defaultLedgerPath } from "./run-ledger";
import { buildPlan } from "./planner";
import { readTaskEnvelopeFile } from "./task-intake";
import type { RunLedgerRecord } from "./types";

interface CliOptions { taskFile: string; repositoryPath: string; ledgerPath: string; }
function parseArguments(args: string[]): CliOptions {
  if (args[0] !== "plan") throw new Error("Usage: tsx tools/development-agent/src/cli.ts plan --task-file <path> [--repo <path>] [--ledger <path>]");
  const values = new Map<string,string>();
  const supported = new Set(["--task-file","--repo","--ledger"]);
  for (let index = 1; index < args.length; index += 1) {
    const flag = args[index];
    if (!supported.has(flag) || values.has(flag)) throw new Error("Unsupported or repeated CLI option: " + flag);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error("CLI option requires a value: " + flag);
    values.set(flag,value); index += 1;
  }
  const taskFile = values.get("--task-file");
  if (!taskFile) throw new Error("--task-file is required.");
  return {
    taskFile:path.resolve(taskFile),
    repositoryPath:path.resolve(values.get("--repo") ?? process.cwd()),
    ledgerPath:path.resolve(values.get("--ledger") ?? defaultLedgerPath())
  };
}
async function main(args: string[]): Promise<void> {
  const options = parseArguments(args);
  const task = await readTaskEnvelopeFile(options.taskFile,options.repositoryPath);
  const plan = await buildPlan({repositoryPath:options.repositoryPath,task});
  const record: RunLedgerRecord = {
    schemaVersion:1,event:"plan",runId:plan.runId,createdAt:plan.createdAt,taskId:task.taskId,
    state:plan.status,branch:plan.repository.branch,headSha:plan.repository.headSha,baseSha:task.baseSha,
    reasonCodes:plan.reasonCodes,
    instructionPaths:plan.applicableInstructions.map((file) => file.path),
    documentPaths:plan.authoritativeDocuments.map((file) => file.path)
  };
  await appendRunLedger(record,plan.repository.repositoryRoot,{taskFilePath:options.taskFile,task,plan},options.ledgerPath);
  process.stdout.write(JSON.stringify(plan,null,2) + "\n");
  if (plan.status === "BLOCKED") process.exitCode = 2;
}
main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Development Agent error.";
  process.stderr.write("Development Agent stopped safely: " + message + "\n");
  process.exitCode = 1;
});
