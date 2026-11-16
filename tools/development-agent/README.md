# Oxenn Development Agent v1

This directory contains the first local-first Development Agent prototype. Version 1 is a deterministic inspection and planning CLI, not an autonomous coding agent.

## Capabilities

- Reads the current repository root, branch, HEAD SHA, local main SHA when available, and Git working-tree status.
- Reads a bounded (32 KiB) task envelope from outside the selected repository; rejects repository-contained, symlinked and hard-linked task files. Validates scope, Git branch-ref syntax, SHA-1/SHA-256 object IDs, provider policy and path containment.
- Reads root and ancestor `AGENTS.md` files for file scopes, and the allowed directory's own plus nested `AGENTS.md` files for directory scopes. Discovery is bounded by 4,096 candidate paths, 256 actual instruction files, depth 32, 10,000 directory entries and 8 MiB aggregate instruction content; exceeding a limit blocks the plan.
- Reads only the authoritative Markdown/source documents explicitly named by the task envelope. MVP-stage and remediation tasks additionally require their task-class minimum authority documents; missing documents produce `BLOCKED`.
  - `mvp-stage`: repository context, MVP product specification, MVP engineering baseline, roadmap README, and the stage brief matching the `MVP-XX` task ID.
  - `remediation`: repository context, remediation prompt, Wave 0 supersession policy, implementation sequence, live remediation progress tracker, and finding records matching every finding ID in the task ID.
- Produces a bounded READY or BLOCKED plan with evidence hashes and reason codes.
- Appends a minimal JSONL run event outside the repository with restrictive file permissions using a pinned directory descriptor; immediately before append it rereads the external task file and reruns the full planner, rejecting any changed task, repository, instruction or document evidence. Symlink destinations and hard-linked ledger files are rejected.

## Hard boundaries

The CLI does not write, patch, or delete repository files; execute user-supplied commands; launch tests or scripts; add dependencies; call an LLM, API, or external provider; create or switch branches; push; create or merge pull requests; run migrations; access databases; or deploy. Git status inspection explicitly disables `core.fsmonitor` and configured clean/smudge/process filters while preserving user Git configuration such as global ignore rules and `safe.directory`. Status output is streamed, and an unverifiable execution boundary or status result blocks the plan. The ledger append currently requires descriptor-relative filesystem support (Linux/macOS); unsupported platforms fail closed. The run ledger is the only write and is required to remain outside the repository. No raw file contents, task objective, environment variables, secrets, or customer data are written to the ledger.

A READY result means only that the local read-only preconditions passed. It is not approval to implement the task and does not authorize any subsequent write operation. Any implementation phase requires a separate owner-approved scope and a later version of the execution controller.

## Requirements

- Node.js 22 or later
- The repository's existing pnpm toolchain
- Git available on PATH

No dependency was added for this prototype.

## Run

Create a JSON task envelope at a path outside the repository, then run:

    pnpm exec tsx tools/development-agent/src/cli.ts plan --task-file /absolute/path/task.json --repo .

The run ledger defaults to:

    $XDG_STATE_HOME/oxenn-development-agent/runs.jsonl

When XDG_STATE_HOME is unset, it uses ~/.local/state/oxenn-development-agent/runs.jsonl. An optional --ledger /absolute/path/runs.jsonl overrides the location. The selected ledger path must be outside the repository; symlink targets, hard-linked files and non-regular files are rejected.

The command exits with:
- 0 for READY
- 2 for BLOCKED
- 1 for invalid input or an inspection/ledger error

A dirty worktree, unavailable status, unverified Git execution boundary, detached HEAD, target-branch mismatch, base-SHA mismatch, missing root instructions, incomplete task-class authority documents, bounded instruction-discovery overflow, or unsafe/unreadable reference input fails closed.

## Task envelope

The task JSON must contain exactly the following fields. Paths are literal repository-relative paths, never globs. baseSha must equal the inspected HEAD SHA and may be a full 40-character SHA-1 or 64-character SHA-256 object ID. Version 1 is model-free and does not permit command execution.

    {
      "schemaVersion": 1,
      "taskId": "DEV-AGENT-1",
      "title": "Example read-only task",
      "taskClass": "tooling",
      "objective": "Inspect a bounded part of the repository and prepare a plan.",
      "authorizedBy": "Explicit owner approval reference",
      "targetBranch": "agents/example-task",
      "baseSha": "0000000000000000000000000000000000000000",
      "allowedPaths": ["tools/example/file.ts"],
      "prohibitedPaths": ["src/app/page.tsx"],
      "authoritativeDocs": ["AGENTS.md"],
      "successCriteria": ["A bounded plan and evidence list are produced."],
      "stopConditions": ["Stop when the branch, base, or worktree differs."],
      "providerPolicy": {
        "mode": "disabled",
        "maxTokens": 0,
        "maxCostUsd": 0
      },
      "permittedCommands": []
    }

Replace the example values with the real task, exact branch, and current full commit SHA. The task file is read-only input and is not copied to the run ledger.

## Verification

Focused tests live in tests/unit/tools/development-agent/ and use disposable temporary Git repositories. Run them explicitly as a developer:

    pnpm exec vitest run --project unit tests/unit/tools/development-agent/

Repository-wide TypeScript validation:

    pnpm typecheck

The CLI itself never launches either command.
