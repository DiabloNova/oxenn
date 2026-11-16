import { describe,expect,it } from "vitest";
import { missingRequiredAuthorityDocs } from "../../../../tools/development-agent/src/authority-requirements";
import type { TaskEnvelope } from "../../../../tools/development-agent/src/types";

const baseTask: TaskEnvelope = {
  schemaVersion:1,taskId:"MVP-01-WP-01",title:"Authority test",taskClass:"mvp-stage",objective:"test",authorizedBy:"owner",
  targetBranch:"feature/test",baseSha:"a".repeat(40),allowedPaths:["MVP/roadmap_plan/MVP/roadmap/01-identity-workspace-and-security-foundation.md"],
  prohibitedPaths:[],authoritativeDocs:[],successCriteria:["test"],stopConditions:["test"],
  providerPolicy:{mode:"disabled",maxTokens:0,maxCostUsd:0},permittedCommands:[]
};

describe("task-class authority requirements",() => {
  it("requires the exact MVP stage brief identified by task ID and the shared baselines",() => {
    const docs = [
      "docs/REPOSITORY_CONTEXT.md","docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md",
      "docs/project/MVP_ENGINEERING_BASELINE.md","MVP/roadmap_plan/MVP/roadmap/README.md",
      "MVP/roadmap_plan/MVP/roadmap/01-identity-workspace-and-security-foundation.md"
    ];
    expect(missingRequiredAuthorityDocs({...baseTask,authoritativeDocs:docs})).toEqual([]);
    expect(missingRequiredAuthorityDocs({...baseTask,authoritativeDocs:docs.slice(0,4)})).toContain("MVP/roadmap_plan/MVP/roadmap/01-<stage-brief>.md");
  });

  it("recognizes the complete repository finding-record category set",() => {
    const task = {...baseTask,taskId:"ARCH001",taskClass:"remediation" as const};
    const docs = [
      "docs/REPOSITORY_CONTEXT.md","ai_tasks/problem-register/AI_REMEDIATION_AGENT_PROMPT.md",
      "ai_tasks/problem-register/WAVE0_POLICY_SUPERSESSION.md","ai_tasks/problem-register/IMPLEMENTATION_SEQUENCE.md",
      "ai_tasks/problem-register/REMEDIATION_PROGRESS.md","ai_tasks/problem-register/findings/097-ARCH-001.md"
    ];
    expect(missingRequiredAuthorityDocs({...task,authoritativeDocs:docs})).toEqual([]);
  });

  it("requires the remediation policy, progress tracker, and exact finding records",() => {
    const task = {...baseTask,taskId:"VER004-scr002",taskClass:"remediation" as const};
    const docs = [
      "docs/REPOSITORY_CONTEXT.md","ai_tasks/problem-register/AI_REMEDIATION_AGENT_PROMPT.md",
      "ai_tasks/problem-register/WAVE0_POLICY_SUPERSESSION.md","ai_tasks/problem-register/IMPLEMENTATION_SEQUENCE.md",
      "ai_tasks/problem-register/REMEDIATION_PROGRESS.md","ai_tasks/problem-register/findings/085-VER-004.md","ai_tasks/problem-register/findings/041-SCR-002.md"
    ];
    expect(missingRequiredAuthorityDocs({...task,authoritativeDocs:docs})).toEqual([]);
    expect(missingRequiredAuthorityDocs({...task,authoritativeDocs:docs.slice(0,5)})).toEqual(["ai_tasks/problem-register/findings/<VER004.md>","ai_tasks/problem-register/findings/<SCR002.md>"]);
  });
});
