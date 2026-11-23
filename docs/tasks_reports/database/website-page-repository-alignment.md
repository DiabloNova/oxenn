# Website and Page Repository Alignment — Stage 3

Branch: feat/stage-3-domain-model-foundation-2026-11-23

## Changes
- Website and Page reads use PostgreSQL rows, not process-local Maps after discarding the query result.
- Website upsert targets the actual partial unique index on organization_id + domain when deleted_at IS NULL and returns the persisted row.
- Page SQL now uses canonical http_status, meta_description, canonical_url, robots_directives and the other declared pages columns. It no longer references non-existent status_code, indexability or description columns.
- Page reads join Website on both id and organization_id. Page insertion selects only a live Website owned by the same Workspace.
- Page upsert cannot move a normalized URL to another Website within the same Workspace.
- Soft delete now returns the actual database result, updates timestamps and increments version.
- The Page domain shape exposes canonical persisted crawl metadata while keeping statusCode and description compatibility aliases.

## Indexability evidence boundary
The canonical pages table has no standalone indexability column. Values are derived from persisted evidence: non-2xx HTTP status -> non_200_status; explicit noindex/none robots meta directive -> noindex; a differing canonical URL -> canonical_mismatch; otherwise -> undetermined. The table does not persist robots.txt allow/deny decisions, so blocked_by_robots cannot be represented faithfully and is rejected on save.

## Validation
- Static comparison with canonical Drizzle schema and relevant callers: PASS.
- Focused regression tests added in tests/unit/features/ai-intelligence/repositories.test.ts: NOT RUN locally.
- The first Vercel preview build for commit 83df6e69 failed TypeScript TS2345 because the validation helper accepted string | undefined while the caller passed string | null. The helper signature is corrected in this follow-up commit; the replacement preview result is pending.
- Lint and the full unit-test suite have not been run in this session; no local repository checkout/terminal or connected Super runner was available.
- No database, schema, migration, snapshot or journal modified. No branch or PR created.

## Remaining Stage 3 gate
The application layer now checks same-Workspace Website/Page relationships, but direct SQL writers are not yet protected: the active schema has a single-column pages.website_id -> websites.id foreign key and does not enforce pages.organization_id = websites.organization_id. The composite database invariant requires a separately authorized, generated Drizzle migration, a clean preflight of existing data and positive/negative disposable PostgreSQL isolation tests. It is not claimed implemented here.

The PageRepository keyword/topic/entity association helpers remain outside this repair and still require independent domain/persistence reconciliation.
