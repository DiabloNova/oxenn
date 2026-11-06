# Oxenn Baseline Preparation Workspace

This workspace contains the staged repository-baseline audit and its resulting execution plans.

## Work areas

- [`baseline issues/`](./baseline%20issues/) — evidence-backed findings discovered during the repository audit. Each validated finding will have its own Markdown record with affected files, root cause, recommended remediation, dependencies, and parallelization assessment.
- [`roadmap/`](./roadmap/) — ordered implementation stages, authored against the verified post-baseline state and gated on completion of all accepted baseline findings.
- [`new_architecture/`](./new_architecture/) — architecture observations and proposed target-state decisions. No architecture change is authorized by documenting an observation.

## Audit sequence

The audit proceeds in explicit, user-approved phases. The initial phase is limited to the 19 root-level files. No nested repository folder is in scope until that phase is reported and approved.

Findings must distinguish confirmed defects from risks, assumptions, and items requiring later cross-checks. No application, database, deployment, or pull-request changes are authorized by this audit workspace.
