import { describe, it, expect } from "vitest";
import { isQueryTenantScoped } from "../../../src/core/database/tenant-context";

describe("isQueryTenantScoped Matcher Test Suite", () => {
  it("case 1: matches unquoted table name", () => {
    expect(isQueryTenantScoped("SELECT * FROM websites")).toBe(true);
  });

  it("case 2: matches double-quoted table name", () => {
    expect(isQueryTenantScoped('SELECT * FROM "websites"')).toBe(true);
  });

  it("case 3: matches schema-qualified table name", () => {
    expect(isQueryTenantScoped("SELECT * FROM public.websites")).toBe(true);
  });

  it("case 4: matches quoted schema-qualified table name", () => {
    expect(isQueryTenantScoped('SELECT * FROM "public"."websites"')).toBe(true);
  });

  it("case 5: matches table with alias without AS", () => {
    expect(isQueryTenantScoped("FROM websites w WHERE w.id = 1")).toBe(true);
  });

  it("case 6: matches JOIN table with AS alias", () => {
    expect(isQueryTenantScoped("SELECT * FROM foo JOIN crawl_jobs AS cj ON foo.id = cj.id")).toBe(true);
  });

  it("case 7 (TRAP): avoids substring false positive for 'pages' inside 'homepage_stats'", () => {
    expect(isQueryTenantScoped("SELECT * FROM homepage_stats")).toBe(false);
  });

  it("case 8 (TRAP): 'monitoring_alerts' is correctly matched and not masked or confused by 'monitoring_configs'", () => {
    expect(isQueryTenantScoped("SELECT * FROM monitoring_alerts")).toBe(true);
  });

  it("case 9 (TRAP): avoids matching 'monitoring_configs' inside 'monitoring_configs_history'", () => {
    expect(isQueryTenantScoped("SELECT * FROM monitoring_configs_history")).toBe(false);
  });

  it("case 10 (TRAP): ignores table name appearing strictly inside single-quoted string literal", () => {
    expect(isQueryTenantScoped("SELECT * FROM system_configurations WHERE key = 'websites'")).toBe(false);
  });

  it("case 11 (TRAP): ignores table name appearing inside single-line SQL comment", () => {
    expect(isQueryTenantScoped("SELECT * FROM system_configurations -- SELECT * FROM websites")).toBe(false);
  });

  it("case 12 (TRAP): ignores table name appearing inside multi-line SQL comment", () => {
    expect(isQueryTenantScoped("SELECT * FROM system_configurations /* SELECT * FROM websites */")).toBe(false);
  });

  it("case 13: matches UPDATE with quoted table identifier and string value matching another table name", () => {
    expect(isQueryTenantScoped('UPDATE "pages" SET title = \'homepage_stats\' WHERE id = 1')).toBe(true);
  });

  it("case 14: matches complex multi-table JOIN query containing tenant-scoped tables", () => {
    const sql = "SELECT w.id, p.title FROM websites AS w INNER JOIN pages p ON p.website_id = w.id WHERE w.status = 'active'";
    expect(isQueryTenantScoped(sql)).toBe(true);
  });

  it("case 15: matches case-insensitive SQL query", () => {
    expect(isQueryTenantScoped("SELECT * FROM WEBSITES")).toBe(true);
  });

  it("case 16: handles empty or falsy SQL string gracefully", () => {
    expect(isQueryTenantScoped("")).toBe(false);
    expect(isQueryTenantScoped(null as unknown as string)).toBe(false);
  });

  it("case 17 (TRAP): ignores table name appearing inside dollar-quoted string literal", () => {
    expect(isQueryTenantScoped("SELECT * FROM system_configurations WHERE value = $$websites$$")).toBe(false);
  });

  it("case 18 (DEFECT 2 SECURITY FIX): single-quoted literal containing comment sequence '--' does NOT wipe subsequent SQL", () => {
    expect(isQueryTenantScoped("SELECT '--' AS x, * FROM websites")).toBe(true);
  });

  it("case 19 (DEFECT 2 SECURITY FIX): single-quoted literal containing comment sequence '/*' does NOT wipe subsequent SQL", () => {
    expect(isQueryTenantScoped("SELECT * FROM pages WHERE path LIKE '/*%' AND title = '*/'")).toBe(true);
  });

  it("case 20 (DEFECT 2 SECURITY FIX): dollar-quoted literal containing '--' does NOT wipe subsequent SQL", () => {
    expect(isQueryTenantScoped("SELECT $$-- foo$$ AS x, * FROM websites")).toBe(true);
  });

  it("case 21 (DEFECT 2 SECURITY FIX): tagged dollar-quoted literal containing block comment does NOT wipe subsequent SQL", () => {
    expect(isQueryTenantScoped("SELECT $tag$/* comment */$tag$ AS x, * FROM websites")).toBe(true);
  });
});
