import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertDedicatedPlatformAdminDatabaseUrl } from "../../../../src/features/admin/security/platform-admin-database-guard";

describe("Platform Admin database isolation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects the Workspace database even when the credential username differs", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://workspace:secret@db.example.test:5432/oxenn");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("postgresql://platform_admin:secret@db.example.test:5432/oxenn"))
      .toThrow("must target a database distinct from DATABASE_URL");
  });

  it("accepts a distinct Platform Admin database on the same PostgreSQL server", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://workspace:secret@db.example.test:5432/oxenn");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("postgresql://platform_admin:secret@db.example.test:5432/oxenn_platform_admin"))
      .not.toThrow();
  });

  it("requires different PostgreSQL roles for runtime and migration credentials", () => {
    vi.stubEnv("PLATFORM_ADMIN_DATABASE_URL", "postgresql://platform_admin:other-secret@db.example.test:5432/oxenn_platform_admin");
    vi.stubEnv("PLATFORM_ADMIN_MIGRATION_DATABASE_URL", "postgresql://platform_admin:secret@db.example.test:5432/oxenn_platform_admin");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl(process.env.PLATFORM_ADMIN_DATABASE_URL!))
      .toThrow("must use different PostgreSQL roles");
  });

  it("rejects non-PostgreSQL URLs and URLs without a database name or role", () => {
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("https://db.example.test/oxenn"))
      .toThrow("must use the PostgreSQL protocol");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("postgresql://user:secret@db.example.test"))
      .toThrow("must identify a database and a dedicated PostgreSQL role");
  });

  it("requires TLS for remote Platform Admin databases in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("postgresql://runtime:secret@db.example.test:5432/platform_admin"))
      .toThrow("must require TLS");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl("postgresql://runtime:secret@db.example.test:5432/platform_admin?sslmode=require"))
      .not.toThrow();
  });

  it("requires runtime and migration URLs to target the same database", () => {
    vi.stubEnv("PLATFORM_ADMIN_DATABASE_URL", "postgresql://runtime:secret@db.example.test:5432/oxenn_platform_admin");
    vi.stubEnv("PLATFORM_ADMIN_MIGRATION_DATABASE_URL", "postgresql://migrator:secret@db.example.test:5432/another_database");
    expect(() => assertDedicatedPlatformAdminDatabaseUrl(process.env.PLATFORM_ADMIN_DATABASE_URL!))
      .toThrow("must target the same dedicated database");
  });
});
