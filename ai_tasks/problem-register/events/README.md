# Automated remediation event history

GitHub lifecycle and CI evidence is stored as append-only, monthly JSON Lines files in this directory.

The recorder listens to:
- Pull requests closed against main: records whether the PR merged or closed without merging.
- Completed runs of the repository CI workflow: retains post-merge runs associated with the exact merge commit on main. Only `success` advances a finding to Verified complete; `failure`, `timed_out`, and `action_required` produce verification-failed status. `cancelled`, `skipped`, and `neutral` outcomes are evidence-only. Pre-merge and unrelated CI completions are no-ops and do not create commits on main.

Each event contains a deterministic event ID, UTC timestamp, repository, PR/CI references, finding IDs, changed file paths, and direct finding-file associations where available. Monthly sharding keeps individual files bounded. Re-delivered events are ignored by event ID.

Finding IDs may be discovered from branch names, PR titles, explicit Finding-IDs: lines, and changed paths, but discovery alone never authorizes a status transition. Every transitioned ID must have exactly one canonical numbered finding file in the repository, that exact path must appear in the PR's changed files with the matching ID, and exactly one matching row must exist in the ledger. Missing, duplicate, incomplete, or mixed valid/invalid mappings fail closed for the entire event; no partial finding transition is written. Other changed paths remain recorded at PR level and are not guessed to belong to one finding.

The recorder never checks out or executes code from a pull request. It checks out the trusted main branch, uses read-only PR/CI metadata, and writes with the GitHub token's repository contents permission. It does not alter branch protection, merge PRs, force-update refs, or run database commands. Writes use a non-force Git ref update with bounded retries; if main is protected against the write or the update cannot be reconciled, the workflow fails safely.

A finding is not marked Verified complete because a branch CI run passes or a PR is merely merged. The state sequence is:
1. PR closed without merge: retain the closure as JSONL evidence only; do not change the ledger or finding disposition because the PR's author-controlled metadata is not accepted remediation.
2. PR merged with complete canonical associations: Integrated — verification pending.
3. CI completes successfully on main for the exact merge commit: Verified complete.
4. Post-merge CI failure: Integrated — verification failed.

The human-readable ledger and finding status lines are updated only for merged PRs and exact post-merge CI events. Verified dispositions are immutable against delayed lifecycle events. Existing evidence links are retained, and the verified-commit column receives the exact merge SHA. Event IDs make delivery idempotent; concurrent main updates use bounded non-force retries, and protected-branch/API failures stop the write without bypassing protections.

The recorder is intentionally evidence-only. It does not authorize remediation, mark a wave complete, approve a finding, or change product/database state.
