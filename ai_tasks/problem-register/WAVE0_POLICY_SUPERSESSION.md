# Wave 0 Policy Supersession

**Effective on this branch:** `policy/remove-wave0-gate`  
**Scope:** procedural Wave 0 sequencing requirements in the problem-register documentation.

## Decision

The mandatory project-wide Wave 0 gate is retired as a prerequisite for starting an otherwise authorized, narrowly scoped remediation task.

An agent working from this branch must not treat completion of all 97 revalidations, reconciliation of every historical PR/issue, or completion of the Wave 0 ledger as a universal prerequisite to begin an independently approved task. Work may proceed in a new task branch from current `main`, provided its exact scope, dependencies, and acceptance criteria are established.

## Superseded instructions

This decision supersedes statements that make completion of the entire Wave 0 mandatory before any remediation, including:

- `AI_REMEDIATION_AGENT_PROMPT.md`, section 3, the Wave 0 gate and its blanket stop-before-Wave-1 rule;
- `IMPLEMENTATION_SEQUENCE.md`, the heading and introductory requirement for “Mandatory Wave 0”;
- blanket statements in `README.md` and `REMEDIATION_PROGRESS.md` that no remediation may begin until the project-wide Wave 0 exit condition is met.

The old Wave 0 records and execution log remain historical evidence and must not be rewritten to imply that the historical checks were performed or that their previous results changed.

## Safeguards that remain in force

Retiring the project-wide gate does **not** authorize unsafe or destructive actions. The following controls remain independently mandatory for every relevant task:

1. Never use production databases for tests, experiments, or migrations. Positively verify a disposable database target before database mutation or destructive testing.
2. Do not execute the historical unsafe probes `verification/phase-0/probe-system-context.ts` or `verification/phase-0/run_rls_matrix.js`.
3. Protect credentials, database URLs, tokens, and API keys; never print or expose secrets.
4. Obtain explicit authorization before production operations, destructive actions, deployments, external-provider/payment side effects, PR merges/closes, or work outside the approved scope.
5. Revalidate the specific finding and relevant code against the exact current base commit before changing it. Do not infer that a finding remains valid from an old audit.
6. Preserve architecture, tenant isolation, authorization, provenance, test integrity, and data-safety invariants. Do not bypass repository protections or CI controls.
7. Respect dependencies that are directly relevant to the selected finding. This policy does not authorize skipping a prerequisite whose absence would make that specific change unsafe or incorrect.

## Execution rule

For each new task, record the current base SHA, create a dedicated branch, inspect the exact finding and affected call sites, implement only the approved scope, run relevant verification, and report actual outcomes. A task may proceed without completing unrelated Wave 0 inventory work; it may not proceed without the task-specific evidence and safeguards above.

This file changes the sequencing policy only. It does not mark any finding verified, approve a code change, authorize production access, or alter historical progress records.
