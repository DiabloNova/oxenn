# DOC-008 — Platform Admin Boundary (Stage 1) Report

**Status:** COMPLETE — Stage 1 implementation only. The later identity-provider and persistence integration stage has not started and requires separate user approval.

## Objective and invariant

Establish a server-only Platform Admin authorization boundary that denies by default and cannot derive Platform Admin authority from Workspace sessions, Workspace roles, or caller-supplied actor fields.

## Implementation

Created src/features/admin/security/platform-admin.server.ts.

- Marks the module server-only and does not export it through the general admin barrel.
- Defines a narrow provider contract for a future trusted server-side identity integration.
- Requires the trusted provider to verify credentials/session, issuer, audience, expiry/revocation, and authoritative Platform Admin grants before returning a verified identity.
- Returns no principal when no provider is configured, the provider fails, the identity is inactive or malformed, or its permission list contains unknown values.
- Creates an opaque, immutable principal only after validation.
- Checks exact permission grants. It does not infer permissions from role names, numeric rank, or wildcard grants.
- Does not accept actorRole, actorId, Workspace session data, or request-body permissions as identity inputs.

Created tests/unit/features/admin/platform-admin-security.test.ts with 11 cases covering default denial, Workspace/caller-role spoofing, inactive and malformed identities, provider failure, explicit grants, role-name non-inheritance, wildcard rejection, and immutability.

## Verification

- **PASS** — targeted Vitest execution: 11 tests passed in an isolated minimal test harness.
- **PASS** — strict TypeScript check of the new module, its domain type dependency, and the new test in that harness.
- **PASS** — GitHub CI job Unit Tests, including repository unit and UI tests.
- **PASS** — GitHub CI job Isolation Suite.
- **PASS** — GitHub CI Typecheck, Lint, Build, dependency audit gate, audit-gate regression tests, schema/RLS checks, and documentation consistency checks.
- **FAIL (unrelated generated-file drift)** — CI step Verify generated tracked files (no drift). Its diff is in src/lib/docsIndex.ts: generated security-document titles/snippets are stale relative to the three DOC-008 documentation files already present on the Stage 1 base commit. The generated diff reflects those prior documentation changes; it does not include either new file from this implementation. This is outside the current authorization and was not changed.
- **NOT RUN** — full local repository test/typecheck commands in the remote shell. Installing all 778 repository packages was killed by the constrained shell environment. The repository's own GitHub CI supplied the full unit, isolation, typecheck, lint, and build evidence listed above.

CI run: https://github.com/DiabloNova/oxenn/actions/runs/42760215662

## Files changed

- Created src/features/admin/security/platform-admin.server.ts.
- Created tests/unit/features/admin/platform-admin-security.test.ts.
- Created this report.

No files were deleted. No existing source, DOC-007 paths, Stage 1 security documents, main, CI configuration, environment, secrets, deployment, database, schema, or migration were modified.

## Git state

- Branch: fix/022-doc-008-platform-admin-boundary.
- Implementation commit: 0b0a9b94c7a4e9c53f357a3deb226cae021d8c2c.
- The implementation commit is one commit ahead of the Stage 1 base 10a80f5cc96dca1b52c071b709bf6c7a4f12ccdf.
- The working clone was clean immediately after checkout of the implementation commit; subsequent verification used a separate temporary test harness.
- Pull request #127 was already associated with this branch before the implementation commit (created at 2026-11-10T04:54:09Z). This task did not create or modify that PR.

## Remaining limitations

- No independent identity provider is implemented or configured. Until a trusted provider is wired by a separately approved phase, the boundary denies access.
- No Platform Admin production route is added or wired to this boundary.
- No canonical Platform Admin persistence or role-assignment storage is implemented.
- Issuer/audience/credential verification and authoritative grant resolution remain the responsibility of the future trusted provider; the current module does not pretend to perform those operations itself.
- The generated src/lib/docsIndex.ts drift remains unresolved because fixing it would expand this phase into the prior documentation workstream.

## Scope decision

Stage 1 is complete. Stop here. Do not implement an identity provider, persistence, migrations, API routes, or any Stage 2 integration until the user reviews this report and explicitly approves the next phase.
