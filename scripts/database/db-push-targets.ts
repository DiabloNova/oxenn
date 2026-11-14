/**
 * Reviewed identities that may be used by the Workspace db:push convenience command.
 *
 * This list is intentionally empty: this repository currently has no provisioned
 * disposable Workspace database connected to it. Do not add an entry merely to
 * make db:push work. Add one only after the database has been provisioned outside
 * this repository with:
 * - a dedicated login role that is not the database owner or a member of it;
 * - no SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, or BYPASSRLS attributes;
 * - no production credentials or network route available to that role;
 * - a database comment set by the separate database-owner/provisioning identity;
 * - an exact hostname/database/role identity and verified TLS for remote hosts.
 *
 * The push role should receive only the schema/object permissions needed to manage
 * the disposable Workspace schema. It must not receive credentials for either the
 * Workspace runtime/migration database or the independent Platform Admin database.
 */
export interface DisposableDbPushTarget {
  readonly id: string;
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly databaseOwner: string;
  readonly databaseComment: string;
  readonly expectedExtensions: readonly string[];
}

export const APPROVED_DISPOSABLE_DB_PUSH_TARGETS: readonly DisposableDbPushTarget[] = [];
