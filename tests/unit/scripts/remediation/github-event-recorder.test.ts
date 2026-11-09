import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
type GitHubStub = {
  rest: {
    git: {
      getRef: () => Promise<{ data: { object: { sha: string } } }>;
      getCommit: () => Promise<{ data: { tree: { sha: string } } }>;
      createBlob: (args: { content: string }) => Promise<{ data: { sha: string } }>;
      createTree: () => Promise<{ data: { sha: string } }>;
      createCommit: () => Promise<{ data: { sha: string } }>;
      updateRef: (args: { force: boolean }) => Promise<unknown>;
    };
    repos: {
      getContent: (args: { path: string }) => Promise<{ data: unknown }>;
    };
  };
};
const recorder = require("../../../../scripts/remediation/github-event-recorder.cjs") as {
  appendEventIfNew: (existing: string, record: { event_id: string }) => { content: string; appended: boolean };
  directFindingId: (path: string) => string | null;
  eventIdFor: (eventType: string, pullRequest: Record<string, unknown> | null, workflowRun: Record<string, unknown> | null) => string;
  extractFindingIds: (pullRequest: Record<string, unknown>, files: Array<{ filename: string }>) => string[];
  extractExplicitFindingIds: (body: string) => string[];
  buildFindingAssociation: (candidateIds: string[], explicitIds: string[], fileFindingIds: Array<{ finding_id: string | null; path: string }>) => { candidate_finding_ids: string[]; explicit_finding_ids: string[]; finding_ids: string[] };
  statusForRecord: (record: Record<string, unknown>) => string | null;
  updateFindingStatus: (content: string, status: string, details: string) => { content: string; changed: boolean };
  updateLedgerRow: (content: string, findingId: string, status: string, evidence: string, commitLink: string | null) => { content: string; changed: boolean; previousStatus: string | null };
  hasCanonicalFindingMapping: (record: Record<string, unknown>) => boolean;
  findFindingPaths: (github: GitHubStub, owner: string, repo: string, ref: string, ids: string[]) => Promise<Record<string, string>>;
  persistRecords: (github: GitHubStub, owner: string, repo: string, records: Array<Record<string, unknown>>, core: { info: () => void; warning: (message: string) => void }) => Promise<void>;
};

const canonicalMapping = {
  mapping_complete: true,
  canonical_mapping_complete: true,
  canonical_finding_paths: { "DOC-001": "ai_tasks/problem-register/findings/015-DOC-001.md" },
  file_finding_ids: [{ finding_id: "DOC-001", path: "ai_tasks/problem-register/findings/015-DOC-001.md" }],
};

