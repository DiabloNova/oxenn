/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly requestId: string | null;
  readonly executionMode: "tenant" | "system";
  readonly dbClient?: any;
  readonly transactionDepth?: number;
  readonly purpose?: string;
  readonly pendingAudits?: Array<{ status: "success" | "error"; details?: string; nestedPurpose: PrivilegedPurposeTag }>;
}

export class TenantContextViolationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantContextViolationException";
  }
}

import { PRIVILEGED_PATHS_REGISTRY, type PrivilegedPurposeTag } from "../privileged-paths";
import { TENANT_SCOPED_TABLES } from "../tenant-tables.generated";
export { TENANT_SCOPED_TABLES, type TenantScopedTable } from "../tenant-tables.generated";

/**
 * Strips comments and string literals from SQL using single-pass tokenization
 * to avoid false positive table matches and prevent string literals containing '--' or block comments
 * from consuming subsequent valid SQL.
 */
function cleanSql(sql: string): string {
  if (!sql) return "";
  return sql.replace(
    /'(?:''|[^'])*'|\$([a-zA-Z0-9_]*)\$[\s\S]*?\$\1\$|\/\*[\s\S]*?\*\/|--[^\n]*/g,
    " "
  );
}

/**
 * Checks if a given SQL query targets any of the tenant-scoped tables.
 */
export function isQueryTenantScoped(sql: string): boolean {
  if (!sql) return false;
  const cleaned = cleanSql(sql);
  for (const table of TENANT_SCOPED_TABLES) {
    const regex = new RegExp(`(?<![a-zA-Z0-9_])${table}(?![a-zA-Z0-9_])`, "i");
    if (regex.test(cleaned)) {
      return true;
    }
  }
  return false;
}

export class TenantContextManager {
  private static storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Retrieves the current active TenantContext.
   */
  public static getContext(): TenantContext | null {
    return this.storage.getStore() || null;
  }

