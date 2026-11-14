# AI Agent Prompt — Execute Oxenn Remediation Safely and in Dependency Order

You are working in the **OXENN** repository. Your task is to remediate the individually documented repository findings in a controlled, evidence-driven sequence. Follow this prompt, the approved architecture, each finding's own remediation specification, the dependency sequence, and the live progress tracker. Do not substitute your own plan or reorder work for convenience.

## 1. Authoritative project documents

Read these documents completely before acting:

1. [OXENN Product Architecture](../../docs/architecture/OXENN_PRODUCT_ARCHITECTURE.md) — target product and technical architecture.
2. [Problem Register](./README.md) — scope and register rules.
3. [Wave 0 Policy Supersession](./WAVE0_POLICY_SUPERSESSION.md) — authoritative sequencing policy; it retires the blanket project-wide Wave 0 prerequisite while preserving task-specific safeguards.
4. [Dependency-Based Implementation Sequence](./IMPLEMENTATION_SEQUENCE.md) — dependency map; apply prerequisites relevant to the selected finding, subject to the supersession policy.
5. [Remediation Progress & Execution Log](./REMEDIATION_PROGRESS.md) — live status ledger and audit trail.
6. The exact individual finding file(s) assigned to the current batch under [findings/](./findings/), including directly related findings and their acceptance criteria.
7. Relevant original audit reports, current source files, tests, migrations, and existing PRs/issues referenced by those finding records.

The individual finding files define the problem and recommended remediation. The architecture defines the intended boundaries. [WAVE0_POLICY_SUPERSESSION.md](./WAVE0_POLICY_SUPERSESSION.md) is authoritative for remediation sequencing and takes precedence over conflicting blanket Wave 0 wording in older documents. The implementation sequence defines dependency relationships, not a universal project-wide entry gate. The progress tracker defines recorded status. If a conflict remains after applying this explicit precedence, stop and report it; do not silently choose a policy.

## 2. Core operating rules

- **Evidence before edits.** Re-open the current source, tests, configuration, database schema/migrations, and relevant history. A historical audit is a lead, not proof that the issue still exists.
- **Revalidate the selected scope.** Before implementation, compare each selected finding and its relevant implementation, tests, and call sites with the exact current base commit. Record the SHA, branch, paths, and evidence in the progress tracker. Do not revalidate unrelated findings as a blanket prerequisite.
- **One finding at a time.** Work from the numbered finding records. Do not merge distinct findings into one undocumented task. A single coherent code change may address related findings, but each finding keeps its own acceptance criteria, status, and closure evidence.
- **Respect relevant dependencies.** Use `IMPLEMENTATION_SEQUENCE.md` to identify dependencies that directly affect the selected finding. Do not skip a prerequisite whose absence would make that change unsafe or incorrect. The project-wide Wave 0 inventory is not a universal prerequisite; see `WAVE0_POLICY_SUPERSESSION.md`.
- **No scope expansion.** Change only files needed for the approved finding(s). Do not perform opportunistic refactors, redesign unrelated modules, or change backend behavior during frontend-only work.
- **No speculative implementation.** Do not invent product policy, security behavior, billing rules, data ownership, API contracts, or migration semantics. Mark unresolved matters as `Needs decision` and ask the user for the decision.
- **No false completion.** A code edit is not a fix. A passing unit test is not proof of integration correctness. A skipped suite is not a pass. Report only commands and outcomes actually observed.
- **Preserve existing work.** Inspect the current branch, uncommitted changes, open PRs/issues, and recent commits before editing. Never overwrite, discard, or duplicate another agent's work.
- **Ask before crossing a boundary.** Obtain explicit user authorization before any production database operation, destructive action, deployment, external-provider side effect, payment operation, PR merge/close, or change outside the approved scope.

## 3. Task-specific revalidation and safety prerequisites

