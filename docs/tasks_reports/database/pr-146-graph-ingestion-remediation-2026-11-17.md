# PR #146 — Graph provenance and ingestion remediation

## Scope

This report records the database/ingestion work performed after refreshing PR #146 from `main` at commit `46d0e80d34fb432457e9d89781acd88d9ad96ac3`.

## Changes

- Relationship provenance is now represented as the server-managed JSONB array `source_chunk_ids`. New graph upserts append the current source atomically in PostgreSQL, and an edge-scoped transaction advisory lock serializes concurrent upserts. Extraction output cannot supply or overwrite provenance fields.
- Document replacement locks matching relationship rows, removes only the replaced document's chunk IDs, preserves edges with remaining known sources, and deletes only fully-provenanced modern edges that have no remaining sources. Rows with unknown/no provenance are not swept up by a broad delete.
- Legacy `source_chunk_id` rows are converted to the array shape and marked `source_provenance_incomplete`. Because older upserts could already have overwritten earlier source IDs, the full historical provenance cannot be reconstructed safely; such legacy edges are retained rather than risking deletion of knowledge still supported by another document. These may require later re-ingestion or explicit reconciliation.
- The legacy brand-profile fallback now requires the matching `documentType`; supporting-file replacement also requires the supporting-document type.
- Supporting-file IDs use NFC normalization while preserving case and exact filename whitespace, so canonically equivalent names remain stable but case-distinct files do not collide.
- Client-supplied `documentId` metadata is ignored; IDs are derived by the ingestion service. Metadata validation reserves capacity for the longest server-generated ID.
- Ingestion now performs embedding, sentiment, and optional graph extraction before opening a database transaction. A provider failure during replacement stops further work and leaves the previous document untouched.
- Replacement and all resulting database writes execute in one short tenant-scoped transaction. Database failures are not treated as provider failures: they abort the transaction, and replacement reports rollback without claiming success. Graph extraction provider failures remain optional and are logged separately from database write failures.
- API, server-action, and crawler callers now pass trusted tenant identity to the service without wrapping remote provider calls in an outer database transaction.
- Added tests for case-sensitive/canonically equivalent filenames, server-owned IDs, provider-failure early stop, provenance retention, and actual tenant transaction rollback behavior.

## Migration and compatibility decision

No table migration was added. The existing `properties` JSONB column supports the multi-source representation, avoiding a new table/RLS migration in this PR. The `source_provenance_incomplete` marker is a deliberate safety measure for historical rows whose earlier supporting sources may already have been lost by the old single-value overwrite behavior.

## Validation

- `git diff --check` passed before publication.
- Added a transaction test that exercises the real `TenantContextManager` rollback path with a controlled database client.
- Updated integration harnesses to model `BEGIN`/`COMMIT`/`ROLLBACK` and leased client connections.
- Local Vitest/TypeScript execution was not available: the pinned dependency installation was terminated by the remote sandbox before the test binaries were installed. GitHub Actions on the updated PR branch is the required final test authority.

## Remaining considerations

- Provenance already overwritten before this fix is not recoverable from the current row alone. Such legacy edges are intentionally retained with an incomplete marker rather than destructively deleted.
- GitHub CI must be checked after the commit; any failures must be addressed before the PR is considered ready to merge.