  /**
   * Returns the current active tenant ID, throwing an exception if not in tenant mode or if missing.
   */
  public static getRequiredTenantId(): string {
    const ctx = this.getContext();
    if (!ctx) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: No active tenant context found for tenant-scoped query."
      );
    }
    if (ctx.executionMode !== "tenant") {
      throw new TenantContextViolationException(
        `Tenant Context Violation: Cannot query tenant-scoped table under ${ctx.executionMode} execution mode.`
      );
    }
    if (!ctx.tenantId) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: Tenant ID is null or undefined in active context."
      );
    }
    return ctx.tenantId;
  }

  /**
   * Checks if we are currently running in System Context.
   */
  public static isSystemMode(): boolean {
    const ctx = this.getContext();
    return ctx !== null && ctx.executionMode === "system";
  }

  /**
   * Run a block of code under an explicit System Context.
   * Never default to system mode; it must be explicitly created.
   */
  public static async runWithSystemContext<T>(
    userId: string | null,
    purpose: PrivilegedPurposeTag,
    work: () => Promise<T>
  ): Promise<T> {
    if (!Object.hasOwn(PRIVILEGED_PATHS_REGISTRY, purpose)) {
      throw new TenantContextViolationException(
        `System Context Violation: Unregistered purpose tag "${purpose}".`
      );
    }

    const TEST_ONLY_TAGS = new Set<string>(["sys-admin-run", "test-req"]);
    // Allow 'sys-admin-run' and 'test-req' only if NODE_ENV is 'test' or in verification probes.
    // Fall back to strictly blocking them in production otherwise.
    if (TEST_ONLY_TAGS.has(purpose) && process.env.NODE_ENV !== "test" && process.env.VERIFICATION_PROBE_ACTIVE !== "1") {
      throw new TenantContextViolationException(
        `System Context Violation: test-only purpose tag "${purpose}" used outside tests.`
      );
    }

    const pathInfo = PRIVILEGED_PATHS_REGISTRY[purpose];

    console.log(`[SystemContext] Leasing client for purpose: ${purpose}`);

    const parentCtx = this.getContext();

    const doAuditLog = (client: any, status: "success" | "error", nestedPurpose: PrivilegedPurposeTag, details?: string) => {
      // Fire and forget autocommit insert. Must run outside the main transaction (or post commit/rollback)
      const pInfo = PRIVILEGED_PATHS_REGISTRY[nestedPurpose];
      client.query(
        `INSERT INTO audit_records (
          id, actor_id, actor_email, actor_role, action, resource_type, resource_id, status, error_details, ip_address, user_agent
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )`,
        [
          userId || "system", // actor_id
          "system@oxenn.local", // actor_email
          "system", // actor_role
          nestedPurpose, // action
          "privileged_db_access", // resource_type
          pInfo.allowedTables.join(","), // resource_id
          status, // status
          details || null, // error_details
          "0.0.0.0", // ip_address
          "system-context" // user_agent
        ]
      ).catch((err: any) => {
        console.error(`[TenantContextManager] Failed to emit ${status} audit log for ${nestedPurpose}:`, err);
      });
    };

    // Check if there is already an active transaction in the current async scope for system mode
    if (parentCtx && parentCtx.dbClient && parentCtx.executionMode === "system") {
      const depth = (parentCtx.transactionDepth || 1) + 1;
      const nestedCtx = Object.freeze({
        ...parentCtx,
        transactionDepth: depth,
        purpose,
        pendingAudits: parentCtx.pendingAudits || []
      });

      try {
        const result = await this.storage.run(nestedCtx, work);
        if (nestedCtx.pendingAudits) {
           nestedCtx.pendingAudits.push({ status: "success", nestedPurpose: purpose });
        }
        return result;
      } catch (err) {
        if (nestedCtx.pendingAudits) {
           nestedCtx.pendingAudits.push({ status: "error", details: err instanceof Error ? err.message : String(err), nestedPurpose: purpose });
        }
        throw err;
      }
    }

    let leasedClient: any = null;
    let transactedCtx: TenantContext | null = null;

    // Dynamically import PostgresClient to avoid circular dependencies
    const { PostgresClient } = await import("../../../features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClient.getInstance();

    // Lease a system/privileged client
    leasedClient = await pgClient.connectSystemClient(purpose);

    try {
      await leasedClient.query("BEGIN");

      transactedCtx = Object.freeze({
        tenantId: null,
        userId,
        requestId: null,
        executionMode: "system",
        dbClient: leasedClient,
        transactionDepth: 1,
        purpose,
        pendingAudits: []
      });

      const result = await this.storage.run(transactedCtx, work);

      await leasedClient.query("COMMIT");
      doAuditLog(leasedClient, "success", purpose);

      if (transactedCtx.pendingAudits) {
         for (const audit of transactedCtx.pendingAudits) {
             doAuditLog(leasedClient, audit.status, audit.nestedPurpose, audit.details);
         }
      }
      return result;
    } catch (err) {
      if (leasedClient) {
        try {
          await leasedClient.query("ROLLBACK");
        } catch (rollbackErr) {
          console.error("[TenantContextManager] ROLLBACK error:", rollbackErr);
        }
        doAuditLog(leasedClient, "error", purpose, err instanceof Error ? err.message : String(err));

        if (transactedCtx && transactedCtx.pendingAudits) {
           for (const audit of transactedCtx.pendingAudits) {
               doAuditLog(leasedClient, audit.status, audit.nestedPurpose, audit.details);
           }
        }
      }
      throw err;
    } finally {
      if (leasedClient && typeof leasedClient.release === "function") {
        leasedClient.release();
      }
    }
  }

  /**
   * Execute tenant-scoped database work within a secure PostgreSQL transaction.
   * Guarantees:
   * BEGIN
   * SET LOCAL app.current_tenant_id = <tenantId>
   * Execute queries
   * COMMIT / ROLLBACK
   */
  public static async runWithTenantContext<T>(
    tenantId: string,
    userId: string | null,
    requestId: string | null,
    work: () => Promise<T>,
    options?: { requireNewSavepoint?: boolean }
  ): Promise<T> {
    if (!tenantId) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: Cannot establish tenant context with empty tenant ID."
      );
    }

    const parentCtx = this.getContext();

    // Check if there is already an active transaction in the current async scope
    if (parentCtx && parentCtx.dbClient && parentCtx.tenantId === tenantId) {
      // Re-use transaction (prefer transaction reuse over nested savepoints by default)
      const depth = (parentCtx.transactionDepth || 1) + 1;
      const nestedCtx = Object.freeze({
        ...parentCtx,
        transactionDepth: depth
      });

      if (options?.requireNewSavepoint) {
        // If independent rollback is explicitly required, use a PostgreSQL SAVEPOINT
        const savepointName =
  `sp_${depth}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const client = parentCtx.dbClient;
        await client.query(`SAVEPOINT ${savepointName}`);
        try {
          const res = await this.storage.run(nestedCtx, work);
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          return res;
        } catch (err) {
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          throw err;
        }
      } else {
        // Otherwise, simply run the work inside the reused transaction
        return this.storage.run(nestedCtx, work);
      }
    }

    let leasedClient: any = null;

    // Dynamically import PostgresClient to avoid circular dependencies
    const { PostgresClient } = await import("../../../features/admin/infrastructure/persistence/postgres");
    const pgClient = PostgresClient.getInstance();

    // We do not catch the connectClient error here; it should propagate up as DatabaseUnavailableError.
    leasedClient = await pgClient.connectClient();

    // Execute the transaction lifecycle
    try {
      await leasedClient.query("BEGIN");
      await leasedClient.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId]
      );

      const transactedCtx: TenantContext = Object.freeze({
        tenantId,
        userId,
        requestId,
        executionMode: "tenant",
        dbClient: leasedClient,
        transactionDepth: 1
      });

      const result = await this.storage.run(transactedCtx, work);

      await leasedClient.query("COMMIT");
      return result;
    } catch (err) {
      if (leasedClient) {
        try {
          await leasedClient.query("ROLLBACK");
        } catch (rollbackErr) {
          console.error("[TenantContextManager] ROLLBACK error:", rollbackErr);
        }
      }
      throw err;
    } finally {
      if (leasedClient && typeof leasedClient.release === "function") {
        leasedClient.release();
      }
    }
  }

  /**
   * Retrieves the current database client if we are inside a tenant transaction context.
   */
  public static getDbClient(): any | null {
    const ctx = this.getContext();
    if (ctx && ctx.dbClient) {
      return ctx.dbClient;
    }
    return null;
  }
}