The historical project-wide Wave 0 inventory is not a universal prerequisite for an independently authorized remediation task. Before changing a selected finding:

1. Record the exact current base commit SHA and the working branch/head SHA.
2. Revalidate the selected finding against that exact base commit. Inspect its relevant source, tests, call sites, directly related findings, and acceptance criteria; record evidence and paths.
3. Reconcile prior PRs or issues only when they overlap the selected finding or affected code. In particular, check PRs #108/#109 for overlapping authentication or RLS work, issues #115/#116 for the corresponding SSRF or workspace-membership changes, and PR #117 before touching SRC-022/payment behavior. Never assume an earlier PR merged or duplicate its patch.
4. Verify the identity and disposable nature of any database target before database tests or migrations. Production databases are prohibited for test or migration experiments.
5. Recheck VER-013 only when its advisory dependency is relevant to the selected change and its stated deadline applies.
6. Treat VER-005 and VER-006 as permanent historical safety warnings. **Do not execute** `verification/phase-0/probe-system-context.ts` or `verification/phase-0/run_rls_matrix.js`. Any replacement verification must positively verify a disposable database target, protect secrets, clean up fixtures, and exit non-zero on failure.
7. Update `REMEDIATION_PROGRESS.md` for the selected finding or coherent batch, recording the exact base/head SHAs, evidence, files, checks, and status. Do not infer dispositions for unrelated findings.

If the selected finding cannot be validated from available evidence, leave it unresolved and explain the limitation. Task-specific dependencies and safeguards remain mandatory even though completion of the unrelated 97-finding inventory is not.

## 4. Implementation method for every finding

For each approved finding:

1. **Read the finding.** Understand its stated root cause, evidence, affected paths, architecture alignment, related findings, and verification criteria.
2. **Inspect current implementation.** Trace callers, data flow, persistence, permissions, error handling, configuration, tests, and external boundaries. Search for duplicate implementations and hidden consumers before editing.
3. **Confirm the root cause.** If current evidence contradicts the finding, stop and update its status with the evidence; do not force the originally proposed fix.
4. **Check dependencies.** Verify prerequisites and cross-finding interactions. Identify overlapping files and coordinate shared changes rather than running conflicting parallel edits.
5. **Choose the smallest complete solution.** Implement the recommended architecture-aligned solution, not merely a local symptom patch. Preserve public contracts unless the approved finding requires a versioned change.
6. **Make the change.** Keep edits narrowly scoped. Add or update tests that prove the behavior and the relevant failure modes. Include regression coverage for the original defect.
7. **Verify progressively.** Run focused tests first, then relevant domain/integration tests, type checks, lint/build, and required CI gates as appropriate. Use a verified disposable environment for database/integration tests. Record skips and failures honestly.
8. **Review the diff.** Inspect every changed line for unintended behavior, tenant-boundary regressions, security issues, data loss, migration hazards, compatibility problems, secrets, and unrelated edits.
9. **Record evidence.** Update the finding's status and append a dated entry to `REMEDIATION_PROGRESS.md` with exact commits, changed files, commands, test counts/results, CI links, risks, and remaining work.
10. **Stop at the gate.** Do not proceed to a dependent finding or the next wave until prerequisites pass and any required user approval is obtained.

## 5. Required architecture invariants

These invariants apply to every change, not only to findings that mention them:

### Product and commercial model
- Keep the **customer product/service being assessed** separate from the **OXENN service/SKU purchased**.
- SEO, AEO, and GEO must be independently purchasable. Bundles are optional, not mandatory.
- Entitlements, quotas, subscriptions, and usage must be enforced server-side and durably; UI visibility is not authorization.
- Do not invent or silently assume a payment provider. Payment confirmation must be authoritative, server-verified, idempotent, and auditable before it activates an entitlement.

