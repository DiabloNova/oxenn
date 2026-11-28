import { describe, expect, it } from "vitest";
import {
  assertLocalLifecycleAuditUrl,
  findExpiryIndexCoverage,
  summarizeLifecycleInventory,
  type LifecycleIndexMetric,
  type LifecycleTableMetric,
  type LifecycleTemporalColumn,
} from "../../../../scripts/database/data-lifecycle-metrics";

describe("database lifecycle audit safety", () => {
  const localUrl = "postgresql://postgres:postgres@localhost:5432/isolation_test_db";

  it("accepts only the explicit local isolation database target", () => {
    expect(assertLocalLifecycleAuditUrl(localUrl).hostname).toBe("localhost");
    expect(() =>
      assertLocalLifecycleAuditUrl(
        "postgresql://postgres:secret@remote.example:5432/isolation_test_db"
      )
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(localUrl + "?host=remote.example&port=5433")
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(
        "postgresql://postgres:postgres@localhost:5432/production"
      )
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(localUrl, { PGHOST: "remote.example" })
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(localUrl, { PGPORT: "5433" })
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(localUrl, { PGDATABASE: "production" })
    ).toThrow("Refusing lifecycle audit outside");
    expect(() =>
      assertLocalLifecycleAuditUrl(localUrl, { PGSERVICE: "production" })
    ).toThrow("Refusing lifecycle audit outside");
  });

  it("summarizes table and index footprint without mutating source rows", () => {
    const tables: LifecycleTableMetric[] = [
      {
        schema_name: "public",
        table_name: "crawl_jobs",
        estimated_rows: "10",
        live_rows: "9",
        dead_rows: "1",
        table_bytes: "100",
        index_bytes: "50",
        total_bytes: "150",
        rls_enabled: true,
        force_rls: true,
        last_vacuum: null,
        last_autovacuum: null,
        last_analyze: null,
        last_autoanalyze: null,
      },
      {
        schema_name: "public",
        table_name: "crawl_cache",
        estimated_rows: "20",
        live_rows: "18",
        dead_rows: "2",
        table_bytes: "200",
        index_bytes: "80",
        total_bytes: "280",
        rls_enabled: false,
        force_rls: false,
        last_vacuum: null,
        last_autovacuum: null,
        last_analyze: null,
        last_autoanalyze: null,
      },
    ];

    expect(summarizeLifecycleInventory(tables)).toEqual({
      tableCount: 2,
      estimatedRows: 30,
      liveRows: 27,
      deadRows: 3,
      tableBytes: 300,
      indexBytes: 130,
      totalBytes: 430,
    });
    expect(tables[0].estimated_rows).toBe("10");
  });

  it("reports whether an explicit expires_at column has index coverage", () => {
    const columns: LifecycleTemporalColumn[] = [
      {
        table_schema: "public",
        table_name: "crawl_cache",
        column_name: "expires_at",
        data_type: "timestamp with time zone",
        is_nullable: "NO",
      },
      {
        table_schema: "public",
        table_name: "crawl_jobs",
        column_name: "lease_expires_at",
        data_type: "timestamp with time zone",
        is_nullable: "YES",
      },
    ];
    const indexes: LifecycleIndexMetric[] = [
      {
        schema_name: "public",
        table_name: "crawl_cache",
        index_name: "idx_crawl_cache_key",
        index_definition: "CREATE INDEX idx_crawl_cache_key ON public.crawl_cache USING btree (cache_key) WHERE expires_at > now()",
        index_columns: ["cache_key"],
        index_scans: "12",
        tuples_read: "12",
        tuples_fetched: "12",
        index_bytes: "4096",
      },
    ];

    expect(findExpiryIndexCoverage(columns, indexes)).toEqual([
      {
        schema: "public",
        table: "crawl_cache",
        column: "expires_at",
        indexed: false,
        indexNames: [],
      },
    ]);
    expect(
      findExpiryIndexCoverage(columns, [
        ...indexes,
        {
          schema_name: "public",
          table_name: "crawl_cache",
          index_name: "idx_crawl_cache_expires",
          index_definition: "CREATE INDEX idx_crawl_cache_expires ON public.crawl_cache USING btree (expires_at)",
          index_columns: ['"expires_at" DESC'],
          index_scans: "0",
          tuples_read: "0",
          tuples_fetched: "0",
          index_bytes: "4096",
        },
      ])[0].indexed
    ).toBe(true);
  });
});
