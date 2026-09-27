import { QueryResult, QueryResultRow } from "pg";

/**
 * Mock Pool Client for offline tsx testing contexts
 */
export class MockPoolClient {
  public async query(sql: string, params: unknown[] = []): Promise<QueryResult<QueryResultRow>> {
    console.debug(`[Postgres Transacted SQL] Executing Parameterised Query: "${sql}" with values: [${params.join(", ")}]`);
    return {
      rows: [] as QueryResultRow[],
      command: "BEGIN",
      rowCount: 0,
      oid: 0,
      fields: []
    };
  }
  public release(): void {}
}