### AI and evidence
- OXENN owns domain logic, business state, authorization, quotas, approvals, execution, provenance, and evaluation.
- LangChain is an interim implementation behind an OXENN-owned adapter. Do not expose LangChain types throughout domain modules or let LangChain own business state or permissions.
- Evaluate LangGraph only for a demonstrated orchestration need. SCRS is a later candidate, not an assumed production-ready replacement.
- LLM output is advisory data, not permission to execute. Enforce deterministic contract, provenance, policy, and approval gates.
- Preserve explicit LIVE, MOCK, and HYBRID modes. Mock data must never masquerade as live evidence.
- Preserve `UNKNOWN != ZERO`. Distinguish unavailable, unknown, measured zero, and valid empty results.
- Preserve source, timestamp/freshness, provider/model/version, trace, and transformation provenance where required.

### Data, tenancy, and security
- Organization-owned records and association tables must obey tenant boundaries. Never classify a table as global merely because it lacks an RLS policy.
- Use an independent ownership inventory; do not let the code under test generate its own expected truth.
- Privileged access must enforce caller, purpose, resource/table, operation, and actor restrictions—not merely validate a descriptive purpose string.
- Preserve SSRF protections across redirects, DNS resolution, IP ranges, and every provider-bound fetch path.
- Treat secrets as secrets: never print database URLs, tokens, API keys, or credentials in logs or reports.
- Use only verified disposable databases for destructive tests. Make cleanup and failure exit behavior explicit.

### Frontend and scope
- Respect the approved product architecture and the user's current frontend/backend scope.
- The dashboard task is frontend-only unless the user explicitly authorizes backend changes.
- Preserve Persian as the default dashboard language and English as an available language where relevant to the approved UI scope.
- Do not introduce new product modules or visible features solely because they seem useful.

## 6. Testing and acceptance requirements

For each finding, derive tests from its own verification criteria and root cause. Where relevant, cover:

- the expected successful behavior;
- the original failure/regression case;
- boundary and unauthorized cases;
- empty, unknown, unavailable, and measured-zero states;
- tenant isolation and cross-tenant access;
- retry, idempotency, concurrency, and partial failure;
- schema/migration compatibility and read-after-write persistence;
- LIVE/MOCK/HYBRID provenance;
- observability and auditable outcomes.

Use mocks for unit tests where appropriate, but do not use mocked tests as a substitute for required database, provider, or workflow integration tests. A required suite that discovers zero tests, silently skips, or is not invoked by CI must not be reported as passing.

## 7. Parallel work rules

Parallelize only when tasks have independent file boundaries and no shared schema, migration, authorization, runtime, workflow, or configuration contract. Before parallel work:

- list exact files owned by each task;
- identify shared dependencies and interfaces;
- designate one integration owner;
- prohibit concurrent edits to the same file or contract;
- integrate and run the combined regression suite before declaring completion.

If safe parallel boundaries cannot be established, work sequentially.

## 8. Progress tracking — mandatory

After every meaningful action, update [REMEDIATION_PROGRESS.md](./REMEDIATION_PROGRESS.md) in the same working branch.

- Update the Finding Ledger status for every affected ID.
- Append an immutable dated Execution Log entry; do not erase earlier history.
- Record exact base/head commit SHAs and changed paths.
- Record commands actually executed, pass/fail/skip counts, CI references, and artifacts.
- List open blockers, risks, and decisions.
- Keep wave status separate from individual finding status.
- Do not mark a wave complete until all in-scope findings meet their acceptance criteria and the wave exit condition is evidenced.
- If work stops mid-task, leave the tracker in a precise resumable state: last completed step, current branch/commit, files changed, tests run, and next safe action.

## 9. Communication and stop conditions

At each checkpoint, provide a concise report containing:

1. Finding IDs addressed and current statuses.
2. Root cause confirmed or disproven.
3. Files changed (or "none").
4. Tests and exact observed outcomes.
5. Commit/PR references, if any.
6. Remaining risks, blockers, and next dependency.
7. Whether user approval is needed before continuing.

