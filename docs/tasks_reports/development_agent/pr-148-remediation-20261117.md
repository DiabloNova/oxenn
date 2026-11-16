# PR #148 — Development Agent v1 remediation report

**Date:** 2026-11-17
**PR:** https://github.com/DiabloNova/oxenn/pull/148
**Working branch:** `agents/oxenn-dev-agent-foundation-20261116`
**Initial PR head:** `4a1dc82144706e438bf292eb9c4244b6fc1a513c`
**Branch handling:** Updated the existing PR branch; no new branch was created.

## Scope

Remediate the confirmed Gitar, HeyDeer and Cubic findings affecting the current read-only Development Agent v1 runtime, its security boundaries, task authority and its documentation. Preserve the existing read-only/no-provider/no-repository-write boundary. Do not start MVP-01 or WP-02, run database or migration commands, or execute the prohibited Phase-0 scripts.

## Review coverage

The completed inline review set contained 39 comments: 2 Gitar, 6 HeyDeer and 31 Cubic. The Gitar/HeyDeer findings and 27 Cubic findings affecting the Development Agent runtime, tests, or Development Agent policy/reporting are addressed in this patch. Four Cubic comments remain deliberately deferred because they concern the preserved MVP-00 source artifacts: the WP-01 snapshot's branch-revalidation evidence detail, and the PDDG/owner-register metadata, stage-count and source-version wording.

## Implemented changes

### Task intake and authority

- Validate branch names against Git ref-name rules while accepting valid punctuation such as `feat/a+b` and `fix#12`.
- Accept full SHA-1 (40 hex characters) and SHA-256 (64 hex characters) object IDs.
- Reject an allowed path that is equal to or nested below a prohibited path, while preserving a permitted parent scope with a narrower prohibited child.
- Require the task envelope to be a regular file outside the selected repository; reject symlink and hard-link task files.
- Read at most 32 KiB through one verified file descriptor and reject file mutation during the read.
- Require the task-class minimum authority documents before a plan can be `READY`: MVP-stage tasks need the repository context, product specification, engineering baseline, roadmap README and the stage brief matching the `MVP-XX` task ID; remediation tasks need the repository context, remediation prompt, Wave 0 supersession policy, implementation sequence, progress tracker and every finding record matching the finding IDs in the task ID.

### Instruction and repository file loading

- Discover root and ancestor `AGENTS.md` files for file scopes; for directory scopes, also discover the directory's own and nested instruction files.
- Do not inspect a sibling directory as though a file path were a directory.
- Reject instruction directory symlinks that resolve outside the repository; avoid repeated traversal of already visited physical directories.
- Bound discovery to 4,096 candidate paths, 256 actual instruction files, depth 32, 10,000 directory entries and 8 MiB of instruction content. Exceeding a limit produces blocked evidence rather than silently omitting instructions.
- Read repository files from a single opened descriptor, verify path containment and descriptor identity, enforce byte limits while reading, and reject files that change during the read.

### Git inspection

- Preserve the user's `HOME`, XDG and Git global/system configuration context, including `safe.directory` and global ignore rules.
- Explicitly disable `core.fsmonitor` and configured clean/smudge/process filters for status inspection. Capture bounded Git stderr and fail closed if the filter configuration or required Git state cannot be verified.
- Stream `git status --porcelain=v1 -z --untracked-files=all` rather than retaining a bounded stdout buffer; an oversized dirty worktree is still recognized as dirty, and an incomplete/timeout result is never treated as clean.
- Count rename/copy records once, not once per path token.
- Remove only the terminating newline from `git rev-parse --show-toplevel`, preserving repository paths with leading/trailing whitespace.
- Preserve untracked file contents; inspection remains read-only.

### Run ledger write boundary

- Keep the JSONL ledger outside the repository and write through a pinned directory descriptor; reject repository-resolving symlink destinations, symlink files and hard-linked ledger targets.
- Create missing ledger directories through the pinned descriptor, with restrictive permissions; use mode `0600` for the ledger file.
- Immediately before append, reread the external task envelope and rerun the full planner. Refuse the append if the task, branch, base, worktree, instruction evidence, authoritative-document evidence or record differs from the original plan.
- Align the ledger evidence limit with the planner's 256-file instruction bound; accept both SHA-1 and SHA-256 IDs and valid Git branch punctuation.
- Enforce consistency between `READY`/`BLOCKED` state and reason codes.
- Descriptor-relative ledger writes are supported on Linux/macOS; unsupported platforms fail closed.

### Tests and documentation

- Added regression coverage for nested instruction discovery, file-vs-directory scopes, external symlinks, discovery limits, task-file location/size/link constraints, path containment, explicit wrong-branch/wrong-base planner blocking, Git filters/fsmonitor, global ignore preservation, large status output, rename counting, repository roots with whitespace, ledger hard links/symlinks, task mutation and branch/head changes before append.
- Increased only the affected planner/ledger test timeout to 15 seconds; no assertions were removed or weakened.
- Updated the Development Agent specification, execution policy and runtime README to reflect shipped v1 behavior and to gate future patching, command execution, provider use, retry behavior and PR actions. The unsafe generic `pnpm test:isolation` recommendation is explicitly forbidden until that script is made target-aware and guarded.
- Corrected the v1 implementation report's branch-ahead count from 8 to 9 at its recorded historical point.

## Verification

| Check | Result |
|---|---|
| Native Node 24.22.1 integration smoke against the actual TypeScript modules (task intake, planner READY/BLOCKED, Git filters/fsmonitor, large status, rename count, SHA-256 ledger validation, hard-link/symlink containment, task-file and branch revalidation) | PASS |
| Native instruction-loader smoke (file vs directory scope, nested instructions, external symlink rejection, depth limit) | PASS |
| Repository-root whitespace smoke | PASS |
| Node native TypeScript syntax parse for 17 changed source/test files | PASS |
| `git diff --check` on the working patch | PASS |
| Full Vitest suite and repository TypeScript typecheck in the local sandbox | NOT RUN — the pinned pnpm workspace install timed out on repeated attempts; no package manifest or lockfile was changed |
| GitHub CI on the updated PR head | PENDING — rerun after publishing this remediation |

The native smoke checks are targeted integration checks, not a substitute for the repository's full Vitest suite or TypeScript typecheck. CI must confirm those checks before merge.

## Deliberately unchanged / follow-up

- The copied MVP-00 planning artifacts were preserved rather than edited as part of this Development Agent runtime remediation. Cubic's lower-priority observations about their historical source-version wording, stage-count wording, branch-revalidation evidence detail and trailing whitespace remain outside this approved scope.
- The previously reported `db-push-attestation` test timeout is in an unchanged test outside the Development Agent files. It was not modified or bypassed; its result must be checked in the fresh CI run.
- No database, migration, deployment, provider, paid-service, Phase-0 probe, or isolation-suite command was executed.

## Merge recommendation

Do not merge until the updated GitHub CI is green and the remaining Cubic check has reached a terminal state. If the pre-existing `db-push-attestation` timeout recurs, triage it separately rather than weakening or skipping that test.
