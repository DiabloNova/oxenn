import { describe,expect,it } from "vitest";
import { parseTaskEnvelope } from "../../../../tools/development-agent/src/task-intake";

const validTask = {
  schemaVersion:1,
  taskId:"DEV-AGENT-1",
  title:"Inspect repository safely",
  taskClass:"tooling",
  objective:"Read the repository and produce a bounded plan.",
  authorizedBy:"Repository owner approval",
  targetBranch:"agents/development-agent",
  baseSha:"0123456789abcdef0123456789abcdef01234567",
  allowedPaths:["tools/development-agent/src/cli.ts"],
  prohibitedPaths:["src/app/page.tsx"],
  authoritativeDocs:["AGENTS.md"],
  successCriteria:["The plan is bounded and read-only."],
  stopConditions:["Stop when the base SHA or branch differs."],
  providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},
  permittedCommands:[]
};

describe("task intake",() => {
  it("accepts a complete model-free read-only task envelope",() => {
    expect(parseTaskEnvelope(validTask).taskId).toBe("DEV-AGENT-1");
  });
  it("fails closed when an unexpected field attempts to widen the contract",() => {
    expect(() => parseTaskEnvelope({...validTask,shellCommand:"echo unsafe"})).toThrow(/unsupported field/);
  });
  it("rejects model use and command execution",() => {
    expect(() => parseTaskEnvelope({...validTask,providerPolicy:{mode:"hosted",maxTokens:100,maxCostUsd:1}})).toThrow(/providers/);
    expect(() => parseTaskEnvelope({...validTask,permittedCommands:["pnpm test"]})).toThrow(/does not permit command/);
  });
  it("rejects an invalid base SHA and path traversal",() => {
    expect(() => parseTaskEnvelope({...validTask,baseSha:"main"})).toThrow(/40-character SHA-1 or 64-character/);
    expect(() => parseTaskEnvelope({...validTask,allowedPaths:["../secrets.env"]})).toThrow(/unsafe segment/);
  });
  it("accepts valid Git branch punctuation and full SHA-256 object IDs",() => {
    expect(parseTaskEnvelope({...validTask,targetBranch:"feat/a+b"}).targetBranch).toBe("feat/a+b");
    expect(parseTaskEnvelope({...validTask,targetBranch:"fix#12",baseSha:"a".repeat(64)}).baseSha).toBe("a".repeat(64));
  });
  it("rejects invalid Git ref syntax without rejecting valid punctuation",() => {
    for (const targetBranch of ["bad..name","bad//name","bad name","-option","feature/.hidden","feature/branch.lock","trailing."]) {
      expect(() => parseTaskEnvelope({...validTask,targetBranch})).toThrow(/valid literal Git branch/);
    }
  });
  it("rejects allowed paths nested in prohibited scopes but permits narrower exclusions",() => {
    expect(() => parseTaskEnvelope({...validTask,allowedPaths:["database/schema/index.ts"],prohibitedPaths:["database"]})).toThrow(/nested inside a prohibited path/);
    expect(parseTaskEnvelope({...validTask,allowedPaths:["database"],prohibitedPaths:["database/schema"]}).allowedPaths).toEqual(["database"]);
  });

});
