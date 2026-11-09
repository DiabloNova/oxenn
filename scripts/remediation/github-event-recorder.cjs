const PROGRESS_PATH = "ai_tasks/problem-register/REMEDIATION_PROGRESS.md";
const FINDINGS_DIR = "ai_tasks/problem-register/findings";
const EVENTS_DIR = "ai_tasks/problem-register/events";

function extractFindingIds(pullRequest, files) {
  const ids = new Set();
  const sources = [
    pullRequest && pullRequest.title,
    pullRequest && pullRequest.head && pullRequest.head.ref,
  ];
  for (const source of sources) {
    if (!source) continue;
    const matches = String(source).match(/[A-Z]{2,5}-\d{3}/gi) || [];
    for (const match of matches) ids.add(match.toUpperCase());
  }
  const body = String((pullRequest && pullRequest.body) || "");
  const explicitMarkers = body.matchAll(/^\s*Finding-IDs\s*:\s*([^\r\n]+)/gim);
  for (const marker of explicitMarkers) {
    const matches = marker[1].match(/[A-Z]{2,5}-\d{3}/gi) || [];
    for (const match of matches) ids.add(match.toUpperCase());
  }
  for (const file of files || []) {
    const match = String(file.filename || file.path || "").match(/(?:^|\/)\d{3}-([A-Z]{2,5}-\d{3})\.md$/i);
    if (match) ids.add(match[1].toUpperCase());
  }
  return Array.from(ids).sort();
}

function directFindingId(path) {
  const match = String(path || "").match(/(?:^|\/)\d{3}-([A-Z]{2,5}-\d{3})\.md$/i);
  return match ? match[1].toUpperCase() : null;
}

function isMainVerifiedStatus(value) {
  return /Verified complete/i.test(String(value || "")) && !/investigation branch only|branch-only/i.test(String(value || ""));
}

function hasCanonicalFindingMapping(record) {
  if (!record || record.mapping_complete !== true || record.canonical_mapping_complete !== true) return false;
  const ids = Array.from(new Set(record.finding_ids || []));
  const paths = record.canonical_finding_paths || {};
  const changedFiles = record.file_finding_ids || [];
  return ids.length > 0 && ids.every((id) =>
    typeof paths[id] === "string" &&
    directFindingId(paths[id]) === id &&
    changedFiles.filter((file) => file && file.finding_id === id && file.path === paths[id]).length === 1
  );
}

function ledgerHasFinding(content, findingId) {
  const prefix = "| [" + findingId + "](";
  return String(content).split(/\r?\n/).filter((line) => line.startsWith(prefix)).length === 1;
}

