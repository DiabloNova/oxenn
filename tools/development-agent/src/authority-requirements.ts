import path from "node:path";
import type { TaskEnvelope } from "./types";

const MVP_CORE_DOCUMENTS = [
  "docs/REPOSITORY_CONTEXT.md",
  "docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md",
  "docs/project/MVP_ENGINEERING_BASELINE.md",
  "MVP/roadmap_plan/MVP/roadmap/README.md"
] as const;
const REMEDIATION_CORE_DOCUMENTS = [
  "docs/REPOSITORY_CONTEXT.md",
  "ai_tasks/problem-register/AI_REMEDIATION_AGENT_PROMPT.md",
  "ai_tasks/problem-register/WAVE0_POLICY_SUPERSESSION.md",
  "ai_tasks/problem-register/IMPLEMENTATION_SEQUENCE.md",
  "ai_tasks/problem-register/REMEDIATION_PROGRESS.md"
] as const;

export function missingRequiredAuthorityDocs(task: TaskEnvelope): string[] {
  const supplied = new Set(task.authoritativeDocs);
  const missing: string[] = [];
  if (task.taskClass === "mvp-stage") {
    for (const document of MVP_CORE_DOCUMENTS) if (!supplied.has(document)) missing.push(document);
    const stageMatch = task.taskId.match(/(?:^|[^A-Z0-9])MVP[-_]?(0[0-9]|1[0-4])(?:[^0-9]|$)/i);
    if (!stageMatch) missing.push("MVP/roadmap_plan/MVP/roadmap/<taskId-matched-stage-brief>.md");
    else {
      const prefix = "MVP/roadmap_plan/MVP/roadmap/" + stageMatch[1] + "-";
      if (![...supplied].some((document) => document.startsWith(prefix) && document.endsWith(".md"))) missing.push(prefix + "<stage-brief>.md");
    }
  } else if (task.taskClass === "remediation") {
    for (const document of REMEDIATION_CORE_DOCUMENTS) if (!supplied.has(document)) missing.push(document);
    const findingIds = [...task.taskId.matchAll(/(?:^|[^A-Z0-9])(RF|DB|FNT|DOC|GHA|PUB|SCR|SRC|TST|VER|ARCH)[-_]?(\d{3})(?=$|[^0-9])/gi)]
      .map((match) => (match[1] + match[2]).toUpperCase());
    const findingDocuments = [...supplied].filter((document) => document.startsWith("ai_tasks/problem-register/findings/") && document.endsWith(".md"));
    if (findingIds.length === 0) missing.push("ai_tasks/problem-register/findings/<taskId-matched-finding>.md");
    else {
      const normalizedFindingDocuments = findingDocuments.map((document) => ({document,normalized:path.basename(document).replace(/[^A-Z0-9]/gi,"").toUpperCase()}));
      for (const findingId of findingIds) {
        if (!normalizedFindingDocuments.some((item) => item.normalized.includes(findingId))) {
          missing.push("ai_tasks/problem-register/findings/<" + findingId + ".md>");
        }
      }
    }
  }
  return missing;
}
