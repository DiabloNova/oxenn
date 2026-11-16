# Oxenn Development Agent — Execution and Safety Policy

**Status:** Guardrails for the implemented read-only v1 and future capabilities; write-enabled/model-enabled phases still require separate owner approval.
**Date:** 2026-11-16

## 1. Default mode

The agent starts in read-only mode. Reading repository files, branch metadata, relevant PR/issue metadata and CI evidence is permitted only within the connected account's existing access.

No repository write, shell command with side effects, external provider call, database operation, deployment or customer contact is implied by the existence of this policy.

Every task requires a task envelope containing:

- Explicit owner request/approval.
- Task class and authoritative source.
- Exact base SHA and target branch.
- Allowed paths and prohibited paths.
- Intended invariant and acceptance criteria.
- Permitted commands and environments.
- Model/provider and maximum token/cost budget, or an explicit model-free requirement.
- Stop conditions and handoff requirements.

Missing or contradictory fields fail closed.

## 2. Mandatory repository safeguards

Follow the current root and nested `AGENTS.md` instructions literally. In particular:

- Inspect branch, commit, working-tree status, relevant source, tests, config, documentation and open changes before modifying anything.
- Treat repository state as authoritative; prior reports are leads, not proof.
- Distinguish FACT, OBSERVATION, INFERENCE, ASSUMPTION, CONFLICT and UNRESOLVED.
- Do not fabricate file contents, command results, test success or completion.
- Do not broaden scope or perform opportunistic refactoring.
- Preserve all pre-existing user and agent work.
- Never discard dirty work or rewrite Git history.
- Never use `git reset`, `git reset --hard`, `git checkout`, `git restore`, `git clean`, `git rebase`, `git revert` or `git commit --amend` unless the exact operation is separately authorized.
- Do not commit, push, open/close/merge a PR or switch branches unless that operation is within the active task authorization.
- Never merge, deploy, release or change production state autonomously.

## 3. Protected operations

The following always require explicit, task-specific owner approval and any required specialist authorization:

- Production database access, migrations, data writes or destructive database tests.
- Schema changes, migration generation/application and changes to tenant isolation or RLS.
- Deployment, release, DNS, billing, payment or subscription actions.
- External-provider activation, credential changes, outbound messages or customer contact.
- Secret, environment, repository permission, branch protection or organization setting changes.
- File deletion, bulk replacement, history rewrite, PR merge/close or branch deletion.
- Changes that cross the approved stage, finding, frontend/backend or product boundaries.

Never request API keys, passwords, private reviewer credentials or database URLs in chat. Use approved secret stores and least-privilege credentials. Never print secrets in logs, traces, test output or progress records.

## 4. Existing remediation-specific rules

When a task is a remediation finding, the existing `AI_REMEDIATION_AGENT_PROMPT.md` and its referenced policy documents remain authoritative. The Development Agent must not replace or weaken them.

- Revalidate only the selected finding and its directly relevant dependencies against the exact base commit.
- The 97-finding Wave 0 inventory is not a universal entry gate; follow `WAVE0_POLICY_SUPERSESSION.md`.
- Preserve the permanent prohibition on running `verification/phase-0/probe-system-context.ts` and `verification/phase-0/run_rls_matrix.js`.
- Verify disposable database identity before any database test or migration; production databases are never test targets.
- Update `REMEDIATION_PROGRESS.md` only as required by the remediation prompt and only for the selected finding/batch.
- A merged PR or successful feature-branch CI is not proof of a finding being verified complete. Follow the event recorder's exact lifecycle rules.

## 5. Test and command policy

Prefer deterministic, non-destructive checks. The future runner should expose named check IDs mapped to reviewed commands rather than allowing the model to invent shell commands.

Potential checks, subject to task relevance and environment verification:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm test:ui`
- `pnpm build`


Do not run `pnpm test:isolation` as a generic check: its current implementation connects with PostgreSQL administrator credentials and force-drops/recreates the hard-coded `isolation_test_db`, without accepting or attesting the caller's target. It remains forbidden until it is replaced by a target-aware guarded command and the exact disposable database identity is independently attested and explicitly approved for the task.

Do not automatically run `pnpm db:migrate`, `pnpm db:push`, Platform Admin migrations/bootstrap, provider integration tests with real credentials, or any command that writes to a non-disposable database.

A command is not a pass merely because it was queued. Record the actual exit code and observed output. A skipped or zero-test suite is not a pass.

## 6. Branch and PR policy

- Re-read the current base immediately before creating an implementation branch.
- Use a unique task branch and isolated worktree.
- Never push directly to `main` or `MVP_00`.
- A PR must state the task scope, base SHA, evidence, checks, risks and owner decisions.
- Every side effect must have a durable operation ID and receipt. After a timeout, reconcile the actual target state before retrying; do not repeat an uncertain write.
- Do not mark a PR ready while required checks are missing, skipped or failing.
- Never merge the PR; the repository owner retains merge authority.
- If the base moves or the branch diverges unexpectedly, stop and reconcile rather than force-pushing or rewriting history.

## 7. Cost, context and rate limits

- Deterministic operations first; model calls only for semantic tasks.
- Read only relevant files and ranges. Do not repeatedly ingest large historical documents or the entire repository.
- No automatic model-provider fallback.
- Respect the per-run budget in the task envelope. Stop when the budget is reached or cannot be measured.
- Do not send repository or customer data to any hosted model/provider unless the owner has approved that specific provider and its data-handling policy for this task, regardless of price.
- Any approved hosted provider must also have a hard token/cost ceiling; no free-tier assumption substitutes for data-handling approval.
- Do not use paid Super Chrome execution, paid model endpoints or other metered services unless the owner explicitly approves the specific service and cost.
- Prefer local models only when the local host has adequate resources and the user has explicitly enabled that runtime.
- Record unknown usage as unknown; never invent a free quota or claim zero cost without evidence.

## 8. Stop conditions

Stop the affected operation and report the exact evidence when:

- A required owner or specialist decision is missing.
- The implementation conflicts with an authoritative document or current architecture.
- A security, privacy, tenancy, SSRF, authorization or data-loss risk is found.
- The target branch/base SHA changed or unexpected dirty work appears.
- A required disposable database cannot be positively identified.
- A required test cannot run or fails.
- The task exceeds its approved paths, stage, budget or provider permissions.
- The agent cannot establish the intended invariant from available evidence.

Do not silently downgrade acceptance criteria to keep moving.

## 9. Status vocabulary

- `SUCCESS`: implementation and all required verification evidence support the intended invariant.
- `INCOMPLETE`: work exists, but required verification or evidence is missing.
- `BLOCKED`: a concrete environment, permission, safety or dependency blocker prevents progress.
- `NEEDS_OWNER_DECISION`: a product, architecture, scope, provider, privacy, commercial or other owner decision is unresolved.

A useful handoff includes the exact state, base/head SHAs, changed paths, executed checks and results, known risks, and the smallest next action needed to resume.