function hasNewPullRequestReference(existing, incoming) {
  const previous = new Set((String(existing || "").match(/\bPR #\d+\b/g) || []).map((value) => value.toUpperCase()));
  const next = (String(incoming || "").match(/\bPR #\d+\b/g) || []).map((value) => value.toUpperCase());
  return next.some((value) => !previous.has(value));
}

function mergeEvidence(existing, incoming) {
  const parts = [];
  for (const value of [existing, incoming]) {
    for (const part of String(value || "").split(/\s*·\s*/)) {
      const item = part.trim();
      if (item && item !== "—" && !parts.includes(item)) parts.push(item);
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

function statusForRecord(record) {
  if (!record || !record.finding_ids || record.finding_ids.length === 0) return null;
  if (record.event_type === "pull_request.closed") {
    if (!record.pull_request || !record.pull_request.merged) return "Closed without merge";
    return hasCanonicalFindingMapping(record) ? "Integrated — verification pending" : null;
  }
  if (record.event_type === "workflow_run.completed" && record.is_post_merge_main_ci) {
    if (!hasCanonicalFindingMapping(record)) return null;
    if (record.workflow_run && record.workflow_run.conclusion === "success") return "Verified complete";
    if (record.workflow_run && ["failure", "timed_out", "action_required"].includes(record.workflow_run.conclusion)) {
      return "Integrated — verification failed";
    }
    return null;
  }
  return null;
}

function updateLedgerRow(content, findingId, status, evidence, commitLink) {
  const lines = String(content).split(/\r?\n/);
  const prefix = "| [" + findingId + "](";
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) return { content, changed: false, previousStatus: null };

  const cells = lines[index].split("|");
  if (cells.length < 7) return { content, changed: false, previousStatus: null };
  const previousStatus = cells[3].trim();
  if (isMainVerifiedStatus(previousStatus) && status !== "Verified complete") {
    return { content, changed: false, previousStatus, resultingStatus: previousStatus };
  }
  if ((/Integrated — verification failed/i.test(previousStatus) || /Closed without merge/i.test(previousStatus)) &&
      status === "Integrated — verification pending" && !hasNewPullRequestReference(cells[5], evidence)) {
    return { content, changed: false, previousStatus, resultingStatus: previousStatus };
  }

  if (!(isMainVerifiedStatus(previousStatus) && status === "Verified complete")) {
    cells[3] = " **" + status + "** ";
  }
  cells[5] = " " + mergeEvidence(cells[5], evidence) + " ";
  if (commitLink && (!cells[4].trim() || cells[4].trim() === "—")) {
    cells[4] = " " + commitLink + " ";
  }
  lines[index] = cells.join("|");
  return { content: lines.join("\n"), changed: lines.join("\n") !== content, previousStatus, resultingStatus: status };
}

function updateFindingStatus(content, status, details) {
  const lines = String(content).split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^- Status: \*\*.*\*\*.*$/.test(lines[i])) matches.push(i);
  }
  if (matches.length !== 1) return { content, changed: false, valid: false };
  const index = matches[0];
  const previous = lines[index];
  if (isMainVerifiedStatus(previous) && status !== "Verified complete") {
    return { content, changed: false, valid: true, protected: true };
  }
  if (/Verified complete/i.test(previous)) {
    const branchOnly = /investigation branch only|branch-only/i.test(previous);
    if (!branchOnly || status === "Verified complete") {
      return { content, changed: false, valid: true, protected: true };
    }
  }
  if ((/Integrated — verification failed/i.test(previous) || /Closed without merge/i.test(previous)) &&
      status === "Integrated — verification pending" && !hasNewPullRequestReference(previous, details)) {
    return { content, changed: false, valid: true, protected: true };
  }
  lines[index] = "- Status: **" + status + "**" + (details ? " (" + details + ")" : "") + ".";
  return { content: lines.join("\n"), changed: lines.join("\n") !== content, valid: true };
}

function appendEventIfNew(existing, record) {
  const current = String(existing || "");
  const known = new Set();
  for (const line of current.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.event_id) known.add(parsed.event_id);
    } catch (_) {
      // Preserve malformed historical lines; do not treat them as valid IDs.
    }
  }
  if (known.has(record.event_id)) return { content: current, appended: false };
  const separator = current && !current.endsWith("\n") ? "\n" : "";
  return {
    content: current + separator + JSON.stringify(record) + "\n",
    appended: true,
  };
}

function eventIdFor(eventType, pullRequest, workflowRun) {
  if (eventType === "pull_request.closed") {
    return [
      eventType,
      pullRequest.number,
      pullRequest.closed_at || pullRequest.updated_at || "unknown-time",
      pullRequest.merge_commit_sha || "unmerged",
    ].join(":");
  }
  return [
    eventType,
    workflowRun.id,
    workflowRun.run_attempt || 1,
    pullRequest ? pullRequest.number : "unassociated",
  ].join(":");
}

function safeMarkdown(value) {
  return String(value == null ? "" : value).replace(/[|\r\n]/g, " ").trim();
}

function evidenceFor(record) {
  const links = [];
  if (record.pull_request && record.pull_request.url) {
    links.push("[PR #" + record.pull_request.number + "](" + record.pull_request.url + ")");
  }
  if (record.workflow_run && record.workflow_run.url) {
    links.push("[CI run #" + record.workflow_run.id + "](" + record.workflow_run.url + ")");
  }
  if (record.pull_request && record.pull_request.merge_commit_sha) {
    links.push("[merge commit](" + record.repository_url + "/commit/" + record.pull_request.merge_commit_sha + ")");
  }
  return links.join(" · ") || "GitHub event recorded in the monthly event log";
}

function appendExecutionLog(content, record, status, eventPath) {
  if (!status || !record.finding_ids || record.finding_ids.length === 0) return content;
  if (String(content).includes(record.event_id)) return content;
  const label = record.pull_request
    ? "PR #" + record.pull_request.number
    : "CI run #" + (record.workflow_run ? record.workflow_run.id : "unknown");
  const lines = [
    "",
    "",
    "### Automated GitHub event — " + label,
    "",
    "- Event ID: " + record.event_id,
    "- Event type: " + record.event_type,
    "- Recorded at (UTC): " + record.occurred_at,
    "- Finding IDs: " + record.finding_ids.join(", "),
    "- Branch: " + safeMarkdown(record.pull_request ? record.pull_request.head_branch : record.workflow_run && record.workflow_run.head_branch),
    "- Commit: " + safeMarkdown(record.workflow_run ? record.workflow_run.head_sha : record.pull_request && record.pull_request.head_sha),
    "- Changed files: " + record.changed_files.length + "; exact paths and per-file finding references are preserved in [" + eventPath.split("/").pop() + "](./events/" + eventPath.split("/").pop() + ").",
    "- Resulting status: " + status + (record.workflow_run ? " (CI conclusion: " + record.workflow_run.conclusion + ")" : ""),
    "- Evidence: " + evidenceFor(record),
  ];
  return String(content).replace(/\s*$/, "") + "\n" + lines.join("\n") + "\n";
}

function statusDetailsForFinding(status, record) {
  if (status === "Integrated — verification pending") {
    return "PR #" + record.pull_request.number + " merged; post-merge CI pending";
  }
  if (status === "Integrated — verification failed") {
    return "PR #" + record.pull_request.number + " merged; see CI run #" + record.workflow_run.id;
  }
  if (status === "Closed without merge") {
    return "PR #" + record.pull_request.number + " closed without merge; no resolution is claimed";
  }
  if (status === "Verified complete") {
    return "PR #" + record.pull_request.number + " merged and post-merge CI run #" + record.workflow_run.id + " passed";
  }
  return "";
}

async function readFile(github, owner, repo, path, ref) {
  try {
    const response = await github.rest.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(response.data) || response.data.type !== "file") return null;
    if (response.data.encoding !== "base64") {
      throw new Error("Refusing to rewrite " + path + ": GitHub did not return complete base64 file content.");
    }
    return {
      sha: response.data.sha,
      content: Buffer.from(response.data.content || "", "base64").toString("utf8"),
    };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function listChangedFiles(github, owner, repo, pullRequest) {
  const files = [];
  let page = 1;
  while (page <= 30) {
    const response = await github.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullRequest.number,
      per_page: 100,
      page,
    });
    files.push(...response.data);
    if (response.data.length < 100) break;
    page += 1;
  }
  return {
    files,
    complete: files.length === Number(pullRequest.changed_files || files.length),
  };
}

async function fetchPullRequestRecord(github, owner, repo, number, run) {
  const response = await github.rest.pulls.get({ owner, repo, pull_number: number });
  const pr = response.data;
  if (!pr.base || pr.base.ref !== "main") return null;
  const fileResult = await listChangedFiles(github, owner, repo, pr);
  const firstCommitResponse = await github.rest.pulls.listCommits({ owner, repo, pull_number: pr.number, per_page: 1, page: 1 });
  const baseSha = firstCommitResponse.data[0] && firstCommitResponse.data[0].parents && firstCommitResponse.data[0].parents[0]
    ? firstCommitResponse.data[0].parents[0].sha
    : pr.base.sha;
  const files = fileResult.files.map((file) => ({
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
  }));
  const findingIds = extractFindingIds(pr, fileResult.files);
  const fileFindingIds = files.map((file) => ({
    path: file.path,
    finding_id: directFindingId(file.path),
  }));
  const postMerge = Boolean(
    run &&
    ["push", "workflow_dispatch"].includes(run.event) &&
    run.head_branch === "main" &&
    pr.merged &&
    pr.merge_commit_sha &&
    pr.merge_commit_sha === run.head_sha
  );
  return {
    schema_version: 1,
    event_id: "",
    event_type: run ? "workflow_run.completed" : "pull_request.closed",
    occurred_at: run ? (run.updated_at || run.run_started_at) : (pr.closed_at || pr.updated_at),
    repository: owner + "/" + repo,
    repository_url: "https://github.com/" + owner + "/" + repo,
    finding_ids: findingIds,
    file_finding_ids: fileFindingIds,
    changed_files: files,
    mapping_complete: fileResult.complete,
    pull_request: {
      number: pr.number,
      url: pr.html_url,
      state: pr.state,
      merged: Boolean(pr.merged),
      merged_at: pr.merged_at || null,
      base_branch: pr.base.ref,
      base_sha: baseSha,
      head_branch: pr.head.ref,
      head_sha: pr.head.sha,
      merge_commit_sha: pr.merge_commit_sha || null,
    },
    workflow_run: run ? {
      id: run.id,
      url: run.html_url,
      name: run.name,
      event: run.event,
      conclusion: run.conclusion,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      run_attempt: run.run_attempt || 1,
    } : null,
    is_post_merge_main_ci: postMerge,
  };
}

async function resolvePullRequestsForRun(github, owner, repo, run) {
  const numbers = new Set((run.pull_requests || []).map((pr) => pr.number).filter(Boolean));
  if (numbers.size === 0 && github.rest.repos.listPullRequestsAssociatedWithCommit) {
    try {
      const response = await github.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: run.head_sha,
      });
      for (const pr of response.data || []) {
        if (pr.number && pr.base && pr.base.ref === "main") numbers.add(pr.number);
      }
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  if (numbers.size === 0) {
    for (let page = 1; page <= 10; page += 1) {
      const response = await github.rest.pulls.list({
        owner,
        repo,
        state: "all",
        base: "main",
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });
      for (const pr of response.data || []) {
        const matchesHead = pr.head && pr.head.sha === run.head_sha;
        const matchesMerge = pr.merge_commit_sha && pr.merge_commit_sha === run.head_sha;
        if (pr.number && (matchesHead || matchesMerge)) numbers.add(pr.number);
      }
      if (numbers.size > 0 || response.data.length < 100) break;
    }
  }
  return Array.from(numbers);
}

async function buildUnassociatedRunRecord(github, owner, repo, run) {
  let files = [];
  try {
    const response = await github.rest.repos.getCommit({
      owner,
      repo,
      ref: run.head_sha,
    });
    files = (response.data.files || []).map((file) => ({
      path: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
    }));
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  const findingIds = extractFindingIds({
    title: run.head_commit && run.head_commit.message,
    body: "",
    head: { ref: run.head_branch },
  }, files);
  return {
    schema_version: 1,
    event_id: "",
    event_type: "workflow_run.completed",
    occurred_at: run.updated_at || run.run_started_at,
    repository: owner + "/" + repo,
    repository_url: "https://github.com/" + owner + "/" + repo,
    finding_ids: findingIds,
    file_finding_ids: files.map((file) => ({ path: file.path, finding_id: directFindingId(file.path) })),
    changed_files: files,
    mapping_complete: true,
    pull_request: null,
    workflow_run: {
      id: run.id,
      url: run.html_url,
      name: run.name,
      event: run.event,
      conclusion: run.conclusion,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      run_attempt: run.run_attempt || 1,
    },
    is_post_merge_main_ci: false,
  };
}

async function findFindingPaths(github, owner, repo, ref, findingIds) {
  if (findingIds.length === 0) return {};
  const response = await github.rest.repos.getContent({
    owner,
    repo,
    path: FINDINGS_DIR,
    ref,
  });
  const entries = Array.isArray(response.data) ? response.data : [];
  const result = {};
  for (const id of findingIds) {
    const suffix = ("-" + id + ".md").toUpperCase();
    const matches = entries.filter((entry) => entry.type === "file" && typeof entry.path === "string" && entry.path.startsWith(FINDINGS_DIR + "/") && /^\d{3}-[A-Z]{2,5}-\d{3}\.md$/i.test(entry.name) && entry.name.toUpperCase().endsWith(suffix));
    if (matches.length === 1) result[id] = matches[0].path;
  }
  return result;
}

async function persistRecords(github, owner, repo, records, core) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const refResponse = await github.rest.git.getRef({ owner, repo, ref: "heads/main" });
    const baseSha = refResponse.data.object.sha;
    const baseCommit = await github.rest.git.getCommit({ owner, repo, commit_sha: baseSha });
    const progressFile = await readFile(github, owner, repo, PROGRESS_PATH, baseSha);
    if (!progressFile) throw new Error("The remediation progress ledger is missing from main.");

    let progress = progressFile.content;
    const eventContents = new Map();
    const changed = new Map();
    const pendingRecords = [];

    for (const record of records) {
      // Pre-merge CI is intentionally not persisted to main: it is not a remediation disposition.
      if (record.event_type === "workflow_run.completed" && !record.is_post_merge_main_ci) continue;
      if (record.event_type === "workflow_run.completed" && (!record.finding_ids || record.finding_ids.length === 0)) continue;
      if (record.event_type === "pull_request.closed" && (!record.finding_ids || record.finding_ids.length === 0)) continue;

      const month = String(record.occurred_at || new Date().toISOString()).slice(0, 7);
      const eventPath = EVENTS_DIR + "/" + month + ".jsonl";
      if (!eventContents.has(eventPath)) {
        const existing = await readFile(github, owner, repo, eventPath, baseSha);
        eventContents.set(eventPath, existing ? existing.content : "");
      }
      const existingText = eventContents.get(eventPath);
      const known = new Set(existingText.split(/\r?\n/).filter(Boolean).flatMap((line) => {
        try { const parsed = JSON.parse(line); return parsed.event_id ? [parsed.event_id] : []; }
        catch (_) { return []; }
      }));
      if (known.has(record.event_id)) continue;

      let status = null;
      let paths = {};
      let stagedProgress = progress;
      const stagedFindingChanges = [];
      record.resulting_statuses = {};
      if (record.finding_ids && record.finding_ids.length > 0) {
        paths = await findFindingPaths(github, owner, repo, baseSha, record.finding_ids);
        record.canonical_finding_paths = paths;
        record.canonical_mapping_complete = record.finding_ids.every((id) =>
          Boolean(paths[id]) &&
          ledgerHasFinding(progress, id) &&
          (record.file_finding_ids || []).filter((file) => file && file.finding_id === id && file.path === paths[id]).length === 1
        );
        if (record.canonical_mapping_complete && record.mapping_complete !== false) {
          status = statusForRecord(record);
        }
      }

      // An unmerged PR is retained as event evidence only; author-controlled metadata never changes a finding.
      const mayChangeDisposition = Boolean(
        status && status !== "Closed without merge" &&
        ((record.event_type === "pull_request.closed" && record.pull_request && record.pull_request.merged) || record.is_post_merge_main_ci)
      );
      if (mayChangeDisposition) {
        const evidence = evidenceFor(record);
        const findingFiles = {};
        let allFindingRecordsValid = true;
        for (const findingId of record.finding_ids) {
          const path = paths[findingId];
          const file = await readFile(github, owner, repo, path, baseSha);
          if (!file) { allFindingRecordsValid = false; break; }
          const statusLines = file.content.split(/\r?\n/).filter((line) => /^- Status: \*\*.*\*\*.*$/.test(line));
          if (statusLines.length !== 1) { allFindingRecordsValid = false; break; }
          if (isMainVerifiedStatus(statusLines[0]) && status !== "Verified complete") { allFindingRecordsValid = false; break; }
          findingFiles[findingId] = { path, content: file.content };
        }
        for (const findingId of record.finding_ids) {
          const ledgerRow = updateLedgerRow(stagedProgress, findingId, status, evidence, null);
          if (ledgerRow.previousStatus == null || ledgerRow.resultingStatus !== status ||
              (isMainVerifiedStatus(ledgerRow.previousStatus) && status !== "Verified complete")) {
            allFindingRecordsValid = false;
            break;
          }
          stagedProgress = ledgerRow.content;
        }
        if (allFindingRecordsValid) {
          const mergeSha = record.pull_request && record.pull_request.merge_commit_sha;
          const commitLink = status === "Verified complete" && mergeSha && record.workflow_run && record.workflow_run.head_sha === mergeSha
            ? "[" + mergeSha.slice(0, 8) + "](https://github.com/" + owner + "/" + repo + "/commit/" + mergeSha + ")"
            : null;
          // Reapply the verified-commit link without changing any other ledger evidence.
          if (commitLink) {
            for (const findingId of record.finding_ids) {
              stagedProgress = updateLedgerRow(stagedProgress, findingId, status, evidence, commitLink).content;
            }
          }
          for (const findingId of record.finding_ids) {
            const item = findingFiles[findingId];
            const updated = updateFindingStatus(item.content, status, statusDetailsForFinding(status, record));
            if (!updated.valid || (updated.protected && status !== "Verified complete")) { allFindingRecordsValid = false; break; }
            if (updated.changed) stagedFindingChanges.push([item.path, updated.content]);
          }
        }
        if (allFindingRecordsValid) {
          progress = stagedProgress;
          for (const [path, content] of stagedFindingChanges) changed.set(path, content);
          for (const findingId of record.finding_ids) record.resulting_statuses[findingId] = status;
          progress = appendExecutionLog(progress, record, status, eventPath);
        } else {
          record.transition_rejected = true;
          record.resulting_statuses = {};
          core.warning("Refusing all finding transitions for this event: at least one finding record or ledger association is missing or invalid.");
        }
      }

      const append = appendEventIfNew(existingText, record);
      if (append.appended) {
        eventContents.set(eventPath, append.content);
        pendingRecords.push(record);
      }
    }

    if (pendingRecords.length === 0) {
      core.info("No relevant remediation event requires persistence; no commit required.");
      return;
    }

    for (const [path, content] of eventContents.entries()) {
      if (content !== "") changed.set(path, content);
    }
    if (progress !== progressFile.content) changed.set(PROGRESS_PATH, progress);
    if (changed.size === 0) return;

    const treeEntries = [];
    for (const [path, content] of changed.entries()) {
      const blob = await github.rest.git.createBlob({
        owner,
        repo,
        content,
        encoding: "utf-8",
      });
      treeEntries.push({ path, mode: "100644", type: "blob", sha: blob.data.sha });
    }
    const tree = await github.rest.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.data.tree.sha,
      tree: treeEntries,
    });
    const ids = Array.from(new Set(pendingRecords.flatMap((record) => record.finding_ids || [])));
    const commit = await github.rest.git.createCommit({
      owner,
      repo,
      message: "chore(remediation): record GitHub lifecycle evidence" + (ids.length ? " (" + ids.join(", ") + ")" : ""),
      tree: tree.data.sha,
      parents: [baseSha],
    });
    try {
      await github.rest.git.updateRef({
        owner,
        repo,
        ref: "heads/main",
        sha: commit.data.sha,
        force: false,
      });
      core.info("Recorded " + pendingRecords.length + " GitHub event(s) in " + commit.data.sha + ".");
      return;
    } catch (error) {
      const retryableConflict = error.status === 409 || (error.status === 422 && /fast.?forward/i.test(String(error.message || "")));
      if (!retryableConflict) throw error;
      core.warning("main advanced during event recording; retrying against the new tip (attempt " + (attempt + 1) + ").");
    }
  }
  throw new Error("Could not safely update main after five non-fast-forward retries; no force update was attempted.");
}

