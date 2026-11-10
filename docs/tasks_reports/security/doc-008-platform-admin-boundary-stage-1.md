# DOC-008 — Platform Admin Boundary (Stage 1) Report

**Status:** COMPLETE — Stage 1 implementation only. The later identity-provider and persistence integration stage has not started and requires separate user approval.

## Objective and invariant

Establish a server-only Platform Admin authorization boundary that denies by default and cannot derive Platform Admin authority from Workspace sessions, Workspace roles, or caller-supplied actor fields.

## Implementation

Created src/features/admin/security/platform-admin.server.ts.

- Marks the authorization module server-only and does not export it through the general admin barrel.
- Defines the provider contract and trusted composition root in src/features/admin/security/platform-admin-identity-provider.server.ts.
- Removes provider parameters from the exported resolver and guard methods. A caller cannot supply or replace the identity provider.
- Keeps the Stage 1 composition root unconfigured; it returns null until a real trusted adapter is implemented in separately approved Stage 2.
- Requires any future trusted provider to verify credentials/session, issuer, audience, expiry/revocation, and authoritative Platform Admin grants before returning a verified identity.
- Returns no principal when no provider is configured, the provider fails, the identity is inactive or malformed, or its permission list contains unknown values.
- Creates an opaque, immutable principal only after validation.
- Checks exact permission grants. It does not infer permissions from role names, numeric rank, or wildcard grants.
- Does not accept actorRole, actorId, Workspace session data, or request-body permissions as identity inputs.

Updated tests/unit/features/admin/platform-admin-security.test.ts with 13 cases covering the unconfigured composition root, default denial, caller-provider injection attempts, Workspace/caller-role spoofing, inactive and malformed identities, provider failure, explicit grants, role-name non-inheritance, wildcard rejection, and immutability.

## Verification

- **PENDING** — GitHub CI for the provider-injection hardening revision. The first run passed Typecheck, Lint, Build, generated-file verification, and Isolation Suite, but one new Unit Test failed because the test invoked a static guard method without preserving its class receiver. The test now binds the class receiver; a fresh run is required.
- **NOT RUN** — full local repository test/typecheck commands in the remote shell. Installing all 778 repository packages was killed by the constrained shell environment in the earlier verification attempt. The final revision must be validated by GitHub CI before merge.

## Files changed

- Created src/features/admin/security/platform-admin.server.ts.
- Created src/features/admin/security/platform-admin-identity-provider.server.ts.
- Created tests/unit/features/admin/platform-admin-security.test.ts.
- Updated this report.

The generated docs index currently contains the report's unchanged public title and first 500-character snippet. The report correction preserves that generated snippet, so src/lib/docsIndex.ts does not require a new generated change. The official generator's output must still be checked by CI for drift.

No files were deleted. No DOC-007 paths, Stage 1 security documents, main, CI configuration, environment, secrets, deployment, database, schema, or migration were modified.

## Git state

- Branch: fix/022-doc-008-platform-admin-boundary.
- Pull request: #127, targeting main.
- Initial implementation commit: 0b0a9b94c7a4e9c53f357a3deb226cae021d8c2c.
- Initial report commit: c5bffadc0a0ecd98ae4587008b24dbf790544d2c.
- Main synchronization commit in the branch: b10ebea96689cef9d2a5f3e44ccf319334d6ed3b.
- Generated docs index commit: d4e1aecb5f6d296488ef117cfc35eb01c5b1c4e7.
- Provider-boundary hardening commit: 2918aebdd375079ba27fab5a02e73970b9843372.
- The repository main branch had advanced to 247b27a39607c1b71d7b29ef4249f9a7e1b7bd1e with a GitHub lifecycle-evidence commit; the PR remained mergeable.

## Remaining limitations

- No independent identity provider is implemented or configured. Until Stage 2 supplies a trusted adapter, the composition root returns null and all Platform Admin authorization attempts are denied.
- No Platform Admin production route is added or wired to this boundary.
- No canonical Platform Admin persistence or role-assignment storage is implemented.
- Issuer/audience/credential verification and authoritative grant resolution remain the responsibility of the future trusted provider; the current module does not pretend to perform those operations itself.

## Scope decision

Stage 1 establishes the trusted provider boundary only. Stop here. Do not implement an identity provider, persistence, migrations, API routes, or any Stage 2 integration until the user separately approves Stage 2.
