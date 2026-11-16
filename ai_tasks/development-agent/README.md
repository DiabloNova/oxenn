# Oxenn Development Agent

**Status:** READ-ONLY V1 RUNTIME IMPLEMENTED; this document governs preparation and future capability gates.
**Prepared:** 2026-11-16
**Repository:** `DiabloNova/oxenn`

## Purpose

Define a low-cost, resumable, evidence-driven engineering agent that can help execute the approved Oxenn development roadmap and separately authorized repository-remediation tasks.

This agent is an engineering tool for developing Oxenn. It is **not** the customer-facing AI agent that will run inside the Oxenn product.

## Current preparation baseline

- Preparation branch: `agents/oxenn-dev-agent-foundation-20261116`
- Preparation base: `main@b56517bc436a8cd03ef75bfac8adbf43c8567753`
- Existing planning branch: `MVP_00@a76a45a739c4a87fa477f520184cd8dbbdccd517`
- At the baseline comparison, `MVP_00` was 6 commits ahead and 26 commits behind `main`.
- The three existing MVP-00 execution documents were copied verbatim into this branch. The original `MVP_00` branch and `main` were not changed.
- MVP-00 WP-00 is recorded as complete in its baseline document. WP-01 remains PARTIAL; its owner-approved planning directions do not close the remaining owner, evidence, legal, privacy, provider, or operational decisions.

The copied documents are historical records and remain unchanged. Their branch metadata is not rewritten to pretend that the original branch was merged.

## Documents

- [Development Agent specification](./DEVELOPMENT_AGENT_SPEC.md)
- [Execution and safety policy](./EXECUTION_POLICY.md)

## Non-goals for this preparation stage

- No changes to Oxenn product runtime, database schema, migrations, provider configuration, secrets, deployment, or production data.
- No LangChain/LangGraph dependency added to the application.
- No automatic PR merge or release.
- No automatic resolution of open MVP-00 owner decisions.
- No assumption that a free cloud service provides unlimited model inference or persistent execution.

## Next implementation gate

The read-only repository-inspection and plan-generation prototype is implemented in `tools/development-agent/`. Before adding repository write access, command execution, local/hosted model use, GitHub writes or PR preparation, the owner must approve a separate implementation plan identifying the exact capability, permissions, data-handling policy, tool allowlist, cost ceiling and acceptance checks. Those later capabilities remain disabled in v1.