async function recordGitHubEvent({ github, context, core }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const records = [];

  if (context.eventName === "pull_request_target") {
    const pr = context.payload.pull_request;
    if (!pr || !pr.number) return;
    const record = await fetchPullRequestRecord(github, owner, repo, pr.number, null);
    if (record) {
      record.event_id = eventIdFor(record.event_type, {
        number: record.pull_request.number,
        closed_at: pr.closed_at || record.occurred_at,
        updated_at: pr.updated_at,
        merge_commit_sha: record.pull_request.merge_commit_sha,
      }, null);
      records.push(record);
    }
  } else if (context.eventName === "workflow_run") {
    const run = context.payload.workflow_run;
    if (!run || run.name !== "CI" || run.status !== "completed") return;
    const numbers = await resolvePullRequestsForRun(github, owner, repo, run);
    for (const number of numbers) {
      const record = await fetchPullRequestRecord(github, owner, repo, number, run);
      if (!record) continue;
      record.event_id = eventIdFor(record.event_type, record.pull_request, run);
      records.push(record);
    }
    if (records.length === 0) {
      const record = await buildUnassociatedRunRecord(github, owner, repo, run);
      record.event_id = eventIdFor(record.event_type, null, run);
      records.push(record);
    }
  } else {
    core.info("Unsupported event type; nothing recorded.");
    return;
  }

  if (records.length === 0) {
    core.info("No applicable GitHub event was found.");
    return;
  }
  await persistRecords(github, owner, repo, records, core);
}

module.exports = {
  appendEventIfNew,
  directFindingId,
  findFindingPaths,
  hasCanonicalFindingMapping,
  isMainVerifiedStatus,
  ledgerHasFinding,
  mergeEvidence,
  persistRecords,
  eventIdFor,
  extractFindingIds,
  statusForRecord,
  updateFindingStatus,
  updateLedgerRow,
  recordGitHubEvent,
};
