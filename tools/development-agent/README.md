# Oxenn Development Agent v1

This directory contains the first local-first Development Agent prototype. Version 1 is a deterministic inspection and planning CLI, not an autonomous coding agent.

## Capabilities

- Reads the current repository root, branch, HEAD SHA, local main SHA when available, and Git working-tree status.
- Reads an explicit task envelope and validates its scope, SHA, branch, provider policy, and allowed paths.
- Reads the root and applicable parent-directory AGENTS.md files for the task's literal allowed paths.
- Reads only the authoritative Markdown/source documents explicitly named by the task envelope.
- Produces a bounded READY or BLOCKED plan with evidence hashes and reason codes.
- Appends a minimal JSONL run event outside the repository with restrictive file permissions.

## Hard boundaries

The CLI does not write, patch, or delete repository files; execute user-supplied commands; launch tests or scripts; add dependencies; call an LLM, API, or external provider; create or switch branches; push; create or merge pull requests; run migrations; access databases; or deploy. The run ledger is the only write and is required to remain outside the repository. No raw file contents, task objective, environment variables, secrets, or customer data are written to the ledger.

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

When XDG_STATE_HOME is unset, it uses ~/.local/state/oxenn-development-agent/runs.jsonl. An optional --ledger /absolute/path/runs.jsonl overrides the location. The selected ledger path must be outside the repository; symlink targets and non-regular files are rejected.

The command exits with:
- 0 for READY
- 2 for BLOCKED
- 1 for invalid input or an inspection/ledger error

A dirty worktree, detached HEAD, target-branch mismatch, base-SHA mismatch, missing root instructions, or unsafe/unreadable reference input fails closed.

## Task envelope

The task JSON must contain exactly the following fields. Paths are literal repository-relative paths, never globs. baseSha must equal the inspected HEAD SHA. Version 1 is model-free and does not permit command execution.

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
