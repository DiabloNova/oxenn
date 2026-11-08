import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveDeploymentEnvironment,
  resolveMode,
  validateEnv,
} from "../../../scripts/env-check";

const originalEnvironment = {
  DATABASE_URL: process.env.DATABASE_URL,
  MIGRATION_DATABASE_URL: process.env.MIGRATION_DATABASE_URL,
  AUTHENTICATOR_DATABASE_URL: process.env.AUTHENTICATOR_DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
  NODE_ENV: process.env.NODE_ENV,
};

afterEach(() => {
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resolveMode", () => {
  it("uses APP_MODE when no explicit mode is provided", () => {
    vi.stubEnv("APP_MODE", "migrate");
    expect(resolveMode()).toBe("migrate");
  });

  it("prefers an explicit mode argument over APP_MODE", () => {
    vi.stubEnv("APP_MODE", "migrate");
    expect(resolveMode("test")).toBe("test");
  });

  it("defaults to dev when neither source provides a mode", () => {
    vi.stubEnv("APP_MODE", "");
    expect(resolveMode()).toBe("dev");
  });

  it.each(["dev", "build", "migrate", "test", "start"])(
    "accepts the supported mode %s",
    (mode) => expect(resolveMode(mode)).toBe(mode),
  );

  it("rejects unsupported modes", () => {
    expect(() => resolveMode("staging")).toThrow("Unsupported environment mode 'staging'");
  });
});

describe("deployment environment validation", () => {
  it("defaults to development outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("APP_ENVIRONMENT", "");
    expect(resolveDeploymentEnvironment()).toBe("development");
  });

  it("does not allow APP_ENVIRONMENT to downgrade NODE_ENV=production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ENVIRONMENT", "development");
    expect(resolveDeploymentEnvironment()).toBe("production");
  });

  it("rejects unknown deployment environments", () => {
    vi.stubEnv("APP_ENVIRONMENT", "preview-ish");
    expect(() => resolveDeploymentEnvironment()).toThrow("Unsupported APP_ENVIRONMENT");
  });
});

describe("validateEnv security rules", () => {
  const setProductionBase = () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ENVIRONMENT", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://oxenn_runtime:strong-db-pass@db.example.com:5432/oxenn");
    vi.stubEnv("AUTHENTICATOR_DATABASE_URL", "postgresql://oxenn_auth:strong-db-pass@auth.example.com:5432/oxenn");
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://oxenn_migrator:strong-db-pass@migrate.example.com:5432/oxenn");
    vi.stubEnv("SESSION_SECRET", "a-realistic-random-secret-value-with-more-than-32-chars");
  };

  it("allows explicitly scoped local development defaults", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_ENVIRONMENT", "development");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/oxenn");
    vi.stubEnv("AUTHENTICATOR_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/oxenn");
    vi.stubEnv("SESSION_SECRET", "local-development-only-not-for-deployment");
    expect(validateEnv("dev").valid).toBe(true);
  });

  it("rejects the documented placeholder session secret in production", () => {
    setProductionBase();
    vi.stubEnv("SESSION_SECRET", "change-this-to-a-secure-32-character-secret-in-production");
    const result = validateEnv("start");
    expect(result.valid).toBe(false);
    expect(result.invalid).toContainEqual(expect.objectContaining({ name: "SESSION_SECRET" }));
  });

  it("rejects short and low-entropy production session secrets", () => {
    setProductionBase();
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    expect(validateEnv("start").invalid).toContainEqual(
      expect.objectContaining({ name: "SESSION_SECRET" }),
    );
    vi.stubEnv("SESSION_SECRET", "short-secret");
    expect(validateEnv("start").invalid).toContainEqual(
      expect.objectContaining({ name: "SESSION_SECRET" }),
    );
  });

  it("rejects local PostgreSQL defaults in production", () => {
    setProductionBase();
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/oxenn");
    const result = validateEnv("start");
    expect(result.valid).toBe(false);
    expect(result.invalid).toContainEqual(expect.objectContaining({ name: "DATABASE_URL" }));
  });

  it("rejects known superuser database roles even on remote hosts", () => {
    setProductionBase();
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:strong-pass@db.example.com:5432/oxenn");
    expect(validateEnv("start").invalid).toContainEqual(
      expect.objectContaining({ name: "DATABASE_URL" }),
    );
  });

  it("requires a distinct authenticator role in production", () => {
    setProductionBase();
    vi.stubEnv("AUTHENTICATOR_DATABASE_URL", "postgresql://oxenn_runtime:another-pass@auth.example.com:5432/oxenn");
    expect(validateEnv("start").invalid).toContainEqual(
      expect.objectContaining({ name: "AUTHENTICATOR_DATABASE_URL" }),
    );
  });

  it("requires a distinct, non-superuser migration role for production migrations", () => {
    setProductionBase();
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://oxenn_runtime:another-pass@migrate.example.com:5432/oxenn");
    expect(validateEnv("migrate").invalid).toContainEqual(
      expect.objectContaining({ name: "MIGRATION_DATABASE_URL" }),
    );
  });

  it("requires the authenticator and migration URLs in non-development modes", () => {
    setProductionBase();
    vi.stubEnv("AUTHENTICATOR_DATABASE_URL", "");
    vi.stubEnv("MIGRATION_DATABASE_URL", "");
    const result = validateEnv("migrate");
    expect(result.missing).toContain("AUTHENTICATOR_DATABASE_URL");
    expect(result.missing).toContain("MIGRATION_DATABASE_URL");
  });

  it("rejects malformed PostgreSQL URLs", () => {
    setProductionBase();
    vi.stubEnv("DATABASE_URL", "postgresql://");
    expect(validateEnv("start").invalid).toContainEqual(
      expect.objectContaining({ name: "DATABASE_URL" }),
    );
  });
});