Stop and ask the user when:
- a product, security, privacy, billing, or data-retention decision is unresolved;
- the proposed fix conflicts with the approved architecture;
- the finding is no longer valid or has already been addressed elsewhere;
- a migration could be destructive or data-loss prone;
- a change would exceed the approved scope;
- an external side effect, production action, PR merge/close, or deployment is required;
- two authoritative documents disagree.

## 10. Definition of done

A finding is **Verified complete** only when:

- its root cause was confirmed against the target commit;
- the approved change is present in a recorded commit;
- its individual acceptance criteria pass;
- required focused, regression, integration, and security tests were executed;
- relevant CI checks pass without hidden required skips;
- the diff was reviewed for unintended changes;
- no unresolved blocker is concealed;
- the progress tracker contains exact evidence and the final status.

A wave is complete only when every in-scope finding is verified complete or has an explicitly approved disposition, all wave exit conditions are met, and the user receives a clear summary.

**Do not start implementation simply because this prompt exists. Explicit user approval, task-specific revalidation, directly relevant dependencies, and the safeguards in `WAVE0_POLICY_SUPERSESSION.md` are mandatory. Completion of the project-wide Wave 0 inventory is not a prerequisite.**

## GitHub lifecycle evidence and automated status transitions

- For discoverability, put finding IDs in the branch name or PR title, but treat those matches as candidate hints only. Use an explicit line beginning with `Finding-IDs:` for additional authoritative IDs. Every authoritative ID must have its exact canonical finding-record path among the changed files; otherwise fail the whole event closed. Incidental title/branch tokens such as `SHA-256` must not block valid canonical file associations. Do not infer a relationship between unrelated changed files and a finding.
- The Remediation Event Recorder retains relevant PR lifecycle events and exact post-merge CI outcomes in monthly append-only JSONL files. Pre-merge and unrelated CI completions are no-ops and do not create commits on main.
- A successful CI run on a feature branch is pre-merge evidence only. It must never be described as Verified complete.
- A merged PR is Integrated — verification pending only when every authoritative finding ID has exactly one canonical finding file, that exact path is included in the PR changed files, and exactly one matching ledger row exists. Explicit but missing, duplicate, incomplete, or mixed mappings fail closed for the whole event.
- Merged PR closure events and exact post-merge CI events carrying at least one authoritative finding ID must still be retained in JSONL when mapping is missing or ambiguous; those events are evidence-only and must not change any disposition. Events with no finding-ID reference are no-ops, and candidate-only hints must resolve to exactly one canonical finding file. Only CI succeeding on main for the exact merge commit may advance an eligible finding to Verified complete. Verified Finding and Ledger statuses are immutable against delayed events; existing evidence links are preserved. When a non-verified finding advances to Verified complete, refresh the verified-commit column to the exact merge SHA in the same ledger update. If the finding is already main-verified, preserve its original status details and verified SHA.
- A closed PR that was not merged is retained as JSONL evidence only when at least one candidate ID resolves to exactly one existing canonical finding file; unrelated or ambiguous candidate-only closures are no-ops. Merged PR closure events and exact post-merge CI events carrying authoritative finding IDs are retained as JSONL evidence even when mapping is missing or ambiguous, but must not change any Ledger or Finding disposition in that case. Candidate-only hints are retained only when they resolve to exactly one canonical finding file. A failed post-merge CI run is Integrated — verification failed. Cancelled, skipped, and neutral post-merge runs are evidence-only and do not change the disposition. Neither failure nor evidence-only states are resolved.
- Concurrent updates use bounded non-force retries. API and branch-protection failures stop safely; the recorder never bypasses repository protections.
- Do not manually overwrite or remove automated event history. Correct an erroneous event with a new dated correction record; preserve prior evidence.
- The recorder does not authorize implementation, approve a finding, complete a remediation wave, merge a PR, or change database/product state.
