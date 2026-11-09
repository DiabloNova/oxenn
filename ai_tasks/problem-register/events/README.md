# Automated remediation event history

GitHub lifecycle and CI evidence is stored as append-only, monthly JSON Lines files in this directory.

The recorder listens to:
- Pull requests closed against main: only PRs with at least one finding-ID reference are considered; closures with no finding-ID reference are no-ops. Merged PRs carrying authoritative IDs are retained as audit evidence even when mapping is incomplete. Candidate-only closures, merged or unmerged, are retained only when a candidate resolves to exactly one canonical finding file.
- Completed runs of the repository CI workflow: only exact post-merge runs associated with the merge commit on main and carrying at least one finding-ID reference are considered; runs with no finding-ID reference are no-ops. Events with authoritative IDs are retained even when finding mapping is incomplete; those events are evidence-only and do not change dispositions. Only `success` with complete canonical mapping advances a finding to Verified complete; `failure`, `timed_out`, and `action_required` with complete mapping produce verification-failed status. `cancelled`, `skipped`, `neutral`, pre-merge, and unrelated CI completions never change dispositions; pre-merge and unrelated CI completions are no-ops.

Each event contains a deterministic event ID, UTC timestamp, repository, PR/CI references, candidate and authoritative finding IDs, changed file paths, and direct finding-file associations where available. Monthly sharding keeps individual files bounded. Re-delivered events are ignored by event ID.

Finding IDs may be discovered from branch names, PR titles, explicit Finding-IDs: lines, and changed paths, but discovery alone never authorizes a status transition. Every transitioned ID must have exactly one canonical numbered finding file in the repository, that exact path must appear in the PR's changed files with the matching ID, and exactly one matching row must exist in the ledger. Missing, duplicate, incomplete, or mixed valid/invalid mappings fail closed for the entire disposition transition; the merged PR or exact post-merge CI event is still retained as JSONL evidence. Other changed paths remain recorded at PR level and are not guessed to belong to one finding.

The recorder never checks out or executes code from a pull request. It checks out the trusted main branch, uses read-only PR/CI metadata, and writes with the GitHub token's repository contents permission. It does not alter branch protection, merge PRs, force-update refs, or run database commands. Writes use a non-force Git ref update with bounded retries; if main is protected against the write or the update cannot be reconciled, the workflow fails safely.

A finding is not marked Verified complete because a branch CI run passes or a PR is merely merged. The state sequence is:
1. PR closed without merge: retain the closure as JSONL evidence only when a candidate resolves to exactly one canonical finding file; do not change any disposition.
2. PR merged: always retain the closure event; change to Integrated — verification pending only with complete canonical associations.
3. CI completes successfully on main for the exact merge commit: change to Verified complete only with complete canonical associations; otherwise retain evidence only.
4. Post-merge CI failure: change to Integrated — verification failed only with complete canonical associations; otherwise retain evidence only.

The human-readable ledger and finding status lines are updated only for merged PRs and exact post-merge CI events. Verified dispositions are immutable against delayed lifecycle events. Existing evidence links are retained. When a non-verified finding advances to Verified complete, the verified-commit column is refreshed to the exact merge SHA in the same ledger update; an already-main-verified finding keeps its original status details and SHA. Event IDs make delivery idempotent; concurrent main updates use bounded non-force retries, and protected-branch/API failures stop the write without bypassing protections.

The recorder is intentionally evidence-only. It does not authorize remediation, mark a wave complete, approve a finding, or change product/database state.
