# Automated remediation event history

GitHub lifecycle and CI evidence is stored as append-only, monthly JSON Lines files in this directory.

The recorder listens to:
- Pull requests closed against main: records whether the PR merged or closed without merging.
- Completed runs of the repository CI workflow: records pre-merge CI evidence and, for a merged PR, checks the CI run for the exact merge commit on main.

Each event contains a deterministic event ID, UTC timestamp, repository, PR/CI references, finding IDs, changed file paths, and direct finding-file associations where available. Monthly sharding keeps individual files bounded. Re-delivered events are ignored by event ID.

Finding IDs are discovered from canonical finding-record paths, branch names, PR titles, and explicit Finding-IDs: lines in PR descriptions. For a single-finding PR, changed paths are attributed to that finding. For a multi-finding PR, changed finding-record paths provide exact per-file associations; other changed paths remain recorded at PR level and are not guessed to belong to one finding.

The recorder never checks out or executes code from a pull request. It checks out the trusted main branch, uses read-only PR/CI metadata, and writes with the GitHub token's repository contents permission. It does not alter branch protection, merge PRs, force-update refs, or run database commands. Writes use a non-force Git ref update with bounded retries; if main is protected against the write or the update cannot be reconciled, the workflow fails safely.

A finding is not marked Verified complete because a branch CI run passes or a PR is merely merged. The state sequence is:
1. PR closed without merge: Closed without merge.
2. PR merged: Integrated — verification pending.
3. CI completes successfully on main for the exact merge commit: Verified complete.
4. Post-merge CI failure: Integrated — verification failed.

The human-readable ledger and finding status line are updated only for closure/integration events. Pre-merge CI runs are retained in the JSONL event history without committing to the ledger while the PR is still open. This avoids modifying files that an open PR may also be changing.

The recorder is intentionally evidence-only. It does not authorize remediation, mark a wave complete, approve a finding, or change product/database state.
