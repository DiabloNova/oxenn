# Remove Redundant API-Key Prefix Index

## Finding

The api_keys prefix column already has a uniqueness constraint, which PostgreSQL backs with a unique index. A separate non-unique index on the same prefix column duplicates that index for the same leading-column lookup pattern. This change removes only the redundant non-unique index and preserves the uniqueness guarantee.

## Implementation

- Removed the standalone prefix index declaration from the current Drizzle schema.
- Added migration 0013 to drop the redundant non-unique index.
- Added the next Drizzle snapshot and journal entry to record the schema change.
- Preserved the prefix uniqueness declaration and the api_keys_prefix_unique constraint.
- Left historical migrations unchanged; the cleanup is incremental.

## Verification and limitations

An earlier isolated candidate-generation run produced a DROP INDEX statement for the ordinary prefix index and did not propose dropping the uniqueness constraint. This is design evidence for the targeted diff, not a substitute for the CI result on this pull request.

No migration was applied and no database push was performed. Oxenn has no connected production database in this environment; verification is limited to repository and isolated schema-generation checks. CI for this pull request must pass before merge.

## Out of scope

This task does not alter RLS declarations or policies, the api_keys uniqueness constraint, runtime API behavior, or unrelated database schema objects.