describe("GitHub remediation event recorder", () => {
  it("extracts and deduplicates finding IDs from branch names, PR text, and finding paths", () => {
    const ids = recorder.extractFindingIds(
      {
        title: "Remediate DOC-001 and DB-002",
        body: "Related finding: SRC-003\nFinding-IDs: SCR-001",
        head: { ref: "investigation/015-doc-001-scope" },
      },
      [{ filename: "ai_tasks/problem-register/findings/016-DOC-002.md" }],
    );
    expect(ids).toEqual(["DB-002", "DOC-001", "DOC-002", "SCR-001"]);
  });

  it("ignores incidental ID-like substrings in branch and title hints", () => {
    const candidates = recorder.extractFindingIds({
      title: "Fix SHA-256 and DOC-003",
      head: { ref: "fix/doc-003-tenant-2026-11-10" },
    }, []);
    expect(candidates).toEqual(["DOC-003", "SHA-256"]);
    const association = recorder.buildFindingAssociation(candidates, [], [
      { finding_id: "DOC-003", path: "ai_tasks/problem-register/findings/017-DOC-003.md" },
    ]);
    expect(association.finding_ids).toEqual(["DOC-003"]);
    expect(association.candidate_finding_ids).toContain("SHA-256");
  });

  it("keeps explicitly referenced unknown IDs in the fail-closed mapping set", () => {
    const explicit = recorder.extractExplicitFindingIds("Finding-IDs: DOC-003, SHA-256");
    expect(explicit).toEqual(["DOC-003", "SHA-256"]);
    const association = recorder.buildFindingAssociation(["DOC-003", "SHA-256"], explicit, [
      { finding_id: "DOC-003", path: "ai_tasks/problem-register/findings/017-DOC-003.md" },
    ]);
    expect(association.finding_ids).toEqual(["DOC-003", "SHA-256"]);
    expect(recorder.hasCanonicalFindingMapping({
      finding_ids: association.finding_ids,
      mapping_complete: true,
      canonical_mapping_complete: true,
      canonical_finding_paths: { "DOC-003": "ai_tasks/problem-register/findings/017-DOC-003.md" },
      file_finding_ids: [{ finding_id: "DOC-003", path: "ai_tasks/problem-register/findings/017-DOC-003.md" }],
    })).toBe(false);
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
      ...canonicalMapping,
      workflow_run: { conclusion: "success" },
    })).toBe("Verified complete");
  });

  it("does not resolve when post-merge CI fails or file mapping is incomplete", () => {
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      ...canonicalMapping,
      workflow_run: { conclusion: "failure" },
    })).toBe("Integrated — verification failed");
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      ...canonicalMapping,
      mapping_complete: false,
      workflow_run: { conclusion: "success" },
    })).toBeNull();
  });

  it("does not transition on a cancelled or skipped post-merge CI run", () => {
    expect(recorder.statusForRecord({
      event_type: "workflow_run.completed",
      finding_ids: ["DOC-001"],
      is_post_merge_main_ci: true,
      ...canonicalMapping,
      workflow_run: { conclusion: "cancelled" },
    })).toBeNull();
  });

  it("marks merged and unmerged PR closures as distinct non-resolved states", () => {
    expect(recorder.statusForRecord({
      event_type: "pull_request.closed",
      finding_ids: ["DOC-001"],
      ...canonicalMapping,
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

  it("preserves verified ledger status details on a later successful verification", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Verified complete** — merged to main; CI passed | — | prior evidence |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Verified complete", "new evidence", "[abcdef12](https://example.test/commit/abcdef12)");
    expect(result.content).toContain("merged to main; CI passed");
    expect(result.content).toContain("prior evidence");
    expect(result.content).toContain("abcdef12");
  });

  it("rejects a delayed pending event from the same PR after a failed verification", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification failed** | — | [PR #125](https://example.test/pull/125) |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Integrated — verification pending", "[PR #125](https://example.test/pull/125)", null);
    expect(result.changed).toBe(false);
    expect(result.content).toBe(row);
  });

  it("allows a new merged PR to retry a previously failed finding", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification failed** | — | [PR #124](https://example.test/pull/124) |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Integrated — verification pending", "[PR #125](https://example.test/pull/125)", null);
    expect(result.changed).toBe(true);
    expect(result.content).toContain("Integrated — verification pending");
    expect(result.content).toContain("PR #124");
    expect(result.content).toContain("PR #125");
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

  it("requires exact canonical paths for every finding in a mixed-ID event", () => {
    expect(recorder.hasCanonicalFindingMapping({
      finding_ids: ["DOC-001", "SCR-999"],
      mapping_complete: true,
      canonical_mapping_complete: true,
      canonical_finding_paths: { "DOC-001": "ai_tasks/problem-register/findings/015-DOC-001.md" },
      file_finding_ids: [{ finding_id: "DOC-001", path: "ai_tasks/problem-register/findings/015-DOC-001.md" }],
    })).toBe(false);
  });

  it("finds canonical finding files without a filename-case mismatch", async () => {
    const github = { rest: { repos: { getContent: async () => ({ data: [
      { type: "file", name: "015-DOC-001.md", path: "ai_tasks/problem-register/findings/015-DOC-001.md" },
    ] }) } } };
    await expect(recorder.findFindingPaths(github as unknown as GitHubStub, "DiabloNova", "oxenn", "main", ["DOC-001"]))
      .resolves.toEqual({ "DOC-001": "ai_tasks/problem-register/findings/015-DOC-001.md" });
  });

  it("preserves prior ledger evidence and fills a missing verified commit link", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification pending** | — | [Investigation](https://example.test/old) |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Verified complete", "[PR](https://example.test/pr)", "[abcdef12](https://example.test/commit/abcdef123456)");
    expect(result.content).toContain("https://example.test/old");
    expect(result.content).toContain("https://example.test/pr");
    expect(result.content).toContain("https://example.test/commit/abcdef123456");
  });

  it("replaces a stale verified commit when a non-verified finding advances", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification pending** | [oldsha1](https://example.test/commit/oldsha1) | [Prior](https://example.test/prior) |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Verified complete", "[PR #125](https://example.test/pull/125)", "[newsha22](https://example.test/commit/newsha22)");
    expect(result.content).toContain("https://example.test/commit/newsha22");
    expect(result.content).not.toContain("https://example.test/commit/oldsha1");
    expect(result.content).toContain("https://example.test/prior");
  });

  it("preserves the verified commit of a finding already verified on main", () => {
    const row = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Verified complete** — merged to main | [oldsha1](https://example.test/commit/oldsha1) | prior evidence |";
    const result = recorder.updateLedgerRow(row, "DOC-001", "Verified complete", "new evidence", "[newsha22](https://example.test/commit/newsha22)");
    expect(result.content).toContain("https://example.test/commit/oldsha1");
    expect(result.content).not.toContain("https://example.test/commit/newsha22");
  });

  it("allows a branch-only verified Finding to advance to main verification", () => {
    const previous = "- Status: **Verified complete** — investigation branch only.";
    const result = recorder.updateFindingStatus(previous, "Verified complete", "PR #125; exact main merge CI passed");
    expect(result.changed).toBe(true);
    expect(result.content).toContain("PR #125; exact main merge CI passed");
    expect(result.content).not.toContain("investigation branch only");
  });

  it("allows a new PR to retry a failed Finding while rejecting a delayed event from the same PR", () => {
    const previous = "- Status: **Integrated — verification failed** (PR #124; see CI run #42).";
    const next = recorder.updateFindingStatus(previous, "Integrated — verification pending", "PR #125 merged; post-merge CI pending");
    expect(next.changed).toBe(true);
    const delayed = recorder.updateFindingStatus(previous, "Integrated — verification pending", "PR #124 merged; post-merge CI pending");
    expect(delayed.changed).toBe(false);
    expect(delayed.content).toBe(previous);
  });

  it("preserves the original details of a Finding already verified on main", () => {
    const previous = "- Status: **Verified complete** (PR #123; exact main merge CI passed).";
    const result = recorder.updateFindingStatus(previous, "Verified complete", "PR #125; later successful CI event");
    expect(result.changed).toBe(false);
    expect(result.content).toBe(previous);
    expect(result.protected).toBe(true);
  });

  it("does not downgrade a persisted verified Finding status with event details", () => {
    const original = "# Finding\n- Status: **Verified complete** (merged to main; post-merge CI passed).\n";
    const result = recorder.updateFindingStatus(original, "Integrated — verification pending", "late close event");
    expect(result.changed).toBe(false);
    expect(result.content).toBe(original);
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

  function makeFakeGitHub(options: { progress?: string; finding?: string; findingAfterFirstConflict?: string; event?: string; updateRef?: (call: number) => Promise<void>; getContentFailure?: number } = {}) {
    const progress = options.progress ?? "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification pending** | — | [Prior](https://example.test/prior) |\n";
    let finding = options.finding ?? "# DOC-001\n- Finding ID: DOC-001\n- Status: **Integrated — verification pending**.\n";
    const event = options.event;
    const blobs: string[] = [];
    const forceFlags: boolean[] = [];
    let updateCalls = 0;
    let refCalls = 0;
    const missing = (status = 404) => Object.assign(new Error("not found"), { status });
    const encode = (content: string) => ({ data: { type: "file", encoding: "base64", content: Buffer.from(content).toString("base64"), sha: "blob-sha" } });
    const github = { rest: {
      git: {
        getRef: async () => ({ data: { object: { sha: "base-" + (++refCalls) } } }),
        getCommit: async () => ({ data: { tree: { sha: "tree-base" } } }),
        createBlob: async ({ content }: { content: string }) => { blobs.push(content); return { data: { sha: "blob-" + blobs.length } }; },
        createTree: async () => ({ data: { sha: "tree-new" } }),
        createCommit: async () => ({ data: { sha: "commit-new" } }),
        updateRef: async ({ force }: { force: boolean }) => {
          updateCalls += 1;
          forceFlags.push(force);
          if (updateCalls === 1 && options.findingAfterFirstConflict) {
            finding = options.findingAfterFirstConflict;
            throw Object.assign(new Error("non-fast-forward"), { status: 422 });
          }
          if (options.updateRef) await options.updateRef(updateCalls);
        },
      },
      repos: {
        getContent: async ({ path }: { path: string }) => {
          if (options.getContentFailure && path.endsWith("REMEDIATION_PROGRESS.md")) throw missing(options.getContentFailure);
          if (path === "ai_tasks/problem-register/REMEDIATION_PROGRESS.md") return encode(progress);
          if (path === "ai_tasks/problem-register/events/2026-11.jsonl") return event === undefined ? Promise.reject(missing()) : encode(event);
          if (path === "ai_tasks/problem-register/findings") return { data: [{ type: "file", name: "015-DOC-001.md", path: "ai_tasks/problem-register/findings/015-DOC-001.md" }] };
          if (path === "ai_tasks/problem-register/findings/015-DOC-001.md") return encode(finding);
          throw missing();
        },
      },
    } };
    return { github, blobs, forceFlags, get updateCalls() { return updateCalls; }, get refCalls() { return refCalls; } };
  }

  const mergedRecord = {
    event_id: "workflow_run.completed:42:1:125",
    event_type: "workflow_run.completed",
    occurred_at: "2026-11-09T15:00:00Z",
    repository_url: "https://github.com/DiabloNova/oxenn",
    finding_ids: ["DOC-001"],
    mapping_complete: true,
    is_post_merge_main_ci: true,
    pull_request: { number: 125, url: "https://github.com/DiabloNova/oxenn/pull/125", merged: true, merge_commit_sha: "abcdef1234567890" },
    workflow_run: { id: 42, url: "https://github.com/DiabloNova/oxenn/actions/runs/42", conclusion: "success", head_sha: "abcdef1234567890" },
    changed_files: [{ path: "ai_tasks/problem-register/findings/015-DOC-001.md" }],
    file_finding_ids: [{ finding_id: "DOC-001", path: "ai_tasks/problem-register/findings/015-DOC-001.md" }],
  };

  it("does not persist pre-merge CI runs to main", async () => {
    const fake = makeFakeGitHub();
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord, is_post_merge_main_ci: false }], { info: () => {}, warning: () => {} });
    expect(fake.updateCalls).toBe(0);
    expect(fake.blobs).toHaveLength(0);
  });

  it("fails closed for a mixed valid/unknown finding set without changing the ledger", async () => {
    const fake = makeFakeGitHub();
    const record: Record<string, unknown> = { ...mergedRecord, finding_ids: ["DOC-001", "SCR-999"] };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(record.resulting_statuses).toEqual({});
    expect(fake.blobs.some((blob) => blob.includes("Integrated — verification pending"))).toBe(false);
    expect(fake.updateCalls).toBe(1);
  });

  it("keeps a same-PR delayed merge-close event from downgrading failed post-merge CI", async () => {
    const progress = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification failed** | — | [PR #125](https://example.test/pull/125) |\n";
    const finding = "# DOC-001\n- Status: **Integrated — verification failed** (PR #125; see CI run #42).\n";
    const fake = makeFakeGitHub({ progress, finding });
    const record: Record<string, unknown> = {
      ...mergedRecord,
      event_id: "pull_request.closed:125:2026-11-09T15:00:00Z:abcdef1234567890",
      event_type: "pull_request.closed",
      workflow_run: null,
    };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(record.resulting_statuses).toEqual({});
    expect(record.transition_rejected).toBe(true);
    expect(record.canonical_mapping_complete).toBe(true);
    expect(fake.blobs).toHaveLength(1);
    expect(fake.blobs[0]).toContain(record.event_id);
  });

  it("does not commit an unrelated closed PR whose candidate ID has no canonical finding file", async () => {
    const fake = makeFakeGitHub();
    const record: Record<string, unknown> = {
      event_id: "pull_request.closed:101:2026-11-09T15:00:00Z:unmerged",
      event_type: "pull_request.closed",
      occurred_at: "2026-11-09T15:00:00Z",
      finding_ids: [],
      candidate_finding_ids: ["FIX-101"],
      file_finding_ids: [],
      mapping_complete: true,
      pull_request: { number: 101, merged: false },
      changed_files: [],
    };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(fake.blobs).toHaveLength(0);
    expect(fake.updateCalls).toBe(0);
  });

  it("retains an unmerged PR as evidence only when its candidate resolves to a real finding file", async () => {
    const fake = makeFakeGitHub();
    const record: Record<string, unknown> = {
      event_id: "pull_request.closed:125:2026-11-09T15:00:00Z:unmerged",
      event_type: "pull_request.closed",
      occurred_at: "2026-11-09T15:00:00Z",
      finding_ids: [],
      candidate_finding_ids: ["DOC-001"],
      file_finding_ids: [],
      mapping_complete: true,
      pull_request: { number: 125, merged: false },
      changed_files: [],
    };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(record.recognized_candidate_finding_ids).toEqual(["DOC-001"]);
    expect(record.resulting_statuses).toEqual({});
    expect(fake.blobs).toHaveLength(1);
    expect(fake.updateCalls).toBe(1);
  });

  it("clears rejection state when a non-force retry reprocesses an event successfully", async () => {
    const invalidFinding = "# DOC-001\n- Finding ID: DOC-001\n- Evidence only; no status line yet.\n";
    const validFinding = "# DOC-001\n- Finding ID: DOC-001\n- Status: **Integrated — verification pending**.\n";
    const staleProgress = "| [DOC-001](./findings/015-DOC-001.md) | Wave 1 | **Integrated — verification pending** | [oldsha1](https://example.test/commit/oldsha1) | [Prior](https://example.test/prior) |\n";
    const fake = makeFakeGitHub({ progress: staleProgress, finding: invalidFinding, findingAfterFirstConflict: validFinding });
    const record: Record<string, unknown> = { ...mergedRecord };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(record.transition_rejected).toBeUndefined();
    expect(record.resulting_statuses).toEqual({ "DOC-001": "Verified complete" });
    expect(fake.blobs.some((blob) => blob.includes("| [abcdef12](https://github.com/DiabloNova/oxenn/commit/abcdef1234567890) |"))).toBe(true);
    expect(fake.blobs.some((blob) => blob.includes("https://example.test/commit/oldsha1"))).toBe(false);
    expect(fake.blobs.some((blob) => blob.includes("- Status: **Verified complete**"))).toBe(true);
    expect(fake.updateCalls).toBe(2);
    expect(fake.forceFlags).toEqual([false, false]);
  });

  it("retains an unmerged PR closure as event evidence without changing finding dispositions", async () => {
    const fake = makeFakeGitHub();
    const record = {
      ...mergedRecord,
      event_id: "pull_request.closed:125:2026-11-09T15:00:00Z:unmerged",
      event_type: "pull_request.closed",
      is_post_merge_main_ci: false,
      pull_request: { number: 125, url: "https://github.com/DiabloNova/oxenn/pull/125", merged: false, merge_commit_sha: null },
      workflow_run: null,
    };
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(fake.blobs.some((blob) => blob.includes(record.event_id))).toBe(true);
    expect(fake.blobs.some((blob) => blob.includes("Integrated — verification pending"))).toBe(false);
    expect(fake.updateCalls).toBe(1);
  });

  it("does not commit a duplicate event already present in the JSONL log", async () => {
    const record = { ...mergedRecord };
    const fake = makeFakeGitHub({ event: JSON.stringify({ event_id: record.event_id }) + "\n" });
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [record], { info: () => {}, warning: () => {} });
    expect(fake.updateCalls).toBe(0);
    expect(fake.blobs).toHaveLength(0);
  });

  it("retries concurrent main updates with a bounded non-force retry policy", async () => {
    const fake = makeFakeGitHub({ updateRef: async (call) => { if (call <= 2) throw Object.assign(new Error("non-fast-forward"), { status: 422 }); } });
    await recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord }], { info: () => {}, warning: () => {} });
    expect(fake.updateCalls).toBe(3);
    expect(fake.refCalls).toBe(3);
    expect(fake.forceFlags).toEqual([false, false, false]);
  });

  it("stops after five concurrent-update conflicts and never force-updates main", async () => {
    const fake = makeFakeGitHub({ updateRef: async () => { throw Object.assign(new Error("non-fast-forward"), { status: 422 }); } });
    await expect(recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord }], { info: () => {}, warning: () => {} }))
      .rejects.toThrow("five non-fast-forward retries");
    expect(fake.updateCalls).toBe(5);
    expect(fake.refCalls).toBe(5);
    expect(fake.forceFlags).toEqual([false, false, false, false, false]);
  });

  it("propagates protected-branch failures without retrying or bypassing protection", async () => {
    const fake = makeFakeGitHub({ updateRef: async () => { throw Object.assign(new Error("protected branch"), { status: 403 }); } });
    await expect(recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord }], { info: () => {}, warning: () => {} }))
      .rejects.toThrow("protected branch");
    expect(fake.updateCalls).toBe(1);
    expect(fake.refCalls).toBe(1);
    expect(fake.forceFlags).toEqual([false]);
  });

  it("does not retry a protected-branch 422 response", async () => {
    const fake = makeFakeGitHub({ updateRef: async () => { throw Object.assign(new Error("protected branch rule violation"), { status: 422 }); } });
    await expect(recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord }], { info: () => {}, warning: () => {} }))
      .rejects.toThrow("protected branch rule violation");
    expect(fake.updateCalls).toBe(1);
    expect(fake.refCalls).toBe(1);
  });

  it("fails safely when the authoritative ledger cannot be read", async () => {
    const fake = makeFakeGitHub({ getContentFailure: 403 });
    await expect(recorder.persistRecords(fake.github, "DiabloNova", "oxenn", [{ ...mergedRecord }], { info: () => {}, warning: () => {} }))
      .rejects.toThrow("not found");
    expect(fake.updateCalls).toBe(0);
  });

});
