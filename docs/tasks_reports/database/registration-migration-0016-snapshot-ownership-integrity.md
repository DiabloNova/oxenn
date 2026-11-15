# Registration Migration 0016: Snapshot and Ownership Integrity

## Scope

Audited only the Workspace migration journal, Drizzle snapshot lineage, migration 0016, the user_profiles schema declaration, and the canonical table-ownership registry on the registration-verification branch.

## Findings

- The current database/drizzle/meta/_journal.json parses as valid JSON. Its 17 entries have sequential indexes 0 through 16, and every journal tag has a corresponding SQL migration file.
- The current 0016_snapshot.json exists, uses the journal's Drizzle version and PostgreSQL dialect, and its prevId matches the id in 0015_snapshot.json.
- The 0016 snapshot contains the user_profiles table with user_id, username, created_at, updated_at, the user_id-to-users.id cascading foreign key, and the unique lower(username) index. These match database/schema/user-profile.ts and 0016_add_user_profiles.sql.
- The existing ownership registry already has a current USER_OWNED entry for user_profiles with schema and snapshot evidence. The ownership test already includes the standalone user-profile schema source and expects 71 Workspace tables.
- The absent 0005_snapshot.json is intentional. Migration 0005 is the custom SQL RLS migration; the next generated Drizzle snapshot (0006) has prevId equal to the id of snapshot 0004. Snapshot files therefore track generated schema states, not every SQL journal entry.

## Changes

- Preserved the valid migration journal, existing migration SQL, and existing snapshots. No schema or migration was regenerated, rewritten, reordered, or applied.
- Strengthened the ownership-registry unit test to verify journal index and SQL-file consistency, the latest generated snapshot's version/dialect and prevId lineage, the user_profiles snapshot entry, and its explicit USER_OWNED ownership metadata.
- Corrected the ownership inventory documentation to 71 Workspace tables and the current scope totals, and documented the intentional 0005 snapshot gap.

## Verification and boundaries

- Completed source-level JSON, journal-to-SQL, snapshot-lineage, snapshot/schema, and ownership-registry checks against the current branch contents.
- No live database connection, migration execution, database push, or production state change was performed.
- The strengthened unit test must pass in the PR's CI run before this change is considered fully validated.
