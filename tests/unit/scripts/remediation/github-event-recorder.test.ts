import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const recorder = require("../../../../scripts/remediation/github-event-recorder.cjs") as {
  appendEventIfNew: (existing: string, record: { event_id: string }) => { content: string; appended: boolean };
  directFindingId: (path: string) => string | null;
  eventIdFor: (eventType: string, pullRequest: Record<string, unknown> | null, workflowRun: Record<string, unknown> | null) => string;
  extractFindingIds: (pullRequest: Record<string, unknown>, files: Array<{ filename: string }>) => string[];
  statusForRecord: (record: Record<string, unknown>) => string | null;
  updateFindingStatus: (content: string, status: string, details: string) => { content: string; changed: boolean };
  updateLedgerRow: (content: string, findingId: string, status: string, evidence: string, commitLink: string | null) => { content: string; changed: boolean; previousStatus: string | null };
};

describe("GitHub remediation event recorder", () => {
  it("extracts and deduplicates finding IDs from branch names, PR text, and finding paths", () => {
    const ids = recorder.extractFindingIds(
      {
        title: "Remediate DOC-001 and DB-002",
        body: "Finding-IDs: SCR-001",
        head: { ref: "investigation/015-doc-001-scope" },
      },
      [{ filename: "ai_tasks/problem-register/findings/016-DOC-002.md" }],
    );
    expect(ids).toEqual(["DB-002", "DOC-001", "DOC-002", "SCR-001"]);
  });

  it("recognizes only canonical numbered finding record paths", () => {
    expect(recorder.directFindingId("ai_tasks/problem-register/findings/015-DOC-001.md")).toBe("DOC-001");
    expect(recorder.directFindingId("src/scripts/verify.ts")).toBeNull();
  });

  it("does not resolve a finding from a pre-merge CI success", () => {
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: false,
      workflow_run: { conclusion: "success" },
    })).toBeNull();
  });

  it("requires successful main CI for the exact merged commit before resolution", () => {
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      mapping_complete: true,
      workflow_run: { conclusion: "success" },
    })).toBe("Verified complete");
  });

  it("does not resolve when post-merge CI fails or file mapping is incomplete", () => {
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      mapping_complete: true,
      workflow_run: { conclusion: "failure" },
    })).toBe("Integrated — verification failed");
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      mapping_complete: false,
      workflow_run: { conclusion: "success" },
    })).toBe("Integrated — verification pending");
  });

  it("marks merged and unmerged PR closures as distinct non-resolved states", () => {
    expect(recorder.statusForRecord({
      event_type: "pull_request.closed",
      finding_ids: ["DOC-001"],
      pull_request: { number: 122, merged: true },
    })).toBe("Integrated — verification pending");
    expect(recorder.statusForRecord({
      event_type: "pull_request.closed",
      finding_ids: ["DOC-001"],
      pull_request: { number: 123, merged: false },
    })).toBe("Closed without merge");
  });

  it("does not downgrade a main-verified ledger row when a delayed close event arrives", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Verified complete** — merged to main | [642ca184](https://github.com/example/commit/642ca184) | evidence |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Integrated — verification pending", "pending", null);
    expect(result.changed).toBe(false);
    expect(result.content).toBe(row);
  });

  it("allows a branch-only verified row to advance to integration-pending", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Verified complete** — investigation branch only | — | evidence |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Integrated — verification pending", "PR evidence", null);
    expect(result.changed).toBe(true);
    expect(result.content).toContain("Integrated — verification pending");
  });

  it("updates a finding status only when exactly one canonical status line exists", () => {
    const original = "# Finding\n\n- Finding ID: DOC-001\n- Status: **In progress**.\n";
    const updated = recorder.updateFindingStatus(original, "Verified complete on main", "PR #122 and CI run #42584501166 passed");
    expect(updated.changed).toBe(true);
    expect(updated.content).toContain("Verified complete on main");
    expect(recorder.updateFindingStatus("# Finding\n- Status: **A**.\n- Status: **B**.\n", "Verified complete", "").changed).toBe(false);
  });

  it("uses deterministic event IDs and appends each event only once", () => {
    const id = recorder.eventIdFor(
      "workflow_run.completed",
      { number: 122 },
      { id: 42584501166, run_attempt: 1 },
    );
    expect(id).toBe("workflow_run.completed:42584501166:1:122");
    const first = recorder.appendEventIfNew("", { event_id: id });
    const second = recorder.appendEventIfNew(first.content, { event_id: id });
    expect(first.appended).toBe(true);
    expect(second.appended).toBe(false);
    expect(second.content).toBe(first.content);
  });
});
